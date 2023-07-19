const { Tag } = require('../models/tag')

async function requireValidTag(req, res, next){
    const err = {type: 'tag-error', msg: 'tag does not exist'}
    try{
        const exists = await Tag.findOne({_id: req.params.tagId})
        if(exists){
            next()
            return
        }
        res.send(err)
    } catch (e) {
        res.send(err)
    }
}

module.exports = { requireValidTag }