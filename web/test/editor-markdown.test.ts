import { describe, expect, it } from "vitest";
import {
  editorHtmlToMarkdown,
  isValidEditorImageSrc,
  markdownToEditorHtml,
} from "../src/editor-markdown";

describe("editor markdown bidirectional conversion", () => {
  it("converts headings, marks, quote, divider, lists, code, table, and images safely", () => {
    const md = [
      "## 章节标题",
      "",
      "正文包含**加粗**、*斜体*、<u>下划线</u>、==高亮==、~~删除~~与[链接](https://example.com)。",
      "",
      "> 这是一段引用。",
      "",
      "- 项目一",
      "- 项目二",
      "",
      "1. 步骤一",
      "2. 步骤二",
      "",
      "---",
      "",
      "```ts",
      "const ok = true;",
      "```",
      "",
      "| 列一 | 列二 |",
      "| --- | --- |",
      "| 值1 | 值2 |",
      "",
      "![示例图](typetada-image:image_abc123)",
      "",
      "![外链](https://example.com/pic.png)",
    ].join("\n");

    const html = markdownToEditorHtml(md);
    expect(html).toContain("<h2>章节标题</h2>");
    expect(html).toContain("<strong>加粗</strong>");
    expect(html).toContain("<em>斜体</em>");
    expect(html).toContain("<u>下划线</u>");
    expect(html).toContain("<mark>高亮</mark>");
    expect(html).toContain("<s>删除</s>");
    expect(html).toContain('data-source-src="typetada-image:image_abc123"');
    expect(html).toContain('data-source-src="https://example.com/pic.png"');
    // 不得提前把外链或私有地址放进真实 img[src]
    expect(html).not.toMatch(/<img[^>]*\ssrc=/i);

    const roundtrip = editorHtmlToMarkdown(html);
    expect(roundtrip).toContain("## 章节标题");
    expect(roundtrip).toContain("**加粗**");
    expect(roundtrip).toContain("*斜体*");
    expect(roundtrip).toContain("<u>下划线</u>");
    expect(roundtrip).toContain("==高亮==");
    expect(roundtrip).toContain("~~删除~~");
    expect(roundtrip).toContain("[链接](https://example.com)");
    expect(roundtrip).toContain("> 这是一段引用。");
    expect(roundtrip).toContain("- 项目一");
    expect(roundtrip).toContain("1. 步骤一");
    expect(roundtrip).toContain("---");
    expect(roundtrip).toContain("```ts\nconst ok = true;\n```");
    expect(roundtrip).toContain("| 列一 | 列二 |");
    expect(roundtrip).toContain("| 值1 | 值2 |");
    expect(roundtrip).toContain("![示例图](typetada-image:image_abc123)");
    expect(roundtrip).toContain("![外链](https://example.com/pic.png)");
  });

  it("blocks dangerous scripts, unsupported image URLs, and base64 image roundtrips", () => {
    expect(isValidEditorImageSrc("https://example.com/a.png")).toBe(true);
    expect(isValidEditorImageSrc("typetada-image:image_123")).toBe(true);
    expect(isValidEditorImageSrc("http://example.com/a.png")).toBe(false);
    expect(isValidEditorImageSrc("file:///etc/passwd")).toBe(false);
    expect(isValidEditorImageSrc("data:image/png;base64,AA==")).toBe(false);

    const html = markdownToEditorHtml(
      "<script>alert(1)</script>\n\n![secret](file:///secret.png)\n\n![insecure](http://example.com/a.png)\n\n[bad](javascript:alert(1))",
    );
    const holder = document.createElement("template");
    holder.innerHTML = html;
    expect(holder.content.querySelector("script,iframe,[onerror]")).toBeNull();
    expect(holder.content.querySelector("img")).toBeNull();
    expect(holder.content.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(html).toContain("图片暂不可用：insecure");

    // 即使 DOM 中混入 base64 src，也绝不能回写为 base64 Markdown
    const fromBase64 = editorHtmlToMarkdown(
      '<p>正文</p><img src="data:image/png;base64,AAA=" alt="bad" />',
    );
    expect(fromBase64).toBe("正文");
    expect(fromBase64).not.toContain("data:image/");
  });

  it("normalizes empty documents and strips ProseMirror trailing breaks", () => {
    expect(markdownToEditorHtml("   \n")).toBe("");
    expect(editorHtmlToMarkdown("")).toBe("");
    expect(
      editorHtmlToMarkdown('<p><br class="ProseMirror-trailingBreak"></p>'),
    ).toBe("");
    expect(
      editorHtmlToMarkdown(
        '<p>第一段<br class="ProseMirror-trailingBreak"></p><ul><li><p>列表项</p></li></ul>',
      ),
    ).toBe("第一段\n\n- 列表项");
  });
});
