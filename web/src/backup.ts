import { database, epoch, changed, getPreferences } from "./db";
import {
  checkResult,
  sourceManifest,
  sha256,
  markdown,
  inert,
  serialize,
} from "./content";
import { hydrateImages, imageFromBytes } from "./images";
import {
  id,
  type Article,
  type Asset,
  type LayoutResult,
  DEFAULT_PREFERENCES,
} from "./types";
const MAX_BACKUP_BYTES = 40 * 1024 * 1024;
export async function exportBackup(articleId?: string) {
  const db = await database,
    tx = db.transaction(["articles", "results", "assets"], "readonly");
  const articles = (await tx.objectStore("articles").getAll()).filter(
    (a) => !articleId || a.id === articleId,
  );
  const ids = new Set(articles.map((a) => a.id));
  const results = (await tx.objectStore("results").getAll()).filter((r) =>
    ids.has(r.articleId),
  );
  const allAssets = await tx.objectStore("assets").getAll();
  await tx.done;
  const assets = articleId
    ? allAssets.filter(
        (a) =>
          articles.some((article) => article.sourceMarkdown.includes(a.id)) ||
          results.some((result) => result.sourceMarkdown.includes(a.id)),
      )
    : allAssets;
  const backup = JSON.stringify(
    {
      format: "TypeTada",
      version: 1,
      // A single-article backup must not overwrite settings on import.
      scope: articleId ? "article" : "all",
      exportedAt: new Date().toISOString(),
      articles,
      results,
      assets,
      preferences: await getPreferences(),
    },
    null,
    2,
  );
  if (new TextEncoder().encode(backup).length > MAX_BACKUP_BYTES)
    throw new Error("备份超过40MiB，请分篇导出或先移除不需要的本机配图");
  return backup;
}
const string = (value: unknown, max: number, label: string) => {
  if (typeof value !== "string" || value.length > max)
    throw new Error(`备份${label}格式或长度无效`);
  return value;
};
function remapMarkdownImages(source: string, ids: Map<string, string>) {
  const tokens = markdown.parse(source, {});
  const usedImages = new Set(
    tokens.flatMap((t) =>
      (t.children || [])
        .filter((c) => c.type === "image")
        .map((c) => c.attrGet("src")),
    ),
  );
  const replace = (value: string) =>
    value
      .replace(
        /(!\[[^\]\n]*\]\(\s*<?)typetada-image:([a-z0-9_-]+)(?=>?(?:\s|\)))/gi,
        (whole, prefix: string, key: string) =>
          ids.has(key) ? prefix + "typetada-image:" + ids.get(key) : whole,
      )
      .replace(
        /^( {0,3}\[[^\]\n]+\]:\s*<?)typetada-image:([a-z0-9_-]+)(?=>?(?:\s|$))/gim,
        (whole, prefix: string, key: string) =>
          usedImages.has("typetada-image:" + key) && ids.has(key)
            ? prefix + "typetada-image:" + ids.get(key)
            : whole,
      );
  const outsideInlineCode = (value: string) => {
    let out = "",
      cursor = 0;
    for (const match of value.matchAll(/(`+)[\s\S]*?\1(?!`)/g)) {
      out += replace(value.slice(cursor, match.index)) + match[0];
      cursor = match.index! + match[0].length;
    }
    return out + replace(value.slice(cursor));
  };
  const lines = source.split("\n"),
    protectedLines = new Set<number>();
  for (const token of tokens)
    if (["fence", "code_block"].includes(token.type) && token.map)
      for (let i = token.map[0]; i < token.map[1]; i++) protectedLines.add(i);
  const result: string[] = [];
  for (let start = 0; start < lines.length;) {
    if (protectedLines.has(start)) {
      result.push(lines[start++]);
      continue;
    }
    let end = start + 1;
    while (end < lines.length && !protectedLines.has(end)) end++;
    result.push(outsideInlineCode(lines.slice(start, end).join("\n")));
    start = end;
  }
  return result.join("\n");
}
export async function importBackup(file: File) {
  if (file.size > MAX_BACKUP_BYTES)
    throw new Error("备份超过40MiB，请分篇导入");
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("不是有效JSON备份");
  }
  if (
    data.format !== "TypeTada" ||
    data.version !== 1 ||
    !Array.isArray(data.articles) ||
    !Array.isArray(data.results) ||
    !Array.isArray(data.assets)
  )
    throw new Error("备份格式或数量不支持");
  const generation = await epoch(),
    imageIds = new Map<string, string>(),
    articleIds = new Map<string, string>(),
    assets: Asset[] = [],
    articles: Article[] = [],
    results: LayoutResult[] = [];
  for (const input of data.assets) {
    const old = string(input.id, 100, "图片ID"),
      url = string(input.url, 14 * 1024 * 1024, "图片数据");
    if (imageIds.has(old)) throw new Error("备份图片ID重复");
    const match =
      /^data:image\/(png|jpeg|gif|webp);base64,([a-z0-9+/=]+)$/i.exec(url);
    if (!match) throw new Error("备份图片只能是本机内嵌图片");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const asset = await imageFromBytes(
      bytes,
      string(input.name, MAX_BACKUP_BYTES, "图片名"),
    );
    imageIds.set(old, asset.id);
    assets.push(asset);
  }
  const replace = (value: string) => remapMarkdownImages(value, imageIds);
  for (const input of data.articles) {
    const old = string(input.id, 100, "文章ID");
    if (articleIds.has(old)) throw new Error("备份文章ID重复");
    const article: Article = {
      id: id("article"),
      title: string(input.title, MAX_BACKUP_BYTES, "标题"),
      sourceMarkdown: replace(
        string(input.sourceMarkdown, MAX_BACKUP_BYTES, "原稿"),
      ),
      revision:
        Number.isSafeInteger(input.revision) && input.revision > 0
          ? input.revision
          : 1,
      updatedAt: Date.now() / 1000,
    };
    articleIds.set(old, article.id);
    articles.push(article);
  }
  const imageMap = new Map(assets.map((a) => [a.id, a.url]));
  for (const input of data.results) {
    const articleId = articleIds.get(input.articleId);
    if (!articleId) throw new Error("备份版本没有对应文章");
    const source = replace(
      string(input.sourceMarkdown, MAX_BACKUP_BYTES, "版本原稿"),
    );
    const dom = inert(
      string(input.sourceHtml, MAX_BACKUP_BYTES, "可核对版本正文"),
    );
    for (const image of dom.querySelectorAll("img")) {
      const key = /^typetada-image:([a-z0-9_-]+)$/i.exec(
        image.getAttribute("src") || "",
      )?.[1];
      if (key && imageIds.has(key))
        image.setAttribute("src", "typetada-image:" + imageIds.get(key));
    }
    const marked = serialize(dom);
    const manifest = sourceManifest(source),
      // 与生成、复制统一使用同一套硬错误与非阻断宽度提示口径
      checked = checkResult(marked, manifest.blocks, manifest.images);
    if (!checked.validation.ready)
      throw new Error(
        "备份中的版本未通过安全/原文检查：" +
          checked.validation.errors.slice(0, 3).join("；"),
      );
    const fragment = hydrateImages(checked.htmlFragment, imageMap);
    results.push({
      ...checked,
      resultId: id("result"),
      articleId,
      createdAt:
        typeof input.createdAt === "number" && Number.isFinite(input.createdAt)
          ? input.createdAt
          : Date.now() / 1000,
      title: string(input.title, MAX_BACKUP_BYTES, "版本标题"),
      sourceMarkdown: source,
      sourceRevision:
        Number.isSafeInteger(input.sourceRevision) && input.sourceRevision > 0
          ? input.sourceRevision
          : 1,
      themeId: string(input.themeId, 100, "主题"),
      skillId: string(input.skillId, 100, "Skill"),
      skillRevision: string(input.skillRevision, 100, "Skill版本"),
      skillContentHash: string(input.skillContentHash, 100, "Skill哈希"),
      model: string(input.model, 100, "模型"),
      htmlFragment: fragment,
      htmlSha256: await sha256(fragment),
      imageStatus: manifest.images.some((i) => i.startsWith("typetada-image:"))
        ? "local_pending"
        : manifest.images.length
          ? "remote"
          : "none",
      usage: { inputTokens: null, outputTokens: null },
      decisions: [
        "从本机备份恢复；已重新进行安全和原文检查，增强语义请阅读确认",
      ],
    });
  }
  const db = await database,
    tx = db.transaction(["articles", "results", "assets", "meta"], "readwrite");
  if (((await tx.objectStore("meta").get("epoch")) || 0) !== generation) {
    await tx.done;
    throw new Error("导入期间本地数据已清除，操作停止");
  }
  for (const value of articles)
    await tx.objectStore("articles").put(value, value.id);
  for (const value of assets)
    await tx.objectStore("assets").put(value, value.id);
  for (const value of results)
    await tx.objectStore("results").put(value, value.resultId);
  // Only known, bounded preferences; never restore consent, wallet, flow, tasks or script state.
  // Consent and the external-image switch are this browser's choices and are kept as they are.
  if (data.preferences && data.scope !== "article") {
    const p = data.preferences;
    const current = {
      ...DEFAULT_PREFERENCES,
      ...((await tx.objectStore("meta").get("preferences")) as
        Partial<typeof DEFAULT_PREFERENCES> | undefined),
    };
    await tx.objectStore("meta").put(
      {
        ...DEFAULT_PREFERENCES,
        consent: current.consent === true,
        showImages: current.showImages === true,
        theme:
          typeof p.theme === "string" && /^[a-z0-9-]+$/.test(p.theme)
            ? p.theme
            : DEFAULT_PREFERENCES.theme,
        mode: p.mode === "auto" ? "auto" : "format_only",
        authorMode: ["preserve", "custom", "none"].includes(p.authorMode)
          ? p.authorMode
          : "preserve",
        name: typeof p.name === "string" ? p.name.slice(0, 60) : "",
        bio: typeof p.bio === "string" ? p.bio.slice(0, 200) : "",
        note: typeof p.note === "string" ? p.note.slice(0, 500) : "",
      },
      "preferences",
    );
  }
  await tx.done;
  changed();
  return { articles: articles.length, results: results.length };
}
