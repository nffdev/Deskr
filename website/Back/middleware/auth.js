const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized.' });

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) return res.status(401).json({ message: 'Unauthorized.' });

        req.user = user.toJSON();
        delete req.user._id;
        delete req.user.__v;
        delete req.user.password;

        next();
    } catch {
        return res.status(401).json({ message: 'Unauthorized.' });
    }
}