const { bodyError, bodyData } = require('../types')
const Term = require('../models/term')

module.exports.Search = async ctx => {
    try {
        const { search = '' } = ctx.request.query
        const rx = new RegExp(search, 'i')

        const terms = await Term.find({
            $or: [{
                title: rx
            }, {
                category: rx
            }, {
                specificCategory: rx
            }]
        }).sort({ title: 1, category: 1 }).limit(10)

        ctx.body = bodyData(terms)
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.SearchByCategory = async ctx => {
    try {
        const { category } = ctx.request.params
        const { search = '' } = ctx.request.query
        const rx = new RegExp(search, 'i')

        const terms = await Term.find({
            category,
            $or: [{
                title: rx
            }, {
                specificCategory: rx
            }]
        }).sort({ title: 1 }).limit(10)

        ctx.body = bodyData(terms)
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}