const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const db = require("../models");
const User = db.user;
const config = require("../config/database");

module.exports = function(passport){
    let opts = {};
    opts.jwtFromRequest = ExtractJwt.fromHeader("authorization");
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
        User.findByPk(jwt_payload.id).then((user) => {
           
            if(user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        }).catch(err=> {
                return done(err, false);
        });
    }));
}