const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: '/'
});

const issueToken = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, cookieOptions());
};

const register = async (req, res) => {
    const { username, email, password } = req.body;

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already in use.' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already in use.' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = crypto.randomUUID();

    const user = new User({ id: userId, username, email, password: hashedPassword });
    await user.save();

    issueToken(res, userId);
    return res.json({ success: true });
}

const login = async (req, res) => {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });

    if (!existing) return res.status(400).json({ message: 'Email or password is invalid.' });
    if (!bcrypt.compareSync(password, existing.password)) return res.status(400).json({  message: 'Email or password is invalid.' });

    issueToken(res, existing.id);
    return res.json({ success: true });
}

const logout = async (req, res) => {
    res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
    return res.json({ success: true });
}

module.exports = {
    login,
    register,
    logout
};
