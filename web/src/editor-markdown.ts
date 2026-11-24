import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { markdown, serialize } from "./content";

const HTTPS_URL = /^https:\/\/[^\s<>]+$/i;
const HTTP_OR_HTTPS_URL = /^https?:\/\/[^\s<>]+$/i;
const LOCAL_IMAGE_URL = /^typetada-image:[a-z0-9_-]+$/i;

/**
 * 判断图片地址是否为编辑器允许的安全来源（仅 HTTPS 外链或本机 typetada-image 引用）
 */
export function isValidEditorImageSrc(src: string): boolean {
  const trimmed = src.trim();
  return HTTPS_URL.test(trimmed) || LOCAL_IMAGE_URL.test(trimmed);
}

/**
 * 将 Markdown 原稿安全转换为供 Tiptap 加载的编辑 HTML（本地/外链图片仅写入 data-source-src，不提前请求）
 */
export function markdownToEditorHtml(source: string): string {
  if (!source.trim()) return "";
  const template = document.createElement("template");
  template.innerHTML = markdown.render(source);

  // 将 <h5> / <h6> 归一化为 <h4>，确保与主题支持的标题层级一致且不丢文字
  for (const heading of template.content.querySelectorAll("h5, h6")) {
    const h4 = document.createElement("h4");
    h4.innerHTML = heading.innerHTML;
    heading.replaceWith(h4);
  }

  for (const image of template.content.querySelectorAll("img")) {
    const original = (image.getAttribute("src") || "").trim();
    const alt = image.getAttribute("alt") || "";
    if (!isValidEditorImageSrc(original)) {
      const placeholder = document.createElement("p");
      placeholder.textContent = `〔图片暂不可用${alt ? `：${alt}` : ""}〕`;
      image.replaceWith(placeholder);
      continue;
    }
    image.setAttribute("data-source-src", original);
    image.removeAttribute("src");
  }

  const clean = DOMPurify.sanitize(template.content, {
    ALLOWED_TAGS: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "s",
      "del",
      "u",
      "mark",
      "br",
      "hr",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: [
      "href",
      "alt",
      "title",
      "start",
      "data-source-src",
      "class",
    ],
    RETURN_DOM_FRAGMENT: true,
  });

  for (const el of clean.querySelectorAll("[class]")) {
    const cls = (el.getAttribute("class") || "").trim();
    if (el.tagName === "CODE" && /^language-[a-z0-9_-]+$/i.test(cls)) continue;
    el.removeAttribute("class");
  }

  for (const link of clean.querySelectorAll("a")) {
    const href = (link.getAttribute("href") || "").trim();
    if (!HTTP_OR_HTTPS_URL.test(href)) {
      link.removeAttribute("href");
    } else {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer noopener");
    }
  }

  return serialize(clean);
}

function createMarkdownConverter() {
  const converter = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  converter.addRule("sourceImage", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const src = (
        el.getAttribute("data-source-src") ||
        el.getAttribute("src") ||
        ""
      ).trim();
      if (!isValidEditorImageSrc(src)) return "";
      const alt = (el.getAttribute("alt") || "").replace(/[\[\]\\]/g, "\\$&");
      const wrapped = /[\s()<>]/.test(src) ? `<${src}>` : src;
      return `![${alt}](${wrapped})`;
    },
  });

  converter.addRule("underline", {
    filter: "u",
    replacement: (content) => (content ? `<u>${content}</u>` : ""),
  });

  converter.addRule("highlight", {
    filter: "mark",
    replacement: (content) => (content ? `==${content}==` : ""),
  });

  converter.addRule("strike", {
    filter: (node) => ["S", "DEL", "STRIKE"].includes(node.nodeName),
    replacement: (content) => (content ? `~~${content}~~` : ""),
  });

  converter.addRule("safeLinks", {
    filter: "a",
    replacement: (content, node) => {
      const href = ((node as HTMLElement).getAttribute("href") || "").trim();
      if (!HTTP_OR_HTTPS_URL.test(href)) return content;
      const wrapped = /[\s()<>]/.test(href) ? `<${href}>` : href;
      return `[${content}](${wrapped})`;
    },
  });

  converter.addRule("compactListItem", {
    filter: "li",
    replacement: (content, node, options) => {
      const clean = content
        .replace(/^\n+/, "")
        .replace(/\n+$/, "")
        .replace(/\n+/g, "\n  ");
      let prefix = `${options.bulletListMarker} `;
      const parent = node.parentNode as HTMLElement | null;
      if (parent?.nodeName === "OL") {
        const start = parent.getAttribute("start");
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = `${start ? Number(start) + index : index + 1}. `;
      }
      return prefix + clean + (node.nextSibling ? "\n" : "");
    },
  });

  converter.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLElement;
      const rows = [...table.querySelectorAll("tr")].map((row) =>
        [...row.children]
          .filter((cell) => ["TH", "TD"].includes(cell.tagName))
          .map((cell) =>
            converter
              .turndown(cell.innerHTML)
              .replace(/\n+/g, " ")
              .replace(/\|/g, "\\|")
              .trim(),
          ),
      );
      if (!rows.length) return "";
      const width = Math.max(...rows.map((r) => r.length));
      if (width === 0) return "";
      const formatRow = (row: string[]) =>
        "| " +
        Array.from({ length: width }, (_, i) => row[i] || "").join(" | ") +
        " |";
      return (
        "\n\n" +
        [
          formatRow(rows[0]),
          formatRow(Array(width).fill("---")),
          ...rows.slice(1).map(formatRow),
        ].join("\n") +
        "\n\n"
      );
    },
  });

  return converter;
}

const markdownConverter = createMarkdownConverter();

/**
 * 将 Tiptap 编辑器输出的安全 HTML 还原为干净 Markdown 原稿
 */
export function editorHtmlToMarkdown(html: string): string {
  if (!html.trim()) return "";
  const template = document.createElement("template");
  template.innerHTML = html;

  // 移除 ProseMirror 自动插入的占位换行符，避免转成冗余空行或反斜杠
  for (const br of template.content.querySelectorAll(
    "br.ProseMirror-trailingBreak",
  )) {
    br.remove();
  }

  // 清除无文本/无图片/无有效节点的纯空文档残留
  const md = markdownConverter.turndown(template.content);
  return md.trim() ? md.replace(/\n{3,}/g, "\n\n") : "";
}
