const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
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

    const sql = `
        SELECT * FROM users
        WHERE username = ?
    `;

    db.query(sql, [username], async (err, results) => {

        if (err) {
            console.log(err);
            return res.send("DB error");
        }

        if (results.length === 0) {
            return res.send("Invalid login");
        }

        const user = results[0];

        if (!user.password) {
            return res.send("No password found");
        }

        try {

            const match =
                await bcrypt.compare(password, user.password);

            if (!match) {
                return res.send("Invalid login");
            }

            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name
            };

            if (user.role === "admin") {
                return res.redirect("/admin");
            }

            return res.redirect("/home");

        } catch (err) {

            console.log(err);
            return res.send("bcrypt error");

        }

    });

});

/* =========================
   HOME (CLEAN VERSION)
========================= */
router.get("/home", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/");
    }

    const userId = req.session.user.id;

    const matchSql = `
        SELECT *
        FROM matches
        ORDER BY kickoff DESC
    `;

    const userSql = `
        SELECT id, username, display_name
        FROM users
        WHERE role = 'user'
    `;

    const pointsSql = `
        SELECT *
        FROM points
    `;

    const predictionsSql = `
        SELECT *
        FROM predictions
    `;

    const rankingSql = `
        SELECT *
        FROM rankings_prediction
    `;

    // 1. Get matches
    db.query(matchSql, (err, matches) => {
        if (err) return res.send("DB error (matches)");

        // 2. Get users
        db.query(userSql, (err, users) => {
            if (err) return res.send("DB error (users)");

            // 3. Get points
            db.query(pointsSql, (err, points) => {
                if (err) return res.send("DB error (points)");

                // 4. Get predictions
                db.query(predictionsSql, (err, predictions) => {
                    if (err) return res.send("DB error (predictions)");

                    // 5. Get rankings
                    db.query(rankingSql, (err, rankings) => {
                        if (err) return res.send("DB error (rankings)");

                        // =========================
                        // BUILD USER MAP
                        // =========================
                        const userMap = {};

                        users.forEach(u => {
                            userMap[u.id] = {
                                id: u.id,
                                username: u.username,
                                display_name: u.display_name,
                                total_points: 0,
                                points: {},
                                ranking_prediction: null
                            };
                        });

                        // =========================
                        // ADD POINTS
                        // =========================
                        points.forEach(p => {
                            if (!userMap[p.user_id]) return;

                            userMap[p.user_id].total_points += Number(p.points);

                            userMap[p.user_id].points[p.match_id] = {
                                points: Number(p.points)
                            };
                        });

                        // =========================
                        // ADD PREDICTIONS
                        // =========================
                        predictions.forEach(pred => {
                            if (!userMap[pred.user_id]) return;

                            if (!userMap[pred.user_id].points[pred.match_id]) {
                                userMap[pred.user_id].points[pred.match_id] = {
                                    points: 0
                                };
                            }

                            userMap[pred.user_id].points[pred.match_id].prediction =
                                `${pred.pred1} - ${pred.pred2}`;

                            userMap[pred.user_id].points[pred.match_id].side_prediction =
                                pred.side_prediction;
                        });

                        // =========================
                        // ADD RANKING PREDICTIONS
                        // =========================
                        rankings.forEach(r => {
                            if (!userMap[r.user_id]) return;

                            userMap[r.user_id].ranking_prediction = {
                                first_place: r.first_place,
                                second_place: r.second_place,
                                third_place: r.third_place,
                                fourth_place: r.fourth_place
                            };
                        });

                        // =========================
                        // SORT USERS
                        // =========================
                        const userList = Object.values(userMap)
                            .sort((a, b) => b.total_points - a.total_points);

                        // =========================
                        // CHECK CURRENT USER RANKING
                        // =========================
                        const checkSql = `
                            SELECT *
                            FROM rankings_prediction
                            WHERE user_id = ?
                        `;

                        db.query(checkSql, [userId], (err, result) => {
                            if (err) return res.send("DB error (ranking check)");

                            if (result.length === 0) {
                                return res.redirect("/rankings-prediction");
                            }

                            // =========================
                            // FINAL RENDER
                            // =========================
                            return res.render("home", {
                                user: req.session.user,
                                matches,
                                users: userList,
                                submitted: req.query.submitted,
                                now: new Date()
                            });
                        });
                    });
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