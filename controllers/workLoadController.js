var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var send = require('koa-send')
var { setGpa, addNotice } = require('../util/function')

var uploadScientificLoad = async ctx => {
    
    let { fid, workLoadId, workLoadTypeId, modeId, extra, calc } = ctx.req.body,
        { originalname, destination, filename } = ctx.req.file,
        initIdSql = `select count(*) as length from workLoad_storage_table`
        initIdRow = await query(initIdSql, [])
        sql = `insert into workLoad_storage_table (storageId, originalname, destination, filename, workLoadTypeId, fid, extra, calc, workLoadId, modeId, uploadTime) values (?,?,?,?,?,?,?,?,?,?,?)`,
        sqlArr = [initIdRow[0].length, originalname, destination, filename, workLoadTypeId, fid, extra, calc, workLoadId, modeId, new Date()],
        row = await query(sql, sqlArr),
        noticeRes = addNotice(null, 3, 1, 1, 4, 3)
    if(noticeRes && row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '上传成功')
    }else {
        ctx.body = new Respond(false, 200, `${originalname}上传发送错误，请重试`)
    }
}

var uploadPublicLoad = async ctx => {
    let { fid, workLoadId, workLoadTypeId, modeId, extra, calc } = ctx.req.body,
        { originalname, destination, filename } = ctx.req.file,
        initIdSql = `select count(*) as length from workLoad_storage_table`
        initIdRow = await query(initIdSql, [])
        sql = `insert into workLoad_storage_table (storageId, originalname, destination, filename, workLoadTypeId, fid, extra, calc, workLoadId, modeId, uploadTime) values (?,?,?,?,?,?,?,?,?,?,?)`,
        sqlArr = [initIdRow[0].length, originalname, destination, filename, workLoadTypeId, fid, extra, calc, workLoadId, modeId, new Date()],
        row = await query(sql, sqlArr),
        noticeRes = addNotice(null, 3, 1, 1, 4, 3)
    if(noticeRes && row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '上传成功')
    }else {
        ctx.body = new Respond(false, 200, `${originalname}上传发送错误，请重试`)
    }
}

var publicLoadSummary = async ctx => {
    let sql = `select * from publicLoad_table`
    let row = await query(sql, [])
    ctx.body = new Respond(true, 200, '查询成功', row)
}

var scientLoadSummary = async ctx => {
    let sumSql = `select scientload_table.*, scientload_type_table.scientLoadType from scientload_table, scientload_type_table where scientload_table.scientTypeId = scientload_type_table.scientTypeId`
    let extraSql = `select workLoadId from scientload_extra_table`
    let scientList = await query(sumSql, [])
    let extraRow = await query(extraSql, [])
    
    let extraList = []
    extraRow.map(item => {
        extraList.push(item.workLoadId)
    })
    ctx.body = new Respond(true, 200, '查询成功', { scientList, extraList })
}

var getMeasure = async ctx => {
    let { workLoadTypeId, workLoadId } = ctx.query,
        checkSql = ``,
        extraSql = ``,
        checkSqlArr = [parseInt(workLoadId)]
    if(parseInt(workLoadTypeId) === 2) {
        checkSql = `select measure from publicLoad_table where workLoadId = ?`
    }else if(parseInt(workLoadTypeId) === 1) {
        checkSql = `select measure, extraMeasure from scientload_table, scientload_extra_table where scientload_extra_table.workLoadId = scientload_table.workLoadId and scientload_table.workLoadId = ?`
        extraSql = `select measure from scientload_table where workLoadId = ?`
    }
    let checkRes = await query(checkSql, checkSqlArr)
    if(!checkRes.length) {
        checkRes = await query(extraSql, checkSqlArr)
    }
    ctx.body = new Respond(true, 200, '查询成功', checkRes[0])
}

