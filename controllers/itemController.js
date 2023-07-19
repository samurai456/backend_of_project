const { Collection } = require('../models/collection')
const { User } = require('../models/user')
const { Comment } = require('../models/comment')
const { Item } = require('../models/item')
const { Tag } = require('../models/tag')
const { proxify } = require('./helper')
const mongoose = require('mongoose')

class ItemController {
    constructor(){
        this.aggregateLookupCollections = {
            $lookup: {
                from: 'collections',
                let: { collectionId: '$collectionId'},
                pipeline: [
                    {$match: {$expr: { $eq: ['$_id', '$$collectionId']}} },
                    {$project: {name: 1, author: 1}}
                ],
                as: 'collection',
            }
        }
        this.aggregateLookupUsers = { 
            $lookup: {
                from: 'users',
                let: { 'author': '$collection.author'},
                pipeline: [
                    {$match: {$expr: { $eq: ['$_id', '$$author']}} },
                    {$project: {nickname: 1}}
                ],
                as: 'author'
            }
        }
        this.aggregateCommands = [
            this.aggregateLookupCollections,
            { $addFields: {collection: {$first: '$collection'}}},
            { $match: {collection: {$exists: true}}},
            this.aggregateLookupUsers,
            { $addFields: {author: {$first: '$author'}}},
            { $match: {author: {$exists: true}}},
        ]
    }

    async updateItem(req, res){
        req.collection = await Collection.findOne({_id: req.item.collectionId})
        if(!this.crudPermitted(req, res)) return
        if(!this.hasRequiredFields(req, res)) return
        if(!this.hasAllAdditionalFields(req, res)) return
        await this.update(req, res)
        res.send({type: 'success'})
    }

    async update(req, res){
        const name = req.body.itemName
        const tags = await this.createTags(req.body.itemTags)
        const data = req.collection.itemFields.reduce((accum, i)=>(
            {...accum, ['__'+i.name]: req.body['__'+i.name]}
        ), {})
        await Item.updateOne({_id: req.item._id}, {...data, name, tags})
    }

    async deleteItems(req, res){
        const i = await Item.findOne({_id: req.body.ids[0]})
        req.collection = await Collection.findOne({_id: i.collectionId})
        if(!this.crudPermitted(req, res)) return
        await Item.deleteMany({_id: req.body.ids, collectionId: req.collection.id})
        res.send({type: 'success'})
    }

    async create(req, res){
        const fields = req.collection.itemFields
            .map(i=>'__'+i.name)
            .reduce((accum, i)=>({...accum, [i]: req.body[i]}), {})
        const tagIds = await this.createTags(req.body.itemTags)
        return await Item.create({
            name: req.body.itemName,
            tags: tagIds,
            collectionId: req.params.collectionId,
            ...fields
        })
    }

    async createTags(tags){
        const uniques = Array.from(new Set(tags))
        const existing = await Tag.find({name: uniques})
        const names = existing.map(i=>i.name)
        const toBeCreated = uniques.filter(i=>!names.includes(i))
        const ids = (await Tag.create(toBeCreated.map(i=>({name: i}))) ).map(i=>i.id)
        return [...ids, ...existing.map(i=>i.id)]
    }

    async createItem(req, res){
        if(!this.crudPermitted(req, res)) return
        if(!this.hasRequiredFields(req, res)) return
        if(!this.hasAllAdditionalFields(req, res)) return
        const item = await this.create(req, res)
        res.send({
            type: 'item-creation-success', 
            msg: 'item created successfully',
            itemId: item.id,
        });
    }

    crudPermitted(req, res){
        if(req.user.id === req.collection.author.toString()) return true
        if(req.user.isAdmin) return true
        const permission = !req.user || !req.user.status? 
            'guest': (req.user.isAdmin? 'admin': 'normal');
        res.send({
            type: 'item-creation-failed', 
            msg: 'only admins and collection owner can create items for this collection',
            permission,
        });
    }

    hasRequiredFields(req, res){
        if(!req.body.itemName){
            res.send({type: 'field-required', msg: 'item name field required'})
            return
        }
        return true
    }

    hasAllAdditionalFields(req, res){
        const fields = req.collection.itemFields.map(i=>i.name)
        if( fields.every(i=>req.body.hasOwnProperty('__'+i)) ) return true
        res.send({
            type: 'additional-fields-404', 
            msg: 'collection has been edited and new additional item fields have been added'
        })
    }

    async getItemsOfCollection(req, res){
        const items = await Item.find({collectionId: req.collection.id})
        res.send({type: 'items-of-collection', items})
    }

    async getItem(req, res){
        const item = await this.itemDetails(req.params.itemId)
        if(!item) return res.send({type: 'failed'})
        res.send({type: 'item', item})
    }

    async itemDetails(id){
        const itemId = new mongoose.Types.ObjectId(id)
        const i = await Item.aggregate([
            {$match: {_id: itemId}},
            {$limit: 1},
            {$lookup: {
                from: 'collections',
                let: { collectionId: '$collectionId'},
                pipeline: [
                    {$match: {$expr: { $eq: ['$_id', '$$collectionId']}} },
                    {$project: {name: 1, author: 1, itemFields: 1}}
                ],
                as: 'collection',
            }},
            { $addFields: {collection: {$first: '$collection'}}},
            { $match: {collection: {$exists: true}}},
            this.aggregateLookupUsers,
            { $addFields: {author: {$first: '$author'}}},
            { $match: {author: {$exists: true}}},
            {$lookup: {
                from: 'tags',
                let: { tagIds: '$tags'},
                pipeline: [
                    {$match: {$expr: { $in: ['$_id', '$$tagIds']}} },
                ],
                as: 'tags',
            }}
        ])
        return i[0]
    }

