var query = require('../util/dbconfig');
// var { LogCheck } = require('./loginController')
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

var getPersonFile = async ctx => {
    let {fid} = ctx.query
    let sql = `select positionId from file_table where fid=?`
    let sqlArr = [fid]

    let checkRow = await query(sql, sqlArr)
    let resSql = ''
    if(checkRow.length) {
        if(checkRow[0].positionId === 4) {
            resSql = `select file_table.fid, name, sex, age, phone, email, file_table.positionId, positionName, station_table.stationId, stationName, station_file_table.levelId, levelName from file_table, level_table, position_table, station_table, station_file_table where file_table.positionId = position_table.positionId and level_table.levelId = station_file_table.levelId and file_table.fid = station_file_table.fid and station_file_table.stationId = station_table.stationId and file_table.fid = ?`
        }else if(checkRow[0].positionId === 3){
            resSql = `select file_table.fid, name, sex, age, phone, email, file_table.positionId, positionName, section_table.sectionId, sectionName from file_table, position_table, section_table, section_file_table where file_table.positionId = position_table.positionId and file_table.fid = section_file_table.fid and section_file_table.sectionId = section_table.sectionId and file_table.fid = ?`
        }else {
            resSql = `select fid, name, sex, age, phone, email, file_table.positionId, positionName from file_table, position_table where file_table.positionId = position_table.positionId and fid = ?`
        }
        let resRow = await query(resSql, sqlArr)
        if(resRow.length) {
            ctx.body = new Respond(true, 200, '查询成功', resRow[0])
        }else {
            ctx.body = new Respond(true, 200, '查询失败')
        }
    }else {
        ctx.body = new Respond(true, 200, '查询失败')
    }
}

var memberFile = async ctx => {
    let {page} = ctx.query
    page = (page - 1) * 10 || 0
    let sql = `select fid, name, sex, age, phone, email, file_table.positionId, positionName from file_table, position_table where file_table.positionId = position_table.positionId limit ${page},10`
    let sumSql = `select count(*) as sum from file_table`

    let resRow = await query(sql, [])
    let sumRow = await query(sumSql, [])
    ctx.body = new Respond(true, 200, '查询成功', { data: resRow, sum: sumRow[0].sum})
}

var memberRegister = async ctx => {
    let { name, sex, age, phone, email, stationId, levelId, positionId, sectionId } = ctx.request.body
    let sql = `insert into file_table (name, sex, age, phone, email, positionId, updateTime) values (?,?,?,?,?,?,?)`
    let sqlArr = [name, sex, age, phone, email, positionId, new Date()]
    let fileRow = await query(sql, sqlArr)
    if(fileRow.affectedRows > 0) {
        if(stationId) {
            let stationSql = `insert into station_file_table (fid, stationId, levelId, updateTime) values (?,?,?,?)`
            let stationSqlArr = [fileRow.insertId, stationId, levelId, new Date()]
            let stationRow = await query(stationSql, stationSqlArr)
            if(stationRow.affectedRows > 0) {
                ctx.body = new Respond(true, 200, `注册成功，职工号${fileRow.insertId}`)
            }else {
                ctx.body = new Respond(false, 200, `注册失败`)
            }
        }else if(sectionId) {
            let sectionSql = `insert into section_file_table (fid, sectionId, updateTime) values (?,?,?)`
            let sectionSqlArr = [fileRow.insertId, sectionId, new Date()]
            let sectionRow = await query(sectionSql, sectionSqlArr)
            if(sectionRow.affectedRows > 0) {
                ctx.body = new Respond(true, 200, `注册成功，职工号${fileRow.insertId}`)
            }else {
                ctx.body = new Respond(false, 200, `注册失败`)
            }
        }else {
            ctx.body = new Respond(true, 200, `注册成功，职工号${fileRow.insertId}`)
        }
    }
}

var getAllMenberApply = async ctx => {
    let {page} = ctx.query
    page = (page - 1) * 8 || 0
    let sumSql = `select count(*) as sum from memberapply_table where modeId = 0`
    let sql = `select mid, applicant, fid, memberapply_table.applyTypeId, reason, memberapply_table.modeId, applyTime, updateTime, memberapply_table.positionId, positionName, applyType, applyMode from memberapply_table, memberapply_type_table, apply_mode_table, position_table where memberapply_table.applyTypeId = memberapply_type_table.applyTypeId and memberapply_table.modeId = apply_mode_table.modeId and memberapply_table.positionId = position_table.positionId and apply_mode_table.modeId = ? limit ${page},8`
    let sqlArr = [0]
    let sumRow = await query(sumSql, [])
    let row = await query(sql, sqlArr)
    row.forEach(item => {
        item.applyTime = formatDate(item.applyTime, 'Y:M:D')
        item.updateTime = formatDate(item.updateTime, 'Y:M:D')
    })
    ctx.body = new Respond(true, 200, '查询成功', { data: row, sum: sumRow[0].sum })
}

