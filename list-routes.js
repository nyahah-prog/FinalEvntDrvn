import router from "./routes/index.js";
const rows = [];
const walk = (stack, prefix = "") => {
  for (const layer of stack) {
    if (layer.route) rows.push({
      method: Object.keys(layer.route.methods).join(", ").toUpperCase(),
      path: prefix + layer.route.path,
      handlers: layer.route.stack.map((s) => s.handle.name || "anonymous").join(", ")
    });
    else if (layer.handle?.stack) walk(layer.handle.stack, prefix + (layer.handle.supplyhubMount || ""));
  }
};
walk(router.stack);
console.table(rows);
