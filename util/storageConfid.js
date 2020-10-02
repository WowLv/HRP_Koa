var multer = require('koa-multer')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `public/uploads/${req.body.mode}/`)
    },
    filename: function (req, file, cb) {
        let nameList = file.originalname.split('.')
        let formatName = Date.now() + '.' + nameList[nameList.length - 1]
        cb(null, formatName)
    }
  })
  
  var upload = multer({ storage: storage })
  module.exports = upload