
function attachWsServerForComments(wsServer){
    return (req, res, next)=>{
        if(['POST', 'DELETE'].includes(req.method) && 
            (req.path.includes('comment') || req.path.includes('like')))
        {
            req.wsServer = wsServer
        }
        next()
    }
}

module.exports = { attachWsServerForComments }