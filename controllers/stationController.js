var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var { auditStationTransferApply, auditPositionTransferApply, addNotice } = require('../util/function')

var posTransferApply = async ctx => {
    let {fid, transferTypeId, oldPositionId, positionId, oldStationId, stationId, oldLevelId, levelId, modeId, reason, applyTime} = ctx.request.body;
    let checkSql = ``
    if(transferTypeId === 1) {
        checkSql = `select * from pos_transfer_table, position_table where pos_transfer_table.positionId = position_table.positionId and modeId = 0 and fid = ?`
    }else {
        checkSql = `select * from pos_transfer_table, station_table where pos_transfer_table.stationId = station_table.stationId and modeId = 0 and fid = ?`
    }
    checkSqlArr = [fid]
    let checkRow = await query(checkSql, checkSqlArr)
    if(checkRow.length) {
        ctx.body = new Respond(false, 200, "该用户已提交同类型申请")
    }else {
        let sql = `insert into pos_transfer_table (fid, transferTypeId, oldPositionId, positionId, oldStationId, stationId, oldLevelId, levelId, modeId, reason, applyTime, updateTime) values (?,?,?,?,?,?,?,?,?,?,?,?)`,
            sqlArr = [fid, transferTypeId, oldPositionId, positionId, oldStationId, stationId, oldLevelId, levelId, modeId, reason, new Date(applyTime), new Date()],
            res = await query(sql, sqlArr),
            noticeRes = addNotice(null, 3, 1, 1, 3, 1)

        if(res.affectedRows > 0 && noticeRes) {
            ctx.body = new Respond(true, 200, "申请成功，请等待审核")
        }else {
            ctx.body = new Respond(false, 200, "申请失败，请重试")
        }
    }
}

var getPosTransferApply = async ctx => {
    let {mode, page} = ctx.query
    page = (page - 1) * 8 || 0
    let sql = ''
        sumSql = ''
    if(mode === 'apply') {
        sql = `select pos_transfer_table.*, name, transferTypeName from file_table, pos_transfer_table, pos_transfer_type_table where file_table.fid = pos_transfer_table.fid and pos_transfer_type_table.transferTypeId = pos_transfer_table.transferTypeId and modeId = 0 limit ${page}, 8`,
        sumSql = `select count(*) as sum from pos_transfer_table where modeId = 0`
    }else {
        sql = `select pos_transfer_table.*, name, transferTypeName from file_table, pos_transfer_table, pos_transfer_type_table where file_table.fid = pos_transfer_table.fid and pos_transfer_type_table.transferTypeId = pos_transfer_table.transferTypeId and (modeId = 1 or modeId = 2) limit ${page}, 8`,
        sumSql = `select count(*) as sum from pos_transfer_table where modeId = 1 or modeId = 2`
    }

    
    let sumRow = await query(sumSql, []),
        row = await query(sql, []),
        levelSql = `select * from level_table`,
        stationSql = `select * from station_table`,
        positionSql = `select * from position_table`,
        levelRow = await query(levelSql, []),
        stationRow = await query(stationSql, []),
        positionRow = await query(positionSql, [])

    if(row.length) {
        row.forEach(item => {
            item.applyTime = formatDate(item.applyTime, 'Y:M:D')
            item.updateTime = formatDate(item.updateTime, 'Y:M:D')
            positionRow.map(posItem => {
                if(posItem.positionId === item.oldPositionId) {
                    item.oldPositionName = posItem.positionName
                }
                if(posItem.positionId === item.positionId) {
                    item.positionName = posItem.positionName
                }
            })
            stationRow.map(stationItem => {
                if(stationItem.stationId === item.oldStationId) {
                    item.oldStationName = stationItem.stationName
                }
                if(stationItem.stationId === item.stationId) {
                    item.stationName = stationItem.stationName
                }
            })
            levelRow.map(levelItem => {
                if(levelItem.levelId === item.oldLevelId) {
                    item.oldLevelName = levelItem.levelName
                }
                if(levelItem.levelId === item.levelId) {
                    item.levelName = levelItem.levelName
                }
            })
        })
    }
    

    ctx.body = new Respond(true, 200, '查询成功', {data: row, sum: sumRow[0].sum})
}

var auditPosTransferApply = async ctx => {
    let { transferTypeId } = ctx.request.body
    if(transferTypeId === 2) {
        ctx.body = await auditStationTransferApply(ctx)
    }else if(transferTypeId === 1) {
        ctx.body = await auditPositionTransferApply(ctx)
    }
}

var deleteTransferRecord = async ctx => {
    
    const { transferId } = ctx.request.body,
          sql = `delete from pos_transfer_table where transferId = ?`,
          sqlArr = [transferId],
          res = await query(sql, sqlArr)
    if(res.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '删除成功')
    }else {
        ctx.body = new Respond(false, 200, '删除失败，请重试')
    }
}

var setStation = async ctx => {
    let { mode, stationId, newName } = ctx.request.body,
        sql = ``,
        sqlArr = []
        
    if(mode === 'add') {
        let initIdSql = `select count(stationId) + 1 as newId from station_table`,
            initIdRow = await query(initIdSql, []),
            newId = initIdRow[0].newId
        sql = `insert into station_table (stationId, stationName) values (?,?)`
        sqlArr = [newId, newName]
    }else if(mode === 'modify') {
        sql = `update station_table set stationName = ? where stationId = ?`
        sqlArr = [newName, stationId]
    }
    res = await query(sql, sqlArr)
    if(res.affectedRows >= 0) {
        ctx.body = new Respond(true, 200, '岗位设置成功')
    }else {
        ctx.body = new Respond(false, 200, '岗位设置失败，请重试')
    }
}


var setPosition = async ctx => {
    let { mode, positionId, newName } = ctx.request.body,
        sql = ``,
        sqlArr = []
        
    if(mode === 'add') {
        let initIdSql = `select count(positionId) + 1 as newId from position_table`,
            initIdRow = await query(initIdSql, []),
            newId = initIdRow[0].newId
        sql = `insert into position_table (positionId, positionName) values (?,?)`
        sqlArr = [newId, newName]
    }else if(mode === 'modify') {
        sql = `update position_table set positionName = ? where positionId = ?`
        sqlArr = [newName, positionId]
    }
    res = await query(sql, sqlArr)
    if(res.affectedRows >= 0) {
        ctx.body = new Respond(true, 200, '职位设置成功')
    }else {
        ctx.body = new Respond(false, 200, '职位设置失败，请重试')
    }
}

module.exports = {
    posTransferApply,
    getPosTransferApply,
    auditPosTransferApply,
    deleteTransferRecord,
    setStation,
    setPosition
}

