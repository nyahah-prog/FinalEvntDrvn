import inquirer from "inquirer";
import bcrypt from "bcryptjs";
import { User, sequelize } from "../models/userModel.js";
try {
  const a = await inquirer.prompt([
    { name: "name", message: "Administrator full name:",
      validate: (s) => s.trim().length >= 2 && s.trim().length <= 120 },
    { name: "email", message: "Email:",
      validate: (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()) && s.trim().length <= 191 },
    { type: "password", name: "password", mask: "*", message: "Password (8 to 72 UTF-8 bytes):",
      validate: (s) => s.length >= 8 && Buffer.byteLength(s) <= 72 }
  ]);
  const email = a.email.trim().toLowerCase();
  if (await User.findOne({ where: { email } })) throw new Error("Email exists. Use assign:role for an existing account.");
  await User.create({ name: a.name.trim(), email, password: await bcrypt.hash(a.password, 12), role: "admin" });
  console.log("Administrator created. Sign in at http://localhost:3000/login");
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await sequelize.close(); }
