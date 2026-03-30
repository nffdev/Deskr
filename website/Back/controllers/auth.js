const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
}

const login = async (req, res) => {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });

    if (!existing) return res.status(400).json({ message: 'Email or password is invalid.' });
    if (!bcrypt.compareSync(password, existing.password)) return res.status(400).json({  message: 'Email or password is invalid.' });

    const token = jwt.sign({ id: existing.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
}

module.exports = {
    login,
    register
};