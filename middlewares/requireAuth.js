
const requireAuth = ({admin}={admin: false}) =>{
    return (req, res, next) => {
        if(req.user && req.user.status && (req.user.isAdmin || !admin)){
            next()
            return
        }
        const permission = !req.user || !req.user.status? 
                                'guest': 
                                req.user.isAdmin? 
                                    'admin': 'normal';
        res.send({
            type: 'permission-denied', 
            msg: `only active ${admin? 'admin': 'authenticated'} users has access to this endpoint`,
            permission
        })
    }
}

module.exports = { requireAuth }