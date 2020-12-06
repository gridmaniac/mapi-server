const { bodyError, bodyData } = require('../types')
const Area = require('../models/area')
const User = require('../models/user')
const geocoder = require('../modules/geocoder')

module.exports.Search = async ctx => {
    try {
        const { search = '' } = ctx.request.query
        const rx = new RegExp(search, 'i')

        const areas = await Area.find({
            $or: [{
                name: rx
            }, {
                state: rx
            }, {
                city: rx
            }]
        }).sort({ name: 1 }).limit(10)

        ctx.body = bodyData(areas.map(x => {
            x.location.coordinates =
                x.location.coordinates.reverse()
            return x
        }))
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.Set = async ctx => {
    const { user } = ctx.state

    try {
        const { area } = ctx.request.body

        await User.findByIdAndUpdate(user.id, {
            area: area._id,
            location: {
                type: 'Point',
                coordinates: [
                    area.location.coordinates[1],
                    area.location.coordinates[0]
                ]
            }
        })
    
        ctx.body = bodyData({ success: true })
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.SetByLocation = async ctx => {
    const { user } = ctx.state

    try {
        const { location } = ctx.request.body
        const { address, name } = await geocoder.reverse(location)
    
        const cc = address['country_code']
        // if (cc !== 'gh' || !name)
        //     throw new Error('This option is only available in Ghana.')

        const { city, state } = address
        
        let area = await Area.findOne({ name, state, city })

        if (!area) {
            const search = []
            city && search.push(city)
            state && search.push(state)
            search.push(name)

            const { lat, lon } = await geocoder.search(search.join(', '))
            area = new Area({
                name,
                state,
                city,
                location: {
                    type: 'Point',
                    coordinates: [lon, lat]
                }
            })
            await area.save()
        }

        await User.findByIdAndUpdate(user.id, {
            area: area.id,
            location: {
                type: 'Point',
                coordinates: [location.lon, location.lat]
            }
        })
    
        area.location.coordinates = area.location.coordinates.reverse()
        ctx.body = bodyData(area)
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.GetByLocation = async ctx => {
    try {
        const { location } = ctx.request.body
        const { address, name } = await geocoder.reverse(location)
    
        const cc = address['country_code']
        // if (cc !== 'gh' || !name)
        //     throw new Error('This option is only available in Ghana.')

        const { city, state } = address
        
        let area = await Area.findOne({ name, state, city })

        if (!area) {
            const search = []
            city && search.push(city)
            state && search.push(state)
            search.push(name)

            const { lat, lon } = await geocoder.search(search.join(', '))
            area = new Area({
                name,
                state,
                city,
                location: {
                    type: 'Point',
                    coordinates: [lon, lat]
                }
            })
            await area.save()
        }
    
        area.location.coordinates = area.location.coordinates.reverse()
        ctx.body = bodyData(area)
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}