const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const createToken = (id, username) => {
    
    return jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

module.exports.signup_post = async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`📝 Attempting to register: ${username}`); // Log the attempt

    try {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ username, password: hashedPassword });
        
        const token = createToken(user._id, user.username);
        res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.status(201).json({ user: user._id });
        console.log("✅ User created successfully!");

    } catch (err) {
        console.log("❌ Error:", err.message); // See this in your VS Code terminal

        // Check for specific MongoDB Duplicate Key Error (Code 11000)
        if (err.code === 11000) {
            res.status(400).json({ error: 'That username is already taken. Please try another.' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
};

module.exports.login_post = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user) {
            const auth = await bcrypt.compare(password, user.password);
            if (auth) {
                const token = createToken(user._id, user.username);
                res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
                return res.status(200).json({ user: user._id });
            }
        }
        throw Error('Invalid credentials');
    } catch (err) {
        res.status(400).json({ error: 'Invalid username or password' });
    }
};

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/login');
};