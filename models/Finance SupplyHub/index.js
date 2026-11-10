import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const FinanceTransaction = sequelize.define("FinanceTransaction", {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  referenceNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM("income", "expense"), allowNull: false },
  category: { type: DataTypes.STRING(80), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0.01 } },
  transactionDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("paid", "pending", "cancelled"), allowNull: false, defaultValue: "paid" },
  paymentMethod: { type: DataTypes.ENUM("cash", "bank", "card", "mobile", "other"), allowNull: false, defaultValue: "cash" },
  recordedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: "finance_transactions",
  indexes: [
    { fields: ["type"] },
    { fields: ["status"] },
    { fields: ["transaction_date"] }
  ]
});
