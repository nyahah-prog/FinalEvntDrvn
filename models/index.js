export { User } from "./userModel.js";
export { sequelize } from "./db.js";
import { defineAssociations } from "./associations.js";
import "./Finance SupplyHub/index.js";
import "./POS SupplyHub/index.js";
import "./Inventory SupplyHub/index.js";
import "./Human Resource SupplyHub/index.js";
defineAssociations();
