import { MODULES, modulesForRole } from "../config/app.js";
import { renderProductsPage } from "./POS SupplyHub/productcontroller.js";
export const homePage = (req, res) => res.render("home", { title: "Welcome", modules: MODULES });
export const dashboardPage = (req, res, next) => {
  res.set("Cache-Control", "no-store, private");
  if (req.currentUser.role === "pos") return renderProductsPage(req, res, next);
  return res.render("dashboard", {
    title: "Dashboard", modules: modulesForRole(req.currentUser.role),
    isViewer: req.currentUser.role === "viewer"
  });
};
