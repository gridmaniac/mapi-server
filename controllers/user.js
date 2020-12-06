const { bodyError, bodyData } = require('../types')
const User = require('../models/user')
const Favorite = require('../models/favorite')
const Rating = require('../models/rating')
const otp = require('../modules/otp')
const jwt = require('jsonwebtoken')
const base64Img = require('base64-img')
const path = require('path')
const fs = require('fs')
const Jimp = require('jimp')
const jo = require('jpeg-autorotate')
const { Types } = require('mongoose')

module.exports.Check = async ctx => {
    try {
        const { phone } = ctx.request.body
        const user = await User.findOne({ phone, deleted: false })

        ctx.body = bodyData({ exists: !!user })
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.SendCode = async ctx => {
    try {
        const { phone } = ctx.request.body
        // const phone = '79128759772'
        // const id = await otp.sendCodeTo(phone)
        const id = 'test'

        ctx.body = bodyData({ id })
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.Verify = async ctx => {
    try {
        const { phone, code, id } = ctx.request.body
        // await otp.verifyCode(code, id)

        const user = await User.findOne({ phone, deleted: false })
        if (user) {
            const payload = {
                id: user.id,
                phone: user.phone
            }

            const token = 'Bearer ' + jwt.sign(payload, process.env.JWT_SECRET)
            return ctx.body = bodyData({ token })
        }

        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

function saveImage(base64String) {
    return new Promise((resolve, reject) => {
        const imagePath = path.join(__dirname, '../public/images')
        base64Img.img(base64String, imagePath, Date.now(), async (err, filePath) => {
            if (err)
                return reject(err)

            const pathArr = filePath.split('/')
            const fileName = pathArr[pathArr.length - 1]

            try {
                let image = await Jimp.read(filePath)
                const ext = image.getExtension()
                if (ext == 'jpg' || ext == 'jpeg') {
                    const fileIn = fs.readFileSync(filePath)
                    const { buffer } = await jo.rotate(fileIn, { quality: 75 })
                    image = await Jimp.read(buffer)
                }

                const ratio = 520 / image.getWidth()
                await image.scale(ratio)
                await image.write(filePath)
            } catch (e) {}

            resolve(fileName)
        })
    })
}

(function ensureImages() {
    const imagesPath = path.join(__dirname, '../public/images')
    if (!fs.existsSync(imagesPath))
        fs.mkdirSync(imagesPath)
})();

module.exports.Create = async ctx => {
    try {
        const { phone, image } = ctx.request.body

        let imageFileName = 'placeholder.png'
        if (image != null) {
            imageFileName = await saveImage(image)
        }

        ctx.request.body.image = imageFileName

        const user = await User.findOneAndUpdate({ phone, deleted: false },
            ctx.request.body, { new: true, upsert: true, setDefaultsOnInsert: true })

        const payload = {
            id: user.id,
            phone: user.phone
        }
    
        const token = 'Bearer ' + jwt.sign(payload, process.env.JWT_SECRET)
        ctx.body = bodyData({ token })
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.Update = async ctx => {
    try {
        const { user } = ctx.state
        const { image } = ctx.request.body
        if (image != null) {
            imageFileName = await saveImage(image)
            ctx.request.body.image = imageFileName
        } else delete ctx.request.body.image

        await User.findByIdAndUpdate(user.id, ctx.request.body)
        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.GetProfile = async ctx => {
    try {
        const { user } = ctx.state
        user.location.coordinates = user.location.coordinates.reverse()

        if (user.area)
            user.area.location.coordinates = user.area.location.coordinates.reverse()

        ctx.body = bodyData({
            profile: {
                id: user.id,
                name: user.name,
                image: user.image,
                isService: user.isService,
                category: user.category,
                specificCategory: user.specificCategory,
                title: user.title,
                description: user.description,
                idNumber: user.idNumber,
                webSite: user.webSite,
                area: user.area,
                location: user.location
            }
        })
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.Delete = async ctx => {
    try {
        const { user } = ctx.state
        await User.findByIdAndUpdate(user.id, { deleted: true })

        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.ConvertToService = async ctx => {
    try {
        const { user } = ctx.state
        const { image } = ctx.request.body
        if (image != null) {
            imageFileName = await saveImage(image)
            ctx.request.body.image = imageFileName
        } else delete ctx.request.body.image

        await User.findByIdAndUpdate(user.id, {
            isService: true,
            ...ctx.request.body
        })
        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.Search = async ctx => {
    try {
        const { area, type, term, search, sort } = ctx.request.body
        const rx = new RegExp(search, 'i')
        const or = []

        const rest = {}

        if (term && term.title)
            or.push({ title: term.title })

        if (term && term.category)
            or.push({ category: term.category })

        // if (type)
        //     rest.type = type

        if (search) {
            or.push({ name: rx })
            or.push({ description: rx })
        }

        if (or.length > 0)
            rest['$or'] = or

        area.location.coordinates = area.location.coordinates.reverse()
        const services = await User.aggregate([
            {
              $geoNear: {
                near: area.location,
                distanceField: 'distance',
                // maxDistance: 10,
                // spherical: true
              }
            },
            {
                $match: { 
                    // isService: true,
                    deleted: false,
                    // area: Types.ObjectId(area._id),
                    ...rest
                }
            },
            { $sort: { [sort]: sort == 'rating' ? -1 : 1 } },
            { $limit: 20 }
        ])

        ctx.body = bodyData(services.map(x => {
            x.location.coordinates =
                x.location.coordinates.reverse()
            return x
        }))
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.GetServiceById = async ctx => {
    try {
        const { user } = ctx.state
        const { id } = ctx.params
        const service = await User.findById(id).populate('area')
        
        const rating = await Rating.findOne({
            user: user.id, service: id
        })

        const ratingsCount = await Rating.count({
            service: id
        })

        const favorite = await Favorite.findOne({
            user: user.id, service: id
        })

        const isMe = user.id == id

        service.location.coordinates = service.location.coordinates.reverse()

        ctx.body = bodyData({ service, rating, favorite, isMe, ratingsCount })
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.RateService = async ctx => {
    try {
        const { user } = ctx.state
        const { id, value } = ctx.request.body

        const rating = {
            user: user.id,
            service: id
        }

        await Rating.findOneAndUpdate(rating,
            { ...rating, value }, { upsert: true })

        const ratings = await Rating.find({ service: id })
        let total = 0
        const list = ratings.reduce((res, x) => {
            const v = x.value
            res[v] = res[v] ? res[v] + 1 : 1
            total ++
            return res
        }, {})
        
        let sum = 0
        for (let i in list) {
            sum += i * list[i]
        }

        const newValue = sum / total
        await User.findByIdAndUpdate(id, { rating: newValue })
        
        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.AddFavorite = async ctx => {
    try {
        const { user } = ctx.state
        const { id } = ctx.request.body

        const favorite = {
            user: user.id,
            service: id
        }

        await Favorite.findOneAndUpdate(favorite,
            favorite, { upsert: true })
        
        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.RemoveFavorite = async ctx => {
    try {
        const { id } = ctx.request.body
        await Favorite.deleteOne({ id })

        ctx.body = bodyData({})
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}

module.exports.GetFavorites = async ctx => {
    try {
        const { user } = ctx.state
        const favorites = await Favorite.find({ user: user.id }).populate('service')
        ctx.body = bodyData(favorites.map(x => x.service))
    } catch(e) {
        ctx.body = bodyError(e.message)
    }
}