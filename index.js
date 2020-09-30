var Koa = require('koa')
var bodyParser = require("koa-bodyparser");

const indexRouter = require('./routes/index');

const app = new Koa();
app.use(bodyParser())
app.use(indexRouter.routes());

app.listen(3000, () => {
    console.log('server at 3000')
})
