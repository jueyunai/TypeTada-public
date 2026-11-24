import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries
        .filter(
          (entry) =>
            (!entry.name.startsWith(".") || entry.name === ".env.example") &&
            !["__pycache__", "node_modules", "dist"].includes(entry.name) &&
            !entry.name.endsWith(".pyc") &&
            !entry.isSymbolicLink(),
        )
        .map((entry) =>
          entry.isDirectory()
            ? files(join(dir, entry.name))
            : [join(dir, entry.name)],
        ),
    )
  )
    .flat()
    .sort();
}