    async getLast10(req, res){
        const last10 = await Item.aggregate([
            ...this.aggregateCommands,
            { $sort: { created_at: -1} },
            { $limit: 10 },
            { $project: {author: 1, name: 1, collection: 1}},
        ])
        res.send({items: last10})
    }

    async getItemsByTag(req, res){
        const tagId = new mongoose.Types.ObjectId(req.params.tagId)
        const items = await Item.aggregate([
            { $match: {$expr: { $in : [tagId, '$tags']} }},
            ...this.aggregateCommands,
            { $project: {author: 1, name: 1, collection: 1}},
        ])
        const tag = await Tag.findOne({_id: tagId});
        res.send({items, tag})
    }

    async getItemForEditing(req, res){
        const item = await this.getItemForEditingFromDb(req.params.itemId)
        if(item && item.tags) item.tags = (await Tag.find({_id: item.tags})).map(i=>i.name)
        return res.send({item})
    }

    async getItemForEditingFromDb(itemId){
        const id = new mongoose.Types.ObjectId(itemId)
        const i = await Item.aggregate([
            { $match: {_id: id}},
            { $limit: 1},
            { $lookup: {
                from: 'collections',
                let: { collectionId: '$collectionId'},
                pipeline: [
                    {$match: {$expr: { $eq: ['$_id', '$$collectionId']}} },
                    {$project: {name: 1, author: 1, description: 1, itemFields: 1, topic: 1, img: 1}}
                ],
                as: 'collection',
            }},
            { $addFields: {collection: {$first: '$collection'}}},
            { $match: {collection: {$exists: true}}},
            this.aggregateLookupUsers,
            { $addFields: {author: {$first: '$author'}}},
            { $match: {author: {$exists: true}}},
            { $lookup: {
                from: 'topics',
                let: { topicId: '$collection.topic'},
                pipeline: [
                    {$match: {$expr: { $eq: ['$_id', '$$topicId']}} }
                ],
                as: 'collection.topic',
            }},
            { $addFields: {'collection.topic': {$first: '$collection.topic'}}},
            { $addFields: {'collection.topic': '$collection.topic.name'}}
        ])
        return i[0]
    }

    async getSearchResults(req, res){
        const collections = await this.getSearchResultsFromCollections(req.params.searchFor)
        const comments = await this.getSearchResultsFromComments(req.params.searchFor)
        const items = await this.getSearchResultsFromItems(req.params.searchFor)
        res.send({searchResult: [...collections, ...comments, ...items]})
    }

    async getSearchResultsFromCollections(phrase){
        return await Collection.aggregate([
            { $match: { $text: { $search: phrase }}},
            { $project: { name: 1, author: 1}},
            { $lookup: {
                from: 'items',
                let: {collectionId: '$_id'},
                pipeline: [
                    {$match: { $expr: { $eq: ['$collectionId', '$$collectionId']}}},
                    {$limit: 1},
                    {$project: {name: 1}},
                ],
                as: 'item'
            }},
            { $addFields: { item: { $first: '$item' }}},
            { $match: {item: {$exists: true}}},
            { $lookup: {
                from: 'users',
                let: {authorId: '$author'},
                pipeline: [
                    {$match: { $expr: { $eq: ['$_id', '$$authorId']}}},
                    {$project: {nickname: 1}},
                ],
                as: 'author'
            }},
            { $addFields: { author: { $first: '$author' }}},
            { $match: {author: {$exists: true}}},
            { $addFields: { textScore: {$meta: 'textScore'}}},
            { $addFields: { resultFrom: 'collection'}},
        ])
    }

    async getSearchResultsFromItems(phrase){
        return await Item.aggregate([
            { $match: { $text: { $search: phrase }}},
            ...this.aggregateCommands,
            { $addFields: { textScore: {$meta: 'textScore'}}},
            { $addFields: { resultFrom: 'item'}},
        ])
    }

    async getSearchResultsFromComments(phrase){
        return await Comment.aggregate([
            { $match: { $text: { $search: phrase }}},
            { $lookup: {
                from: 'items',
                let: {itemId: '$item'},
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$itemId']}}},
                ],
                as: 'item'
            }},
            { $addFields: { item: { $first: '$item' }}},
            { $match: {item: {$exists: true}}},
            { $lookup: {
                from: 'collections',
                let: {collectionId: '$item.collectionId'},
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$collectionId']}}},
                    { $project: { author: 1, name: 1 }}
                ],
                as: 'collection'
            }},
            { $addFields: { collection: { $first: '$collection' }}},
            { $match: {collection: {$exists: true}}},
            { $lookup: {
                from: 'users',
                let: {authorId: '$collection.author'},
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$authorId']}}},
                    { $project: { nickname: 1 }}
                ],
                as: 'author'
            }},
            { $addFields: { 'author': { $first: '$author' }}},
            { $match: { 'author': {$exists: true}}},
            { $addFields: { textScore: {$meta: 'textScore'}}},
            { $addFields: { resultFrom: 'comment'}},
        ])
    }

}

module.exports.itemController = proxify(new ItemController)