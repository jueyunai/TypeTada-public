// Regressions for the second review round: false rejections, legacy code
// boxes, label placement, failure handling, auth cancel, assets and backups.
import { beforeEach, describe, expect, it, vi } from "vitest";

const flags = { failSave: false, failUpdateAfterSave: false };
vi.mock("../src/db", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/db")>();
  return {
    ...real,
    saveResult: vi.fn(async (...args: Parameters<typeof real.saveResult>) => {
      if (flags.failSave) {
        flags.failUpdateAfterSave = true;
        throw new Error("QuotaExceededError");
      }
      return real.saveResult(...args);
    }),
    updateJob: vi.fn(async (...args: Parameters<typeof real.updateJob>) => {
      if (flags.failUpdateAfterSave) throw new Error("QuotaExceededError");
      return real.updateJob(...args);
    }),
  };
});

import * as store from "../src/db";
import {
  checkGeneratedResult,
  checkResult,
  escapeHtml,
  inert,
  inspectFragment,
  sourceManifest,
} from "../src/content";
import {
  generateLayout,
  parseThemeChoice,
  UnsavedResult,
} from "../src/pipeline";
import {
  authorizeUrl,
  disconnectWallet,
  ENDPOINTS,
  finishAuthorization,
} from "../src/wallet";
import { exportBackup, importBackup } from "../src/backup";
import { DEFAULT_PREFERENCES } from "../src/types";

const leaf = (s: string) => `<span leaf="">${s}</span>`;
const p = (s: string, style = "") =>
  `<p${style ? ` style="${style}"` : ""}>${leaf(s)}</p>`;
const root = (inner: string) =>
  `<section style="text-align:left">${inner}</section>`;
const label = (s: string) => `<span data-enhancement="label">${leaf(s)}</span>`;

beforeEach(async () => {
  flags.failSave = false;
  flags.failUpdateAfterSave = false;
  await disconnectWallet();
  await store.clearLocal();
  history.replaceState(null, "", "/");
});

