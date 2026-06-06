const express = require("express");
const router = express.Router();
const db = require("../database/db");
module.exports = router;

/* ===== ADMIN PROTECTION ===== */
function isAdmin(req, res, next) {

    if (!req.session.user) {
        return res.redirect("/");
    }

    if (req.session.user.role !== "admin") {
        return res.send("Access denied");
    }

    next();

}

router.get("/admin", isAdmin, (req, res) => {

    const usersSql = `
        SELECT id, username
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
                matches
            });

        });

    });

});

/* =========================
   ADD MATCH (ADMIN)
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

        if (err) return res.send("Create match error");

        res.redirect("/admin");

    });

});

module.exports = router;

router.post("/admin/matches/delete", isAdmin, (req, res) => {

    const { match_id } = req.body;

    const sql = `
        DELETE FROM matches
        WHERE id = ?
    `;

    db.query(sql, [match_id], (err) => {

        if (err) return res.send("Delete match error");

        res.redirect("/admin");

    });

});

/* =========================
   UPDATE MATCH + POINTS
========================= */

router.post("/admin/update-match", isAdmin, (req, res) => {

    const { match_id, result1, result2, user_id, points } = req.body;

    // 1. update match result
    const matchSql = `
        UPDATE matches
        SET result1 = ?, result2 = ?, is_finished = TRUE
        WHERE id = ?
    `;

    db.query(matchSql, [result1, result2, match_id], (err) => {

        if (err) return res.send("Match update error");

        // 2. delete old points for this match
        const deleteSql = `
            DELETE FROM points WHERE match_id = ?
        `;

        db.query(deleteSql, [match_id], (err) => {

            if (err) return res.send("Delete error");

            // 3. insert new points
            const insertSql = `
                INSERT INTO points (user_id, match_id, points)
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

                if (err) return res.send("Insert points error");

                res.redirect("/admin");

            });

        });

    });

});



router.post("/admin/users/create", isAdmin, (req, res) => {

    const { username } = req.body;

    const sql = `
        INSERT INTO users (username, password, role, display_name)
        VALUES (?, NULL, 'user', ?)
    `;

    db.query(sql, [username], (err) => {

        if (err) return res.send("Create user error");

        res.redirect("/admin");

    });

});

router.post("/admin/users/delete", isAdmin, (req, res) => {

    const { user_id } = req.body;

    const sql = `
        DELETE FROM users
        WHERE id = ?
    `;

    db.query(sql, [user_id], (err) => {

        if (err) return res.send("Delete user error");

        res.redirect("/admin");

    });

});

router.post("/admin/users/reset-password", isAdmin, (req, res) => {

    const { user_id } = req.body;

    const sql = `
        UPDATE users
        SET password = NULL
        WHERE id = ?
    `;

    db.query(sql, [user_id], (err) => {

        if (err) return res.send("Reset password error");

        res.redirect("/admin");

    });

});