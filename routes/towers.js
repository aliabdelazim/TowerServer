const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const db = require("../models");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Tower = db.tower;
//import redis
const redis = require('redis');
// config the socket.io
const server = require("http").createServer(router);
const io = require("socket.io")(server, {
    cors: {
       origin: "http://localhost:3000",
       methods: ["GET", "POST"],
    },
 });

const socketPort = 8000;
server.listen(socketPort, () => {
    console.log(`listening on *:${socketPort}`);
});


// create and connect redis client to local instance.
const redisClient = redis.createClient();
// Print redis errors to the console
redisClient.on('error', (err) => {
    console.log("Error " + err);
});

router.post("/create", passport.authenticate("jwt", { session: false }), (req, res, next) => {
    const newTower = {
        name: req.body.name,
        location: req.body.location,
        floors_num: req.body.floors_num,
        offices_num: req.body.offices_num,
        rating: req.body.rating,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
    }

    Tower.create(newTower).then(data => {
        redisClient.del("TOWERS_LIST")
        io.emit("a tower have been added", data)
        res.send(data);
    })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Tower."
            });
        });
});

router.get("/towerList", cache, (req, res, next) => {

    const showWithOffices = req.query['show-with-offices']
    const { page, size, search, sort } = req.query;
    var condition = search ? { name: { [Op.like]: `%${search}%` } } : null;

    var sortation = sort ? [sort.split(',')[0], sort.split(',')[1]] : null

    const { limit, offset } = getPagination(page, size);


    if (showWithOffices !== undefined && showWithOffices === 'true') {
        condition = { ...condition, offices_num: 0, }
        Tower.findAndCountAll({ where: condition, limit, offset }).then((list) => {

            const response = getPagingData(list, page, limit);
            //set to redis
            redisClient.setex("TOWERS_LIST", 3600, JSON.stringify(response));
            res.send(response);

        }).catch((err) => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving list of towers."
            })
        })
    } else {
        Tower.findAndCountAll({ where: condition, limit, offset, order: [sortation] }).then((list) => {

            const response = getPagingData(list, page, limit);
            //set to redis
            redisClient.setex("TOWERS_LIST", 3600, JSON.stringify(response));
            res.json(response);

        }).catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving list of towers."
            });
        })
    }
});

router.put("/update", passport.authenticate("jwt", { session: false }), (req, res, next) => {

    const id = req.query.id
    const newTowerValues = req.body

    Tower.findOne({ where: { name: id } }).then((tower) => {
        tower.update({ tower, ...newTowerValues })
        redisClient.del("TOWERS_LIST")
        io.emit("a tower have been updated", tower)
        res.json(tower);
    }).catch(err => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while updating the tower"
        });
    })
});

router.delete("/delete", passport.authenticate("jwt", { session: false }), (req, res, next) => {
    const id = req.query.id
    Tower.destroy({ where: { id: id } }).then(() => {
        redisClient.del("TOWERS_LIST")
        io.emit("a tower have been deleted", id)
        res.status(200).send({
            message: "Tower deletion is successfull"
        });
    }).catch((err) => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while deleting the tower"
        });
    })

});

router.get("/search", (req, res, next) => {
    const searchPrams = req.query

    Tower.findAll({
        where:
        {
            [Op.and]: { ...searchPrams }
        }
    }).then((search) => {
        res.send(search)
    }).catch((err) => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while searching the towers"
        });
    })

});

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: towers } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, towers, totalPages, currentPage };
};

const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
};

function cache(req, res, next) {
    redisClient.get("TOWERS_LIST", (error, cachedData) => {
        if (error) throw error;
        if (cachedData != null) {
            parsedResponse = JSON.parse(cachedData)
            res.send(parsedResponse);
        } else {
            next();
        }
    });
};

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("a tower have been added",
        (msg) => {
            io.emit("chat message", msg)
        },
        (err) => {
            io.emit(err)
        })



    socket.on("disconnect", () => {
        console.log("user disconnected");


    })
});

module.exports = router;