describe("layout checks", () => {
  const imageLink =
    "说明。\n\n[![甲图](https://example.com/a.png)](https://example.com/page)";
  const card = (inner: string) =>
    `<section><img src="https://example.com/a.png" alt="甲图">${inner}</section>`;

  it("accepts a caption inside an image-only link card and lists it as decoration", () => {
    const { blocks, images } = sourceManifest(imageLink);
    const html = root(
      p("说明。") +
        `<a href="https://example.com/page">${card(p("点击查看原文"))}</a>`,
    );
    const result = checkGeneratedResult(html, blocks, images);
    expect(result.validation.errors).toEqual([]);
    expect(result.enhancements).toContainEqual(
      expect.objectContaining({ type: "label", text: "点击查看原文" }),
    );
    expect(
      inert(result.htmlFragment)
        .querySelector("img")
        ?.closest("a")
        ?.getAttribute("href"),
    ).toBe("https://example.com/page");
    // Wrong target and body text pulled into the link are still rejected.
    const wrong = root(
      p("说明。") + `<a href="https://example.com/x">${card(p("点击"))}</a>`,
    );
    expect(checkGeneratedResult(wrong, blocks, images).validation.ready).toBe(
      false,
    );
    const swallowed = sourceManifest(
      "[![甲图](https://example.com/a.png)](https://example.com/page)\n\n下一段正文。",
    );
    const pulled = root(
      `<a href="https://example.com/page">${card("")}${p("下一段正文。")}</a>`,
    );
    expect(
      checkGeneratedResult(pulled, swallowed.blocks, swallowed.images)
        .validation.ready,
    ).toBe(false);
    // A link whose source text is not empty keeps the strict text check.
    const texted = sourceManifest(
      "[![甲图](https://example.com/a.png) 原文说明](https://example.com/page)",
    );
    const changed = root(
      `<a href="https://example.com/page">${card(p("改过的说明"))}</a>`,
    );
    expect(
      checkGeneratedResult(changed, texted.blocks, texted.images).validation
        .ready,
    ).toBe(false);
  });

  it("replaces an old code wrapper instead of nesting a second code box", () => {
    const { blocks, images } = sourceManifest("前文。\n\n```\na b\nc\n```");
    const mono = "font-family:Consolas,monospace";
    const legacy = `<section style="${mono};background:#eee;padding:8px">${p("a&nbsp;b", mono)}${p("c", mono)}</section>`;
    const result = checkGeneratedResult(
      root(p("前文。") + legacy),
      blocks,
      images,
    );
    expect(result.validation.ready).toBe(true);
    expect(result.htmlFragment).not.toContain("#eee");
    expect(result.htmlFragment.match(/background:#f1f5f9/g)).toHaveLength(1);
    expect(checkResult(result.sourceHtml, blocks, images).htmlFragment).toBe(
      result.htmlFragment,
    );
  });

  it("keeps labels on their side of the code and accepts wrapped labels", () => {
    const { blocks, images } = sourceManifest("前文。\n\n```\nx = 1\n```");
    const after = checkGeneratedResult(
      root(
        p("前文。") +
          `<section data-source="s002"><pre>x = 1</pre>${label("图注：示例")}</section>`,
      ),
      blocks,
      images,
    );
    expect(after.validation.ready).toBe(true);
    expect(after.htmlFragment.indexOf("图注：示例")).toBeGreaterThan(
      after.htmlFragment.indexOf("x = 1"),
    );

    const wrapped = checkGeneratedResult(
      root(
        p("前文。") +
          `<section data-source="s002"><section>${label("代码")}</section><pre>x = 1</pre></section>`,
      ),
      blocks,
      images,
    );
    expect(wrapped.validation.ready).toBe(true);
    expect(wrapped.htmlFragment.indexOf("代码")).toBeLessThan(
      wrapped.htmlFragment.indexOf("x = 1"),
    );
    expect(wrapped.enhancements).toContainEqual(
      expect.objectContaining({ type: "label", text: "代码" }),
    );
    expect(checkResult(wrapped.sourceHtml, blocks, images).htmlFragment).toBe(
      wrapped.htmlFragment,
    );
  });

  it("reports where source blocks and added items sit in the final fragment", () => {
    const md = "## 同样一杯咖啡\n\n正文一。\n\n```\nx = 1\n```";
    const { blocks, images } = sourceManifest(md);
    const html = root(
      `<section style="background:#ecfdf5">${p("导语卡片")}</section>` +
        `<section><p style="font-size:17px;font-weight:900">${leaf("同样一杯咖啡")}</p></section>` +
        p("正文一。") +
        `<section data-source="s003"><pre>x = 1</pre></section>`,
    );
    const checked = checkGeneratedResult(html, blocks, images);
    const { locations, enhancements } = inspectFragment(
      checked.sourceHtml,
      blocks,
      images,
    );
    const dom = inert(checked.htmlFragment);
    const at = (path: number[] | null | undefined) => {
      let el: Element | null | undefined = dom.children[path?.[0] ?? -1];
      for (const i of path?.slice(1) ?? []) el = el?.children[i];
      return el;
    };
    expect(at(locations.blocks.s001)?.textContent).toBe("同样一杯咖啡");
    expect(at(locations.blocks.s002)?.textContent).toBe("正文一。");
    expect(at(locations.blocks.s003)?.textContent).toContain("x = 1");
    expect(enhancements[0].text).toBe("导语卡片");
    expect(at(locations.enhancements[0])?.textContent).toContain("导语卡片");
  });
});

describe("generation failures", () => {
  async function connect() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: any) => {
        if (String(url) === ENDPOINTS.exchange)
          return new Response(JSON.stringify({ key: "test-personal-key" }));
        if (String(url) === ENDPOINTS.chat) {
          const sources = JSON.parse(
            JSON.parse(init.body).messages[1].content,
          ).sources;
          const html = root(
            sources.map((s: any) => p(escapeHtml(s.text))).join(""),
          );
          return new Response(
            JSON.stringify({
              choices: [{ finish_reason: "stop", message: { content: html } }],
              usage: { prompt_tokens: 1, completion_tokens: 1 },
            }),
          );
        }
        if (String(url).startsWith("/library/")) {
          const { readFileSync } = await import("node:fs");
          return new Response(readFileSync("public" + url, "utf8"));
        }
        throw new Error("Unexpected network URL " + url);
      }),
    );
    const auth = await authorizeUrl(false);
    const back = new URL(new URL(auth).searchParams.get("callback_url")!);
    back.searchParams.set("code", "test-code");
    history.replaceState(null, "", back);
    await finishAuthorization();
  }

  it("hands back the paid result even when recording the failure also fails", async () => {
    await connect();
    const article = await store.createArticle("付费结果", "正文第一段。");
    flags.failSave = true;
    const statuses: string[] = [];
    const error = await generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      (job) => statuses.push(job.status),
    ).catch((e) => e);
    expect(error).toBeInstanceOf(UnsavedResult);
    expect((error as UnsavedResult).result.htmlFragment).toContain(
      "正文第一段。",
    );
    expect(statuses.at(-1)).toBe("failed");
  });

  it("reads theme choices wrapped in prose and rejects non-object JSON", () => {
    expect(parseThemeChoice('{"themeId":"red-white","reason":"简洁"}')).toEqual(
      {
        themeId: "red-white",
        reason: "简洁",
      },
    );
    expect(
      parseThemeChoice(
        '好的，选择如下：\n{"themeId":"moyu-green"}\n希望合适。',
      ),
    ).toEqual({
      themeId: "moyu-green",
      reason: "",
    });
    expect(
      parseThemeChoice('```json\n{"themeId":"olive-journal","reason":1}\n```')
        ?.themeId,
    ).toBe("olive-journal");
    for (const bad of [
      "null",
      "[]",
      '"red-white"',
      '{"theme":"x"}',
      "无法判断",
    ])
      expect(parseThemeChoice(bad)).toBeNull();
  });
});

