const bcrypt = require("bcrypt");

const password = "Mehdi20262026";

const hash =
"$2b$10$gcM.lkj0K9fnOx1oiNAQ7egndpx.ZsY6ds94POI5M..zSWj3vAktm";

bcrypt.compare(password, hash)
.then(result => {
    console.log(result);
});