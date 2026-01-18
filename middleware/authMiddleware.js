const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key_123'; // Use .env in production

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
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

module.exports = { requireAuth, JWT_SECRET };