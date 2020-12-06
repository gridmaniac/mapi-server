const { Schema, model } = require('mongoose')

const schema = new Schema({
    user: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
})

module.exports = model('Rating', schema)