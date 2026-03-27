const mysql = require('mysql2/promise')

const pool = mysql.createPool({
    host: "gondola.proxy.rlwy.net",
    port: 27311,
    user: "root",
    password: "SlLveBRKycWHcbZzGZKVkxvOEPbzhqtL",
    database: "railway",
    ssl: {
        rejectUnauthorized: false
    }
})

module.exports = pool