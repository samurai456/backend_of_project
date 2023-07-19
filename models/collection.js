const mongoose = require('mongoose')

const Collection = mongoose.Schema({
    name: { type: String, required: [true, 'collection name required']},
    description: {
        type: String,
        required: [true, 'collection description required'],
        validate: { 
            validator: v=>!/<script>/i.test(v),
            message: 'XSS attempt detected!',
        }
    },
    topic: { type: mongoose.Types.ObjectId },
    img: {type: String},
    itemFields: {type: []},
    author: {type: mongoose.Types.ObjectId,  required: [true, 'collection author required']},
    created_at: { type: Date, default: Date.now }
});

Collection.index({name: 'text', description: 'text'})

module.exports.Collection = mongoose.model('Collection', Collection);