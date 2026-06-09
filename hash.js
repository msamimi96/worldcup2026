const bcrypt = require("bcrypt");

bcrypt.hash("Mehdi20262026", 10)
.then(hash => {
    console.log(hash);
});