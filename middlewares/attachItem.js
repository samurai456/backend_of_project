const { Item } = require('../models/item');

async function attachItem(req, res, next){
    try{
        const item = await Item.findOne({_id: req.params.itemId})
        if(item){
            req.item = item;
            next()
            return
        }
        res.send({type: '', msg: 'item does not exist'})
    } catch(e){
        res.send({type: '', msg: 'wrong id format'})
    }
    
}

module.exports = { attachItem }