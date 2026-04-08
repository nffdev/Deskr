const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    id: String,
    username: String,
    email: String,
    password: String,
    notifications: {
        buildNotifications: { type: Boolean, default: true },
        connectionAlerts: { type: Boolean, default: true }
    }
});

module.exports = model('user', userSchema);