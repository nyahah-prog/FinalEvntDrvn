import { Router } from "express";
import { dashboard } from "../../controllers/POS SupplyHub/posController.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
const router = Router();
router.use(requireAuth, requireRole("pos"));
router.get("/", dashboard);
// Add this module's endpoints here.
export default router;
