var Router = require('koa-router')
var upload = require('../util/storageConfid')
const router = new Router();

var allInfo = require('../controllers/allInfoController')
var login = require('../controllers/loginController')
var personInfo = require('../controllers/personInfoController')
var memberFile = require('../controllers/memberController')
var workLoad = require('../controllers/workLoadController')
var notification = require('../controllers/noticeController')

router.post('/login', login.Login)  //√
router.post('/check', login.LogCheck)   //√
router.post('/u_register', login.Register)
router.post('/modifyPw', login.modifyPw)    //√

router.get('/personInfo', personInfo.getInfo)   //√
router.post('/personInfo', personInfo.setInfo)  //√

router.get('/allInfo', allInfo.getAllInfo)  //√
router.post('/searchInfo', allInfo.searchInfo)  //√

router.get('/personFile', memberFile.getPersonFile) //√
router.get('/memberFile', memberFile.memberFile)    //√
router.post('/m_register', memberFile.memberRegister)
router.get('/allMemberApply', memberFile.getAllMenberApply)
router.post('/memberApply', memberFile.ERApply)
router.post('/passMember', memberFile.passMember)
router.post('/rejectMember', memberFile.rejectMember)
router.get('/checkResign', memberFile.checkResign)
router.post('/searchFile', memberFile.searchFile)

router.post('/scientLoad', upload.single('file'), workLoad.uploadScientificLoad)
router.post('/publicLoad', upload.single('file'), workLoad.uploadPublicLoad)
router.get('/publicLoad_sum', workLoad.publicLoadSummary)
router.get('/scientLoad_sum', workLoad.scientLoadSummary)
router.get('/load_manage', workLoad.workLoadManage)
router.get('/download_load', workLoad.downloadWorkLoad)

router.get('/notice', notification.notice)


module.exports = router
