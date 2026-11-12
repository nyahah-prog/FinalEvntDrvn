import express from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import productRoutes from "./productsRoutes.js";
const router = express.Router();
router.use(requireAuth, requireRole("pos"));
router.use("/", productRoutes);

export default router;
