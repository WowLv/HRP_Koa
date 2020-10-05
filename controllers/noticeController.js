var query = require('../util/dbconfig');
// var { LogCheck } = require('./loginController')
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

var notice = async ctx => {
    let { fid }  = ctx.query
    let sql = `select * from notification_table where notifier = ?`
    let sqlArr = [fid]

    let row = await query(sql, sqlArr)
    if(row.length) {
        ctx.body = new Respond(true, 200, null, row)
    }else {
        ctx.body = new Respond(false, 200, null)
    }
}

module.exports = {
    notice
}