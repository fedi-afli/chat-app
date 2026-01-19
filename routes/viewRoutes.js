const { Router } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = Router();

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login');
            } else {
                // Fetch the user so we can get the nickname
                let user = await User.findById(decodedToken.id);
                res.locals.user = user; 
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
};

router.get('/', (req, res) => res.redirect('/login'));
router.get('/chat', requireAuth, (req, res) => {
    // Pass both username and nickname to the view
    res.render('chat', { 
        username: res.locals.user.username,
        nickname: res.locals.user.nickname 
    });
});

module.exports = router;