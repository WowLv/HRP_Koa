var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var send = require('koa-send')

var uploadScientificLoad = async ctx => {
    
    let { fid, workLoadId, workLoadTypeId, modeId, extra } = ctx.req.body,
        { originalname, destination, filename } = ctx.req.file,
        initIdSql = `select count(*) as length from workLoad_storage_table`
        initIdRow = await query(initIdSql, [])
        sql = `insert into workLoad_storage_table (storageId, originalname, destination, filename, workLoadTypeId, fid, extra, workLoadId, modeId, uploadTime) values (?,?,?,?,?,?,?,?,?,?)`,
        sqlArr = [initIdRow[0].length, originalname, destination, filename, workLoadTypeId, fid, extra, workLoadId, modeId, new Date()],
        row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '上传成功')
    }else {
        ctx.body = new Respond(false, 200, `${originalname}上传发送错误，请重试`)
    }
}

var uploadPublicLoad = async ctx => {
    let { fid, workLoadId, workLoadTypeId, modeId, extra } = ctx.req.body,
        { originalname, destination, filename } = ctx.req.file,
        initIdSql = `select count(*) as length from workLoad_storage_table`
        initIdRow = await query(initIdSql, [])
        sql = `insert into workLoad_storage_table (storageId, originalname, destination, filename, workLoadTypeId, fid, extra, workLoadId, modeId, uploadTime) values (?,?,?,?,?,?,?,?,?,?)`,
        sqlArr = [initIdRow[0].length, originalname, destination, filename, workLoadTypeId, fid, extra, workLoadId, modeId, new Date()],
        row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
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
    let extraMeasureSql = `select * from extraMeasure_table`
    let scientList = await query(sumSql, [])
    let extraRow = await query(extraSql, [])
    let extraMeasureList = await query(extraMeasureSql, [])
    
    let extraList = []
    extraRow.map(item => {
        extraList.push(item.workLoadId)
    })
    ctx.body = new Respond(true, 200, '查询成功', { scientList, extraList, extraMeasureList})
}

var workLoadManage = async ctx => {
    let {page} = ctx.query
    page = page * 10
    let scientSql = `select workload_storage_table.*, name, workLoadType, applyMode, workLoad from workload_storage_table, file_table, workload_type_table, apply_mode_table, scientload_table where workload_storage_table.workLoadTypeId = workload_type_table.workLoadTypeId and workload_storage_table.fid = file_table.fid and workload_storage_table.modeId = apply_mode_table.modeId and workload_storage_table.workLoadId = scientload_table.workLoadId and workload_storage_table.workLoadTypeId = 1 and storageId < ${page}`,
        publicSql = `select workload_storage_table.*, name, workLoadType, applyMode, workLoad from workload_storage_table, file_table, workload_type_table, apply_mode_table, publicLoad_table where workload_storage_table.workLoadTypeId = workload_type_table.workLoadTypeId and workload_storage_table.fid = file_table.fid and workload_storage_table.modeId = apply_mode_table.modeId and workload_storage_table.workLoadId = publicLoad_table.workLoadId and workload_storage_table.workLoadTypeId = 2 and storageId < ${page}`,
        scientRow = await query(scientSql, []),
        publicRow = await query(publicSql, []),
        res = [...scientRow, ...publicRow],
        sumSql = `select count(*) as sum from workload_storage_table`,
        sumRow = await query(sumSql, [])
    res.forEach(item => {
        item.uploadTime = formatDate(item.uploadTime, 'Y:M:D')
    })
    ctx.body = new Respond(true, 200, '查询成功', { data: res, sum: sumRow[0].sum })
}

var downloadWorkLoad = async ctx => {
    const { destination, filename, originalname } = ctx.query
    const path = `${destination}${filename}`
    //下载显示名字
    ctx.attachment(originalname)
    await send(ctx, path)
}

module.exports = {
    uploadScientificLoad,
    uploadPublicLoad,
    publicLoadSummary,
    scientLoadSummary,
    workLoadManage,
    downloadWorkLoad
}