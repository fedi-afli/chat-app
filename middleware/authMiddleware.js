const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Handle Errors
const handleErrors = (err) => {
    console.log("Error handled:", err.message, err.code); 
    let errors = { username: '', password: '' };

    // Login Errors
    if (err.message === 'incorrect username') {
        errors.username = 'That username is not registered';
    }
    if (err.message === 'incorrect password') {
        errors.password = 'That password is incorrect';
    }

    // Signup Errors
    if (err.code === 11000) {
        errors.username = 'That username is already taken';
        return errors;
    }

    // Validation Errors
    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
};

// Create Token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, 'net ninja secret', { expiresIn: maxAge });
};

module.exports.signup_get = (req, res) => res.render('signup');
module.exports.login_get = (req, res) => res.render('login');

module.exports.signup_post = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Validation logic happens inside the Model now
        const user = await User.create({ username, password });
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.login_post = async (req, res) => {
    const { username, password } = req.body;
    console.log("Login attempt for user:", username);
    try {
        const user = await User.login(username, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
}