import { sequelize } from "./models/db.js";
try {
  await sequelize.authenticate();
  console.log("SupplyHub MySQL connection successful.");
} catch (error) {
  console.error("Connection failed:", error.message);
  process.exitCode = 1;
} finally { await sequelize.close(); }
