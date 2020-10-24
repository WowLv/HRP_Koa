var query = require('../util/dbconfig');
var { Respond } = require('./class')
async function updateModeId(modeId, transferId) {
    let updateModeSql = `update pos_transfer_table set modeId = ? where transferId = ?`,
        updateModeSqlArr = [modeId, transferId],
        updateModeRes = await query(updateModeSql, updateModeSqlArr)
    if(updateModeRes.affectedRows > 0) {
        return new Respond(true, 200, '审核成功，信息已修改')
    }else {
        return new Respond(false, 200, '审核失败，请重试')
    }
}

async function updatePositionId(ctx) {
    let { positionId = 4, fid, modeId, transferId } = ctx.request.body,
        powerSql = `update user_table set powerId = ?, updateTime = ? where uid = ?`
        powerSqlArr = [positionId + 1, new Date(), fid],
        fileSql = `update file_table set positionId = ? where fid = ?`,
        fileSqlArr = [positionId, fid],
        transferSql = `update pos_transfer_table set modeId = ? where transferId = ?`,
        transferSqlArr = [modeId, transferId],
        powerRes = await query(powerSql, powerSqlArr)
        fileRes = await query(fileSql, fileSqlArr),
        transferRes = await query(transferSql, transferSqlArr)
    if(fileRes.affectedRows > 0 && transferRes.affectedRows > 0 && powerRes.affectedRows > 0) {
        if(modeId === 1) {
            return new Respond(true, 200, '审核成功，信息已修改')
        }else {
            return new Respond(true, 200, '审核成功，未通过')
        }
    }else {
        return new Respond(false, 200, '审核失败，请重试')
    }
}

async function auditStationTransferApply(ctx) {
    let { fid, stationId, levelId, transferId, modeId, transferTypeId } = ctx.request.body
    if(modeId === 1) {
        let checkFidSql = `select * from station_file_table where fid = ?`,
            checkFidSqlArr = [fid],
            checkFidRes = await query(checkFidSql, checkFidSqlArr),
            updateSql = ``
        if(checkFidRes.length) {
            updateSql = `update station_file_table set stationId=?, levelId=?, updateTime=? where fid=?`
        }else {
            updateSql = `insert into station_file_table (stationId, levelId, updateTime, fid) values (?,?,?,?)`
        }
        let updateSqlArr = [stationId, levelId, new Date(), fid],
            updateRes = await query(updateSql, updateSqlArr),
            checkTargetSql = `select teachLoadTarget from performance_target_table as a, station_file_table as b where a.stationId = b.stationId and a.levelId = b.levelId and fid = ?`,
            checkTargetSqlArr = [fid],
            checkTargetRow = await query(checkTargetSql, checkTargetSqlArr),
            updateTargetSql = `update gpa_record_table set teachLoad=?, updateTime=?, isExist = 1 where fid=?`,
            updateTargetSqlArr = [checkTargetRow[0].teachLoadTarget, new Date(), fid],
            updateTargetRes = await query(updateTargetSql, updateTargetSqlArr)
        if(updateRes.affectedRows > 0 && updateTargetRes.affectedRows > 0) {
            return await updateModeId(modeId, transferId)
        }else {
            return new Respond(false, 200, '审核失败，请重试')
        }
    }else {
        return await updateModeId(modeId, transferId)
    }
}

async function auditPositionTransferApply(ctx) {
    //update update file_table.position
    //oldPositionId !== positionId && oldPosition === 4   ---> delete gpa_record_table, station_file_table
    //oldPositionId !== positionId && oldPosition === 3   ---> delete section_file_table
    let { fid, oldPositionId, positionId, modeId } = ctx.request.body
    if(modeId === 1) {
        if(oldPositionId !== positionId && oldPositionId === 4) {
            let delLoadSql = `update gpa_record_table set isExist = 0 where fid=?`,
                delStationSql = `delete from station_file_table where fid = ?`,
                delTeachRecordSql = `update teach_record_table set isCheck = 1 where fid = ?`,
                delSqlArr = [fid],
                delLoadRes = await query(delLoadSql, delSqlArr),
                delStationRes = await query(delStationSql, delSqlArr)
                delTeachRecordRes = await query(delTeachRecordSql, delSqlArr)
            if(delLoadRes.affectedRows >= 0 && delStationRes.affectedRows >= 0 && delTeachRecordRes.affectedRows >= 0) {
                return await updatePositionId(ctx)
            }else {
                ctx.body = new Respond(false, 200, '审核失败，请重试')
            }
        }else if (oldPositionId !== positionId && oldPositionId === 3) {
            let delSql = `delete from section_file_table where fid = ?`,
                delSqlArr = [fid],
                delRes = await query(delSql, delSqlArr)
            if(delRes.affectedRows >= 0) {
                return await updatePositionId(ctx)
            }else {
                ctx.body = new Respond(false, 200, '审核失败，请重试')
            }
        }else {
            return await updatePositionId(ctx)
        }
    }else {
        return await updatePositionId(ctx)
    }
}

async function getCalc(storageId) {
    let sql = `select workLoadTypeId, workLoadId, extra from workLoad_storage_table where storageId = ?`,
        sqlArr = [storageId],
        row = await query(sql, sqlArr)
    return row[0]
}

async function setGpa(storageId) {
    let { workLoadTypeId, workLoadId, extra } = await getCalc(storageId)
    let checkSql = ``,
        checkSqlArr = [workLoadId]
    if(workLoadTypeId === 2) {
        checkSql = `select gpa*calc from publicLoad_table a, workload_storage_table b where a.workLoadId = b.workLoadId and a.workLoadId = ?`
    }else if(workLoadTypeId === 1) {
        if(extra) {
            checkSql = `select gpa*calc + extraGpa*extra as gpa from scientload_table a, workload_storage_table b, scientload_extra_table c where c.workLoadId = a.workLoadId  and a.workLoadId = b.workLoadId and a.workLoadId = ?`
        }else {
            checkSql = `select gpa*calc as gpa from scientload_table a, workload_storage_table b where a.workLoadId = b.workLoadId and a.workLoadId = ?`
        } 
    }
    let checkRow = await query(checkSql, checkSqlArr),
        gpa = checkRow[0].gpa
    return gpa
}

module.exports = {
    updateModeId,
    updatePositionId,
    auditStationTransferApply,
    auditPositionTransferApply,
    setGpa
}