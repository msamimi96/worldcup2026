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
    const {
            match_id,
            pred1,
            pred2,
            side_prediction
        } = req.body;

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

            // 3. If prediction exists → UPDATE it
            if (result.length > 0) {

                const updateSql = `
                    UPDATE predictions
                    SET pred1 = ?,
                        pred2 = ?,
                        side_prediction = ?
                    WHERE user_id = ? AND match_id = ?
                `;

                return db.query(
                    updateSql,
                    [
                        pred1,
                        pred2,
                        side_prediction,
                        userId,
                        match_id
                    ],
                    (err) => {
                        if (err) return res.send("Update error");
                        res.redirect("/home?submitted=1");
                    }
                );
            }

            // 4. Otherwise → INSERT new prediction
            const insertSql = `
                INSERT INTO predictions
                (
                    user_id,
                    match_id,
                    pred1,
                    pred2,
                    side_prediction
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    userId,
                    match_id,
                    pred1,
                    pred2,
                    side_prediction
                ],
                (err) => {
                    if (err) return res.send("Insert error");
                    res.redirect("/home?submitted=1");
                }
            );

        });

    });
    

});

/* =========================
   RANKINGS PAGE
========================= */

router.get("/rankings-prediction", isUser, (req, res) => {

    const userId = req.session.user.id;

    const firstMatchSql = `
        SELECT kickoff
        FROM matches
        ORDER BY kickoff ASC
        LIMIT 1
    `;

    db.query(firstMatchSql, (err, firstMatchResult) => {

        if (err) return res.send("DB error");

        const firstMatch = firstMatchResult[0];

        const locked =
            new Date(firstMatch.kickoff).getTime()
            <= Date.now();

        const rankingSql = `
            SELECT *
            FROM rankings_prediction
            WHERE user_id = ?
        `;

        db.query(rankingSql, [userId], (err, rankingResult) => {

            if (err) return res.send("DB error");

            res.render("rankings", {
                ranking: rankingResult[0] || null,
                locked
            });

        });

    });

});

/* =========================
   SUBMIT RANKINGS
========================= */

router.post("/submit-rankings", isUser, (req, res) => {

    const userId = req.session.user.id;

    const {
        first_place,
        second_place,
        third_place,
        fourth_place,
    } = req.body;

    // check if rankings already exist
    const checkSql = `
        SELECT *
        FROM rankings_prediction
        WHERE user_id = ?
    `;

    db.query(checkSql, [userId], (err, result) => {

        if (err) return res.send("DB error");

        // =========================
        // UPDATE EXISTING RANKINGS
        // =========================

        if (result.length > 0) {

            const updateSql = `
                UPDATE rankings_prediction
                SET
                    first_place = ?,
                    second_place = ?,
                    third_place = ?,
                    fourth_place = ?
                WHERE user_id = ?
            `;

            db.query(
                updateSql,
                [
                    first_place,
                    second_place,
                    third_place,
                    fourth_place,
                    userId
                ],
                (err) => {

                    if (err) return res.send("Update error");

                    res.redirect("/home");

                }
            );

        }

        // =========================
        // INSERT NEW RANKINGS
        // =========================

        else {

            const insertSql = `
                INSERT INTO rankings_prediction
                (
                    user_id,
                    first_place,
                    second_place,
                    third_place,
                    fourth_place
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    userId,
                    first_place,
                    second_place,
                    third_place,
                    fourth_place
                ],
                (err) => {

                    if (err) return res.send("Insert error");

                    res.redirect("/home");

                }
            );

        }

    });

});

module.exports = router;