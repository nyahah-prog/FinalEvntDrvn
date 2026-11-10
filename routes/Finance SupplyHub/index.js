import { Router } from "express";
import {
  dashboard, createTransaction, updateTransaction, deleteTransaction, updateTransactionStatus, exportTransactions
} from "../../controllers/Finance SupplyHub/financeController.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
const router = Router();
router.use(requireAuth, requireRole("finance"));
router.get("/", dashboard);
router.get("/export.csv", exportTransactions);
router.post("/transactions", createTransaction);
router.post("/transactions/:id", updateTransaction);
router.post("/transactions/:id/status", updateTransactionStatus);
router.post("/transactions/:id/delete", deleteTransaction);
export default router;
