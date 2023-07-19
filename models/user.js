const mongoose = require('mongoose')

const User = mongoose.Schema({
    nickname: { type: String, required: [true, 'nickname required'] },
    email: {
        type: String,
        unique: [true, 'email already exists in database!'],
        required: [true, 'email required'],
        validate: { 
            validator: v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            message: 'invalid email',
        }
    },
    password: { type: String, required: [true, 'password required'] },
    registrationDate: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    status: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    lang: { type: String, default: 'en'},
    theme: { type: String, default: 'light'}
});

module.exports.User = mongoose.model('User', User);