const { Like } = require('../models/like')
const { proxify } = require('./helper')

class LikeController{
    async getLikes(itemId){
        return await Like.countDocuments({item: itemId})
    }

    async liked(itemId, userId){
        return await Like.findOne({item: itemId, user: userId})
    }

    async getItemLikeInfo(itemId, userId){
        const likes = await this.getLikes(itemId)
        const liked = userId&& await this.liked(itemId, userId)
        return {likes, liked}
    }

    async createLike(req, res){
        if(await Like.findOne({item: req.item.id, user: req.user.id})){
            res.send({type: 'already-liked'})
            return
        }
        await Like.create({item: req.item.id, user: req.user.id})
        res.send({type: 'liked'})
        req.wsServer.onLikeUnlike(req.item.id)
    }

    async deleteLike(req, res){
        await Like.deleteOne({item: req.item.id, user: req.user.id})
        res.send({type: 'unliked'})
        req.wsServer.onLikeUnlike(req.item.id)
    }
}

module.exports.likeController = proxify(new LikeController)