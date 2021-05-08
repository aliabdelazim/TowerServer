module.exports = (sequelize, Sequelize) => {
    const UserSchema = sequelize.define("user", {
    name : {
        type: Sequelize.STRING,
    },
    email : {
        type: Sequelize.STRING,
        required: true,
    },
    username : {
        type: Sequelize.STRING,
        required: true,
    },
    password : {
        type: Sequelize.STRING,
        required: true,
    },
});

return UserSchema;

}
