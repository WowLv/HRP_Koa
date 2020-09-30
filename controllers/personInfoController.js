var query = require('../util/dbconfig');
var { LogCheck } = require('./loginController')
var { Respond } = require('../util/class')
const jwt = require('jsonwebtoken')

var getInfo = async ctx => {
    let {Uid} = ctx.query
    let sql = `select uid, username, sex, age, phone, email, user_table.powerId, power_table.powerName as power from power_table, user_table where power_table.powerId = user_table.powerId and user_table.uid=?`
    let sqlArr = [Uid]

    let row = await query(sql, sqlArr)
    let { uid, username, sex, age, phone, email, powerId } = row[0]
    if(row.length) {
        ctx.body = new Respond(true, 200, '查询成功', { uid, username, sex, age, phone, email, powerId})
    }else {
        ctx.body = new Respond(false, 200, '查询失败')
    }
}

var setInfo = async ctx => {
    let {uid, username, sex, age, phone, email, powerId, pwd} = ctx.request.body    
    let sql = `UPDATE user_table,power_table SET uid=?,username=?,sex=?,age=?,phone=?,email=?,user_table.powerId=?,updateTime=? where power_table.powerId = user_table.powerId and user_table.uid=?`
    let sqlArr = [uid, username, sex, age, phone, email, powerId, new Date(), uid]
    if(pwd) {
        sql = `UPDATE user_table,power_table SET uid=?,pwd=?,username=?,sex=?,age=?,phone=?,email=?,user_table.powerId=?,updateTime=? where power_table.powerId = user_table.powerId and user_table.uid=?`
        sqlArr = [uid, pwd, username, sex, age, phone, email, powerId, new Date(), uid]
    }
    
    let row = await query(sql, sqlArr)
    if(row.affectedRows > 0) {
        ctx.body = new Respond(true, 200, '保存成功')
    }else {
        ctx.body = new Respond(false, 200, '保存失败，请重试')
    }
}

module.exports = {
    getInfo,
    setInfo
}