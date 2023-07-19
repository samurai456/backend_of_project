const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { router } = require('./router')
const WebSocket = require('ws');
const http = require('http');
const app = express();
const { onConnection, onNewComment, onLikeUnlike } = require('./wsMethods');
const { attachWsServerForComments } = require('./middlewares/attachWsForComments');
require('dotenv').config()

process.on('uncaughtException', e=>console.log(e))

const server = http.createServer(app)
const webSocketServer = new WebSocket.Server({ server })

webSocketServer.on('connection', onConnection)
webSocketServer.onNewComment = onNewComment
webSocketServer.onLikeUnlike = onLikeUnlike

app.use(express.json());
app.use(cors({
    origin: process.env.frontend,
    methods: ['POST', 'PUT', 'GET', 'DELETE']
}));
app.use('/api', attachWsServerForComments(webSocketServer), router)

async function startApp(){
    try {
        await mongoose.connect(process.env.dbURL);
        server.listen(8000, () => console.log('server is running...'));
    } catch (e) {
        console.log(e)
    }
}

startApp();