export const APP_TITLE = "SupplyHub: School and Office Supplies Store Management System";
export const ROLES = ["admin", "finance", "pos", "inventory", "human-resource", "viewer"];
export const MODULES = [
  {"key": "finance", "name": "Finance SupplyHub", "path": "/finance", "description": "Income, expenses, payment records, and financial reports."},
  {"key": "pos", "name": "POS SupplyHub", "path": "/pos", "description": "Sales, checkout, receipts, and cashier transaction history."},
  {"key": "inventory", "name": "Inventory SupplyHub", "path": "/inventory", "description": "Products, categories, stock movements, and suppliers."},
  {"key": "human-resource", "name": "Human Resource SupplyHub", "path": "/human-resource", "description": "Employee records, attendance, and work schedules."}
];
export const modulesForRole = (role) => MODULES.filter((m) => role === "admin" || m.key === role);
