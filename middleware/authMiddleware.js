import { User } from "../models/userModel.js";
export const loadCurrentUser = async (req, res, next) => {
  try {
    req.currentUser = null;
    res.locals.currentUser = null;
    if (req.session.userId) {
      const user = await User.findByPk(req.session.userId, { attributes: { exclude: ["password"] } });
      if (user?.isActive) {
        req.currentUser = user.get({ plain: true });
        res.locals.currentUser = req.currentUser;
      } else delete req.session.userId;
    }
    next();
  } catch (error) { next(error); }
};
export const requireAuth = (req, res, next) => {
  if (!req.currentUser) return res.redirect("/login");
  next();
};
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.currentUser) return res.redirect("/login");
  if (req.currentUser.role === "admin" || roles.includes(req.currentUser.role)) return next();
  return res.status(403).render("error", {
    title: "Access restricted", message: "Your account does not have access to this module."
  });
};
