const { Comment } = require('../models/comment')
const { proxify } = require('./helper')
const mongoose = require('mongoose')

class CommentController {
    async create(req, res){
        const comment = await Comment.create({
            user: req.user.id, 
            item: req.item.id, 
            text: req.body.text
        })
        res.send({type: 'comment-creation-success'})
        req.wsServer.onNewComment(req.item._id)
    }

    async deleteComment(req, res){
        const comment = await this.getComment(req.params.commentId)
        if(!comment) return res.send({type: 'failed', msg: 'no comment'})
        if(!await this.crudPermitted(req.user, comment)){
            return req.send({
                type: 'failed', 
                msg: 'you have no permission to delete this comment',
                permission: req.user.isAdmin? 'admin': 'normal'
            })
        }
        await Comment.deleteOne({_id: comment._id})
        res.send({type: 'success'})
        req.wsServer.onNewComment(comment.item._id)
    }

    async getComment(commentId){
        const id = new mongoose.Types.ObjectId(commentId)
        const c = await Comment.aggregate([
            {$match: {_id: id}},
            {$limit: 1},
            {
                $lookup: {
                    from: 'items',
                    let: { itemId: '$item'},
                    pipeline: [
                        {$match: {$expr: { $eq: ['$_id', '$$itemId']}} },
                        {$project: {collectionId: 1}}
                    ],
                    as: 'item',
                }
            },
            { $addFields: {item: {$first: '$item'}}},
            { $match: {item: {$exists: true}}},
            {
                $lookup: {
                    from: 'collections',
                    let: { collectionId: '$item.collectionId'},
                    pipeline: [
                        {$match: {$expr: { $eq: ['$_id', '$$collectionId']}} },
                        {$project: {author: 1}}
                    ],
                    as: 'collection',
                }
            },
            { $addFields: {collection: {$first: '$collection'}}},
            { $match: {collection: {$exists: true}}},
            {
                $lookup: {
                    from: 'users',
                    let: { author: '$collection.author'},
                    pipeline: [
                        {$match: {$expr: { $eq: ['$_id', '$$author']}} },
                        {$project: {name: 1}}
                    ],
                    as: 'itemAuthor',
                }
            },
            { $addFields: {itemAuthor: {$first: '$itemAuthor'}}},
            { $match: {itemAuthor: {$exists: true}}},
        ])
        return c[0]
    }

    async crudPermitted(user, comment){
        if(user.isAdmin || user.id===comment.user.toString()|| 
            comment.itemAuthor._id.toString()===user.id ){
                return true
        }
        return false
    }
}

module.exports.commentController = proxify(new CommentController)