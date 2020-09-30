var formatDate = (date, format) => {
    let FormatedDate = ''
    let Y = date.getFullYear()
    let M = date.getMonth()+1
    if(M < 10) {
        M = `0${date.getMonth() + 1}`
    }
    let D = date.getDate()
    if(D < 10) {
        D = `0${date.getDate()}`
    }
    let h = date.getHours()
    if(h < 10) {
        h = `0${date.getHours()}`
    }
    let m = date.getMinutes()
    if(m < 10) {
        m = `0${date.getMinutes()}`
    }
    let s = date.getSeconds()
    if(s < 10) {
        s = `0${date.getSeconds()}`
    }

    switch (format) {
        case 'Y':
            FormatedDate = `${Y}`
            break;
        case 'Y:M':
            FormatedDate = `${Y}-${M}`
            break;
        case 'Y:M:D':
            FormatedDate = `${Y}-${M}-${D}`
            break;
        case 'Y:M:D hh:mm:ss':
            FormatedDate = `${Y}-${M}-${D} ${h}:${m}:${s}`
            break;
        default:
            FormatedDate = `${Y}-${M}-${D} ${h}:${m}:${s}`
            break;
    }

    return FormatedDate
}

module.exports = {
    formatDate
}