describe("wallet, assets and backups", () => {
  it("explains a cancelled authorization and clears the pending flow", async () => {
    const auth = await authorizeUrl(false);
    const back = new URL(new URL(auth).searchParams.get("callback_url")!);
    history.replaceState(null, "", back);
    await expect(finishAuthorization()).rejects.toThrow("钱包授权已取消");
    expect(await store.getMeta("authFlow")).toBeUndefined();
    expect(location.search).toBe("");
  });

  it("keeps an image that only an unsaved recovery draft still uses", async () => {
    const asset = {
      id: "image_recovery",
      url: "data:image/png;base64,iVBORw0KGgo=",
      mime: "image/png",
      name: "a.png",
      createdAt: 1,
    };
    await store.putAsset(asset, await store.epoch());
    const article = await store.createArticle("草稿", "正文。");
    await store.saveRecovery({
      ...article,
      sourceMarkdown: "正文。\n\n![](typetada-image:image_recovery)",
    });
    await expect(store.deleteAsset(asset.id)).rejects.toThrow("仍被");
    await store.removeRecovery(article.id);
    await store.deleteAsset(asset.id);
    expect(await store.listAssets()).toEqual([]);
  });

  it("restores settings from a full backup but keeps this browser's consent and image switch", async () => {
    const article = await store.createArticle("备份", "正文。");
    await store.putMeta("preferences", {
      ...DEFAULT_PREFERENCES,
      theme: "red-white",
      name: "旧署名",
      consent: false,
      showImages: false,
    });
    const full = await exportBackup();
    const single = await exportBackup(article.id);
    expect(JSON.parse(single).scope).toBe("article");

    const mine = {
      ...DEFAULT_PREFERENCES,
      theme: "olive-journal",
      consent: true,
      showImages: true,
    };
    await store.putMeta("preferences", mine);
    await importBackup(new File([single], "single.json"));
    expect(await store.getPreferences()).toEqual(mine);

    await importBackup(new File([full], "full.json"));
    const restored = await store.getPreferences();
    expect(restored).toMatchObject({
      theme: "red-white",
      name: "旧署名",
      consent: true,
      showImages: true,
    });
  });
});
