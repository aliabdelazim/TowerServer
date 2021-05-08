module.exports = (sequelize, Sequelize) => {
    const TowerSchema = sequelize.define("tower", {
    name : {
        type: Sequelize.STRING,
    },
    location : {
        type: Sequelize.STRING,
        required: true,
    },
    floors_num : {
        type: Sequelize.INTEGER,
        required: true,
    },
    offices_num : {
        type: Sequelize.INTEGER,
        required: true,
    },
    rating : {
        type: Sequelize.FLOAT,
        required: true,
    },
    latitude : {
        type: Sequelize.DOUBLE,
        required: true,
    },
    longitude : {
        type: Sequelize.DOUBLE,
        required: true,
    },
});

return TowerSchema;

}
