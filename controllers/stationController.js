var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

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
    page = (page - 1) * 10 || 0
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

async function updateModeId(modeId, transferId) {
    let updateModeSql = `update pos_transfer_table set modeId = ? where transferId = ?`,
        updateModeSqlArr = [modeId, transferId]
        updateModeRes = await query(updateModeSql, updateModeSqlArr)
    if(updateModeRes.affectedRows > 0) {
        return new Respond(true, 200, '审核成功，信息已修改')
    }else {
        return new Respond(false, 200, '审核失败，请重试')
    }
}

async function updatePositionId(ctx) {
    let { positionId, fid, modeId, transferId } = ctx.request.body
        fileSql = `update file_table set positionId = ? where fid = ?`
        fileSqlArr = [positionId, fid]
        transferSql = `update pos_transfer_table set modeId = ? where transferId = ?`
        transferSqlArr = [modeId, transferId]
        fileRes = await query(fileSql, fileSqlArr)
        transferRes = await query(transferSql, transferSqlArr)
    if(fileRes.affectedRows > 0 && transferRes.affectedRows > 0) {
        return new Respond(true, 200, '审核成功，信息已修改')
    }else {
        return new Respond(false, 200, '审核失败，请重试')
    }
}

async function auditPositionTransferApply(ctx) {
    //update update file_table.position
    //oldPositionId !== positionId && oldPosition === 4   ---> delete teachLoad_record_table, station_file_table
    //oldPositionId !== positionId && oldPosition === 3   ---> delete section_file_table
    let { fid, oldPositionId, positionId } = ctx.request.body
    if(oldPositionId !== positionId && oldPositionId === 4) {
        let delLoadSql = `delete from teachLoad_record_table where fid = ?`
            delStationSql = `delete from station_file_table where fid = ?`
            delSqlArr = [fid]
            delLoadRes = await query(delLoadSql, delSqlArr)
            delStationRes = await query(delStationSql, delSqlArr)
        if(delLoadRes.affectedRows > 0 && delStationRes.affectedRows > 0) {
            return await updatePositionId(ctx)
        }else {
            ctx.body = new Respond(false, 200, '审核失败，请重试')
        }
    }else if (oldPositionId !== positionId && oldPositionId === 3) {
        let delSql = `delete from section_file_table where fid = ?`
            delSqlArr = [fid]
            delRes = await query(delSql, delSqlArr)
        if(delRes.affectedRows > 0) {
            return await updatePositionId(ctx)
        }else {
            ctx.body = new Respond(false, 200, '审核失败，请重试')
        }
    }else {
        return await updatePositionId(ctx)
    }

}

var auditPosTransferApply = async ctx => {
    let { fid, stationId, levelId, transferId, modeId, transferTypeId, oldPositionId, positionId } = ctx.request.body
    if(transferTypeId === 2) {
        if(modeId === 1) {
            let updateSql = `update station_file_table set stationId=?, levelId=?, updateTime=? where fid=?`
                updateSqlArr = [stationId, levelId, new Date(), fid]
                updateRes = await query(updateSql, updateSqlArr)
                checkTargetSql = `select teachLoadTarget from performance_target_table as a, station_file_table as b where a.stationId = b.stationId and a.levelId = b.levelId and fid = ?`,
                checkTargetSqlArr = [fid],
                checkTargetRow = await query(checkTargetSql, checkTargetSqlArr)
                updateTargetSql = `update teachLoad_record_table set teachLoad=?, updateTime=? where fid=?`
                updateTargetSqlArr = [checkTargetRow[0].teachLoadTarget, new Date(), fid]
                updateTargetRes = await query(updateTargetSql, updateTargetSqlArr)
            ctx.body = await updateModeId(modeId, transferId)
        }else {
            ctx.body = await updateModeId(modeId, transferId)
        }
    }else if(transferTypeId === 1) {
        ctx.body = await auditPositionTransferApply(ctx)
    }
}

module.exports = {
    posTransferApply,
    getPosTransferApply,
    auditPosTransferApply
}