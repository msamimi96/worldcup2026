const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const db = require("../database/db");

/* =========================
   LOGIN PAGE
========================= */

router.get("/", (req, res) => {

    res.render("login");

});

/* =========================
   LOGIN
========================= */

router.post("/login", (req, res) => {

    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, results) => {

        if (err) return res.send("DB error");

        if (results.length === 0) {
            return res.send("Invalid login");
        }

        const user = results[0];

        // save session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        // ROLE-BASED REDIRECT
        if (user.role === "admin") {
            return res.redirect("/admin");
        } else {
            return res.redirect("/home");
        }

    });

});

/* =========================
   HOME
========================= */

router.get("/home", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/");
    }

    // 1. Get matches
    const matchSql = `SELECT * FROM matches ORDER BY kickoff ASC`;

    db.query(matchSql, (err, matches) => {

        if (err) return res.send("DB error (matches)");

        // 2. Get users
        const userSql = `SELECT id, username FROM users`;

        db.query(userSql, (err, users) => {

            if (err) return res.send("DB error (users)");

            // 3. Get all points
            const pointsSql = `SELECT * FROM points`;

            db.query(pointsSql, (err, points) => {

                if (err) return res.send("DB error (points)");

                // 4. Build structured users
                const userMap = {};

                users.forEach(u => {
                    userMap[u.id] = {
                        id: u.id,
                        username: u.username,
                        total_points: 0,
                        points: {}
                    };
                });

                // 5. Fill points
                points.forEach(p => {

                    if (userMap[p.user_id]) {

                        userMap[p.user_id].total_points += p.points;

                        userMap[p.user_id].points[p.match_id] = p.points;
                    }

                });

                // 6. Convert to array + sort
                const userList = Object.values(userMap)
                    .sort((a, b) => b.total_points - a.total_points);

                // 7. Render
                res.render("home", {
                    user: req.session.user,
                    matches,
                    users: userList
                });

            });

        });

    });

});

/* =========================
   LOGOUT
========================= */

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/");

    });

});

module.exports = router;