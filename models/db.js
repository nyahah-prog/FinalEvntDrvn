import "../config/env.js";
import { Sequelize } from "sequelize";
export const databaseConfig = {
  database: process.env.DB_NAME || "supplyhub_system",
  username: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
  host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306)
};
export const sequelize = new Sequelize(
  databaseConfig.database, databaseConfig.username, databaseConfig.password,
  { host: databaseConfig.host, port: databaseConfig.port, dialect: "mysql", logging: false,
    define: { underscored: true }, pool: { max: 5, min: 0, idle: 10000 } }
);
