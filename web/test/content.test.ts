import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  sourceManifest,
  checkGeneratedResult,
  checkResult,
  sanitize,
  formatChecks,
  inert,
} from "../src/content";
const body = (text: string, style = "") =>
  `<section style="text-align:left"><section data-source="s001" style="${style}"><p><span leaf="">${text}</span></p></section><section data-enhancement="quote" data-refs="s001"><p><span leaf="">好内容值得好模样。</span></p></section><section data-enhancement="cta"><p><span leaf="">欢迎点赞、在看、转发。</span></p></section></section>`;
const masthead = '<section><span style="border-radius:10px 1px 10px 1px;"><span leaf=""><br></span></span><span><span leaf="">周末笔记</span></span><span><span leaf="">学习 AI</span></span></section>';
const mastheadResult =
  `<section style="text-align:left">${masthead}<section data-enhancement="cover" data-refs="s001"><span leaf="">封面</span></section><p data-source="s001"><span leaf="">正文内容。</span></p><p data-source="s002"><span leaf="">#周末笔记 #学习 AI</span></p></section>`;

describe("browser content contract", () => {
  it("preserves masthead and cover additions in review list while matching all source paragraphs", () => {
    const { blocks, images } = sourceManifest("正文内容。\n\n#周末笔记 #学习 AI");
    const checked = checkGeneratedResult(mastheadResult, blocks, images);
    expect(checked.validation.ready).toBe(true);
    expect(checked.validation.errors).toEqual([]);
    expect(checked.validation.warnings).toEqual([]);
    expect(checked.plainText).toContain("周末笔记");
    expect(checked.plainText).toContain("#周末笔记 #学习 AI");
    expect(checked.enhancements.map(({ type }) => type)).toEqual(["added", "cover"]);
    expect(checked.enhancements[0]).toMatchObject({
      text: "周末笔记学习 AI",
      location: "正文前",
    });
  });
  it.each([
    ["unmatched caption", mastheadResult.replace("周末笔记", "原创栏目")],
    ["later body section", mastheadResult.replace(masthead, "").replace('<p data-source="s002">', masthead + '<p data-source="s002">')],
    ["extra unowned masthead prose", mastheadResult.replace(masthead, masthead.replace("</section>", "增补内容</section>"))],
  ])("allows decorative masthead variations for %s and fixes missing leaf spans losslessly", (_, html) => {
    const { blocks, images } = sourceManifest("正文内容。\n\n#周末笔记 #学习 AI");
    const checked = checkGeneratedResult(html, blocks, images);
    expect(checked.validation.ready).toBe(true);
    expect(checked.validation.warnings).toEqual([]);
    expect(checked.htmlFragment).not.toContain("data-source");
  });
  it("rejects trailing source topic mutation even when decorative masthead matches", () => {
    const { blocks, images } = sourceManifest("正文内容。\n\n#周末笔记 #学习 AI");
    const checked = checkGeneratedResult(
      mastheadResult.replace("#学习 AI", "#学习效率"),
      blocks,
      images,
    );
    expect(checked.validation.ready).toBe(false);
    expect(checked.validation.errors).toContain("原文s002文字变化");
  });
  it("rejects tampered source text and unsafe attributes", () => {
    const { blocks, images } = sourceManifest("正文内容。\n\n#周末笔记 #学习 AI");
    const html = mastheadResult
      .replace("正文内容。", "正文更新。")
      .replace('<span leaf="">周末笔记', '<span leaf="" onclick="unsafe()">周末笔记');
    const checked = checkGeneratedResult(html, blocks, images);
    expect(checked.validation.ready).toBe(false);
    expect(checked.validation.errors).toEqual(
      expect.arrayContaining(["原文s001文字变化", "不允许的属性：onclick"]),
    );
  });
  it("retains approved enhancements while checking every source block", () => {
    const { blocks, images } = sourceManifest("价格为19.9元。");
    const result = checkResult(body("价格为19.9元。"), blocks, images);
    expect(result.validation.ready).toBe(true);
    expect(result.htmlFragment).toContain("欢迎点赞");
    expect(result.enhancements).toHaveLength(2);
    expect(result.htmlFragment).not.toContain("data-source");
    expect(
      checkResult(body("价格为199元。"), blocks, images).validation.ready,
    ).toBe(false);
  });
  it.each([
    '<img src="https://bad/image.png" onerror="alert(1)">',
    "<script>alert(1)</script>",
    '<svg onload="alert(1)"></svg>',
    '<a href="javascript:alert(1)"><span leaf="">测试</span></a>',
    '<section style="background:u\\72l(https://evil)"></section>',
  ])("blocks active content %s", (html) => {
    const { blocks, images } = sourceManifest("原文。");
    expect(
      checkResult(
        body("原文。").replace(
          "</section></section>",
          html + "</section></section>",
        ),
        blocks,
        images,
      ).validation.ready,
    ).toBe(false);
  });
  it.each([
    "display:none",
    "height:1px;overflow:hidden",
    "font-size:0",
    "opacity:0",
    "position:fixed",
    "color:transparent",
  ])("blocks hidden or positioned content %s", (style) => {
    const { blocks } = sourceManifest("原文。");
    expect(
      checkResult(body("原文。", style), blocks, []).validation.ready,
    ).toBe(false);
  });
  it("preserves heading, tables, code and original URLs", () => {
    const { blocks } = sourceManifest(
      "# 必须保留\n\n| 名称 | 价格 |\n|---|---|\n| A | 19.9元 |",
    );
    expect(blocks[0].text).toContain("必须保留");
    expect(blocks[1].tableRows).toEqual([
      ["名称", "价格"],
      ["A", "19.9元"],
    ]);
    expect(() => sourceManifest("- item\n  - child")).toThrow("嵌套");
    const code = sourceManifest(
      '```js\nif (x < 2) {\n\treturn "原码";\n}\n```',
    );
    expect(
      checkResult(body("ignored"), code.blocks, []).htmlFragment,
    ).toContain("&lt;");
  });
  it("keeps source image URLs and local IDs; rejects invented URLs", () => {
    const url = "https://example.com/photo.png?x=1&y=2";
    const { blocks, images } = sourceManifest(`![](${url})`);
    const output = body(
      `<img src="${url.replace("&", "&amp;")}" style="max-width:100%;height:auto">`,
    );
    expect(checkResult(output, blocks, images).validation.ready).toBe(true);
    expect(
      checkResult(output.replace("example.com", "evil.com"), blocks, images)
        .validation.ready,
    ).toBe(false);
    const local = sourceManifest("![](typetada-image:image_abc)");
    expect(local.images).toEqual(["typetada-image:image_abc"]);
  });
  it("matches current upstream leaf/align/gradient checks and keeps empty decoration", () => {
    const clean = sanitize(
      '<section style="text-align:left"><section style="height:1px;overflow:hidden;background:linear-gradient(red,blue)"><span leaf="">&#8203;</span></section><p><span leaf="">正文。</span></p></section>',
      [],
    );
    expect(clean.errors).toEqual([]);
    expect(formatChecks(clean.dom).warnings).toEqual([]);
    // 零宽字符之后混入可见文字的裁剪依然拦截
    expect(
      sanitize(
        '<section style="text-align:left"><section style="height:1px;overflow:hidden"><span leaf="">&#8203;隐藏文字</span></section></section>',
        [],
      ).errors.length,
    ).toBeGreaterThan(0);
    expect(
      formatChecks(inert("<section><p>正文。</p></section>")).warnings.length,
    ).toBeGreaterThan(0);
    expect(
      formatChecks(
        inert(
          '<section style="text-align:left;background:linear-gradient(red,blue)"><span leaf="">正文。</span></section>',
        ),
      ).warnings.join(),
    ).toContain("渐变");
  });
  it("keeps safe static SVG icons while rejecting active or external SVG tricks", () => {
    const { blocks, images } = sourceManifest("结尾段。");
    const svg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M1 12s4-8 11-8"></path><polyline points="16 2 20 6 16 10"></polyline><polygon points="12 2 15 8 9 8"></polygon></svg>';
    const ok = checkResult(
      `<section style="text-align:left"><p data-source="s001"><span leaf="">结尾段。</span></p><section data-enhancement="author">${svg}<span leaf="">点赞</span></section></section>`,
      blocks,
      images,
    );
    expect(ok.validation.ready).toBe(true);
    expect(ok.htmlFragment).toContain("<svg");
    expect(ok.htmlFragment).toContain('viewBox="0 0 24 24"');
    expect(ok.htmlFragment).toContain("<polygon");
    for (const bad of [
      '<svg><foreignObject><p>x</p></foreignObject></svg>',
      '<svg><use href="https://evil.example/icon.svg#a"></use></svg>',
      '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M0 0" fill="url(https://evil.example/p)"></path></svg>',
    ]) {
      expect(
        sanitize(`<section style="text-align:left">${bad}</section>`, []).errors
          .length,
      ).toBeGreaterThan(0);
    }
  });
  it("supports h4, chapter-level grouping and composite header additions while blocking invented links", () => {
    const { blocks, images } = sourceManifest("## 第一章\n\n#### 步骤一\n\n正文内容。");
    const html = `<section style="text-align:left"><section style="padding:0 20px"><section data-source="s001"><span data-enhancement="label"><span leaf="">01 PART · CHAPTER</span></span><h3><span leaf="">第一章</span></h3></section><h4 data-source="s002"><span leaf="">步骤一</span></h4><p data-source="s003"><span leaf="">正文内容。</span></p></section></section>`;
    const ok = checkResult(html, blocks, images);
    expect(ok.validation.ready).toBe(true);
    expect(ok.enhancements.some((e) => e.type === "label")).toBe(true);
    // 禁止借装饰标签在原文中注入原稿外链接
    const badLinkLabel = html.replace(
      '<span leaf="">01 PART · CHAPTER</span>',
      '<a href="https://example.com"><span leaf="">01 PART</span></a>',
    );
    expect(
      checkResult(badLinkLabel, blocks, images).validation.ready,
    ).toBe(false);
    // 无外部链接且原文完整时，允许 Skill 自定义附加增强卡片并收入核对清单
    const withInlineQuote = checkResult(
      `<section style="text-align:left"><section data-source="s001"><span data-enhancement="quote"><span leaf="">夹带</span></span><h3><span leaf="">第一章</span></h3></section><h4 data-source="s002"><span leaf="">步骤一</span></h4><p data-source="s003"><span leaf="">正文内容。</span></p></section>`,
      blocks,
      images,
    );
    expect(withInlineQuote.validation.ready).toBe(true);
    expect(withInlineQuote.enhancements.some((e) => e.text === "夹带")).toBe(true);
  });
  it("enforces WeChat #1.4 width auto box-sizing and emits non-blocking width compatibility warnings", () => {
    const { blocks, images } = sourceManifest("原文内容。");
    const pct = checkResult(
      `<section style="text-align:left"><section data-source="s001" style="width:100%;padding:12px;border:1px solid #ddd"><p><span leaf="">原文内容。</span></p></section></section>`,
      blocks,
      images,
    );
    expect(pct.validation.ready).toBe(true);
    expect(pct.validation.warnings).toEqual([]);
    expect(pct.htmlFragment).toContain("box-sizing:border-box");

    const overflow = checkResult(
      `<section style="text-align:left"><section data-source="s001" style="width:100%;margin:0 20px"><p><span leaf="">原文内容。</span></p></section></section>`,
      blocks,
      images,
    );
    expect(overflow.validation.ready).toBe(true);
    expect(overflow.validation.warnings.join()).toContain("#1.4 width");

    const fixedCard = checkResult(
      `<section style="text-align:left"><section data-source="s001"><p><span leaf="">原文内容。</span></p></section><section data-enhancement="toc" data-refs="s001"><section style="display:inline-block;width:150px;padding:14px"><p><span leaf="">卡片</span></p></section></section></section>`,
      blocks,
      images,
    );
    expect(fixedCard.validation.ready).toBe(true);
    expect(fixedCard.validation.warnings.join()).toContain("width:150px");

    const adaptiveCard = checkResult(
      `<section style="text-align:left"><section data-source="s001"><p><span leaf="">原文内容。</span></p></section><section data-enhancement="toc" data-refs="s001"><section style="display:inline-block;white-space:nowrap;width:auto;min-width:144px;box-sizing:border-box;padding:12px"><p><span leaf="">卡片</span></p></section></section></section>`,
      blocks,
      images,
    );
    expect(adaptiveCard.validation.ready).toBe(true);
    expect(adaptiveCard.validation.warnings).toEqual([]);
  });
  it("bundled demo retains original head/footer and passes browser gate", () => {
    const demo = JSON.parse(readFileSync("public/library/demo.json", "utf8"));
    const clean = sanitize(demo.htmlFragment, []);
    expect(clean.errors).toEqual([]);
    expect(formatChecks(clean.dom).warnings).toEqual([]);
    expect(demo.htmlFragment).toContain("<svg");
    expect(demo.htmlFragment).toContain("THANKS FOR READING");
  });
  it("accepts full moyu-blue layered magazine cover enhancement with layoutMonth", () => {
    const { blocks, images } = sourceManifest("去年每天坐地铁我都反复比价，最后发现把麻烦交给AI才能留住生活。");
    const html = `<section style="text-align:left;max-width:677px;margin:0 auto;background:#ffffff">
      <section data-enhancement="cover" data-refs="s001" style="margin:0 0 32px;background:#fff;border:1.5px solid rgba(37,99,235,0.15);border-radius:20px;overflow:hidden;width:100%;box-sizing:border-box;">
        <section style="padding:32px 28px 28px;">
          <section style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
            <span style="width:6px;height:6px;background:#2563EB;border-radius:50%;"><span leaf="">&#8203;</span></span>
            <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:#2563EB;"><span leaf="">AGENT · 使用手记</span></span>
            <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,rgba(37,99,235,0.12),transparent);"><span leaf="">&#8203;</span></section>
            <span style="font-size:10px;color:#D1D5DB;font-weight:600;"><span leaf="">2026 / 11</span></span>
          </section>
          <section>
            <p style="font-size:24px;font-weight:900;color:#111827;margin:0;line-height:1.05;"><span leaf="">把麻烦</span><span style="color:#2563EB;"><span leaf="">交给AI</span></span></p>
            <p style="font-size:24px;font-weight:900;color:#2563EB;margin:0 0 16px;line-height:1.05;"><span leaf="">把生活的滋味留给自己</span></p>
            <section style="width:48px;height:3px;background:linear-gradient(to right,#2563EB,#60A5FA);border-radius:2px;margin-bottom:12px;"><span leaf="">&#8203;</span></section>
            <p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;"><span leaf="">少些操心 · 办妥琐事 · 留下乐趣</span></p>
          </section>
        </section>
        <section style="background:#2563EB;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
          <p style="font-size:12px;color:#ffffff;margin:0;font-weight:600;"><span leaf="">观猹大会 · Agent闭门讨论</span></p>
          <section style="display:flex;gap:4px;">
            <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;"><span leaf="">省心</span></span>
            <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;"><span leaf="">托付</span></span>
          </section>
        </section>
      </section>
      <p data-source="s001" style="font-size:16px;text-align:justify"><span leaf="">去年每天坐地铁我都反复比价，最后发现把麻烦交给AI才能留住生活。</span></p>
    </section>`;
    const result = checkResult(html, blocks, images);
    expect(result.validation.errors).toEqual([]);
    expect(result.validation.warnings).toEqual([]);
    expect(result.validation.ready).toBe(true);
    expect(result.enhancements[0]?.type).toBe("cover");
  });
});
it('all registered themes have real source images and hash-checked contexts',async()=>{const index=JSON.parse(readFileSync('public/library/index.json','utf8'));expect(index.packages[0].themes).toHaveLength(13);for(const theme of index.packages[0].themes){const path='public'+theme.contextPath;expect(readFileSync(path,'utf8')).toContain('公众号');expect(readFileSync('public/theme-previews/'+theme.id+'-thumb.webp').length).toBeGreaterThan(1000);}});