var getAllMenberApplyFinished = async ctx => {
    let {page} = ctx.query
    page = (page - 1) * 8 || 0
    let sumSql = `select count(*) as sum from memberapply_table where modeId = 1 or modeId = 2`
    let sql = `select mid, applicant, fid, memberapply_table.applyTypeId, reason, memberapply_table.modeId, applyTime, updateTime, memberapply_table.positionId, positionName, applyType, applyMode from memberapply_table, memberapply_type_table, apply_mode_table, position_table where memberapply_table.applyTypeId = memberapply_type_table.applyTypeId and memberapply_table.modeId = apply_mode_table.modeId and memberapply_table.positionId = position_table.positionId and (apply_mode_table.modeId = ? or apply_mode_table.modeId = ?) limit ${page},8`
    let sqlArr = [1,2]

    let sumRow = await query(sumSql, [])
    let row = await query(sql, sqlArr)
    row.forEach(item => {
        item.applyTime = formatDate(item.applyTime, 'Y:M:D')
        item.updateTime = formatDate(item.updateTime, 'Y:M:D')
    })
    ctx.body = new Respond(true, 200, '查询成功', { data: row, sum: sumRow[0].sum })
}

var ERApply = async ctx => {
    let { applicant, fid, reason, applyTypeId, modeId, applyTime, positionId } = ctx.request.body
    let sql = `insert into memberapply_table (applicant, fid, reason, applyTypeId, modeId, applyTime, createTime, updateTime, positionId) values (?,?,?,?,?,?,?,?,?)`
    let sqlArr = [applicant, fid, reason, applyTypeId, modeId, new Date(applyTime), new Date(), new Date(), positionId]
    let row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '申请成功，请等待审核')
    }else {
        ctx.body = new Respond(false, 200, '申请失败，请重试')
    }
}

var auditMember = async ctx => {
    let { mid, modeId } = ctx.request.body
    let sql = `UPDATE memberapply_table set modeId=?, updateTime=? where mid=?`
    let sqlArr = [modeId, new Date(), mid]
    let row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '审批成功')
    }else {
        ctx.body = new Respond(false, 200, '审批失败，请重试')
    }
}

var checkResign = async ctx => {
    let { fid } = ctx.query
    let sql = `select applyTypeId, modeId from memberapply_table where fid = ? and applyTypeId = 2`
    let sqlArr = [fid]

    let row = await query(sql, sqlArr)
    if(row.length) {
        ctx.body = new Respond(true, 200, "查询成功", row[0])
    }else {
        ctx.body = new Respond(false, 200, "此ID无记录")
    }
}

var searchMember = async ctx => {
    let {user} = ctx.request.body
    let sql = `select fid, name, sex, age, phone, email, file_table.positionId, positionName from file_table, position_table where file_table.positionId = position_table.positionId and (file_table.name=? or file_table.fid=?)`
    let sqlArr = [user, user]
    let row = await query(sql, sqlArr)
    if(row.length) {
        ctx.body = new Respond(true, 200, '查询成功', {data: row, sum: row.length})
    }else {
        ctx.body = new Respond(false, 200, '查询无结果')
    }
    
}

var getPositionList = async ctx => {
    let levelSql = `select * from level_table`
    let stationSql = `select * from station_table`
    let positionSql = `select * from position_table`
    let sectionSql = `select * from section_table`
    let levelRow = await query(levelSql, [])
    let stationRow = await query(stationSql, [])
    let positionRow = await query(positionSql, [])
    let sectionRow = await query(sectionSql, [])

    ctx.body = new Respond(true, 200, '查询成功', {levelRow, stationRow, positionRow, sectionRow})
}

module.exports = {
    getPersonFile,
    memberFile,
    memberRegister,
    getAllMenberApply,
    ERApply,
    auditMember,
    checkResign,
    searchMember,
    getPositionList,
    getAllMenberApplyFinished
}