import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { files } from "../scripts/files.mjs";
it("excludes hidden state, credentials, caches and links from Skill hashes and source archives", async () => {
  const root = await mkdtemp(join(tmpdir(), "typetada-source-list-"));
  try {
    await mkdir(join(root, ".omc"));
    await mkdir(join(root, "nested"));
    await mkdir(join(root, "__pycache__"));
    for (const name of [
      ".DS_Store",
      ".env.local",
      ".omc/state.json",
      "__pycache__/a.pyc",
      "nested/theme.md",
      ".env.example",
    ])
      await writeFile(join(root, name), "synthetic");
    await symlink(
      join(root, ".omc/state.json"),
      join(root, "linked-state.json"),
    );
    expect((await files(root)).map((p: string) => relative(root, p))).toEqual([
      ".env.example",
      "nested/theme.md",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
