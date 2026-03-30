const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    id: String,
    username: String,
    email: String,
    password: String
});

module.exports = model('user', userSchema);