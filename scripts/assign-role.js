import { ROLES } from "../config/app.js";
import { User, sequelize } from "../models/userModel.js";
const [email, role] = process.argv.slice(2);
try {
  if (!email || !ROLES.includes(role)) throw new Error(
    `Usage: npm run assign:role -- user@example.com <${ROLES.join("|")}>`
  );
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) throw new Error("Account not found. Register the account first.");
  await user.update({ role });
  console.log(`Assigned ${role} to ${user.email}.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await sequelize.close(); }
