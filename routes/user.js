const db = require("../database/db");
const express = require("express");
const router = express.Router();


function isUser(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/");
    }
    next();
}

/* =========================
   SUBMIT PREDICTION
========================= */

router.post("/predict", isUser, (req, res) => {

    const userId = req.session.user.id;
    const { match_id, pred1, pred2 } = req.body;
    if (!pred1 || !pred2) {
        return res.send("Invalid prediction");
        }

    // 1. Get match kickoff time
    const matchSql = `
        SELECT kickoff FROM matches WHERE id = ?
    `;

    db.query(matchSql, [match_id], (err, matchResult) => {

        if (err) return res.send("DB error");

        if (!matchResult.length) {
            return res.send("Match not found");
        }

        const match = matchResult[0];

        // 🔒 LOCK CHECK (IMPORTANT)
        if (new Date(match.kickoff) < new Date()) {
            return res.send("Prediction closed");
        }

        // 2. Check if already predicted
        const checkSql = `
            SELECT * FROM predictions
            WHERE user_id = ? AND match_id = ?
        `;

        db.query(checkSql, [userId, match_id], (err, result) => {

            if (err) return res.send("DB error");

            if (result.length > 0) {
                return res.send("You already predicted this match");
            }

            // 3. Insert prediction
            const insertSql = `
                INSERT INTO predictions (user_id, match_id, pred1, pred2)
                VALUES (?, ?, ?, ?)
            `;

            db.query(insertSql,
                [userId, match_id, pred1, pred2],
                (err) => {

                    if (err) return res.send("Insert error");

                    res.redirect("/home");

                }
            );

        });

    });
    

});

module.exports = router;