const axios  = require('axios')
const rateLimit = require('axios-rate-limit')
const nominatim = rateLimit(axios.create({
    baseURL: 'https://nominatim.openstreetmap.org'
}), { maxRPS: 1 })

module.exports.reverse = async function(location) {
    const { data } = await nominatim.get('/reverse', {
        params: {
            format: 'jsonv2',
            zoom: 14,
            namedetails: 1,
            ...location
        }
    })
    return data
}

module.exports.search = async function(name) {
    const { data } = await nominatim.get('/search', {
        params: {
            format: 'jsonv2',
            q: name,
            // countrycodes: 'gh',
            limit: 1
        }
    })
    return data.length > 0 ? data[0] : null
}