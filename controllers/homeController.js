import { MODULES, modulesForRole } from "../config/app.js";
export const homePage = (req, res) => res.render("home", { title: "Welcome", modules: MODULES });
export const dashboardPage = (req, res) => res.render("dashboard", {
  title: "Dashboard", modules: modulesForRole(req.currentUser.role),
  isViewer: req.currentUser.role === "viewer"
});
