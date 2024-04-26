const { Categories } = require('../models/categories');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) =>{
    const categoriesList = await Category.find();

    if(!categoriesList) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(categoriesList);
})

router.get('/:id', async(req,res)=>{
    const categories = await Category.findById(req.params.id);

    if(!categories) {
        res.status(500).json({message: 'The category with the given ID was not found.'})
    } 
    res.status(200).send(categories);
})

router.post('/', async (req,res)=>{
    let categories = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    })
    categories = await categories.save();

    if(!categories)
    return res.status(400).send('the category cannot be created!')

    res.send(categories);
})


router.put('/:id',async (req, res)=> {
    const categories = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon || categories.icon,
            color: req.body.color,
        },
        { new: true}
    )

    if(!categories)
    return res.status(400).send('the category cannot be created!')

    res.send(categories);
})

router.delete('/:id', (req, res)=>{
    Category.findByIdAndRemove(req.params.id).then(categories =>{
        if(categories) {
            return res.status(200).json({success: true, message: 'the category is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "category not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

module.exports = router;
