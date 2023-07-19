const jwt = require('jsonwebtoken');
const { User } = require('../models/user.js')

const verifyToken = (req, res, next) =>{
    const clientToken = req.headers?.jwt;
    const clientId = req.headers?.userid;
    if (!clientToken || !clientId) return next()
    jwt.verify(clientToken, process.env.SECRET_KEY, (err, decode)=>{
        if(err || decode.id !== clientId){
            return res.send({
                type: 'verification', 
                msg: 'invalid jwt or userId', 
                permission: 'guest'
            })
        }
        User.findOneAndUpdate(
            {_id: decode.id}, 
            {lastLoginDate: Date.now()}, 
            {returnOriginal: false}
        ).then(user=>{
            req.user = user;
            next();
        })
    })
};

module.exports = { verifyToken }