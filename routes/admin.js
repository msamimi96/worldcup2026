const express = require("express");
const router = express.Router();
const db = require("../database/db");


/* ===== ADMIN PROTECTION ===== */
function isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.send("Access denied");
    }
    next();
}

/* =========================
   ADD MATCH (ADMIN)
========================= */

router.post("/admin/add-match", isAdmin, (req, res) => {

    const { team1, team2, kickoff } = req.body;

    const sql = `
        INSERT INTO matches (team1, team2, kickoff)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [team1, team2, kickoff], (err) => {

        if (err) {
            console.log(err);
            return res.send("Error adding match");
        }

        res.redirect("/home");

    });

});

module.exports = router;


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

            const values = user_id.map((id, i) => [
                id,
                match_id,
                points[i] || 0
            ]);

            db.query(insertSql, [values], (err) => {

                if (err) return res.send("Insert points error");

                res.redirect("/admin");

            });

        });

    });

});

router.get("/admin", isAdmin, (req, res) => {

    const matchSql = "SELECT * FROM matches ORDER BY kickoff ASC";
    const userSql = "SELECT id, username FROM users";

    db.query(matchSql, (err, matches) => {

        if (err) return res.send("DB error (matches)");

        db.query(userSql, (err, users) => {

            if (err) return res.send("DB error (users)");

            res.render("admin", {
                matches,
                users
            });

        });

    });

});