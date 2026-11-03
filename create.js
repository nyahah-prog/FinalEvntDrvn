// SupplyHub module-aware adaptation of the XianFire generator workflow.
// XianFire copyright (c) 2025 Christian I. Cabrera. See LICENSE.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const modules = {
  finance: "Finance SupplyHub", pos: "POS SupplyHub",
  inventory: "Inventory SupplyHub", "human-resource": "Human Resource SupplyHub"
};
const [kind, name, ...args] = process.argv.slice(2);
try {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name || "")) {
    throw new Error("Provide a JavaScript identifier, for example Product or productController.");
  }
  let moduleKey = null;
  if (args.length) {
    if (args.length !== 2 || args[0] !== "--module" || !modules[args[1]]) {
      throw new Error("Use --module finance|pos|inventory|human-resource.");
    }
    moduleKey = args[1];
  }
  if (moduleKey && !["model", "controller"].includes(kind)) {
    throw new Error("--module is available for model and controller generators.");
  }
  const folder = moduleKey ? modules[moduleKey] : "";
  let destination, source;
  if (kind === "model") {
    const className = name[0].toUpperCase() + name.slice(1);
    destination = path.join(root, "models", folder, className + ".js");
    source = `import { DataTypes } from "sequelize";
import { sequelize } from "${moduleKey ? "../" : "./"}db.js";
// Replace these example fields with your team's agreed schema.
export const ${className} = sequelize.define("${className}", {
  name: { type: DataTypes.STRING(150), allowNull: false }
}, { tableName: "${moduleKey ? moduleKey.replaceAll("-", "_") + "_" : ""}${className.toLowerCase()}_records" });
`;
  } else if (kind === "controller") {
    destination = path.join(root, "controllers", folder, name + ".js");
    source = `// Add named actions for this module.
export const index = (req, res) => {
  res.json({ success: true, message: "${name} is ready for editing." });
};
`;
  } else if (kind === "middleware") {
    destination = path.join(root, "middleware", name + ".js");
    source = 'export { requireAuth, requireRole } from "./authMiddleware.js";\n';
  } else if (kind === "upload-middleware") {
    destination = path.join(root, "middleware", name + ".js");
    source = `import multer from "multer";
// Uploaded bytes remain in memory. Validate and save them in your controller.
export const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) =>
    callback(null, ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype))
});
`;
  } else throw new Error("Use model, controller, middleware, or upload-middleware.");
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { flag: "wx" });
  console.log(`Created: ${path.relative(root, destination)}`);
  if (kind === "model") console.log("Export the model from its model index before running migrate.");
} catch (error) {
  console.error(error.code === "EEXIST" ? "File already exists; no changes made." : error.message);
  process.exitCode = 1;
}
