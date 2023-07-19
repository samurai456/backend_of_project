const { Comment } = require('./models/comment')
const { User } = require('./models/user')
const { likeController } = require('./controllers/likeController')
const mongoose = require('mongoose')

async function onConnection(ws, req){
    const [itemId, userId] = req.url.split('/').slice(1)
    ws.itemIdOfComments = new mongoose.Types.ObjectId(itemId)
    const { likes, liked } = await likeController.getItemLikeInfo(itemId, userId);
    ws.send(JSON.stringify({
        type: 'onConnect', 
        comments: await getComments(ws.itemIdOfComments),
        likes,
        liked
    }))
}

async function onLikeUnlike(itemId){
    const likes = await likeController.getLikes(itemId)
    sendTo(itemId, this.clients, {likes})
}

async function onNewComment(itemId){
    const comments = await getComments(itemId);
    sendTo(itemId, this.clients, {comments})
}

function sendTo(itemId, clients, resp){
    clients.forEach(async i=>{
        if(i.itemIdOfComments.toString() !== itemId.toString()) return
        i.send(JSON.stringify(resp))
    })
}

async function getComments(itemId){
    return await Comment.aggregate([
        { $match: {item: itemId}},
        { $lookup: {
            from: 'users',
            let: { 'user': '$user'},
            pipeline: [
                {$match: {$expr: { $eq: ['$_id', '$$user']}} },
                {$project: {nickname: 1, email: 1}}
            ],
            as: 'user',
        }},
        { $addFields: { user: { $first: '$user'}} },
        { $match: {user: {$exists: true}}}
    ])
}

module.exports = { onConnection, onNewComment, onLikeUnlike }