// Build script for The Red Book.
// Bundles src/ with esbuild, compiles Tailwind, copies public/, and stamps the
// service worker with a content hash so clients always pick up new deploys.
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const out = "dist";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) static assets
cpSync("public", out, { recursive: true });

// 2) tailwind
execSync(`npx tailwindcss -c tailwind.config.js -i src/tw.css -o ${out}/styles.css --minify`, { stdio: "inherit" });

// 3) app bundle
await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  target: "es2017",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: `${out}/app.js`,
  logLevel: "info",
});

// 4) stamp the service worker cache name with a hash of the bundle + styles
const hash = createHash("sha1")
  .update(readFileSync(`${out}/app.js`))
  .update(readFileSync(`${out}/styles.css`))
  .digest("hex")
  .slice(0, 10);
const swPath = join(out, "sw.js");
if (existsSync(swPath)) {
  writeFileSync(swPath, readFileSync(swPath, "utf8").replace("__BUILD__", hash));
}
console.log(`\nBuilt ${out}/ (cache stamp ${hash})`);

// optional: --serve for local preview
if (process.argv.includes("--serve")) {
  const { createServer } = await import("node:http");
  const { readFile } = await import("node:fs/promises");
  const types = { html: "text/html", js: "text/javascript", css: "text/css", json: "application/json", webmanifest: "application/manifest+json", png: "image/png", svg: "image/svg+xml", woff2: "font/woff2" };
  createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    try {
      const data = await readFile(join(out, p));
      res.writeHead(200, { "Content-Type": types[p.split(".").pop()] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  }).listen(5173, () => console.log("Preview at http://localhost:5173"));
}
