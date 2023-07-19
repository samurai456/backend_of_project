const { Topic } = require('../models/topic')
const { proxify } = require('./helper')

class TopicController{
    async createMany(req, res){
        req.body.topics.forEach(async name => {
            const topic = await Topic.create({ name });
            topic.save();
        });
        res.send({type: 'topics-creation-success', msg: 'topics created successfully'})
    }

    async getAll(req, res){
        const topics = await Topic.find({}, {__v: 0});
        res.send({type: 'all-topics', topics})
    }
}

module.exports.topicController = proxify(new TopicController)