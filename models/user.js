const { Schema, model } = require('mongoose')
const { Types } = Schema

const pointSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
})

const schema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['IF', 'SB', 'CO']
    },
    isService: {
        type: Boolean,
        required: true,
        default: false
    },
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
    },
    description: String,
    idNumber: String,
    webSite: String,
    image: String,
    area: {
        type: Types.ObjectId,
        ref: 'Area'
    },
    location: {
        type: pointSchema,
        index: '2dsphere'
    },
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    date: String,
    deleted: {
        type: Boolean,
        required: true,
        default: false
    }
})

module.exports = model('User', schema)