var workLoadManage = async ctx => {
    let {page, mode} = ctx.query
    page = parseInt(page) * 10
    let scientSql = ``,
        publicSql = ``,
        sumSql = ``
    if(mode === 'apply') {
        scientSql = `select a.*, name, workLoadType, applyMode, workLoad from workload_storage_table a, file_table b, workload_type_table c, apply_mode_table d, scientLoad_table e where a.workLoadTypeId = c.workLoadTypeId and a.fid = b.fid and a.modeId = d.modeId and a.workLoadId = e.workLoadId and a.workLoadTypeId = 1 and a.modeId = 0 and storageId < ${page}`
        publicSql = `select a.*, name, workLoadType, applyMode, workLoad from workload_storage_table a, file_table b, workload_type_table c, apply_mode_table d, publicLoad_table e where a.workLoadTypeId = c.workLoadTypeId and a.fid = b.fid and a.modeId = d.modeId and a.workLoadId = e.workLoadId and a.workLoadTypeId = 2 and a.modeId = 0 and storageId < ${page}`
        sumSql = `select count(*) as sum from workload_storage_table where modeId = 0`
    }else {
        scientSql = `select a.*, name, workLoadType, applyMode, workLoad from workload_storage_table a, file_table b, workload_type_table c, apply_mode_table d, scientLoad_table e where a.workLoadTypeId = c.workLoadTypeId and a.fid = b.fid and a.modeId = d.modeId and a.workLoadId = e.workLoadId and a.workLoadTypeId = 1 and (a.modeId = 1 or a.modeId = 2) and storageId < ${page}`
        publicSql = `select a.*, name, workLoadType, applyMode, workLoad from workload_storage_table a, file_table b, workload_type_table c, apply_mode_table d, publicLoad_table e where a.workLoadTypeId = c.workLoadTypeId and a.fid = b.fid and a.modeId = d.modeId and a.workLoadId = e.workLoadId and a.workLoadTypeId = 2 and (a.modeId = 1 or a.modeId = 2) and storageId < ${page}`
        sumSql = `select count(*) as sum from workload_storage_table where modeId = 1 or modeId = 2`
    }
    let scientRow = await query(scientSql, []),
        publicRow = await query(publicSql, []),
        sumRow = await query(sumSql, []),
        res = [...scientRow, ...publicRow]
    if(res.length) {
        res.sort((a, b) => {
            return a.uploadTime - b.uploadTime
        })
        res.forEach(item => {
            item.uploadTime = formatDate(item.uploadTime, 'Y:M:D')
        })
    }
    ctx.body = new Respond(true, 200, '查询成功', { data: res, sum: sumRow[0].sum })
}

var downloadWorkLoad = async ctx => {
    const { destination, filename, originalname } = ctx.query
    const path = `${destination}${filename}`
    //下载显示名字
    ctx.attachment(originalname)
    await send(ctx, path)
}


var auditWorkLoad = async ctx => {
    let { workLoadTypeId, storageId, modeId, fid } = ctx.request.body,
        updateModeSql = `update workload_storage_table set modeId = ? where storageId = ?`,
        updateModeSqlArr = [modeId, storageId],
        updateModeRes = await query(updateModeSql, updateModeSqlArr),
        noticeRes
    if(modeId === 1) {
        noticeRes = addNotice(fid, null, 2, 2, 4, null)
        let gpa = await setGpa(ctx),
            updateGpaSql = ``,
            updateGpaSqlArr = [gpa, fid]
        if(workLoadTypeId === 1) {
            //教科研工作量
            updateGpaSql = `update gpa_record_table set scientGpa = scientGpa + ? where fid = ?`
        }else if(workLoadTypeId === 1) {
            //公共工作量
            updateGpaSql = `update gpa_record_table set publicGpa = publicGpa + ? where fid = ?`
        } 

        let updateGpaRes = await query(updateGpaSql, updateGpaSqlArr)
        if(noticeRes && updateModeRes.affectedRows > 0 && updateGpaRes.affectedRows > 0) {
            ctx.body = new Respond(true, 200, '审核成功，信息修改成功')
        }else {
            ctx.body = new Respond(false, 200, '审核失败，请重试')
        }
    }else if(modeId === 2){
        noticeRes = addNotice(fid, null, 3, 2, 4, null)
        if(noticeRes) {
            ctx.body = new Respond(true, 200, '审核成功，未通过')
        }
        
    }
}

var getWorkLoadType = async ctx => {
    let workLoadTypeSql = `select * from workLoad_type_table`,
        workLoadTypeRow = await query(workLoadTypeSql, []),
        scientTypeSql = `select * from scientLoad_type_table`,
        scientTypeRow = await query(scientTypeSql, [])
    ctx.body = new Respond(true, 200, '查询成功', { workLoadTypeRow, scientTypeRow } )
}

