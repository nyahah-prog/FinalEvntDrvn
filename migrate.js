import { sequelize, databaseConfig } from "./models/db.js";
import "./models/index.js";
import mysql from "mysql2/promise";
let connection;
try {
  connection = await mysql.createConnection({
    host: databaseConfig.host, port: databaseConfig.port,
    user: databaseConfig.username, password: databaseConfig.password
  });
  await connection.query(
    "CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    [databaseConfig.database]
  );
  await sequelize.authenticate();
  // Create missing tables. Never drop tables or alter existing columns here.
  await sequelize.sync();
  console.log(`Database ${databaseConfig.database} is ready. Existing records were preserved.`);
} catch (error) {
  console.error("Setup failed:", error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
  await sequelize.close();
}
