import mysql from "mysql2/promise";

const host = process.env.DB_HOST || "db";
const user = process.env.DB_USER || "appuser";
const password = process.env.DB_PASS || "apppassword";
const database = process.env.DB_NAME || "appdb";
const port = Number(process.env.DB_PORT || 3306);

export const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  connectionLimit: 10
});
