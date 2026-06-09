const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    ownerId: {
        type: String,
        required: true,
        index: true
    },
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
    if (!this.isActive) return false;
    const TIMEOUT = 10000;
    const now = new Date();
    const timeSinceLastHeartbeat = now - this.lastHeartbeat;
    return timeSinceLastHeartbeat < TIMEOUT;
};

module.exports = mongoose.model('Connection', connectionSchema);
