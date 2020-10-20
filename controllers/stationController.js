var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var { auditStationTransferApply, auditPositionTransferApply } = require('../util/function')

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
        let sql = `insert into pos_transfer_table (fid, transferTypeId, oldPositionId, positionId, oldStationId, stationId, oldLevelId, levelId, modeId, reason, applyTime, updateTime) values (?,?,?,?,?,?,?,?,?,?,?,?)`
        sqlArr = [fid, transferTypeId, oldPositionId, positionId, oldStationId, stationId, oldLevelId, levelId, modeId, reason, new Date(applyTime), new Date()]
        let res = await query(sql, sqlArr)
        if(res.affectedRows > 0) {
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
        sql = `select pos_transfer_table.*, name, transferTypeName from file_table, pos_transfer_table, pos_transfer_type_table where file_table.fid = pos_transfer_table.fid and pos_transfer_type_table.transferTypeId = pos_transfer_table.transferTypeId and modeId = 0 limit ${page}, 10`,
        sumSql = `select count(*) as sum from pos_transfer_table where modeId = 0`
    }else {
        sql = `select pos_transfer_table.*, name, transferTypeName from file_table, pos_transfer_table, pos_transfer_type_table where file_table.fid = pos_transfer_table.fid and pos_transfer_type_table.transferTypeId = pos_transfer_table.transferTypeId and (modeId = 1 or modeId = 2) limit ${page}, 10`,
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

module.exports = {
    posTransferApply,
    getPosTransferApply,
    auditPosTransferApply
}