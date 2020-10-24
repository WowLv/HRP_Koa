var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

var setTeachRecord = async ctx => {
    let { fid, recordTypeId, classHour, recordTime } = ctx.request.body,
        checkIsTeacherSql = `select positionId from file_table where fid = ?`,
        checkIsTeacherSqlArr = [fid],
        sql = `insert into teach_record_table (fid, recordTypeId, classHour, recordTime) values (?,?,?,?)`,
        sqlArr = [fid, recordTypeId, classHour, new Date(recordTime)],
        updateCheckModeSql = `update gpa_record_table set isUpdate = 1 where recordTypeId = ?`,
        updateCheckModeSqlArr = [recordTypeId],
        checkIsTeacherRow = await query(checkIsTeacherSql, checkIsTeacherSqlArr)
    if(checkIsTeacherRow[0].positionId === 4) {
        let res = await query(sql, sqlArr),
            updateRes = await query(updateCheckModeSql, updateCheckModeSqlArr)
        if(res.affectedRows > 0 && updateRes.affectedRows > 0) {
            ctx.body = new Respond(true, 200, '报备成功')
        }else {
            ctx.body = new Respond(false, 200, '报备失败，请重试')
        }
    }else {
        ctx.body = new Respond(false, 200, '请确认是否为教师职工号')
    }
    
}

var setTeachLoad = async ctx => {
    let { fid, mode, teachLoad, updateTime } = ctx.request.body
    if(mode === 'check') {
        let checkClasshourSql = `select * from teach_record_table where isCheck = 0 and fid = ?`,
            checkClasshourSqlArr = [fid],
            checkClasshourRow = await query(checkClasshourSql, checkClasshourSqlArr)
            checkSumSql = `select name, teachLoad + IFNULL((select sum(classHour) as classHour from teach_record_table where isCheck = 0 and fid = ?), 0) as teachLoad from file_table a, gpa_record_table b where a.fid = b.fid and isExist = 1 and a.fid = ?`,
            checkSumSqlArr = [fid, fid],
            checkSumRow = await query(checkSumSql, checkSumSqlArr)
        if(checkClasshourRow.length && checkSumRow.length) {
            ctx.body = new Respond(true, 200, '查询成功', checkSumRow[0])
        }else if(checkSumRow.length) {
            ctx.body = new Respond(true, 200, '该教师已录入完毕', checkSumRow[0])
        }else {
            ctx.body = new Respond(false, 200, '请确认是否为教师职工号')
        }
        
    }else if(mode === 'update') {
        let setLoadSql = `update gpa_record_table set teachLoad = ?, updateTime = ?, isUpdate = ? where fid = ?`,
            setLoadSqlArr = [teachLoad, new Date(updateTime), 0, fid],
            updateCheckSql = `update teach_record_table set isCheck = 1 where fid = ?`,
            updateCheckSqlArr = [fid],
            setLoadRes = await query(setLoadSql, setLoadSqlArr),
            updateCheckRes = await query(updateCheckSql, updateCheckSqlArr)
        if(setLoadRes.affectedRows > 0 && updateCheckRes.affectedRows >= 0) {
            ctx.body = new Respond(true, 200, '录入教学工作量成功')
        }else {
            ctx.body = new Respond(false, 200, '录入教学工作量失败，请重试')
        }
    }
}

module.exports = {
    setTeachRecord,
    setTeachLoad
}