require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

/* =========================
   SETTINGS
========================= */

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   SESSIONS
========================= */

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false

}));

const userRoutes = require("./routes/user");
app.use("/", userRoutes);

/* =========================
   ROUTES
========================= */

const authRoutes = require("./routes/auth");

app.use("/", authRoutes);

const adminRoutes = require("./routes/admin");
app.use("/", adminRoutes);


/* =========================
   SERVER
========================= */


const PORT = 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});