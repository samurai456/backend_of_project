const mongoose = require('mongoose')

const Token = mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, required: [true, 'user id required']},
    token: { type: String, required: [true, 'token required']},
    createdAt: { type: Date, default: Date.now, expires: 3600 },
})

module.exports.Token = mongoose.model('Token', Token);