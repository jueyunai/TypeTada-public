import { readFile, writeFile, mkdir, stat, rm } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import createPurify from "dompurify";
import { files } from "./files.mjs";
const root = resolve(import.meta.dirname, "../.."),
  publicDir = resolve(root, "web/public"),
  target = join(publicDir, "library");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
const utf8 = async (p) => readFile(p, "utf8"),
  sha = (b) => createHash("sha256").update(b).digest("hex");
const registry = JSON.parse(await utf8(join(root, "skills/registry.json"))),
  packages = [];
const window = new JSDOM("").window,
  purify = createPurify(window);
for (const entry of registry.filter((e) => e.enabled)) {
  if (entry.adapter !== "gzh")
    throw new Error("Unsupported Skill adapter " + entry.id);
  const packageRoot = resolve(root, "skills", entry.directory);
  if (!packageRoot.startsWith(join(root, "skills") + "/"))
    throw new Error("Invalid package directory");
  const hash = createHash("sha256");
  for (const path of await files(packageRoot)) {
    hash.update(relative(packageRoot, path) + "\0");
    hash.update(await readFile(path));
  }
  const digest = hash.digest("hex");
  const skill = await utf8(join(packageRoot, "SKILL.md"));
  // The browser already handles imports, theme selection, validation and export.
  const assembly = skill.match(/^### 4\. [\s\S]+?(?=^### 5\. )/m)?.[0];
  const writing = skill.match(
    /^## 生成时的智能处理[\s\S]+?(?=^## 自定义主题生成)/m,
  )?.[0];
  if (!assembly || !writing)
    throw new Error("Missing gzh-design generation sections");
  const index = await utf8(join(packageRoot, "references/theme-index.md")),
    themes = [];
  for (const line of index.split("\n")) {
    if (!line.startsWith("|") || !line.includes("references/theme-")) continue;
    const cols = line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
      match = /references\/theme-([a-z0-9-]+)\.md/.exec(cols[3]);
    if (!match) continue;
    const themeId = match[1],
      name = cols[0],
      color = cols[1].match(/#[a-f0-9]{6}/i)?.[0] || "#059669";
    const references = await Promise.all(
      [
        "references/reading-typography.md",
        `references/theme-${themeId}.md`,
        "references/common-components.md",
      ].map(
        async (file) => `## ${file}\n${await utf8(join(packageRoot, file))}`,
      ),
    );
    const context = [
      "## 公众号排版 Skill · 生成与装配",
      assembly.trim(),
      writing.trim(),
      `## 当前主题\n${name}（${themeId}），适用场景：${cols[2]}。正文下划线 CSS：${cols[4]}`,
      ...references,
    ].join("\n\n");
    const path = `${entry.id}-${themeId}-${sha(context).slice(0, 16)}.txt`;
    await writeFile(join(target, path), context);
    const specimenCandidates = [
      join(packageRoot, "assets/theme-previews", `theme-${themeId}.html`),
      join(packageRoot, "gallery", `${themeId}.html`),
    ];
    let raw = null;
    for (const candidate of specimenCandidates) {
      try {
        raw = await utf8(candidate);
        break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    if (raw === null) {
      throw new Error(`Missing theme specimen for ${themeId}`);
    }
    const cleaned = raw.replace(
      /<p[^>]*style="[^"]*display\s*:\s*none[^"]*"[^>]*>\s*<mp-style-type\b[^>]*>\s*<\/mp-style-type>\s*<\/p>/gi,
      "",
    );
    const safe = purify.sanitize(cleaned, {
      FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "img"],
      FORBID_ATTR: ["onload", "onclick"],
    });
    await writeFile(
      join(target, `${themeId}-sample.html`),
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>html{background:white}body{margin:0;padding:18px 14px;background:white;text-align:left;overflow-wrap:break-word;box-sizing:border-box}</style></head><body>${safe}</body></html>`,
    );
    await stat(join(publicDir, "theme-previews", `${themeId}-thumb.webp`));
    themes.push({
      id: themeId,
      name,
      color,
      description: cols[2],
      skillId: entry.id,
      contextPath: "/library/" + path,
      contextHash: sha(context),
    });
  }
  packages.push({ ...entry, hash: digest, themes });
}
await writeFile(
  join(target, "index.json"),
  JSON.stringify({ version: 1, packages }),
);
const gallery = await utf8(
    join(root, "skills/gzh-design/gallery/moyu-green.html"),
  ),
  dom = new JSDOM(gallery).window.document;
dom.querySelector("section").style.textAlign = "left";
for (const el of dom.querySelectorAll("[style]")) {
  el.style.removeProperty("cursor");
  // 先过滤零宽字符再判定是否含可见文字，保留纯装饰线条的渐变
  const visible = el.textContent.replace(/[\u200b-\u200d\ufeff]/g, "").trim();
  if (visible && /gradient\(/.test(el.getAttribute("style")))
    el.setAttribute(
      "style",
      el
        .getAttribute("style")
        .replace(/(?:linear|radial)-gradient\([^;]+/g, "#059669"),
    );
}
await writeFile(
  join(target, "demo.json"),
  JSON.stringify({
    title: "做了些爆款 Skills 以后，我对 Skills 的看法",
    sourceMarkdown: await utf8(
      join(root, "skills/gzh-design/gallery/sample-article.md"),
    ),
    htmlFragment: purify.sanitize(dom.body.innerHTML, { ADD_ATTR: ["leaf"] }),
  }),
);
await rm(join(publicDir, "typetada-source.zip"), { force: true });
console.log(
  `Prepared ${packages.reduce((n, p) => n + p.themes.length, 0)} Skill themes and static specimens.`,
);
