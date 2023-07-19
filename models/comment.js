const mongoose = require('mongoose')

const Comment = mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, required: [true, 'comment`s user required']},
    item: { type: mongoose.Types.ObjectId, required: [true, 'commented item required']},
    text: { type: String, required: [true, 'text of comment required']},
    created_at: { type: Date, default: Date.now }
});

Comment.index({text: 'text'})

module.exports.Comment = mongoose.model('Comment', Comment);