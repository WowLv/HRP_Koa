var query = require('../util/dbconfig');
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

var scientificLoad = async ctx => {
    // let file = ctx.req.file
    // console.log(file)
    let { fid } = ctx.req.body
    let { originalname, destination, filename } = ctx.req.file
    let sql = `insert into workLoad_storage_table (originalname, destination, filename, workLoadTypeId, fid, uploadTime) values (?,?,?,?,?,?)`
    let sqlArr = [originalname, destination, filename, 1, fid, new Date()]
    let row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '上传成功')
    }else {
        ctx.body = new Respond(false, 200, `${originalname}上传发送错误，请重试`)
    }
}

var publicLoad = async ctx => {
    let { fid } = ctx.req.body
    let { originalname, destination, filename } = ctx.req.file
    let sql = `insert into workLoad_storage_table (originalname, destination, filename, workLoadTypeId, fid, uploadTime) values (?,?,?,?,?,?)`
    let sqlArr = [originalname, destination, filename, 2, fid, new Date()]
    let row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '上传成功')
    }else {
        ctx.body = new Respond(false, 200, `${originalname}上传发送错误，请重试`)
    }
}

module.exports = {
    scientificLoad,
    publicLoad
}