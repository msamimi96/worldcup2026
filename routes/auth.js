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
            role: user.role,
            display_name: user.display_name
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
    const matchSql = `
        SELECT *
        FROM matches
        ORDER BY kickoff ASC
    `;

    db.query(matchSql, (err, matches) => {

        if (err) return res.send("DB error (matches)");

        // 2. Get users
        const userSql = `
            SELECT id, username, display_name
            FROM users
        `;

        db.query(userSql, (err, users) => {

            if (err) return res.send("DB error (users)");

            // 3. Get points
            const pointsSql = `
                SELECT *
                FROM points
            `;

            db.query(pointsSql, (err, points) => {

                if (err) return res.send("DB error (points)");

                // 4. Build users map
                const userMap = {};

                users.forEach(u => {

                    userMap[u.id] = {
                        id: u.id,
                        username: u.username,
                        display_name: u.display_name,
                        total_points: 0,
                        points: {}
                    };

                });

                // 5. Fill points
                points.forEach(p => {

                    if (userMap[p.user_id]) {

                        userMap[p.user_id].total_points += Number(p.points);

                        userMap[p.user_id].points[p.match_id] = {
                            points: p.points
                        };

                    }

                });

                // 6. Get predictions
                const predictionSql = `
                    SELECT *
                    FROM predictions
                `;

                db.query(predictionSql, (err, predictions) => {

                    if (err) {
                        return res.send("DB error (predictions)");
                    }

                    // attach predictions
                    predictions.forEach(pred => {

                        if (userMap[pred.user_id]) {

                            // create object if not exists
                            if (!userMap[pred.user_id].points[pred.match_id]) {

                                userMap[pred.user_id].points[pred.match_id] = {
                                    points: 0
                                };

                            }

                            userMap[pred.user_id].points[pred.match_id].prediction =
                                `${pred.pred1} - ${pred.pred2}`;

                            userMap[pred.user_id].points[pred.match_id].side_prediction =
                                pred.side_prediction;

                        }

                    });
                    
                    const allRankingsSql = `
                        SELECT *
                        FROM rankings_prediction
                    `;

                    db.query(allRankingsSql, (err, rankings) => {

                        if (err) {
                            return res.send("DB error (rankings)");
                        }

                        rankings.forEach(r => {

                            if (userMap[r.user_id]) {

                                userMap[r.user_id].ranking_prediction = {
                                    first_place: r.first_place,
                                    second_place: r.second_place,
                                    third_place: r.third_place,
                                    fourth_place: r.fourth_place
                                };

                            }

                        });

                    // 7. Sort leaderboard
                    const userList = Object.values(userMap)
                        .sort((a, b) => b.total_points - a.total_points);

                    // 8. Rankings check
                    const rankingSql = `
                        SELECT *
                        FROM rankings_prediction
                        WHERE user_id = ?
                    `;

                    db.query(
                        rankingSql,
                        [req.session.user.id],
                        (err, rankingResult) => {

                            if (err) {
                                return res.send("DB error (rankings)");
                            }

                            // if rankings not submitted
                            if (rankingResult.length === 0) {
                                return res.redirect("/rankings-prediction");
                            }

                            // 9. Render home
                            res.render("home", {
                                user: req.session.user,
                                matches,
                                users: userList
                            });

                        }
                    );

                });

            });

        });

    });

});

/* =========================
   LOGOUT
========================= */

router.post("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/");

    });

});

module.exports = router;
