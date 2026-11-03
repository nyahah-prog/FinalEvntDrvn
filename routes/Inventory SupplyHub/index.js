import { Router } from "express";
import { dashboard } from "../../controllers/Inventory SupplyHub/inventoryController.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
const router = Router();
router.use(requireAuth, requireRole("inventory"));
router.get("/", dashboard);
// Add this module's endpoints here.
export default router;
