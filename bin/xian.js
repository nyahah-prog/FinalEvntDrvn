#!/usr/bin/env node
// SupplyHub adaptation of the XianFire CLI. Original attribution: LICENSE.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const [command = "start", ...rest] = process.argv.slice(2);
const scripts = {
  start: ["index.js"], s: ["index.js"],
  dev: [require.resolve("nodemon/bin/nodemon.js"), "index.js"],
  d: [require.resolve("nodemon/bin/nodemon.js"), "index.js"],
  xian: [require.resolve("nodemon/bin/nodemon.js"), "index.js"],
  migrate: ["migrate.js"], m: ["migrate.js"],
  "create:model": ["create.js", "model"],
  "create:controller": ["create.js", "controller"],
  "create:add-middleware": ["create.js", "middleware"],
  "create:upload-middleware": ["create.js", "upload-middleware"],
  "route:list": ["list-routes.js"], "route:cache": ["route-cache.js"],
  "db:test": ["testConnection.js"], "roles:list": ["testRoles.js"],
  "create:admin": ["scripts/create-admin.js"], "assign:role": ["scripts/assign-role.js"]
};
if (["help", "-h", "--help"].includes(command)) {
  console.log("SupplyHub | XianFire starter\nCommands:\n  " + Object.keys(scripts).join("\n  "));
  console.log("Example: node bin/xian.js create:model Product --module inventory");
} else if (!scripts[command]) {
  console.error("Unknown command. Use node bin/xian.js help.");
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [...scripts[command], ...rest], {
    cwd: root, stdio: "inherit"
  });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
