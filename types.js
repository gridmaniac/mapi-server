module.exports.bodyError = function(msg) {
    return {
        err: msg
    }
}

module.exports.bodyData = function(obj) {
    return obj
}