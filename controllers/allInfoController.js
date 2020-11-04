var query = require('../util/dbconfig');
// var { LogCheck } = require('./loginController')
var { formatDate } = require('../util/format')
var { Respond } = require('../util/class')

var getAllInfo = async ctx => {
    let {page} = ctx.query
    page = (page - 1) * 10 || 0
    let sql = `select uid, username, sex, age, phone, email, user_table.powerId, powerName from power_table, user_table where power_table.powerId = user_table.powerId limit ${page},10`
    let sumSql = `select count(*) as sum from user_table`
    let sqlArr = []

    let row = await query(sql, sqlArr)
    let sumRow = await query(sumSql, sqlArr)
    ctx.body = new Respond(true, 200, 'null', {data: row, sum: sumRow[0].sum})
}

var searchInfo = async ctx => {
    let {user} = ctx.request.body
    let sql = `select uid, username, sex, age, phone, email, user_table.powerId from power_table, user_table where power_table.powerId = user_table.powerId and (user_table.username=? or user_table.uid=?)`
    let sqlArr = [user, user]
    let row = await query(sql, sqlArr)
    if(row.length) {
        ctx.body = new Respond(true, 200, '查询成功', {data: row, sum: row.length})
    }else {
        ctx.body = new Respond(false, 200, '查询无结果')
    }
    
}

module.exports = {
    getAllInfo,
    searchInfo
}

