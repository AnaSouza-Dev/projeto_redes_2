import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "db",
  user: "appuser",
  password: "apppassword",
  database: "appdb",
  port: 3306,
  connectionLimit: 10
});
