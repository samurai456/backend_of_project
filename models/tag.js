const mongoose = require('mongoose')

const Tag = mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'tag name required'], 
        unique: [true, 'tag name should be unique']
    },
});

module.exports.Tag = mongoose.model('Tag', Tag);