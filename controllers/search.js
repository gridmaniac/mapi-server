const { bodyError, bodyData } = require('../types')

module.exports.Test = async ctx => {
    const { user } = ctx.state
    ctx.body = bodyData({ user })
}