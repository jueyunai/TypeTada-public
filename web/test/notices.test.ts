import { describe, expect, it } from "vitest";
import * as store from "../src/db";
import {
  checkGeneratedResult,
  checkResult,
  inert,
  sourceManifest,
} from "../src/content";
import {
  fillAuthorPlaceholders,
  removePlaceholderParagraphs,
  saveLocalEdit,
} from "../src/fixes";
import {
  describeResult,
  describeWarnings,
  formatTokens,
  friendlyJobMessage,
  friendlyLocation,
  targetPath,
  withDecorations,
} from "../src/notices";
import type { LayoutResult } from "../src/types";

const leaf = (s: string) => `<span leaf="">${s}</span>`;
const body = (s: string) =>
  `<p style="margin-bottom:16px;font-size:14px;line-height:1.9">${leaf(s)}</p>`;
const root = (inner: string) =>
  `<section style="text-align:left">${inner}</section>`;
// The moyu-green chapter-title component: number + PART + bold 17px title.
const chapter = (no: string, title: string) =>
  `<section style="margin-top:48px;padding:0 20px"><section style="display:flex;align-items:center;gap:16px">` +
  `<section><p style="margin:0;font-size:28px;font-weight:900">${leaf(no)}</p><p style="margin:0;font-size:8px">${leaf("PART")}</p></section>` +
  `<section><p style="margin:0;font-size:17px;font-weight:900">${leaf(title)}</p><p style="margin:0;font-size:11px">${leaf("ENGLISH")}</p></section>` +
  `</section></section>`;
const SOURCE =
  "开头一段。\n\n---\n\n## 同样一杯咖啡\n\n正文一。\n\n---\n\n## 有些步骤\n\n正文二。";
const signature = (text: string) =>
  `<section style="margin-top:32px;background:#f0fdf4;padding:16px">${body(text)}</section>`;

function asResult(markdown: string, html: string): LayoutResult {
  const { blocks, images } = sourceManifest(markdown);
  const checked = checkGeneratedResult(html, blocks, images);
  return {
    ...checked,
    resultId: "r1",
    articleId: "a1",
    createdAt: 1,
    title: "t",
    sourceMarkdown: markdown,
    sourceRevision: 1,
    themeId: "moyu-green",
    skillId: "gzh-design",
    skillRevision: "local",
    skillContentHash: "h",
    model: "m",
    htmlSha256: "x",
    imageStatus: "none",
    usage: { inputTokens: 68286, outputTokens: 31857 },
    decisions: [],
  };
}

describe("theme-aware checks", () => {
  it("treats a chapter card that replaces divider + heading as handled by the theme", () => {
    const { blocks, images } = sourceManifest(SOURCE);
    const html = root(
      body("开头一段。") +
        chapter("01", "同样一杯咖啡") +
        body("正文一。") +
        chapter("02", "有些步骤") +
        body("正文二。"),
    );
    const result = checkGeneratedResult(html, blocks, images);
    expect(result.validation.ready).toBe(true);
    const groups = describeWarnings(result.validation.warnings, blocks);
    expect(groups.action).toEqual([]);
    expect(groups.review).toEqual([]);
    expect(groups.auto).toHaveLength(1);
    expect(groups.auto[0].title).toBe(
      "主题把 2 个小标题做成了章节样式，2 处分隔线也换成了章节间距",
    );
  });

  it("still flags headings that look like body text, described by their words", () => {
    const { blocks, images } = sourceManifest(SOURCE);
    const html = root(
      body("开头一段。") +
        body("同样一杯咖啡") +
        body("正文一。") +
        "<hr>" +
        body("有些步骤") +
        body("正文二。"),
    );
    const result = checkGeneratedResult(html, blocks, images);
    expect(result.validation.ready).toBe(true);
    const groups = describeWarnings(result.validation.warnings, blocks);
    expect(groups.auto).toEqual([]);
    const titles = groups.review.map((n) => n.title);
    expect(titles).toContain("2 个小标题看起来和正文一样");
    expect(titles).toContain("1 处分隔线没有出现在成稿里");
    const heading = groups.review.find((n) => n.key === "heading_plain")!;
    expect(heading.detail).toContain("小标题「同样一杯咖啡」");
    expect(heading.detail).not.toMatch(/s\d{3}/);
    const divider = groups.review.find((n) => n.key === "divider_missing")!;
    expect(divider.detail).toContain("「同样一杯咖啡」前的分隔线");
  });

  it("only reports placeholders the AI added, not those written by the author", () => {
    const own = "模板语法写作 {{name}} 即可。";
    const { blocks, images } = sourceManifest(own);
    const kept = checkGeneratedResult(root(body(own)), blocks, images);
    expect(kept.validation.warnings.join()).not.toContain("模板占位符");
    const added = checkGeneratedResult(
      root(body(own) + signature("我是 {{作者名}}，{{一句话简介}}。")),
      blocks,
      images,
    );
    const groups = describeWarnings(
      added.validation.warnings,
      blocks,
      added.enhancements,
    );
    expect(groups.action.map((n) => n.key)).toEqual(["placeholder"]);
    expect(groups.action[0].title).toBe("文末署名还没填");
    expect(groups.action[0].quote).toContain("我是 {{作者名}}");
    expect(groups.action[0].actions).toEqual([
      "fill_author",
      "remove_placeholder",
    ]);
  });
});

