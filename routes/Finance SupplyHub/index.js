import { Router } from "express";
import { dashboard } from "../../controllers/Finance SupplyHub/financeController.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
const router = Router();
router.use(requireAuth, requireRole("finance"));
router.get("/", dashboard);
// Add this module's endpoints here.
export default router;
