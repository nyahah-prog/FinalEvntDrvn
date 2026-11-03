import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { ROLES } from "../config/app.js";
export const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(191), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: "viewer" },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: "users" });
export { sequelize };
