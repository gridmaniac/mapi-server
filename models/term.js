const { Schema, model } = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        index: true
    },
    category: {
        type: String,
        index: true
    },
    specificCategory: {
        type: String,
        index: true
    }
})

module.exports = model('Term', schema)