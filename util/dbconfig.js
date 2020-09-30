const mysql = require('mysql')
  //配置数据库
var pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'posinfo'
  })
//连接数据库，使用mysql的连接池
var sqlConnect = (sql, sqlArr) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((connectErr, conn) => {
            if(connectErr) {
                throw connectErr
            }    

            conn.query(sql, sqlArr, (err, row) => {
                //释放连接
                conn.release()
                if(err) {
                    reject(err)
                }
                resolve(row)
            })
        })
    })
}

module.exports = sqlConnect
