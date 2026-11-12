import { User, sequelize } from "./models/userModel.js";
try {
  console.table(await User.findAll({
    attributes: ["id", "name", "email", "role", "isActive"], raw: true
  }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await sequelize.close(); }
