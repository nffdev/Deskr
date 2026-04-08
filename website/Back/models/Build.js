const { Schema, model } = require('mongoose');

const buildSchema = new Schema({
    buildId: String,
    userId: String,
    appName: String,
    language: { type: String, enum: ['cs', 'cpp'] },
    version: String,
    description: String,
    apiUrl: String,
    status: { type: String, enum: ['pending', 'building', 'success', 'failed'], default: 'pending' },
    fileSize: Number,
    error: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('build', buildSchema);
