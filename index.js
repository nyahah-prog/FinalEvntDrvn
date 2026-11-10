/*
 * SupplyHub starter adapted from XianFire 2.0.10.
 * XianFire copyright (c) 2025 Christian I. Cabrera.
 * Original permission and warranty terms are retained in LICENSE.
 */
import "./config/env.js";
import express from "express";
import session from "express-session";
import flash from "connect-flash";
import hbs from "hbs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import router from "./routes/index.js";
import { APP_TITLE } from "./config/app.js";
import { loadCurrentUser } from "./middleware/authMiddleware.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error("Set SESSION_SECRET to at least 32 random characters in .env.");
}
app.disable("x-powered-by");
if (isProduction) app.set("trust proxy", 1);
app.engine("xian", hbs.__express);
app.set("views", path.join(root, "views"));
app.set("view engine", "xian");
for (const name of fs.readdirSync(path.join(root, "views/partials"))) {
  if (name.endsWith(".xian")) hbs.registerPartial(
    name.slice(0, -5), fs.readFileSync(path.join(root, "views/partials", name), "utf8")
  );
}
hbs.registerPartial(
  "finance-head",
  fs.readFileSync(path.join(root, "views/Finance SupplyHub/head.xian"), "utf8")
);
hbs.registerPartial(
  "finance-side",
  fs.readFileSync(path.join(root, "views/Finance SupplyHub/side.xian"), "utf8")
);
app.use(express.static(path.join(root, "public")));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(session({
  name: "supplyhub.sid", secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 28800000 }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.appTitle = APP_TITLE;
  res.locals.year = new Date().getFullYear();
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});
app.use(csrfProtection);
app.use(loadCurrentUser);
app.use("/", router);
app.use((req, res) => res.status(404).render("error", {
  title: "Page not found", message: "This page does not exist."
}));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error.name || "Error", error.message);
  res.status(500).render("error", {
    title: "Unable to complete request",
    message: error.name?.startsWith("Sequelize")
      ? "Check your MySQL settings in .env, then run npm run migrate."
      : "The request could not be completed. Check the terminal for details."
  });
});
export default app;
export const startServer = (port = Number(process.env.PORT || 3000)) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`🔥 XianFire running at http://localhost:${server.address().port}`);
      resolve(server);
    });
    server.once("error", reject);
  });
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