describe("local placeholder fixes keep the source intact", () => {
  const markdown = "正文一段。";
  const html = root(
    body("正文一段。") +
      signature("我是 {{作者名}}，{{一句话简介，比如：一个爱琢磨 AI 的人}}。"),
  );

  it("fills name and bio, or drops the bio clause when it is empty", () => {
    const result = asResult(markdown, html);
    const filled = fillAuthorPlaceholders(result.sourceHtml!, markdown, {
      name: "李知云",
      bio: "写字的人",
    })!;
    expect(inert(filled).textContent).toContain("我是李知云，写字的人。");
    const short = fillAuthorPlaceholders(result.sourceHtml!, markdown, {
      name: "Lee",
      bio: "",
    })!;
    expect(inert(short).textContent).toContain("我是 Lee。");
    expect(
      fillAuthorPlaceholders(result.sourceHtml!, markdown, {
        name: " ",
        bio: "x",
      }),
    ).toBeNull();
    const { blocks, images } = sourceManifest(markdown);
    const again = checkResult(filled, blocks, images);
    expect(again.validation.ready).toBe(true);
    expect(again.validation.warnings.join()).not.toContain("模板占位符");
  });

  it("removes the placeholder paragraph and its now-empty card", () => {
    const result = asResult(markdown, html);
    const removed = removePlaceholderParagraphs(result.sourceHtml!, markdown)!;
    const dom = inert(removed);
    expect(dom.textContent).not.toContain("{{");
    expect(dom.textContent).toContain("正文一段。");
    expect(dom.querySelector('section[style*="#f0fdf4"]')).toBeNull();
  });

  it("saves the edit as a new checked version and refuses edits that touch the source", async () => {
    await store.clearLocal();
    const article = await store.createArticle("t", markdown);
    const result = { ...asResult(markdown, html), articleId: article.id };
    const filled = fillAuthorPlaceholders(result.sourceHtml!, markdown, {
      name: "李知云",
      bio: "",
    })!;
    const next = await saveLocalEdit(
      result,
      filled,
      "在本机填入了署名，没有调用模型。",
    );
    expect(next.resultId).not.toBe(result.resultId);
    expect(next.htmlFragment).toContain("我是李知云。");
    expect(next.validation.ready).toBe(true);
    expect((await store.listVersions(article.id)).map((v) => v.id)).toContain(
      next.resultId,
    );
    const broken = result.sourceHtml!.replace("正文一段。", "正文改了。");
    await expect(saveLocalEdit(result, broken, "x")).rejects.toThrow(
      "会影响原文",
    );
  });
});

