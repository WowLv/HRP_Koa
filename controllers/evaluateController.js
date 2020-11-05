var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var { addNotice, calcEvaluation } = require('../util/function')

var getGpaRecord = async ctx => {
    let { page, year } = ctx.query
    page = (page - 1) * 10 || 0
    let sql = `select a.*, b.stationId, b.levelId, name from gpa_record_table a, station_file_table b, file_table c where a.fid = b.fid and a.fid = c.fid and isExist = 1 and isEvaluate = 0 and YEAR(a.updateTime) = ${year} limit ${page}, 10`,
        sumSql = `select count(*) as sum from gpa_record_table where isExist = 1 and isEvaluate = 0 and YEAR(updateTime) = ${year}`
        row = await query (sql, []),
        sumRow = await query(sumSql, [])
    ctx.body = new Respond(true, 200, '查询成功', {data: row, sum: sumRow[0].sum})
}

var getEvaluation = async ctx => {
    let { page, year } = ctx.query
    page = (page - 1) * 10 || 0
    let sql = `select a.*, name from evaluation_record_table a, file_table b where a.fid = b.fid and YEAR(createTime) = ${year} limit ${page}, 10`,
        row = await query(sql, []),
        sumSql = `select count(*) as sum from evaluation_record_table where YEAR(createTime) = ${year}`,
        sumRow = await query(sumSql, [])
    if(row.length) {
        row.forEach(item => {
            item.createTime = formatDate(item.createTime, 'Y:M:D')
        })
    }
    ctx.body = new Respond(true, 200, '查询成功', {data: row, sum: sumRow[0].sum})
}


var evaluate = async ctx => {
    const { fid, teachLoad, publicGpa, scientGpa, stationId, levelId } = ctx.request.body
    let checkSql = `select * from gpa_record_table where fid = ? and isUpdate = 1`,
        checkSqlArr = [fid],
        checkRow = await query(checkSql, checkSqlArr)
    if(checkRow.length) {
        response = new Respond(false, 200, '请确保教务处已录入课时量')
    }else {
        let targetGpaSql = `select teachLoadTarget, publicLoadTarget, scientLoadTarget from performance_target_table where stationId = ? and levelId = ?`,
            targetGpaSqlArr = [stationId, levelId],
            targetGpaRow = await query(targetGpaSql, targetGpaSqlArr),
            {teachLoadTarget, publicLoadTarget, scientLoadTarget} = targetGpaRow[0],
            gradeSql = `select (? - ?) * (select rule from evaluation_rule_table where workLoadTypeId = 3) + (? - ?) * (select rule from evaluation_rule_table where workLoadTypeId = 2) + (? - ?) * (select rule from evaluation_rule_table where workLoadTypeId = 1) as grade`,
            gradeSqlArr = [teachLoad, teachLoadTarget, publicGpa, publicLoadTarget, scientGpa, scientLoadTarget],
            gradeRow = await query(gradeSql, gradeSqlArr),
            { grade } = gradeRow[0],
            ruleSql = `select targetGrade, evaluation from evaluation_table`,
            ruleRow = await query(ruleSql, []),
            evaluation = calcEvaluation(grade, ruleRow),
            recordSql = `insert into evaluation_record_table (fid, evaluation, grade, createTime) values(?,?,?,?)`,
            recordSqlArr = [fid, evaluation, 100 + grade, new Date()],
            recordRes = await query(recordSql, recordSqlArr),
            updateSql = `update gpa_record_table set isEvaluate = 1 where fid = ?`,
            updateSqlArr = [fid],
            updateRes = await query(updateSql, updateSqlArr),
            noticeRes = addNotice(fid, null, 2, 2, 6, null)
        if(recordRes.affectedRows > 0 && updateRes.affectedRows > 0 && noticeRes) {
            ctx.body = new Respond(true, 200, '考核成功')
        }else {
            ctx.body = new Respond(false, 200, '考核失败，请重试')
        }
    }
}

var getPersonEvaluation = async ctx => {
    let { fid, year } = ctx.query,
        sql = `select a.*, name from evaluation_record_table a, file_table b where YEAR(a.createTime) = ${year} and a.fid = b.fid and a.fid = ?`,
        sqlArr = [fid],
        [row] = await query(sql, sqlArr)
    if(row) {
        row.createTime = formatDate(row.createTime, 'Y:M:D')
    }
    ctx.body = new Respond(true, 200, '查询成功', row)
}

var resetGrade = async ctx => {
    let { evaluateRecordId, grade } = ctx.request.body,
        ruleSql = `select targetGrade, evaluation from evaluation_table`,
        ruleRow = await query(ruleSql, []),
        evaluation = calcEvaluation(grade - 100, ruleRow),
        sql = `update evaluation_record_table set grade = ?, evaluation = ?, createTime = ? where evaluateRecordId = ?`,
        sqlArr = [grade, evaluation, new Date(), evaluateRecordId],
        res = await query(sql, sqlArr)
    if(res.affectedRows > 0) {
        ctx.body = new Respond(true, 200, "绩效再评成功")
    }else {
        ctx.body = new Respond(false, 200, "绩效再评失败，请重试")
    }
}

module.exports = {
    getGpaRecord,
    getEvaluation,
    evaluate,
    getPersonEvaluation,
    resetGrade
}