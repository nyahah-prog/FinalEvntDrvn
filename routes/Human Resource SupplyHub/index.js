import { Router } from "express";
import { dashboard } from "../../controllers/Human Resource SupplyHub/humanResourceController.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
const router = Router();
router.use(requireAuth, requireRole("human-resource"));
router.get("/", dashboard);
// Add this module's endpoints here.
export default router;
