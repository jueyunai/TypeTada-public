import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const output = join(root, ".edgeone");
const assets = join(output, "assets");

// Only replace generated assets/routes; keep the CLI-managed project association.
await readFile(join(root, "web/dist/index.html"));
await mkdir(output, { recursive: true });
await rm(assets, { recursive: true, force: true });
await cp(join(root, "web/dist"), assets, { recursive: true });
// Only /editor is a client route. Missing assets and legacy API paths must stay 404.
await writeFile(
  join(assets, ".edgeone-assets-config.json"),
  JSON.stringify({ needsFallback: false }) + "\n",
);
await rm(join(output, "routes.json"), { force: true });
const generated = spawnSync("edgeone", ["makers", "generate-routes"], {
  cwd: root,
  env: { ...process.env, PAGES_SOURCE: "skills" },
  stdio: "inherit",
});
if (generated.error) throw generated.error;
if (generated.status !== 0)
  throw new Error("EdgeOne route generation failed");
const routes = JSON.parse(
  await readFile(join(output, "routes.json"), "utf8"),
);
if (
  routes.routes.some((route) => route.src === "/.*") ||
  !routes.conf?.rewrites?.some(
    (route) => route.source === "/editor" && route.destination === "/index.html",
  )
)
  throw new Error("Unexpected EdgeOne SPA fallback; refusing deployment");
console.log("Prepared EdgeOne static assets and scoped /editor routing.");
