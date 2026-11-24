import { expect, it } from "vitest";
import { sourcePreview } from "../src/source-preview";
it("renders visible headings, strong, dividers, remote and local images instead of Markdown syntax", () => {
  const dom = document.createElement("template");
  dom.innerHTML = sourcePreview(
    "## 章节\n\n**重点**\n\n---\n\n![](https://example.com/a.png)\n\n![](typetada-image:image_one)",
    new Map([["image_one", "data:image/png;base64,iVBORw0KGgo="]]),
  );
  expect(dom.content.querySelector("h2")?.textContent).toBe("章节");
  expect(dom.content.querySelector("strong")?.textContent).toBe("重点");
  expect(dom.content.querySelector("hr")).not.toBeNull();
  expect(
    [...dom.content.querySelectorAll("img")].map((e) => e.getAttribute("src")),
  ).toEqual([
    "https://example.com/a.png",
    "data:image/png;base64,iVBORw0KGgo=",
  ]);
  expect(dom.content.querySelector("img")?.getAttribute("referrerpolicy")).toBe(
    "no-referrer",
  );
});
it("does not execute raw HTML or load unsupported image paths", () => {
  const html = sourcePreview(
    "<script>evil()</script>\n\n![local](file:///secret.png)\n\n[link](javascript:evil())",
    new Map(),
  );
  const dom = document.createElement("template");
  dom.innerHTML = html;
  expect(dom.content.querySelector("script,iframe,[onerror]")).toBeNull();
  expect(dom.content.querySelector("img")).toBeNull();
  expect(dom.content.querySelector('a[href^="javascript:"]')).toBeNull();
});
it("shows a missing local image notice and does not print its internal identifier", () => {
  const html = sourcePreview("![图](typetada-image:image_missing)", new Map());
  expect(html).toContain("图片暂不可用");
  expect(html).not.toContain("typetada-image:");
});
