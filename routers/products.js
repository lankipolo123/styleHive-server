const express = require('express');
const router = express.Router();
const { Product } = require('../models/products');
const { Category } = require('../models/categories');
const mongoose = require('mongoose');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        cb(null, fileName + '-' + Date.now());
    }
});

const uploadOptions = multer({ storage: storage });

// GET all products or a single product by ID
router.get('/:id?', async (req, res) => {
    try {
        let filter = {};
        if (req.query.categories) {
            filter = { category: req.query.categories.split(',') };
        }

        if (req.params.id) {
            const product = await Product.findById(req.params.id).populate('category');
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            return res.status(200).json(product);
        } else {
            const productList = await Product.find(filter).populate('category');
            if (!productList || productList.length === 0) {
                return res.status(404).json({ success: false, message: 'No products found' });
            }
            return res.status(200).json(productList);
        }
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Create a new product
router.post('/', uploadOptions.single('image'), async (req, res) => {
    try {
        // Validate category
        const category = await Category.findById(req.body.category);
        if (!category) {
            return res.status(400).send('Invalid Category');
        }
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        // Create new product
        const product = new Product({
            name: req.body.name,
            descriptions: req.body.descriptions,
            richDescriptions: req.body.richDescriptions,
            image: `${basePath}${fileName}`,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInstock: req.body.countInstock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        });

        // Save product to database
        const savedProduct = await product.save();

        // Respond with the saved product
        return res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    try {
        // Validate product ID
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product ID');
        }

        // Update product
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Check if product exists
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Respond with the updated product
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    try {
        // Delete product
        const deletedProduct = await Product.findOneAndDelete({ _id: req.params.id });

        // Check if product was deleted
        if (deletedProduct) {
            return res.status(200).json({ success: true, message: 'Product is deleted' });
        } else {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Update product gallery images
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    try {
        // Validate product ID
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product ID');
        }

        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        // Check if files are provided
        if (files && files.length > 0) {
            files.forEach(file => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        // Find the product by ID and update its gallery images
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $push: { images: { $each: imagesPaths } } }, // Add new images to the existing array
            { new: true }
        );

        // Check if the product exists
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Respond with the updated product
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error updating gallery images:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
