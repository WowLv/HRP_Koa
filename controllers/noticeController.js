var query = require('../util/dbconfig');
// var { LogCheck } = require('./loginController')
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

async function updateIsRead(noticeId) {
    let updateIsReadSql = `update notification_table set isRead = 1 where noticeId = ?`,
        res = await query(updateIsReadSql, [noticeId])
    if(res.affectedRows > 0) {
        return true
    }else {
        return false
    }
}

var notice = async ctx => {
    let { fid, positionId }  = ctx.query,
        sql = ``,
        sqlArr = [],
        sectionSql = ``,
        sectionSqlArr = [],
        sectionRow
    if(parseInt(positionId) === 3) {
        sectionSql = `select noticeId, a.noticeModeId, a.noticeSourceId, a.noticeTypeId, createTime, noticeMode, noticeType, noticeSource from notification_table a, notice_mode_table b, notice_type_table c, notice_source_table d, section_file_table e where a.noticeModeId = b.noticeModeId and a.noticeTypeId = c.noticeTypeId and a.noticeSourceId = d.noticeSourceId and a.sectionId = e.sectionId and e.fid = ? and isRead = 0 and positionId = ?`
        sectionSqlArr = [fid, positionId]
        sql = `select noticeId, a.noticeModeId, a.noticeSourceId, a.noticeTypeId, createTime, noticeMode, noticeType, noticeSource from notification_table a, notice_mode_table b, notice_type_table c, notice_source_table d where a.noticeModeId = b.noticeModeId and a.noticeTypeId = c.noticeTypeId and a.noticeSourceId = d.noticeSourceId and isRead = 0 and notifier = ?`
        sqlArr = [fid]
        sectionRow = await query(sectionSql, sectionSqlArr)
    }else {
        sql = `select noticeId, a.noticeModeId, a.noticeSourceId, a.noticeTypeId, createTime, noticeMode, noticeType, noticeSource from notification_table a, notice_mode_table b, notice_type_table c, notice_source_table d where a.noticeModeId = b.noticeModeId and a.noticeTypeId = c.noticeTypeId and a.noticeSourceId = d.noticeSourceId and isRead = 0 and (notifier = ? or positionId = ?)`
        sqlArr = [fid, positionId]
    }
        
    let row = await query(sql, sqlArr),
        updateNum = 0
    if(sectionRow && sectionRow.length) {
        row.push(...sectionRow)
    }
    row.map(item => {
        let res = updateIsRead(item.noticeId)
        if(res) {
            updateNum++
        }
    })
    
    if(row.length && updateNum === row.length) {
        ctx.body = new Respond(true, 200, null, row)
    }else {
        ctx.body = new Respond(false, 200, null)
    }  
}

module.exports = {
    notice
}