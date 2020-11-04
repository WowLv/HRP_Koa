var Koa = require('koa')
const path = require('path')
const static = require('koa-static') 
const mount = require('koa-mount')
var bodyParser = require("koa-bodyparser");
const hrpRouter = require('./routes/index');
const hrp = new Koa();
const tb = new Koa()
const app = new Koa()

hrp.use(bodyParser())
hrp.use(hrpRouter.routes());
// tb.use(bodyParser())
// tb.use(hrpRouter.routes());
tb.use(static('./mtb-view'));
hrp.use(static('./hrp-view'));
app.use(mount(hrp)).use(mount(tb))

// app.use(async (ctx, next) => {
//     await ctx.render('tb.html') // render 渲染方法，这里加载到 views/index.html
//     await next()
// })

app.listen(3000, () => {
    console.log('server at 3000')
})