var getGpa = async ctx => {
    let { workLoadTypeId, workLoadId } = ctx.query,
          sql = ``,
          sqlArr = []
    if(parseInt(workLoadTypeId) === 1) {
        //教科研
        sql = `select gpa, (select extraGpa from scientload_extra_table where workLoadId = ?) as extraGpa from scientload_table where workLoadId = ?`
        sqlArr = [workLoadId, workLoadId]
    }else if(parseInt(workLoadTypeId) === 2) {
        //公共
        sql = `select gpa from publicLoad_table where workLoadId = ?`
        sqlArr = [workLoadId]
    }
    let row = await query(sql, sqlArr)
    ctx.body = new Respond(true, 200, '查询成功', row[0])
}

var setWorkLoad = async ctx => {
    const { workLoadTypeId, workLoadId, measure, gpa, extraGpa, extraMeasure } = ctx.request.body
    let sql = ``,
        sqlArr = []
    if(workLoadTypeId === 1) {
        //教科研
        if(extraGpa) {
            let extraSql = `update scientLoad_extra_table set extra = ?, extraMeasure = ? where workLoadId = ?`,
                extraSqlArr = [extra, extraMeasure, workLoadId],
                extraRes = await query(extraSql, extraSqlArr)
                if(extraRes.affectedRows < 0) {
                    ctx.body = new Respond(false, 200, '更改工作量失败，请重试')
                    return;
                }
        }
        sql = `update scientLoad_table set measure = ?, gpa = ? where workLoadId = ?`
        sqlArr = [ measure, gpa, workLoadId]
    }else if(workLoadTypeId === 2) {
        sql = `update publicLoad_table set measure = ?, gpa = ? where workLoadId = ?`
        sqlArr = [ measure, gpa, workLoadId]
    }
    let res = await query(sql, sqlArr)
    if(res.affectedRows >= 0) {
        ctx.body = new Respond(true, 200, '更改工作量成功')
    }else {
        ctx.body = new Respond(false, 200, '更改工作量失败，请重试')
    }
}

var addWorkLoad = async ctx => {
    const { workLoadTypeId, workLoad, measure, gpa, extraGpa, extraMeasure, scientTypeId } = ctx.request.body
    let sql = ``,
        sqlArr = []
        flag = false
    if(workLoadTypeId === 1) {
        //教科研
        let initIdSql = `select count(workLoadId) + 1 as workLoadId from scientLoad_table`,
            initIdRow = await query(initIdSql, []),
            newWorkLoadId = initIdRow[0].workLoadId
        if(extraGpa) {
            let extraSql = `insert into scientLoad_extra_table (workLoadId, extraMeasure, extraGpa) values (?,?,?)`,
                extraSqlArr = [newWorkLoadId, extraMeasure, extraGpa],
                extraRes = await query(extraSql, extraSqlArr)
            if(extraRes.affectedRows > 0) {
                flag = true
            }
        }
        sql = `insert into scientLoad_table (workLoadId, workLoad, gpa, measure, scientTypeId) values (?,?,?,?,?)`,
        sqlArr = [newWorkLoadId, workLoad, gpa, measure, scientTypeId]  
    }else if(workLoadTypeId === 2) {
        //公共
        let initIdSql = `select count(workLoadId) + 1 as workLoadId from publicLoad_table`,
            initIdRow = await query(initIdSql, []),
            newWorkLoadId = initIdRow[0].workLoadId
        sql = `insert into publicLoad_table (workLoadId, workLoad, gpa, measure) values (?,?,?,?)`,
        sqlArr = [newWorkLoadId, workLoad, gpa, measure]  
    }
    res = await query(sql, sqlArr)
    if(res.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '新增工作量成功')
    }else {
        ctx.body = new Respond(false, 200, '新增工作量失败，请重试')
    }
}

module.exports = {
    uploadScientificLoad,
    uploadPublicLoad,
    publicLoadSummary,
    scientLoadSummary,
    workLoadManage,
    downloadWorkLoad,
    getMeasure,
    auditWorkLoad,
    getWorkLoadType,
    getGpa,
    setWorkLoad,
    addWorkLoad
}