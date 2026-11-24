import { expect, it } from "vitest";
import { readPaste } from "../src/paste";
import { sourceManifest, markdown } from "../src/content";

it("keeps headings, emphasis, dividers, links and remote pictures from rendered Markdown editors", async () => {
  const pasted = await readPaste({
    text: "标题\n重点\n图片.png",
    files: [],
    html: '<h1>文章标题</h1><h2>小标题</h2><p><strong>重点</strong>和<span style="font-weight:700">加粗</span></p><hr><p><img alt="配图" src="https://example.com/a%20b.png"></p><p><a href="https://example.com">链接</a></p>',
  });
  expect(pasted.markdown).toContain("# 文章标题");
  expect(pasted.markdown).toContain("## 小标题");
  expect(pasted.markdown).toContain("**重点**");
  expect(pasted.markdown).toContain("**加粗**");
  expect(pasted.markdown).toContain("---");
  expect(sourceManifest(pasted.markdown).images).toEqual([
    "https://example.com/a%20b.png",
  ]);
  expect(markdown.render(pasted.markdown)).toContain("<hr>");
});
it("retains raw Markdown rather than flattening an editor HTML wrapper", async () => {
  const text = "## 标题\n\n**重点**\n\n---";
  expect(
    (await readPaste({ html: `<p>${text}</p>`, text, files: [] })).markdown,
  ).toBe(text);
});
it("turns embedded image data into local assets and preserves its place in the article", async () => {
  const data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
  const p = await readPaste({
    html: `<p>前文</p><img src="${data}"><p>后文</p>`,
    text: "前文后文",
    files: [],
  });
  expect(p.assets).toHaveLength(1);
  expect(p.markdown).not.toContain("base64");
  expect(p.markdown.indexOf("typetada-image:")).toBeGreaterThan(
    p.markdown.indexOf("前文"),
  );
  expect(p.markdown.indexOf("typetada-image:")).toBeLessThan(
    p.markdown.indexOf("后文"),
  );
  expect(sourceManifest(p.markdown).images).toHaveLength(1);
});
it("imports a clipboard image file, and never fetches a foreign blob or file path", async () => {
  const file = {
    type: "image/png",
    name: "配图.png",
    size: 8,
    arrayBuffer: async () =>
      Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]).buffer,
  } as File;
  const p = await readPaste({
    html: '<p>正文</p><img src="blob:https://editor.test/123">',
    text: "正文",
    files: [file],
  });
  expect(p.assets).toHaveLength(1);
  expect(p.markdown).toContain("typetada-image:");
  expect(p.markdown).not.toContain("blob:");
  const missing = await readPaste({
    html: '<p>正文</p><img alt="示例" src="file:///private/image.png">',
    text: "正文",
    files: [],
  });
  expect(missing.warnings).toHaveLength(1);
  expect(missing.markdown).toContain("图片未带入");
  expect(missing.markdown).not.toContain("file:");
});
it("removes scripts, events and unsafe links without running HTML", async () => {
  const p = await readPaste({
    html: '<script>evil()</script><h2 onclick="evil()">章节</h2><a href="javascript:evil()">文字</a>',
    text: "章节文字",
    files: [],
  });
  expect(p.markdown).toContain("## 章节");
  expect(p.markdown).toContain("文字");
  expect(p.markdown).not.toMatch(/evil|javascript|onclick/);
});
it("keeps simple table cells and rejects merged tables rather than flattening them", async () => {
  const p = await readPaste({
    html: "<table><tr><th>项目</th><th>数量</th></tr><tr><td><strong>配图</strong></td><td>2</td></tr></table>",
    text: "项目数量配图2",
    files: [],
  });
  expect(sourceManifest(p.markdown).blocks[0].tableRows).toEqual([
    ["项目", "数量"],
    ["配图", "2"],
  ]);
  await expect(
    readPaste({
      html: '<table><tr><td colspan="2">合并</td></tr></table>',
      text: "合并",
      files: [],
    }),
  ).rejects.toThrow("合并单元格");
});
it("replaces a Markdown local image with its clipboard file at the original position", async () => {
  const file = {
    type: "image/png",
    name: "local.png",
    size: 8,
    arrayBuffer: async () =>
      Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]).buffer,
  } as File;
  const p = await readPaste({
    html: "<p>MD</p>",
    text: "# 标题\n\n前文\n\n![](local.png)\n\n后文",
    files: [file],
  });
  expect(p.assets).toHaveLength(1);
  expect(p.markdown).not.toContain("local.png");
  expect(p.markdown.indexOf("typetada-image:")).toBeLessThan(
    p.markdown.indexOf("后文"),
  );
  expect(sourceManifest(p.markdown).images).toHaveLength(1);
});

it("preserves Watcha ProseMirror figure, headings, marks and dividers without treating the filename as the image", async () => {
  const p = await readPaste({
    html: '<figure data-pm-slice="1 1 []"><div class="figure-image-frame"><img src="https://watcha.tos-cn-beijing.volces.com/prod/user/uploads/sample.png" alt="配图.png" data-popup="true"></div><figcaption><br class="ProseMirror-trailingBreak"></figcaption></figure><p><strong>重点</strong></p><hr contenteditable="false"><h2>小标题</h2><p>正文。</p>',
    text: "配图.png\n重点\n小标题\n正文。",
    files: [],
  });
  expect(p.markdown).toContain(
    "![配图.png](<https://watcha.tos-cn-beijing.volces.com/prod/user/uploads/sample.png>)",
  );
  expect(p.markdown).toContain("## 小标题");
  expect(p.markdown).toContain("**重点**");
  expect(p.markdown).toContain("---");
  expect(p.warnings).toHaveLength(0);
});
