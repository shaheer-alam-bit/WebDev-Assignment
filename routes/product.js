const Users = require('../models/user');
const Product = require('../models/Product');
const express = require('express');
var router = express.Router();


router.get('/', async (req, res) => {
    try{
        const products = await Product.find()
        if (!products) return res.json({ msg: "NO PRODUCTS FOUND" })
        res.json({ msg: "PRODUCTS FOUND", data: products })
    } catch (error) {
        console.error(error);
    }
})

router.post('/getByName', async (req,res)=>{
    try{
        const {name} = req.body;
        const product = await Product.find({name: name})
        if(!product) return res.json({msg: "PRODUCT NOT FOUND"})

        res.json({msg: "PRODUCT FOUND", data: product})
    }catch(error){
        console.error(error)
    }
})

router.get('/getByUser/:id', async (req,res)=>{
    try {
        const user = await Users.findOne({_id: req.params.id});
        if (!user) return res.json({ msg: "USER NOT FOUND" });

        const products = await Product.find({user: user._id});
        if (!products) return res.json({ msg: "NO PRODUCTS FOUND" });

        res.json({ msg: "PRODUCTS FOUND", data: products });
    } catch (error) {
        console.error(error);
    }
})

//Middleware to check the length of the barcode_id
router.use((req, res, next) => {
    if (req.body.barcode_id.length !== 13) {
        return res.json({ msg: 'INVALID LENGTH OF BARCODE ID' });
    }
    else {
        next();
    }
})


router.post('/getByID', async (req, res) => {
    try {
        const product = await Product.findOne({ barcode_id: req.body.barcode_id }).populate('user','-password');
        if (!product) return res.json({ msg: "PRODUCT NOT FOUND" })
        res.json({ msg: "PRODUCT FOUND", data: product })
    } catch (error) {
        console.error(error);
    }
});


router.use((req, res, next) => {
    if (!req.user.admin) {
        return res.json({ msg: 'NOT ADMIN, NOT AUTHORIZED' });
    }
    else {
        next();
    }
})

router.post('/add', async (req, res) => {
    try {
        const user = await Users.findOne({ email: req.user.email });
        if (!user) return res.json({ msg: 'USER NOT FOUND' });

        const product = await Product.findOne({ barcode_id: req.body.barcode_id })
        if (product) return res.json({ msg: `PRODUCT WITH ${req.body.barcode_id} ALREADY EXISTS` });

        if (req.body.price < 0) return res.json({msg: 'A Product cannot have negative value of price'});
        await Product.create({ ...req.body, user: user._id });
        return res.json({ msg: 'PRODUCT ADDED SUCCESSFULLY' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({msg: 'Validation Error:', error: error.message});
        }
        console.error(error);
    }
}
)

router.post('/delete', async (req, res) => {
    try {
        const { barcode_id } = req.body;
        const product = await Product.findOne({ barcode_id });
        if (!product) return res.json({ msg: `PRODUCT WITH ID ${barcode_id} NOT FOUND` });

        await Product.deleteOne({ barcode_id });
        return res.json({ msg: `PRODUCT WITH ID ${barcode_id} DELETED SUCCESSFULLY` });
    } catch (error) {
        console.error(error);
    }

})

router.post('/update',async (req,res)=>{
    try{
        const {barcode_id,quantity,price} = req.body;
        const product = await Product.findOne({barcode_id});
        if (!product) return res.json({ msg: `PRODUCT WITH ID ${barcode_id} NOT FOUND` });

        await Product.findOneAndUpdate({barcode_id: barcode_id},{ $set: {quantity: quantity, price:price}});
        return res.json({ msg: `PRODUCT WITH ID ${barcode_id} UPDATED SUCCESSFULLY` });
    }catch(error){
        console.error(error);
    }
})


module.exports = router