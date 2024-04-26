const { Users } = require('../models/users'); // Correct import using 'Users'

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/`, async (req, res) =>{
    try {
        const usersList = await Users.find().select('-passwordHash'); // Correct usage of 'Users'
        res.send(usersList);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.get('/:id', async(req,res)=>{
    try {
        const users = await Users.findById(req.params.id).select('-passwordHash'); // Correct usage of 'Users'
        if(!users) {
            return res.status(404).json({ message: 'The user with the given ID was not found.' });
        }
        res.status(200).send(users);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.post('/', async (req, res) => {
    try {
        if (!req.body.password) {
            return res.status(400).send('Password is required');
        }
        let users = new Users({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        });
        users = await users.save();
        res.send(users);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.put('/:id',async (req, res)=> {
    try {
        const usersExist = await Users.findById(req.params.id);
        let newPassword
        if(req.body.password) {
            newPassword = bcrypt.hashSync(req.body.password, 10)
        } else {
            newPassword = usersExist.passwordHash;
        }
        const users = await Users.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                passwordHash: newPassword,
                phone: req.body.phone,
                isAdmin: req.body.isAdmin,
                street: req.body.street,
                apartment: req.body.apartment,
                zip: req.body.zip,
                city: req.body.city,
                country: req.body.country,
            },
            { new: true}
        )
        if(!users)
            return res.status(400).send('the user cannot be created!')
        res.send(users);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const users = await Users.findOne({ email: req.body.email });
        const secret = process.env.secret;
        if (!users) {
            return res.status(400).send('The user not found');
        }
        if (req.body.password && users.passwordHash) {
            if (bcrypt.compareSync(req.body.password, users.passwordHash)) {
                const token = jwt.sign(
                    {
                        usersId: users.id,
                        isAdmin: users.isAdmin
                    },
                    secret,
                    { expiresIn: '1d' }
                );
                res.status(200).send({ users: users.email, token: token });
            } else {
                res.status(400).send('Password is wrong!');
            }
        } else {
            res.status(400).send('Password or password hash not found!');
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.post('/register', async (req,res)=>{
    try {
        let users = new Users({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        })
        users = await users.save();
        if(!users)
            return res.status(400).send('the user cannot be created!')
        res.send(users);
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.delete('/:id', (req, res)=>{
    try {
        Users.findByIdAndRemove(req.params.id).then(user =>{
            if(user) {
                return res.status(200).json({success: true, message: 'the user is deleted!'})
            } else {
                return res.status(404).json({success: false , message: "user not found!"})
            }
        }).catch(err=>{
           return res.status(500).json({success: false, error: err}) 
        })
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.get(`/get/count`, async (req, res) =>{
    try {
        const userCount = await Users.countDocuments();
        res.send({ userCount: userCount });
    } catch (error) {
        console.error("Error getting user count:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

module.exports = router;
