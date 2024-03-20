
const express = require('express');

const jwt = require('jsonwebtoken');
const { authenticateJWT, blacklistToken } = require('./authenticateJWT');
const {login, logout} = require('./authController');
const {create_order, order_list, ipn} =require('./orderController');
const { body, validationResult } = require('express-validator');

const app = express ();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const loginValidationRules = [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required')
];
const createOrderValidationRules = [
    body('customer_name').notEmpty().withMessage('Customer name is required'),
    body('customer_email').notEmpty().withMessage('Valid email is required'),
    body('customer_phone').notEmpty().withMessage('Customer phone is required'),
    body('street').notEmpty().withMessage('Street address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('zipcode').notEmpty().withMessage('Zip code is required'),
    body('country').notEmpty().withMessage('Country is required'),
    body('price').notEmpty().withMessage('Price is required'),
    body('product_name').notEmpty().withMessage('Product name is required'),
    body('product_details').notEmpty().withMessage('Product details is required')
];
const ipnValidationRules = [
    body('invoice').notEmpty().withMessage('invoice is required'),
    body('amount').notEmpty().withMessage('amount is required'),
    body('status').notEmpty().withMessage('status is required')
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

app.get("/", (req, res)=> {
    res.send("learning Express js");
    res.end();
});
app.post('/login', loginValidationRules, validate, login);
app.post("/create_order", authenticateJWT,createOrderValidationRules, validate, create_order);
app.post("/ipn", ipnValidationRules, validate,  authenticateJWT, ipn);
app.get("/order_list",  authenticateJWT, order_list);
app.get("/logout", authenticateJWT, logout);

module.exports = app;
