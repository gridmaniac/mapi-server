const { Schema, model } = require('mongoose')
const { Types } = Schema

const schema = new Schema({
    user: {
        type: String,
        required: true
    },
    service: {
        type: Types.ObjectId,
        ref: 'User'
    }
})

module.exports = model('Favorite', schema)