class Respond {
    constructor(success, code, msg, data = {}) {
        this.success = success
        this.code = code
        this.msg = msg
        this.data = data
    }
}

module.exports = {
    Respond
}