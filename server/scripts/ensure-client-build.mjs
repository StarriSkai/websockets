import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

if (process.env.SKIP_CLIENT_BUILD === "1") {
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const marker = path.join(repoRoot, "client", "build", "index.html");

if (fs.existsSync(marker)) {
  process.exit(0);
}

console.error("client/build missing — building client for production…");
const result = spawnSync("npm", ["run", "build:client"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
});
const code = result.status ?? (result.error ? 1 : 0);
process.exit(code);
