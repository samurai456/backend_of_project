const Router = require('express');
const { userController } = require('./controllers/userController')
const { collectionController } = require('./controllers/collectionController')
const { tagController } = require('./controllers/tagController')
const { topicController } = require('./controllers/topicController')
const { itemController } = require('./controllers/itemController')
const { commentController } = require('./controllers/commentController')
const { likeController } = require('./controllers/likeController')
const { verifyToken } = require('./middlewares/verifyToken')
const { requireAuth } = require('./middlewares/requireAuth')
const { attachCollection } = require('./middlewares/attachCollection')
const { attachItem } = require('./middlewares/attachItem')
const { requireValidTag } = require('./middlewares/requireValidTag')
const multer = require('multer');
const upload = multer({storage: multer.memoryStorage()})

const router = new Router();
router.get('/verify', verifyToken, userController.verify)

router.post('/user/sign-up', userController.signUp )
router.post('/user/sign-in', userController.signIn )
router.get('/user/all', verifyToken, requireAuth({admin: true}), userController.sendAll)
router.put('/user/block', verifyToken, requireAuth({admin: true}), userController.blockMany)
router.put('/user/unblock', verifyToken, requireAuth({admin: true}), userController.unblockMany)
router.put('/user/give-admin', verifyToken, requireAuth({admin: true}), userController.giveAdmin)
router.put('/user/take-admin', verifyToken, requireAuth({admin: true}), userController.takeAdmin)
router.delete('/user/delete', verifyToken, requireAuth({admin: true}), userController.deleteMany)
router.get('/user/email', verifyToken, requireAuth(), userController.getEmail)
router.put('/user/theme/:theme', verifyToken, requireAuth(), userController.changeTheme)
router.put('/user/lang/:lang', verifyToken, requireAuth(), userController.changeLang)
router.get('/user/reset-password/:email', userController.handleResetPasswordRequest)
router.post('/user/reset-password', userController.resetPassword)

router.post('/topic', verifyToken, requireAuth({admin: true}) , topicController.createMany)
router.get('/topic/all', topicController.getAll)

router.get('/collection/5largest', collectionController.get5Largest)
router.get('/collection/collection-for-editing/:collectionId', attachCollection, collectionController.getCollectionForEditing)
router.post('/collection', upload.single('img'), verifyToken, requireAuth(), collectionController.createCollection)
router.put('/collection/:collectionId', upload.single('img'), verifyToken, requireAuth(), attachCollection, collectionController.updateCollection)
router.get('/collection/collections-of-user/:userId', collectionController.getUserCollections)
router.get('/collection/:collectionId', attachCollection, collectionController.getCollection)
router.delete('/collection/:collectionId', verifyToken, requireAuth(), attachCollection, collectionController.deleteCollection)

router.get('/item/last10', itemController.getLast10)
router.get('/item/items-by-tag/:tagId', requireValidTag, itemController.getItemsByTag)
router.post('/item/:collectionId/', verifyToken, requireAuth(), attachCollection, itemController.createItem)
router.post('/item/items-of-collection/:collectionId/:page', attachCollection, itemController.getItemsOfCollection )
router.post('/item/download-items-of-collection/:collectionId', attachCollection, itemController.getFilteredItemsOfCollection)
router.get('/item/:itemId', itemController.getItem)
router.get('/item/for-editing/:itemId', itemController.getItemForEditing)
router.put('/item/:itemId', verifyToken, requireAuth(), attachItem, itemController.updateItem)
router.delete('/item/delete-many', verifyToken, requireAuth(), itemController.deleteItems)
router.get('/item/search-for/:searchFor', itemController.getSearchResults)

router.post('/comment/:itemId', verifyToken, requireAuth(), attachItem, commentController.create)
router.delete('/comment/:commentId', verifyToken, requireAuth(), commentController.deleteComment)

router.get('/tag/popular', tagController.getPopular)
router.get('/tag/by-start/:tagStart', tagController.getTagsByStart)

router.get('/like/:itemId', verifyToken, likeController.getItemLikeInfo)
router.delete('/like/:itemId', verifyToken, requireAuth(), attachItem, likeController.deleteLike)
router.post('/like/:itemId', verifyToken, requireAuth(), attachItem, likeController.createLike)

router.post('/some', itemController.some)

module.exports = { router };