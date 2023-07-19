const mongoose = require('mongoose')

const Item = mongoose.Schema({
    name: { type: String, required: [true, 'item name required']},
    tags: { type: [mongoose.Types.ObjectId]},
    collectionId: { type: mongoose.Types.ObjectId, required: [true, 'items collection required'] },
    created_at: { type: Date, default: Date.now }
}, {strict: false});

Item.index({'$**': 'text'})

module.exports.Item = mongoose.model('Item', Item);