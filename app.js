const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const db = require("./models");


db.sequelize.sync();

const app = express();


const users = require("./routes/users");
const towers = require("./routes/towers");


const port = 3000;



app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

require("./config/passport")(passport);

app.use("/users", users);
app.use("/towers", towers);


app.get("/", (req, res) => {
    res.send("Invalid endpoint!");
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(port, () => {
    console.log(`App running on ${port}.`)
})


