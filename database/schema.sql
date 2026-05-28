CREATE DATABASE IF NOT EXISTS worldcup;

USE worldcup;

/* =========================
   USERS
========================= */

CREATE TABLE users (

    id INT PRIMARY KEY AUTO_INCREMENT,

    username VARCHAR(50) UNIQUE,

    password VARCHAR(255),

    role ENUM('user', 'admin') DEFAULT 'user'

);

/* =========================
   MATCHES
========================= */

CREATE TABLE matches (

    id INT PRIMARY KEY AUTO_INCREMENT,

    team1 VARCHAR(50),

    team2 VARCHAR(50),

    kickoff DATETIME,

    result1 INT NULL,

    result2 INT NULL,

    is_finished BOOLEAN DEFAULT FALSE

);

/* =========================
   PREDICTIONS
========================= */

CREATE TABLE predictions (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT,

    match_id INT,

    pred1 INT,

    pred2 INT,

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (match_id)
        REFERENCES matches(id)

);

/* =========================
   POINTS
========================= */

CREATE TABLE points (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT,

    match_id INT,

    points INT,

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (match_id)
        REFERENCES matches(id)

);