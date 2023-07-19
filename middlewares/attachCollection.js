const { Collection } = require('../models/collection')

async function attachCollection(req, res, next){
    try{
        const col = await Collection.findOne({_id: req.params.collectionId})
        if(col){
            req.collection = col;
            return next()
        }
        res.send({type: '', msg: 'collection does not exist'})
    } catch(e){
        res.send({type: '', msg: 'wrong id format'})
    }
    
}

module.exports = { attachCollection }