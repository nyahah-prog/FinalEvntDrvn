import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
export const loginPage = (req, res) => req.currentUser
  ? res.redirect("/") : res.render("login", { title: "Sign in" });
export const registerPage = (req, res) => req.currentUser
  ? res.redirect("/") : res.render("register", { title: "Create account" });
export const forgotPasswordPage = (req, res) =>
  res.render("forgotpassword", { title: "Account assistance" });

const establishSession = (req, userId) => new Promise((resolve, reject) => {
  req.session.regenerate((error) => {
    if (error) return reject(error);
    req.session.userId = userId;
    req.session.save((saveError) => saveError ? reject(saveError) : resolve());
  });
});
export const loginUser = async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = email && password ? await User.findOne({ where: { email } }) : null;
    if (!user?.isActive || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render("login", { title: "Sign in", error: "Invalid email or password.", email });
    }
    await establishSession(req, user.id);
    res.redirect("/");
  } catch (error) { next(error); }
};
export const registerUser = async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (name.length < 2 || name.length > 120 || email.length > 191
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || password.length < 8 || Buffer.byteLength(password) > 72
      || password !== req.body.confirmPassword) {
      return res.status(422).render("register", {
        title: "Create account", name, email,
        error: "Enter a valid name and email, and matching passwords of 8 to 72 UTF-8 bytes."
      });
    }
    const user = await User.create({
      name, email, password: await bcrypt.hash(password, 12), role: "viewer"
    });
    await establishSession(req, user.id);
    res.redirect("/");
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).render("register", {
      title: "Create account", error: "Email is already registered."
    });
    next(error);
  }
};
export const logoutUser = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("supplyhub.sid");
    res.redirect("/login");
  });
};
