var query = require('../util/dbconfig');
const jwt = require('jsonwebtoken')
var { Respond } = require('../util/class')

var LogCheck = async (ctx) => {
    var token = ctx.headers['authorization']
    var decode = ''
    if(!token) {
        ctx.body = new Respond(false, 200, '登录失败')
    }else {
        jwt.verify(token,'abcd',(err, decoded)=>{
            if(ctx.request.body.noCheck || ctx.query.noCheck) {
                decode = decoded
            }else {
                if(err) {
                    ctx.body = new Respond(false, 200, '登录过期')
                    console.log(err.name);
                }else {
                    ctx.body = new Respond(true, 200, '登录成功', {
                        username: decoded.username,
                        uid: decoded.uid,
                        powerId: decoded.powerId
                    })
                }
            }
        })
    }
    
   return decode
}

var Login = async ctx => {
    let {user,pwd} = ctx.request.body
    
    let sql = `select * from user_table where username=? or uid=?`
    let sqlArr = [user, user]
    let sql1 = `select * from user_table where (username=? or uid=?) and user_table.pwd=?`
    let sqlArr1 = [user, user, pwd]

    let checkRow = await query(sql, sqlArr)
    let loginRow = await query(sql1, sqlArr1)

    if(!checkRow.length) {
        ctx.body = new Respond(false, 200, '用户名错误')
    }else {
        if(!loginRow.length) {
            ctx.body = new Respond(false, 200, '密码错误')
        }else {
            ctx.body = new Respond(true, 200, '登录成功',{
                token:jwt.sign({username: loginRow[0].username, uid: loginRow[0].uid, powerId: loginRow[0].powerId},'abcd',{
                    // 过期时间
                    expiresIn:"6h"
                }),
                uid: loginRow[0].uid,
                powerId: loginRow[0].powerId,
                username: loginRow[0].username
            })
        }
    }
}

var modifyPw = async ctx => {
    const {oldPassword, newPassword} = ctx.request.body
    const userObj = await LogCheck(ctx)
    let sql = `select * from user_table where uid=? and pwd=?`
    let sqlArr = [userObj.uid, oldPassword]
    let sql1 = `UPDATE user_table SET pwd=? where uid=?`
    let sqlArr1 = [newPassword, userObj.uid]

    let checkRow = await query(sql, sqlArr)
    let modifyRow = await query(sql1, sqlArr1)
    if(!checkRow.length) {
        ctx.body = new Respond(false, 200, '旧密码错误')
    }else {
        if(modifyRow.affectedRows > 0) {
            ctx.body = new Respond(true, 200, '修改成功')
        }
    }
}

var Register = async ctx => {
    let {uid, username, sex, age, pwd, phone, email, powerId} = ctx.request.body
    let createTime = new Date()
    if(!email) email = ""
    let checkSql = `select * from file_table where fid=?`
    let checkSqlArr = [uid]
    let checkRes = await query(checkSql, checkSqlArr)
    if(!checkRes.length) {
        ctx.body = new Respond(false, 200, '此职工号不存在')
    }else {
        let sql = `insert into user_table (uid, username, sex, age, pwd, phone, email, updateTime, powerId) values (?,?,?,?,?,?,?,?,?)`
        let sqlArr = [uid, username, sex, age, pwd, phone, email, createTime, powerId]
        let row = await query(sql, sqlArr)
        if(row.affectedRows > 0) {
            ctx.body = new Respond(true, 200, `新用户${username}注册成功`)
        }else {
            ctx.body = new Respond(false, 200, '注册失败')
        }
    }
}

module.exports = {
    LogCheck,
    Login,
    modifyPw,
    Register
}