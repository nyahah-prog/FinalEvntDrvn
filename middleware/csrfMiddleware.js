import { randomBytes, timingSafeEqual } from "node:crypto";
export const csrfProtection = (req, res, next) => {
  req.session.csrfToken ||= randomBytes(32).toString("hex");
  res.locals.csrfToken = req.session.csrfToken;
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const provided = req.body?._csrf || req.get("x-csrf-token");
  const expected = req.session.csrfToken;
  const valid = typeof provided === "string"
    && Buffer.byteLength(provided) === Buffer.byteLength(expected)
    && timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) return res.status(403).render("error", {
    title: "Form expired", message: "Reload the form and submit it again."
  });
  next();
};
