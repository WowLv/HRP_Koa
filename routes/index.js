var Router = require('koa-router')
var upload = require('../util/storageConfid')
const router = new Router();

var allInfo = require('../controllers/allInfoController')
var login = require('../controllers/loginController')
var personInfo = require('../controllers/personInfoController')
var memberFile = require('../controllers/memberController')
var workLoad = require('../controllers/workLoadController')

router.post('/login', login.Login)
router.post('/check', login.LogCheck)
router.post('/uregister', login.Register)
router.post('/modifyPw', login.modifyPw)

router.get('/personInfo', personInfo.getInfo)
router.post('/personInfo', personInfo.setInfo)

router.get('/allInfo', allInfo.getAllInfo)
router.post('/searchInfo', allInfo.searchInfo)

router.get('/personFile', memberFile.getPersonFile)
router.get('/memberFile', memberFile.memberFile)
router.post('/mregister', memberFile.memberRegister)
router.get('/allMemberApply', memberFile.getAllMenberApply)
router.post('/memberApply', memberFile.entryApply)
router.post('/passMember', memberFile.passMember)
router.post('/rejectMember', memberFile.rejectMember)

router.post('/scient_load', upload.single('file'), workLoad.scientificLoad)
router.post('/public_load', upload.single('file'), workLoad.publicLoad)


module.exports = router
