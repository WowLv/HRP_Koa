var Router = require('koa-router')
var upload = require('../util/storageConfid')
var router = new Router();

var allInfo = require('../controllers/allInfoController')
var login = require('../controllers/loginController')
var personInfo = require('../controllers/personInfoController')
var memberFile = require('../controllers/memberController')
var workLoad = require('../controllers/workLoadController')
var notification = require('../controllers/noticeController')
var station = require('../controllers/stationController')
var section = require('../controllers/sectionController')
var teach = require('../controllers/teachController')
var evaluate = require('../controllers/evaluateController')


router.post('/login', login.Login)      //√
router.post('/check', login.LogCheck)       //√
router.post('/u_register', login.registerUser)      //√
router.post('/modifyPw', login.modifyPw)        //√
router.get('/percent',login.getPercent)         //m
router.post('/u_delete', login.deleteUser)      //m

router.get('/personInfo', personInfo.getInfo)       //√
router.post('/personInfo', personInfo.setInfo)      //√

router.get('/allInfo', allInfo.getAllInfo)      //√
router.post('/searchInfo', allInfo.searchInfo)      //√

router.get('/personFile', memberFile.getPersonFile)     //√
router.post('/personFile', memberFile.setPersonFile)     //m
router.get('/memberFile', memberFile.memberFile)    //√
router.post('/m_register', memberFile.memberRegister)       //√
router.get('/allMemberApply', memberFile.getAllMenberApply)     //√
router.get('/allMemberFinished', memberFile.getAllMenberApplyFinished)      //√
router.post('/memberApply', memberFile.ERApply)     //√
router.post('/auditMember', memberFile.auditMember)     //√
router.get('/checkResign', memberFile.checkResign)      //m
router.post('/searchMember', memberFile.searchMember)       //√
router.get('/positionList', memberFile.getPositionList)     //√
router.post('/del_memTransfer', memberFile.deleteMemRecord)      //m
router.post('/del_memberFile', memberFile.delMemberFile)

router.post('/scientLoad', upload.single('file'), workLoad.uploadScientificLoad)    //√
router.post('/publicLoad', upload.single('file'), workLoad.uploadPublicLoad)    //√
router.get('/publicLoad_sum', workLoad.publicLoadSummary)   //√ 
router.get('/scientLoad_sum', workLoad.scientLoadSummary)   //√   !!加上有附加项的id列表
router.get('/load_manage', workLoad.workLoadManage)   //√ 
router.get('/download_load', workLoad.downloadWorkLoad)   //√
router.get('/measure', workLoad.getMeasure)   //√
router.post('/audit_workLoad', workLoad.auditWorkLoad)   //√
router.get('/workLoadType', workLoad.getWorkLoadType)    //m
router.get('/gpa', workLoad.getGpa)                      //m
router.post('/mod_workLoad', workLoad.setWorkLoad)       //m
router.post('/add_workLoad', workLoad.addWorkLoad)       //m

router.get('/notice', notification.notice)               //m

router.post('/pos_transfer', station.posTransferApply)   //√
router.get('/pos_transferApply', station.getPosTransferApply)   //√
router.post('/audit_posTransfer', station.auditPosTransferApply)   //√  !!加上权限改变
router.post('/delete_posTransfer', station.deleteTransferRecord)   //m
router.post('/set_station', station.setStation)                    //m
router.post('/set_position', station.setPosition)                  //m

router.get('/sectionFile', section.getEachSectionFile)          //m
router.post('/sectionApply', section.sectionApply)              //m
router.get('/all_sectionApply', section.getAllSectionApply)     //m
router.post('/audit_sectionApply', section.auditSectionApply)   //m
router.post('/set_section', section.setSection)                 //m
router.post('/del_sectionRec', section.delSectionRecord)        //m

router.post('/teach_record', teach.setTeachRecord)  //m
router.post('/teachLoad', teach.setTeachLoad)       //m

router.get('/gpa_record', evaluate.getGpaRecord)                 //m              
router.get('/evaluation', evaluate.getEvaluation)                //m
router.post('/evaluate', evaluate.evaluate)                      //m
router.get('/person_eval', evaluate.getPersonEvaluation)         //m
router.post('/reEvaluate', evaluate.resetGrade)

module.exports = router
