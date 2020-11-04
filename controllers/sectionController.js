var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var { addNotice } = require('../util/function')

var getEachSectionFile = async ctx => {
    let { page, sectionId } = ctx.query
    page = (parseInt(page) - 1) * 10 || 0

    let sql = `select id, a.fid, name, a.sectionId, b.sectionName, a.updateTime from section_file_table a, section_table b, file_table c where a.sectionId = b.sectionId and a.fid = c.fid and a.sectionId = ? limit ${page}, 10 `,
        sqlArr = [sectionId, page],
        sumSql = `select count(*) as sum from section_file_table where sectionId = ?`,
        sumSqlArr = [sectionId],
        row = await query(sql, sqlArr),
        sumRow = await query(sumSql, sumSqlArr)
    if(row.length) {
        row.forEach(item => {
            item.updateTime = formatDate(item.updateTime, 'Y:M:D')
        })
    }
    ctx.body = new Respond(true, 200, '查询成功', { data: row, sum: sumRow[0].sum })
}

var sectionApply = async ctx => {
    console.log(ctx.request.body)
    let { fid, oldSectionId, sectionId, reason, applyTime, modeId } = ctx.request.body,
        applySql = `insert into section_transfer_table (fid, oldSectionId, sectionId, reason, applyTime, updateTime, modeId) values (?,?,?,?,?,?,?)`,
        applySqlArr = [fid, oldSectionId, sectionId, reason, new Date(applyTime), new Date(), modeId]
        checkFidSql = `select * from section_transfer_table where modeId = 0 and fid = ?`,
        checkFidSqlArr = [fid],
        checkFidRow = await query(checkFidSql, checkFidSqlArr)
    if(checkFidRow.length) {
        ctx.body = new Respond(false, 200, '该用户已提交同类型申请')
    }else {
        let applyRes = await query(applySql, applySqlArr),
            noticeRes = addNotice(null, 2, 1, 1, 1, null)
        if(noticeRes && applyRes.affectedRows > 0) {
            ctx.body = new Respond(true, 200, '申请成功，请等待审核')
        }else {
            ctx.body = new Respond(false, 200, '申请失败，请重试')
        }
    }
}

var getAllSectionApply = async ctx => {
    let {mode, page} = ctx.query
    page = (page - 1) * 8 || 0
    let sql = ''
        sumSql = ''
    if(mode === 'apply') {
        sql = `select a.*, b.name from section_transfer_table a, file_table b where a.fid = b.fid and modeId = 0 limit ${page}, 8`
        sumSql = `select count(*) as sum from section_transfer_table where modeId = 0`
    }else {
        sql = `select a.*, b.name from section_transfer_table a, file_table b where a.fid = b.fid and modeId != 0 limit ${page}, 8`
        sumSql = `select count(*) as sum from section_transfer_table where modeId != 0`
    }
    let row = await query(sql, []),
        sumRow = await query(sumSql, []),
        sectionSql = `select * from section_table`,
        sectionRow = await query(sectionSql, [])
    if(row.length) {
        row.forEach(item => {
            item.applyTime = formatDate(item.applyTime, 'Y:M:D')
            item.updateTime = formatDate(item.updateTime, 'Y:M:D')
            sectionRow.map(sectionItem => {
                if(sectionItem.sectionId === item.oldSectionId) {
                    item.oldSectionName = sectionItem.sectionName
                }
                if(sectionItem.sectionId === item.sectionId) {
                    item.sectionName = sectionItem.sectionName
                }
            })
        })
    }
    ctx.body = new Respond(true, 200, '查询成功', {data: row, sum: sumRow[0].sum})
    
}

var auditSectionApply = async ctx => {
    let { transferId, sectionId, modeId, fid } = ctx.request.body,
        flag = true,
        noticeRes
    if(modeId === 1) {
        let checkSql = `select * from section_file_table where fid = ?`,
            checkSqlArr = [fid],
            checkRow = await query(checkSql, checkSqlArr)
        noticeRes = addNotice(fid, null, 2, 2, 1, null)
        if(checkRow.length) {
            let updateSectionSql = `update section_file_table set sectionId=? where fid = ?`,
                updateSectionSqlArr = [sectionId, fid],
                updateSectionRes = await query(updateSectionSql, updateSectionSqlArr)
            if(!updateSectionRes.affectedRows) {
                flag = false;
            }
        }else {
            let insertSql = `insert into section_file_table (fid, sectionId, updateTime) values (?,?,?)`,
                insertSqlArr = [fid, sectionId, new Date()],
                insertRes = await query(insertSql, insertSqlArr)
            if(!insertRes.affectedRows) {
                flag = false;
            }
        }
        
    }
    noticeRes = addNotice(fid, null, 3, 2, 1, null)
    let updateModeSql = `update section_transfer_table set modeId=?, updateTime=? where transferId=?`,
        updateModeArr = [modeId, new Date(), transferId],
        updateModeRes = await query(updateModeSql, updateModeArr),
        updatePowerSql = `update user_table set powerId = 3 + ? where uid = ?`,
        updatePowerSqlArr = [sectionId, fid],
        updatePowerRes = await query(updatePowerSql, updatePowerSqlArr)

    if(noticeRes && flag && updateModeRes.affectedRows > 0 && updatePowerRes.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '审核成功，信息已修改')
    }else {
        ctx.body = new Respond(false, 200, '审核失败，请重试')
    }
}

var setSection = async ctx => {
    let { mode, sectionId, newName } = ctx.request.body,
        sql = ``,
        sqlArr = []
        
    if(mode === 'add') {
        let initIdSql = `select count(sectionId) + 1 as newId from section_table`,
            initIdRow = await query(initIdSql, []),
            newId = initIdRow[0].newId
        sql = `insert into section_table (sectionId, sectionName) values (?,?)`
        sqlArr = [newId, newName]
    }else if(mode === 'modify') {
        sql = `update section_table set sectionName = ? where sectionId = ?`
        sqlArr = [newName, sectionId]
    }
    res = await query(sql, sqlArr)
    if(res.affectedRows >= 0) {
        ctx.body = new Respond(true, 200, '部门设置成功')
    }else {
        ctx.body = new Respond(false, 200, '部门设置失败，请重试')
    }
}

module.exports = {
    getEachSectionFile,
    sectionApply,
    getAllSectionApply,
    auditSectionApply,
    setSection
}