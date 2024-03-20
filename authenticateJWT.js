const jwt = require('jsonwebtoken');
const knex = require('knex')(require('./knexfile'));

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticateJWT(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    try {
        const blacklistedToken = await knex('blacklisted_tokens').where('token', token).first();
        if (blacklistedToken) {
            return res.status(401).json({ message: 'Unauthorized: Token invalidated' });
        }
    } catch (error) {
        console.error('Error checking token blacklist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        req.user = user;
        next();
    });
}

async function blacklistToken(token) {
    try {
        await knex('blacklisted_tokens').insert({ token });
    } catch (error) {
        console.error('Error blacklisting token:', error);
        throw new Error('Internal server error');
    }
}

module.exports = { authenticateJWT, blacklistToken };
