require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

/* =========================
   SECURITY
========================= */

app.disable("x-powered-by");

/* =========================
   MIDDLEWARE
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

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
   404 HANDLER
========================= */

app.use((req, res) => {
    res.status(404).send("Page not found");
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});