const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    id: String,
    username: String,
    email: String,
    password: String,
    notifications: {
        buildNotifications: { type: Boolean, default: true },
        connectionAlerts: { type: Boolean, default: true }
    },
    deviceTokens: [{
        _id: false,
        token: { type: String, required: true },
        platform: { type: String, default: 'ios' },
        updatedAt: { type: Date, default: Date.now }
    }]
});

module.exports = model('user', userSchema);