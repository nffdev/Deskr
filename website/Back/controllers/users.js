const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Build = require('../models/Build');

const getMe = async (req, res) => {
    return res.status(200).json(req.user);
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
};

const updateAccount = async (req, res) => {
    const { username, email } = req.body;

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (username && username !== user.username) {
        if (username.length < 3 || username.length > 16) {
            return res.status(400).json({ message: 'Username must be between 3 and 16 characters.' });
        }
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already taken.' });
        user.username = username;
    }

    if (email && email !== user.email) {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already in use.' });
        user.email = email;
    }

    await user.save();

    const updated = user.toJSON();
    delete updated._id;
    delete updated.__v;
    delete updated.password;

    return res.json(updated);
};

const updateNotifications = async (req, res) => {
    const { buildNotifications, connectionAlerts } = req.body;

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.notifications) {
        user.notifications = { buildNotifications: true, connectionAlerts: true };
    }

    if (typeof buildNotifications === 'boolean') user.notifications.buildNotifications = buildNotifications;
    if (typeof connectionAlerts === 'boolean') user.notifications.connectionAlerts = connectionAlerts;

    await user.save();

    return res.json({ notifications: user.notifications });
};

const getStorage = async (req, res) => {
    const buildsDir = path.resolve(__dirname, '../../../builder/builds');
    let totalSize = 0;

    try {
        if (fs.existsSync(buildsDir)) {
            const getDirSize = (dir) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        getDirSize(fullPath);
                    } else {
                        totalSize += fs.statSync(fullPath).size;
                    }
                }
            };
            getDirSize(buildsDir);
        }
    } catch (e) { }

    return res.json({
        used: totalSize,
        limit: 100 * 1024 * 1024
    });
};

const clearStorage = async (req, res) => {
    const buildsDir = path.resolve(__dirname, '../../../builder/builds');

    try {
        if (fs.existsSync(buildsDir)) {
            fs.rmSync(buildsDir, { recursive: true, force: true });
            fs.mkdirSync(buildsDir, { recursive: true });
        }
    } catch (e) {
        return res.status(500).json({ message: 'Failed to clear storage.' });
    }

    return res.json({ message: 'Storage cleared.' });
};

const deleteAccount = async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required to delete the account.' });

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ message: 'Password is incorrect.' });
    }

    await Connection.deleteMany({ ownerId: user.id });
    await Build.deleteMany({ userId: user.id });
    await User.deleteOne({ id: user.id });

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });

    return res.json({ success: true });
};

module.exports = {
    getMe,
    changePassword,
    updateAccount,
    updateNotifications,
    getStorage,
    clearStorage,
    deleteAccount
};
