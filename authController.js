const bcrypt = require('bcrypt');
const knex = require('knex')(require('./knexfile'));
const jwt = require('jsonwebtoken');
const { authenticateJWT, blacklistToken } = require('./authenticateJWT');

async function login (req, res) {
    const { email, password } = req.body;
    try {
        const user = await knex('users').where('email', email).first();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const accessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET);
        res.json({ message: 'Login successful', user,accessToken });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function logout(req, res){
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    try {
        await blacklistToken(token);
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error blacklisting token:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    login, logout
};