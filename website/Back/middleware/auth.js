const User = require('../models/User');

module.exports = async (req, res, next) => {
    const { authorization: token } = req.headers;
    if (!token) return res.status(401).json({ message: 'Unauthorized.' });

    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ message: 'Unauthorized.' });

    req.user = user.toJSON();
    delete req.user._id;
    delete req.user.__v;

    next();
}