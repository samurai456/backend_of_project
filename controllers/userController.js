const { User } = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { proxify } = require('./helper')


class UserController{
    async signUp(req, res){
        if(!req.body.password) return res.send({type:'failed'})
        if(!this.validateEmailFormat(req, res)) return
        if(!await this.uniqueEmail(req, res)) return
        const newUser = await this.create(req, res);
        const token = jwt.sign({id: newUser.id}, process.env.SECRET_KEY);
        res.send({type: 'signup-success', msg: 'user successfully created', token, userId: newUser.id });
    }

    validateEmailFormat(req, res){
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)){
            res.send({type: 'signup-error', msg: 'invalid email format'})
            return
        }
        return true
    }

    async uniqueEmail(req, res){
        if(await User.findOne({email: req.body.email})){
            res.send({type: 'signup-error', msg: 'user with this email already exists'})
            return
        }
        return true
    }

    async create(req, res){
        const {nickname, email, password, theme, lang} = req.body;
        const user = await User.create({
            nickname,
            email,
            password: bcrypt.hashSync(password, 8),
            lang,
            theme,
        });
        return user
    }

    async signIn(req, res){
        const user = await User.findOneAndUpdate(
            {email: req.body.email}, 
            {lastLoginDate: Date.now()}, 
            {returnOriginal: false}
        )
        if(!this.verifySignInData(req, res, user)) return
        if(!this.verifyStatus(res, user)) return
        this.sendSignInSuccess(res, user)
    }

    verifySignInData(req, res, user){
        if(user && bcrypt.compareSync(req.body.password, user.password)) return true
        res.send({type: 'signin-failed', msg: 'invalid email or password'})
    }

    verifyStatus(res, user){
        if(user && user.status) return true
        res.send({type: 'signin-failed', msg: 'user is blocked'})
    }

    sendSignInSuccess(res, user){
        const token = jwt.sign({id: user.id}, process.env.SECRET_KEY);
        res.send({
            type: 'signin-success', 
            msg: 'successfully signed in', 
            token,
            userId: user.id,
            permission: user.isAdmin? 'admin': 'normal',
            lang: user.lang,
            theme: user.theme
        });
    }

    async sendAll(req, res){
        const allUsers = await User.find({}, {password: 0, lang: 0, theme: 0}).sort({_id: -1});
        res.send({type: 'all-users', allUsers});
    }

    async blockMany(req, res){
        this.updateAndSend(req, res, {status: false})
    }

    async unblockMany(req, res){
        this.updateAndSend(req, res, {status: true})
    }

    async giveAdmin(req, res){
        this.updateAndSend(req, res, {isAdmin: true})
    }

    async takeAdmin(req, res){
        this.updateAndSend(req, res, {isAdmin: false})
    }

    async updateAndSend(req, res, filter){
        await User.updateMany({_id: req.body.ids}, filter)
        const user = await User.findOne({_id: req.user._id})
        const permission = this.getPermission(user)
        if(permission!=='admin') return res.send({permission })
        this.sendAll(req, res);
    }

    async deleteMany(req, res){
        await User.deleteMany({_id: req.body.ids})
        const user = await User.findOne({_id: req.user._id})
        const permission = this.getPermission(user)
        if(permission!=='admin') return res.send({permission })
        this.sendAll(req, res);
    }

    getPermission(user){
        return !user|| !user.status? 
                    'guest': 
                    user.isAdmin? 
                        'admin': 'normal';
    }

    verify(req, res){
        if(req.user && req.user.status){
            res.send({
                type: 'verification', 
                permission: req.user.isAdmin? 'admin': 'normal', 
                lang: req.user.lang,
                theme: req.user.theme
            })
        } else {
            res.send({type: 'verification', permission: 'guest'})
        }
    }

    async changeTheme(req, res){
        if(!['dark', 'light'].includes(req.params.theme) ){
            return res.send({type: 'theme-error', msg: 'only dark and light themes allowed'})
        }
        req.user.theme = req.params.theme;
        req.user.save()
        res.send({type: 'theme-changed'})
    }

    async changeLang(req, res){
        if(!['ru', 'en'].includes(req.params.lang) ){
            return res.send({type: 'lang-error', msg: 'only "ru" and "en" languages allowed'})
        }
        req.user.lang = req.params.lang;
        req.user.save()
        res.send({type: 'lang-changed'})
    }

    async getEmail(req, res){
        res.send({email: req.user.email})
    }
}

module.exports.userController = proxify(new UserController)