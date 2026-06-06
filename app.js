require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

/* =========================
   MIDDLEWARE (IMPORTANT ORDER)
========================= */

// 1. body parser FIRST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. session SECOND
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// 3. static files
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   VIEW ENGINE
========================= */

app.set("view engine", "ejs");

/* =========================
   ROUTES
========================= */

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);

/* =========================
   SERVER
========================= */

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});