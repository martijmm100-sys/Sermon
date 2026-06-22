import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const required = [
  "index.html",
  "assets/css/styles.css",
  "assets/js/app.js",
  "assets/js/parser.js",
  "assets/js/starter-book.js",
  "assets/js/storage.js",
  "assets/js/study-engine.js",
  "assets/img/cross.svg",
  "README.md",
  "SOURCE_NOTICE.md",
  ".nojekyll"
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  throw new Error(`Missing required files: ${missing.join(", ")}`);
}

const html = readFileSync("index.html", "utf8");
if (!html.includes('<script type="module" src="./assets/js/app.js"></script>')) {
  throw new Error("index.html must load the app using a relative GitHub Pages-safe path.");
}

if (!html.includes("<main") || !html.includes("data-tab-panel=\"reader\"")) {
  throw new Error("index.html is missing required structure.");
}

for (const file of required.filter((item) => item.endsWith(".js"))) {
  execFileSync("node", ["--check", file], { stdio: "inherit" });
}

console.log("Static app smoke test passed.");
