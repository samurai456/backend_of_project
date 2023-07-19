const mongoose = require('mongoose')

const Topic = mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'topic name required'],
        unique: [true, 'topic name should be unique'],  
        validate: { 
            validator: v=>v.length<=50,
            message: 'topic name can not be greater than 50 symbols',
        }  
    },
});

module.exports = { Topic: mongoose.model('Topic', Topic) };