describe("plain-language wording", () => {
  const { blocks } = sourceManifest(
    "开头一段。\n\n几家平台轮流撒券，今天这边满减。\n\n## 同样一杯咖啡",
  );

  it("rewrites blocking checker messages without internal ids", () => {
    const message = friendlyJobMessage(
      "排版检查未通过：原文s002文字变化；成稿链接必须来自原稿；不支持的标签：iframe",
      blocks,
    );
    expect(message).toBe(
      "这版排版没通过原文核对，已拦下，不会交给你复制：「几家平台轮流撒券，今天这边满…」这段被改了字；AI 加了原稿里没有的链接；这版排版用了公众号不支持的格式。",
    );
    expect(friendlyJobMessage("钱包已断开", blocks)).toBe("钱包已断开");
  });

  it("describes locations and token counts for people", () => {
    expect(friendlyLocation("正文前", blocks)).toBe("文章开头");
    expect(friendlyLocation("正文后", blocks)).toBe("文章结尾");
    expect(friendlyLocation("s003 后", blocks)).toBe(
      "小标题「同样一杯咖啡」之后",
    );
    expect(formatTokens(68286)).toBe("6.8 万");
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(null)).toBe("未知");
  });

  it("classifies every warning the checker can emit", () => {
    const known = [
      "原文s001未保留标题结构，请核对标题样式。",
      "原文s001的分隔线未能确认，请核对排版。",
      "原文s001的标题已改为主题章节样式。",
      "原文s001的分隔线已由主题章节间距代替。",
      "成稿包含模板占位符，复制前请核对或删除",
      "部分原文待核对：原文s001仅在封面或引用区域匹配到，请确认正文是否完整",
      "文章外层需显式text-align:left",
      "承载文字的渐变背景有微信深色模式风险，请改纯色",
      "文字未被span leaf包裹",
      "全文缺少span leaf",
      "正文有疑似半角标点或英文直引号，请修复；代码和专名需逐项确认",
      "width:100% 与左右 margin 共存易触发微信公众号 #1.4 width 水平溢出，请移除 width:100% 或改用外层 padding",
      "width:90% 搭配 padding/border 时缺少 box-sizing:border-box，易在微信端溢出",
      "含文字容器使用固定像素 width:300px，易触发微信公众号 #1.4 width 溢出，请改用 width:auto;min-width 自适应",
    ];
    for (const message of known) {
      const groups = describeWarnings([message], blocks);
      const all = [...groups.action, ...groups.review, ...groups.auto];
      expect(all).toHaveLength(1);
      expect(all[0].key, message).not.toBe("other");
      expect(all[0].title + (all[0].detail || "")).not.toMatch(
        /s\d{3}|span leaf|text-align|#1\.4/,
      );
    }
  });

  it("re-checks history saved with the old heading and divider warnings", () => {
    const html = root(
      body("开头一段。") +
        chapter("01", "同样一杯咖啡") +
        body("正文一。") +
        chapter("02", "有些步骤") +
        body("正文二。"),
    );
    const result = asResult(SOURCE, html);
    result.validation = {
      ...result.validation,
      warnings: [
        "原文s002的分隔线未能确认，请核对排版。",
        "原文s003未保留标题结构，请核对标题样式。",
      ],
    };
    const { notices } = describeResult(result);
    expect(notices.review).toEqual([]);
    expect(notices.auto.map((n) => n.key)).toEqual(["chapter", "decorations"]);
    const decorations = notices.auto[1];
    expect(decorations.title).toMatch(/^主题加了 \d+ 处装饰文字$/);
    expect(decorations.items?.map((item) => item.text).join()).toContain(
      "PART",
    );
  });

  it("points each notice at the element to highlight in the preview", () => {
    const html = root(
      body("开头一段。") +
        chapter("01", "同样一杯咖啡") +
        body("正文一。") +
        "<hr>" +
        body("有些步骤") +
        body("正文二。") +
        signature("我是 {{作者名}}。"),
    );
    const result = asResult(SOURCE, html);
    const { notices, locations } = describeResult(result);
    const dom = inert(result.htmlFragment);
    const at = (path: number[] | null) => {
      let el: Element | null | undefined = dom.children[path?.[0] ?? -1];
      for (const i of path?.slice(1) ?? []) el = el?.children[i];
      return el?.textContent ?? null;
    };
    const placeholder = notices.action.find((n) => n.key === "placeholder")!;
    expect(at(targetPath(placeholder.target, locations))).toContain(
      "{{作者名}}",
    );
    const plain = notices.review.find((n) => n.key === "heading_plain")!;
    expect(at(targetPath(plain.target, locations))).toBe("有些步骤");
    const chapterNotice = notices.auto.find((n) => n.key === "chapter")!;
    expect(at(targetPath(chapterNotice.target, locations))).toContain(
      "同样一杯咖啡",
    );
    expect(targetPath(undefined, locations)).toBeNull();
  });

  it("summarizes Skill decoration instead of asking to confirm each item", () => {
    const groups = withDecorations({ action: [], review: [], auto: [] }, [
      { type: "added", text: "01", location: "s001 后" },
      { type: "cover", text: "THOUGHTS · AI 助理观察" },
      { type: "added", text: "WHO PAYS THE BILL" },
      { type: "placeholder", text: "我是 {{作者名}}。" },
    ]);
    expect(groups.action).toEqual([]);
    expect(groups.auto).toHaveLength(1);
    const [notice] = groups.auto;
    expect(notice.title).toBe("主题加了 3 处装饰文字");
    expect(notice.items?.map((i) => i.index)).toEqual([0, 1, 2]);
    // Readable examples first; bare chapter numbers are not used as examples.
    expect(notice.detail).toContain("「THOUGHTS · A…」「WHO PAYS THE…」");
    expect(
      withDecorations({ action: [], review: [], auto: [] }, []).auto,
    ).toEqual([]);
  });

  it("names generic template text without offering a signature", () => {
    const { blocks } = sourceManifest("正文。");
    const groups = describeWarnings(
      ["成稿包含模板占位符，复制前请核对或删除"],
      blocks,
      [{ type: "placeholder", text: "{{这里写一句金句}}" }],
    );
    expect(groups.action[0]).toMatchObject({
      title: "有一段模板文字还没填",
      quote: "{{这里写一句金句}}",
      actions: ["remove_placeholder"],
    });
  });
});
