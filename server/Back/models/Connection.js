const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    deviceInfo: {
        type: String,
        default: 'Unknown Device'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Connection', connectionSchema);
