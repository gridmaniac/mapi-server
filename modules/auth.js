const passport = require('koa-passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('../models/user')

const fetchUser = async id => {
    const user = await User.findById(id).populate('area')
    return user
}

passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(async function (id, done) {
    try {
        const user = await fetchUser(id)
        done(null, user)
    } catch (err) {
        done(err)
    }
})

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}

passport.use('jwt',
    new JwtStrategy(jwtOptions, async (payload, done) => {
        const user = await fetchUser(payload.id)
        if (user)
            return done(null, user)
        return done(null, false)
    }))

module.exports.isJWTAuthenticated = async (ctx, next) => {
    return passport.authenticate('jwt', async (err, user) => {
        if (user) {
            ctx.state.user = user
            return next()
        }
        
        return ctx.status = 403
    })(ctx, next)
}