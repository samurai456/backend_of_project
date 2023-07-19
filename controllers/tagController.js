const { Tag } = require('../models/tag')
const { proxify } = require('./helper')

class TagController{
    async getPopular(req, res){
        const tags = await Tag.aggregate([
            {
                $lookup: {
                    from: 'items',
                    let: {tagId: '$_id'},
                    pipeline: [
                        {$match: {$expr: {$in: ['$$tagId','$tags']}}},
                        {$project: {name: 1}}
                    ],
                    as: 'items'
                }
            },
            {$addFields: {items: {$size: '$items'}}},
            {$sort: {items: -1}},
            {$limit: 50},
            {$match: {items: {$gt: 0}}}
        ])
        res.send({tags})
    }

    async getTagsByStart(req, res){
        const tags = await Tag.find({name: new RegExp( `^${req.params.tagStart}.*$` )})
        res.send({tags})
    }
}

module.exports.tagController = proxify(new TagController)