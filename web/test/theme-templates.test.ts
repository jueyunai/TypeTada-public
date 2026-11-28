import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkGeneratedResult,
  checkResult,
  formatChecks,
  sanitize,
  sourceManifest,
  widthChecks,
} from "../src/content";

describe("theme templates and sanitizer compatibility", () => {
  it("passes sanitize with 0 errors across all 13 prepared theme sample specimens and theme reference snippets", () => {
    const libDir = path.resolve(import.meta.dirname, "../public/library");
    const samples = fs
      .readdirSync(libDir)
      .filter((name) => name.endsWith("-sample.html"))
      .sort();
    expect(samples).toHaveLength(13);

    for (const name of samples) {
      const html = fs.readFileSync(path.join(libDir, name), "utf8");
      const rawBody = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
      // Showcase specimen pages stack component cards with `id="block-..."`; strip showcase wrappers while keeping article specimens unmodified.
      const isShowcase = /<section id="block-/i.test(rawBody);
      const fragment = isShowcase
        ? `<section style="text-align:left">${rawBody.replace(/\sid="block-[^"]+"/g, "")}</section>`
        : rawBody;
      const sanitized = sanitize(fragment, []);
      expect(sanitized.errors, name).toEqual([]);
      const fmt = formatChecks(sanitized.dom);
      const widths = widthChecks(sanitized.dom);
      expect(Array.isArray(fmt.warnings), name).toBe(true);
      expect(Array.isArray(widths), name).toBe(true);
    }

    const refsDir = path.resolve(import.meta.dirname, "../../skills/gzh-design/references");
    const refFiles = [
      "common-components.md",
      ...fs
        .readdirSync(refsDir)
        .filter((f) => f.startsWith("theme-") && f.endsWith(".md"))
        .sort(),
    ];
    for (const file of refFiles) {
      const md = fs.readFileSync(path.join(refsDir, file), "utf8");
      const blocks = [...md.matchAll(/```html\r?\n([\s\S]*?)```/g)].map(
        (m) => m[1],
      );
      for (const snippet of blocks) {
        // olive-journal component 23 uses SVG <text>/<tspan>, intentionally blocked for text fidelity/security.
        if (file === "theme-olive-journal.md" && /<text\b|<tspan\b/i.test(snippet))
          continue;
        const normalizedImg = snippet.replace(
          /src="([^"]+)"/g,
          'src="typetada-image:mock"',
        );
        const wrapped = `<section style="text-align:left">${normalizedImg}</section>`;
        expect(sanitize(wrapped, ["typetada-image:mock"]).errors, file).toEqual(
          [],
        );
      }
    }
  });

  it("extracts HTML fenced inside surrounding prose without silently dropping bare loose text", () => {
    const { blocks, images } = sourceManifest("正文第一段。");
    const wrapped = [
      "这是为您生成的公众号 HTML 代码：",
      "```html",
      `<section style="text-align:left"><p><span leaf="">正文第一段。</span></p></section>`,
      "```",
      "### 设计说明",
      "",
      "以上版式已保留原文。",
    ].join("\n");

    const ok = checkGeneratedResult(wrapped, blocks, images);
    expect(ok.validation.ready).toBe(true);
    expect(ok.validation.errors).toEqual([]);
    expect(ok.validation.warnings).toEqual([]);
    expect(ok.normalizations).toContain("提取回复中的 HTML 代码块");

    const loose = `说明文字<section style="text-align:left"><p><span leaf="">正文第一段。</span></p></section>`;
    const bad = checkGeneratedResult(loose, blocks, images);
    expect(bad.validation.ready).toBe(false);
    expect(bad.validation.errors).toContain("正文必须只有一个section根节点");
  });

  it("accepts short caption prefixes after images and GIF badges while blocking non-caption prefixes or tampered captions", () => {
    const { blocks, images } = sourceManifest(
      [
        "![截图](typetada-image:img_1)",
        "",
        "文有样逐字差异核对面板",
        "",
        "![演示](typetada-image:gif_1)",
        "",
        "创建 skill 的录屏演示",
        "",
        "普通正文段落。",
      ].join("\n"),
    );

    const validHtml = `<section style="text-align:left">
      <section><span leaf=""><img src="typetada-image:img_1" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span></section>
      <p style="font-size:12px;color:#9CA3AF;text-align:center;"><span leaf="">— 文有样逐字差异核对面板</span></p>
      <section><span leaf=""><img src="typetada-image:gif_1" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span></section>
      <p style="text-align:center;"><span style="background:#FFEDD5;color:#9A3412;padding:1px 8px;margin-right:6px;"><span leaf="">GIF 动图</span></span><span style="color:#9CA3AF;"><span leaf="">创建 skill 的录屏演示</span></span></p>
      <p><span leaf="">普通正文段落。</span></p>
    </section>`;
    const ok = checkResult(validHtml, blocks, images);
    expect(ok.validation.ready).toBe(true);
    expect(ok.validation.errors).toEqual([]);
    expect(ok.enhancements.some((e) => e.text === "—")).toBe(true);
    expect(ok.enhancements.some((e) => e.text === "GIF 动图")).toBe(true);

    const tamperedCaption = validHtml.replace(
      "— 文有样逐字差异核对面板",
      "— 文有样差异对比面板",
    );
    expect(checkResult(tamperedCaption, blocks, images).validation.ready).toBe(
      false,
    );

    const prefixedBody = validHtml.replace("普通正文段落。", "— 普通正文段落。");
    expect(checkResult(prefixedBody, blocks, images).validation.ready).toBe(
      false,
    );
  });

  it("supports full-width space indentation from 6 magazine dark/light code templates while rejecting unindented lines", () => {
    const { blocks, images } = sourceManifest(
      '代码说明。\n\n```python\ndef make_skill(name):\n    return f"已生成 {name}"\n```',
    );
    const fullWidthIndentHtml = `<section style="text-align:left">
      <p><span leaf="">代码说明。</span></p>
      <section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#1E293B;">
        <section style="display:flex;align-items:center;padding:9px 14px;background:#0F172A;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF5F56;margin-right:7px;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
        </section>
        <section style="padding:11px 14px;">
          <p style="margin:0;font-family:Consolas,monospace;font-size:13px;"><span leaf="">def make_skill(name):</span></p>
          <p style="margin:0;font-family:Consolas,monospace;font-size:13px;"><span leaf="">\u3000\u3000return f"已生成 {name}"</span></p>
        </section>
      </section>
    </section>`;
    expect(checkResult(fullWidthIndentHtml, blocks, images).validation.ready).toBe(
      true,
    );

    const unindentedHtml = fullWidthIndentHtml.replace("\u3000\u3000return", "return");
    expect(checkResult(unindentedHtml, blocks, images).validation.ready).toBe(
      false,
    );
  });

  it("silently strips standalone <mp-style-type> display:none wrapper while still blocking real hidden content", () => {
    const { blocks, images } = sourceManifest("正文内容。");
    const withMpMarker = `<section style="text-align:left"><p><span leaf="">正文内容。</span></p></section><p style="display:none;"><mp-style-type data-value="3"></mp-style-type></p>`;
    const ok = checkResult(withMpMarker, blocks, images);
    expect(ok.validation.ready).toBe(true);
    expect(ok.validation.errors).toEqual([]);
    expect(ok.htmlFragment).not.toContain("mp-style-type");

    const hiddenText = `<section style="text-align:left"><p><span leaf="">正文内容。</span></p><p style="display:none;"><span leaf="">隐藏正文</span></p></section>`;
    const blocked = checkResult(hiddenText, blocks, images);
    expect(blocked.validation.ready).toBe(false);
    expect(blocked.validation.errors).toContain("不允许隐藏或网格正文");
  });

  it("allows symmetrical corner brackets around quoted source blocks while rejecting tampered text inside quotes", () => {
    const { blocks, images } = sourceManifest("核心观点只有一个。");
    const quotedHtml = `<section style="text-align:left"><section style="background:#FEF2F2;border-left:4px solid #DC2626;padding:18px 22px;"><p><span leaf="">「核心观点只有一个。」</span></p></section></section>`;
    const ok = checkResult(quotedHtml, blocks, images);
    expect(ok.validation.ready).toBe(true);
    expect(ok.enhancements.some((e) => e.text === "「」")).toBe(true);

    const tampered = quotedHtml.replace("只有一个", "只有两条");
    expect(checkResult(tampered, blocks, images).validation.ready).toBe(false);
  });

  it("permits position:relative/static while blocking position:absolute/fixed", () => {
    const rel = sanitize(
      `<section style="text-align:left"><section style="position:relative;"><p><span leaf="">章节</span></p></section></section>`,
      [],
    );
    expect(rel.errors).toEqual([]);

    const abs = sanitize(
      `<section style="text-align:left"><section style="position:absolute;top:0;"><p><span leaf="">漂浮</span></p></section></section>`,
      [],
    );
    expect(abs.errors).toContain("危险或不支持的CSS：position");

    const fixed = sanitize(
      `<section style="text-align:left"><section style="position:fixed;top:0;"><p><span leaf="">固定</span></p></section></section>`,
      [],
    );
    expect(fixed.errors).toContain("危险或不支持的CSS：position");
  });

  it("recovers the sunset-studio multi-section failure pattern (prose + fenced HTML + em-dash captions)", () => {
    const md = [
      "前言第一段。",
      "",
      "## 01 对工具的三个硬要求",
      "",
      "![截图](typetada-image:image_1)",
      "",
      "文有样逐字差异核对面板",
      "",
      "## 02 真实反馈与迭代",
      "",
      "![盲盒抽屉](typetada-image:image_2)",
      "",
      "文有样盲盒排版抽屉界面",
      "",
      "![真机预览](typetada-image:image_3)",
      "",
      "文有样盲盒排版真机预览",
      "",
      "收尾段落，[示例链接](https://example.com)。",
    ].join("\n");
    const { blocks, images } = sourceManifest(md);

    const response = `这是为您生成的赤陶橙杂志风排版 HTML：
\`\`\`html
<section style="max-width:677px;margin:0 auto;text-align:left;">
  <section data-body="">
    <p style="margin:0 0 20px;"><span leaf="">前言第一段。</span></p>
    <section style="margin-top:16px;margin-bottom:32px;padding:0 20px;">
      <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <section><p><span leaf="">01</span></p><p><span leaf="">PART</span></p></section>
        <section><p style="font-size:17px;font-weight:900;"><span leaf="">对工具的三个硬要求</span></p><p><span leaf="">RULES</span></p></section>
      </section>
      <section><span leaf=""><img src="typetada-image:image_1" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span></section>
      <p style="font-size:12px;color:#9CA3AF;text-align:center;"><span leaf="">— 文有样逐字差异核对面板</span></p>
    </section>
    <section style="margin-top:48px;margin-bottom:32px;padding:0 20px;">
      <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <section><p><span leaf="">02</span></p><p><span leaf="">PART</span></p></section>
        <section><p style="font-size:17px;font-weight:900;"><span leaf="">真实反馈与迭代</span></p><p><span leaf="">FEEDBACK</span></p></section>
      </section>
      <section><span leaf=""><img src="typetada-image:image_2" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span></section>
      <p style="font-size:12px;color:#9CA3AF;text-align:center;"><span leaf="">— 文有样盲盒排版抽屉界面</span></p>
      <section><span leaf=""><img src="typetada-image:image_3" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span></section>
      <p style="font-size:12px;color:#9CA3AF;text-align:center;"><span leaf="">— 文有样盲盒排版真机预览</span></p>
      <p style="margin:0 0 20px;"><span leaf="">收尾段落，</span><a href="https://example.com"><span leaf="">示例链接</span></a><span leaf="">。</span></p>
    </section>
  </section>
</section>
\`\`\`
### 从封面到尾声的阅读动线

以上总结了整篇排版结构。`;

    const res = checkGeneratedResult(response, blocks, images);
    expect(res.validation.errors).toEqual([]);
    expect(res.validation.ready).toBe(true);
    expect(res.normalizations).toContain("提取回复中的 HTML 代码块");
  });
});
