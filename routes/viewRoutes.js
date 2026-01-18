const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', (req, res) => res.render('login')); // Default to login
router.get('/login', (req, res) => res.render('login'));
router.get('/signup', (req, res) => res.render('signup'));

router.get('/chat', requireAuth, (req, res) => {
    res.render('chat', { username: req.user.username });
});

module.exports = router;