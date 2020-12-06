const { Schema, model } = require('mongoose')

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
        index: true
    },
    state: { 
        type: String,
        index: true
    },
    city: { 
        type: String,
        index: true
    },
    location: {
        type: pointSchema,
        index: '2dsphere'
    }
})

module.exports = model('Area', schema)