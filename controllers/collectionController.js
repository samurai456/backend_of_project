const { Collection } = require('../models/collection')
const { User } = require('../models/user')
const { Topic } = require('../models/topic')
const { Item } = require('../models/item')
const { storage } = require('../firebase')
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage')
const { v4 } = require('uuid')
const { proxify } = require('./helper')
const mongoose = require('mongoose')

class CollectionController{
    constructor(){
        this.aggregateLookupItems = {
            $lookup: {
                from: 'items',
                localField: '_id',
                foreignField: 'collectionId',
                as: 'items'
            }
        }
        this.aggregateLookupTopics = {
            $lookup: {
                from: 'topics', 
                localField: 'topic',
                foreignField: '_id',
                as: 'topic'
            }
        }
    }

    async updateCollection(req, res){
        if(!(req.user.id===req.collection.author.toString()||req.user.isAdmin)){
            return res.send({
                type: 'collection-update-failed', 
                msg: 'you have no permission to update this collection'
            })
        }
        if(!this.checkItemFields(req, res)) return
        await this.update(req)
        res.send({type: 'success'})
    }

    async update(req){
        req.collection.name = req.body.name
        req.collection.description = req.body.description
        req.collection.topic = req.body.topic
        req.collection.itemFields = JSON.parse(req.body.itemFields)
        if(req.file) req.collection.img = await this.saveImg(req)
        else if(req.body.img==='undefined') req.collection.img = undefined
        await req.collection.save()
    }

    async createCollection(req, res){
        if(!await this.creationPermitted(req, res)) return
        if(!this.checkItemFields(req, res)) return
        req.body.imgUrl = await this.saveImg(req, res)
        await this.create(req, res)
        res.send({type: 'success', msg: 'collection created successfully'})
    }

    async create(req, res){
        const collection = await Collection.create({
            name: req.body.name,
            description: req.body.description,
            topic: req.body.topic||undefined,
            img: req.body.imgUrl,
            itemFields: JSON.parse(req.body.itemFields),
            author: req.body.author
        });
    }

    async saveImg(req, res){
        if(req.file) return this.sendImgToStorage(req.file)
    }

    async sendImgToStorage(img){
        const imageRef = ref(storage, `images/${v4()+img.originalname}`)
        const a = await uploadBytes(imageRef, img.buffer)
        const url = await getDownloadURL(a.ref)
        return url
    }

    async creationPermitted(req, res){
        if(req.user.id === req.body.author) return true
        if(req.user.isAdmin && await this.authorExists(req.body.author)) return true
        res.send({
            type: 'failed', 
            msg: 'you have not permission to create collection or author did not exists',
            permission: req.user.isAdmin? 'admin': 'normal'
        });
    }

    async authorExists(id){
        try{
            const exists = await User.findOne({_id: id})
            return exists? true: false
        } catch (e) {
            return false
        }
    }

    checkItemFields(req, res){
        if(this.allFieldNamesUnique(req, res)) return true
        res.send({
            type: 'failed',
            msg: 'additionl item fields are not unique'
        })
    }

    allFieldNamesUnique(req, res){
        const uniques = []
        return JSON.parse(req.body.itemFields).every(i=>{
            if(uniques.includes(i.name)) return false
            uniques.push(i.name)
            return true
        })
    }

    async getUserCollections(req, res){
        const user = await User.findOne({_id: req.params.userId}, {nickname: 1, email: 1})
        if(!user) return res.send({type: 'failed', msg: 'user does not exist' })
        const collections = await this.collectionsByUserId(user._id)
        res.send({type: 'user-collections', collections, user })
    }

    async collectionsByUserId(userId){
        const id = new mongoose.Types.ObjectId(userId)
        return await Collection.aggregate([
            {$match: {author: id}},
            this.aggregateLookupItems,
            this.aggregateLookupTopics,
            { $addFields: {items: {$size: '$items'}} },
            { $addFields: {topic: {$first: '$topic'}} },
            { $project: {items: 1, name: 1, topic: 1}}
        ])
    }

    async getCollectionForEditing(req, res){
        res.send({collection: req.collection})
    }

    async getCollection(req, res){
        req.collection._doc.topic = req.collection.topic && (await Topic.findOne({_id: req.collection.topic}))?.name;
        const author = await User.findOne({_id: req.collection.author}, {nickname: 1})
        if(!author) return res.send({type: 'collection-author-does-not-exist' })
        req.collection._doc.author = author
        res.send({type: 'collection', collection: req.collection });
    }

    async get5Largest(req, res){
        const collections = await this.getLargests(5);
        res.send({ collections })
    }

    async getLargests(limit){
        return await Collection.aggregate([
            this.aggregateLookupItems,
            {
                $lookup: {
                    from: 'users',
                    let: { author: '$author'},
                    pipeline: [
                        {$match: {$expr: { $eq: ['$_id', '$$author']}} },
                        {$project: {nickname: 1}}
                    ],
                    as: 'author'
                }
            },
            { $addFields: {author: {$first: '$author'}}},
            { $match: {author: {$exists: true}}},
            { $addFields: { items: {$size: '$items'}}},
            { $sort: { items: -1} },
            { $limit: limit },
            this.aggregateLookupTopics,
            { $addFields: {topic: {$first: '$topic'}} },
            { $project: {author: 1, items: 1, name: 1, topic: 1}},
        ])
    }

    async deleteCollection(req, res){
        if(req.user.isAdmin || req.user.id === req.collection.author.toString()){
            const {deletedCount} = await Collection.deleteOne({_id: req.params.collectionId})
            return res.send({type: 'success', deletedCount})
        }
        const permission = req.user.status? (req.isAdmin? 'admin': 'normal') : 'guest'
        res.send({
            type: 'failed', 
            msg: 'you are not allowed to delete this collection', 
            permission
        })
    }
}

module.exports.collectionController = proxify(new CollectionController)