var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')
var send = require('koa-send')

var uploadScientificLoad = async ctx => {
    let { fid, workLoadId, workLoadTypeId, modeId } = ctx.req.body
    let { originalname, destination, filename } = ctx.req.file
    let sql = `insert into workLoad_storage_table (originalname, destination, filename, workLoadTypeId, fid, workLoadId, modeId, uploadTime) values (?,?,?,?,?,?,?,?)`
    let sqlArr = [originalname, destination, filename, workLoadTypeId, fid, workLoadId, modeId, new Date()]
    let row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '上传成功')
    }else {
        ctx.body = new Respond(false, 200, `${originalname}上传发送错误，请重试`)
    }
}

var uploadPublicLoad = async ctx => {
    let { fid, workLoadId, workLoadTypeId, modeId } = ctx.req.body
    let { originalname, destination, filename } = ctx.req.file
    let sql = `insert into workLoad_storage_table (originalname, destination, filename, workLoadTypeId, fid, workLoadId, modeId, uploadTime) values (?,?,?,?,?,?,?,?)`
    let sqlArr = [originalname, destination, filename, workLoadTypeId, fid, workLoadId, modeId, new Date()]
    let row = await query(sql, sqlArr)
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
    let sql = `select scientload_table.*, scientload_type_table.scientLoadType from scientload_table, scientload_type_table where scientload_table.scientTypeId = scientload_type_table.scientTypeId`
    let row = await query(sql, [])
    ctx.body = new Respond(true, 200, '查询成功', row)
}

var workLoadManage = async ctx => {
    let scientSql = `select workload_storage_table.*, name, workLoadType, applyMode, workLoad from workload_storage_table, file_table, workload_type_table, apply_mode_table, scientload_table where workload_storage_table.workLoadTypeId= workload_type_table.workLoadTypeId and workload_storage_table.fid = file_table.fid and workload_storage_table.modeId = apply_mode_table.modeId and workload_storage_table.workLoadId = scientload_table.workLoadId and workload_storage_table.workLoadTypeId = 1`
    let publicSql = `select workload_storage_table.*, name, workLoadType, applyMode, workLoad from workload_storage_table, file_table, workload_type_table, apply_mode_table, publicLoad_table where workload_storage_table.workLoadTypeId= workload_type_table.workLoadTypeId and workload_storage_table.fid = file_table.fid and workload_storage_table.modeId = apply_mode_table.modeId and workload_storage_table.workLoadId = publicLoad_table.workLoadId and workload_storage_table.workLoadTypeId = 2`
    let scientRow = await query(scientSql, [])
    let publicRow = await query(publicSql, [])
    let res = [...scientRow, ...publicRow]
    res.forEach(item => {
        item.uploadTime = formatDate(item.uploadTime, 'Y:M:D')
    })
    ctx.body = new Respond(true, 200, '查询成功', res)
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