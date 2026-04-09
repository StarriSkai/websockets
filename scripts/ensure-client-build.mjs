import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const marker = path.join(root, "client", "dist", "index.html");

if (fs.existsSync(marker)) {
  process.exit(0);
}

console.error("client/dist missing — building client for production…");
const result = spawnSync("npm", ["run", "build:client"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
const code = result.status ?? (result.error ? 1 : 0);
process.exit(code);
