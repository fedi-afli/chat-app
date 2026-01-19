const jwt = require('jsonwebtoken');

// 👇 Read from .env
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        // Use process.env.JWT_SECRET here
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                res.redirect('/login');
            } else {
                req.user = decodedToken;
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
};

module.exports = { requireAuth }; 
// Note: We don't export JWT_SECRET anymore because we can just use process.env everywhere