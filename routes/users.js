const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const config = require("../config/database");
const user = require("../models/user");
var bcrypt = require("bcryptjs");

router.post("/register", (req, res, next) => {
    const newUser = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 8)
    }

    User.create(newUser).then(data => {
        res.send(data);
    })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the User."
            });
        });
});

router.post("/authenticate", (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ where: { username: username } }).then((user) => {
        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        const token = jwt.sign(user.toJSON(), config.secret, {
            expiresIn: 604800,
        });

        res.json({
            succes: true,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });



    }).catch(err => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while retrieving User."
        });
    })
});

router.get("/profile", passport.authenticate("jwt", { session: false }), (req, res, next) => {
    res.json({
        user: req.user
    });
});

module.exports = router;