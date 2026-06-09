const express = require("express");
const router = express.Router();
const db = require("../database/db");
const bcrypt = require("bcrypt");

/* =========================
   ADMIN PROTECTION
========================= */

function isAdmin(req, res, next) {

    if (!req.session.user) {
        return res.redirect("/");
    }

    if (req.session.user.role !== "admin") {
        return res.send("Access denied");
    }

    next();

}

/* =========================
   ADMIN PAGE
========================= */

router.get("/admin", isAdmin, (req, res) => {

    const usersSql = `
        SELECT id, username, display_name
        FROM users
        WHERE role = 'user'
    `;

    const matchesSql = `
        SELECT *
        FROM matches
        ORDER BY kickoff ASC
    `;

    db.query(usersSql, (err, users) => {

        if (err) return res.send("Users DB error");

        db.query(matchesSql, (err, matches) => {

            if (err) return res.send("Matches DB error");

            res.render("admin", {
                users,
                matches,
                user: req.session.user  
            });

        });

    });

});

/* =========================
   CREATE MATCH
========================= */

router.post("/admin/matches/create", isAdmin, (req, res) => {

    const {
        team1,
        team2,
        kickoff
    } = req.body;

    const sql = `
        INSERT INTO matches
        (team1, team2, kickoff)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [team1, team2, kickoff], (err) => {

        if (err) {
            console.log(err);
            return res.send(err);
        }

        res.redirect("/admin");

    });

});

/* =========================
   DELETE MATCH
========================= */

router.post("/admin/matches/delete", isAdmin, (req, res) => {

    const { match_id } = req.body;

    // delete predictions first
    db.query(
        "DELETE FROM predictions WHERE match_id = ?",
        [match_id],
        (err) => {

            if (err) {
                console.log(err);
                return res.send(err);
            }

            // delete points
            db.query(
                "DELETE FROM points WHERE match_id = ?",
                [match_id],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.send(err);
                    }

                    // finally delete match
                    db.query(
                        "DELETE FROM matches WHERE id = ?",
                        [match_id],
                        (err) => {

                            if (err) {
                                console.log(err);
                                return res.send(err);
                            }

                            res.redirect("/admin");

                        }
                    );

                }
            );

        }
    );

});

/* =========================
   UPDATE MATCH + POINTS
========================= */

router.post("/admin/update-match", isAdmin, (req, res) => {

    const {
        match_id,
        result1,
        result2,
        user_id,
        points
    } = req.body;

    // update result
    const matchSql = `
        UPDATE matches
        SET result1 = ?, result2 = ?, is_finished = TRUE
        WHERE id = ?
    `;

    db.query(matchSql, [result1, result2, match_id], (err) => {

        if (err) {
            console.log(err);
            return res.send(err);
        }

        // delete old points
        const deleteSql = `
            DELETE FROM points
            WHERE match_id = ?
        `;

        db.query(deleteSql, [match_id], (err) => {

            if (err) {
                console.log(err);
                return res.send(err);
            }

            // insert new points
            const insertSql = `
                INSERT INTO points
                (user_id, match_id, points)
                VALUES ?
            `;

            const values = user_id.map((id, i) => {

                const value = Number(points[i]);

                return [
                    id,
                    match_id,
                    isNaN(value) ? 0 : value
                ];

            });

            db.query(insertSql, [values], (err) => {

                if (err) {
                    console.log(err);
                    return res.send(err);
                }

                res.redirect("/admin");

            });

        });

    });

});

/* =========================
   CREATE USER
========================= */

router.post("/admin/users/create", isAdmin, async (req, res) => {

    const { username, password, display_name } = req.body;

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (username, password, role, display_name)
            VALUES (?, ?, 'user', ?)
        `;

        db.query(sql, [username, hashedPassword, display_name], (err) => {

            if (err) {
                console.log(err);
                return res.send(err);
            }

            res.redirect("/admin");

        });

    } catch (err) {
        console.log(err);
        return res.send("Hash error");
    }

});

/* =========================
   DELETE USER
========================= */

router.post("/admin/users/delete", isAdmin, (req, res) => {

    const { user_id } = req.body;

    // delete predictions
    db.query(
        "DELETE FROM predictions WHERE user_id = ?",
        [user_id],
        (err) => {

            if (err) {
                console.log(err);
                return res.send(err);
            }

            // delete points
            db.query(
                "DELETE FROM points WHERE user_id = ?",
                [user_id],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.send(err);
                    }

                    // delete rankings
                    db.query(
                        "DELETE FROM rankings_prediction WHERE user_id = ?",
                        [user_id],
                        (err) => {

                            if (err) {
                                console.log(err);
                                return res.send(err);
                            }

                            // delete user
                            db.query(
                                "DELETE FROM users WHERE id = ?",
                                [user_id],
                                (err) => {

                                    if (err) {
                                        console.log(err);
                                        return res.send(err);
                                    }

                                    res.redirect("/admin");

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});

/* =========================
   CHANGE PASSWORD
========================= */

router.post("/admin/users/change-password", isAdmin, async (req, res) => {

    const { user_id, new_password } = req.body;

    try {

        const hashedPassword = await bcrypt.hash(new_password, 10);

        const sql = `
            UPDATE users
            SET password = ?
            WHERE id = ?
        `;

        db.query(sql, [hashedPassword, user_id], (err) => {

            if (err) {
                console.log(err);
                return res.send(err);
            }

            res.redirect("/admin");

        });

    } catch (err) {
        console.log(err);
        return res.send("Hash error");
    }

});

module.exports = router;