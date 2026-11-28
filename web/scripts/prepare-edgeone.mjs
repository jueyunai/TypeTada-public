import {
  copyFile,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const output = join(root, ".edgeone");
const assets = join(output, "assets");
const dist = join(root, "web/dist");
// Keep build history outside the directory uploaded to EdgeOne.
const history = join(root, "artifacts/edgeone-asset-history");

async function rememberAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const files = entries
    .filter((entry) => entry.isFile() && /-[\w-]{8,}\.[\w]+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (!files.length) return null;
  const version = createHash("sha256").update(files.join("\n")).digest("hex");
  const snapshot = join(history, version);
  await mkdir(snapshot, { recursive: true });
  for (const file of files)
    await copyFile(join(directory, file), join(snapshot, file));
  const now = new Date();
  await utimes(snapshot, now, now);
  return version;
}

await readFile(join(dist, "index.html"));
await mkdir(output, { recursive: true });
await mkdir(history, { recursive: true });
if (!(await readdir(history)).length) await rememberAssets(join(assets, "assets"));
const currentVersion = await rememberAssets(join(dist, "assets"));
if (!currentVersion) throw new Error("No hashed assets in the Vite build");

const priorBuilds = await Promise.all(
  (await readdir(history))
    .filter((name) => /^[a-f0-9]{64}$/.test(name) && name !== currentVersion)
    .map(async (name) => {
      const path = join(history, name);
      return { path, time: (await stat(path)).mtimeMs };
    }),
);
priorBuilds.sort((a, b) => b.time - a.time);

// Current HTML and theme data come from this build. Old tabs only need old hashes.
await rm(assets, { recursive: true, force: true });
await cp(dist, assets, { recursive: true });
for (const { path } of priorBuilds.slice(0, 2))
  await cp(path, join(assets, "assets"), { recursive: true, force: false });
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
for (const { path } of priorBuilds.slice(2))
  await rm(path, { recursive: true, force: true });
console.log(`Prepared EdgeOne static assets with ${Math.min(priorBuilds.length, 2)} previous build(s).`);
