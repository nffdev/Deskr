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
    lastHeartbeat: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

connectionSchema.methods.isConnectionActive = function() {
    const TIMEOUT = 10000; // 10 seconds
    const now = new Date();
    const timeSinceLastHeartbeat = now - this.lastHeartbeat;
    return timeSinceLastHeartbeat < TIMEOUT;
};

module.exports = mongoose.model('Connection', connectionSchema);
