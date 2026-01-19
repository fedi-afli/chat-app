const { Router } = require('express');
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login');
            } else {
                // Fetch User
                let user = await User.findById(decodedToken.id);
                
                // 👇 SAFETY CHECK: If token exists but user was deleted from DB
                if (!user) {
                    res.cookie('jwt', '', { maxAge: 1 }); // Clear invalid cookie
                    return res.redirect('/login');
                }

                res.locals.user = user; 
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
};

// 🏠 Home Route
router.get('/', (req, res) => res.render('home'));

// 🔐 Auth Pages (GET)
router.get('/signup', authController.signup_get);
router.get('/login', authController.login_get);
router.get('/logout', authController.logout_get);

// 📩 Auth Logic (POST)
router.post('/signup', authController.signup_post);
router.post('/login', authController.login_post);

// 💬 Chat Route (Protected)
router.get('/chat', requireAuth, (req, res) => {
    res.render('chat', { 
        username: res.locals.user.username,
        // 👇 FIX: Fallback to username if nickname is missing (handles old users safely)
        nickname: res.locals.user.nickname || res.locals.user.username 
    });
});

module.exports = router;