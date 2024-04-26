const Order = require('../models/orders'); // Import the Order model
const OrderItem = require('../models/order-items'); // Import the OrderItem model
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const orderList = await Order.find().populate('users', 'name').sort({'dateOrdered': -1});
        if (!orderList) {
            return res.status(500).json({success: false});
        }
        res.send(orderList);
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('users', 'name')
            .populate({
                path: 'orderItems', populate: {
                    path: 'product', populate: 'category'
                }
            });
        if (!order) {
            return res.status(404).json({success: false, message: "Order not found!"});
        }
        res.send(order);
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

router.post('/', async (req, res) => {
    try {
        const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
            let newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product
            });
            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        }));
        const totalPrices = await Promise.all(orderItemsIds.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
            if (!orderItem || !orderItem.product) {
                return 0; // or any other default value
            }
            const totalPrice = orderItem.product.price * orderItem.quantity;
            return totalPrice;
        }));
        const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

        let order = new Order({
            orderItems: orderItemsIds,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            status: req.body.status,
            totalPrice: totalPrice,
            users: req.body.users
        });
        order = await order.save();

        res.send(order);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!order)
            return res.status(400).send('The order cannot be updated!');

        res.send(order);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndRemove(req.params.id);
        if (order) {
            await Promise.all(order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem);
            }));
            return res.status(200).json({ success: true, message: 'The order is deleted!' });
        } else {
            return res.status(404).json({ success: false, message: "Order not found!" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error });
    }
});

router.get('/get/totalsales', async (req, res) => {
    try {
        const totalSales = await Order.aggregate([
            { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
        ]);

        if (!totalSales) {
            return res.status(400).send('The order sales cannot be generated');
        }

        res.send({ totalsales: totalSales.pop().totalsales });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/get/count', async (req, res) => {
    try {
        const orderCount = await Order.countDocuments((count) => count);

        if (!orderCount) {
            res.status(500).json({ success: false });
        }
        res.send({ orderCount: orderCount });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/get/userorders/:userid', async (req, res) => {
    try {
        const userOrderList = await Order.find({ users: req.params.userid }).populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'
            }
        }).sort({ 'dateOrdered': -1 });

        if (!userOrderList) {
            res.status(500).json({ success: false });
        }
        res.send(userOrderList);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
