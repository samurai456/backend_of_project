const mongoose = require('mongoose')

const Like = mongoose.Schema({
    item: { type: mongoose.Types.ObjectId, required: [true, 'liked item required'] },
    user: { type: mongoose.Types.ObjectId,  required: [true, 'like`s user required']}
});

module.exports = { Like: mongoose.model('Like', Like) };