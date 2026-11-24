import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { imageFromBytes } from "./images";
import type { Asset } from "./types";

export type PasteInput = { html: string; text: string; files: File[] };
export async function readPaste(input: PasteInput) {
  const assets: Asset[] = [],
    warnings: string[] = [];
  const files = input.files.filter((f) => f.type.startsWith("image/"));
  if (input.html.length + input.text.length > 15 * 1024 * 1024)
    throw new Error("粘贴内容过大，请改为分段或文件导入");
  if (files.length > 20) throw new Error("一次最多粘贴20张图片");
  const markdownText =
    /(?:^|\n)\s{0,3}(?:#{1,6} |```|(?:[-*_]\s*){3,}$)|!\[[^\]]*\]\(|\*\*[^*]+\*\*/m.test(
      input.text,
    );
  const wrapper = document.createElement("template");
  wrapper.innerHTML = input.html;
  const hasRichStructure = !!wrapper.content.querySelector(
    "img,a[href],h1,h2,h3,h4,h5,h6,strong,b,em,i,u,s,del,mark,hr,br,table,ul,ol,blockquote,pre,code,[style]",
  );
  const imported = new Map<File, Asset>();
  async function fileAsset(file: File) {
    let asset = imported.get(file);
    if (!asset) {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("单张图片不能超过10MiB");
      asset = await imageFromBytes(
        new Uint8Array(await file.arrayBuffer()),
        file.name,
      );
      imported.set(file, asset);
      assets.push(asset);
    }
    return `typetada-image:${asset.id}`;
  }
  // Raw Markdown already carries structure. Import unavailable image sources in place
  // when the clipboard also supplies their bytes, rather than appending duplicates.
  if (!input.html || (markdownText && !hasRichStructure)) {
    let result = "",
      cursor = 0,
      nextFile = 0;
    const matches = [
      ...input.text.matchAll(/!\[([^\]]*)\]\((?:<([^>]+)>|([^()\n]+))\)/g),
    ];
    for (const match of matches) {
      result += input.text.slice(cursor, match.index);
      const src = (match[2] || match[3]).trim();
      if (/^(?:https:\/\/|typetada-image:)/i.test(src)) result += match[0];
      else if (files[nextFile])
        result += `![${match[1]}](<${await fileAsset(files[nextFile++])}>)`;
      else {
        result += match[0];
        warnings.push(
          "部分图片是本机路径，复制时没有图片文件；请用「插入配图」补上。",
        );
      }
      cursor = match.index! + match[0].length;
    }
    result += input.text.slice(cursor);
    for (const file of files.slice(nextFile))
      result += `\n\n![](${await fileAsset(file)})`;
    return { markdown: result, assets, warnings: [...new Set(warnings)] };
  }
  const clean = DOMPurify.sanitize(input.html, {
    ALLOWED_TAGS: [
      "p",
      "div",
      "section",
      "article",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "del",
      "strike",
      "span",
      "mark",
      "hr",
      "br",
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
      "src",
      "alt",
      "title",
      "style",
      "start",
      "colspan",
      "rowspan",
    ],
  });
  const template = document.createElement("template");
  template.innerHTML = clean;
  const images = [...template.content.querySelectorAll("img")];
  if (images.length > 20) throw new Error("一次最多粘贴20张图片");
  let nextFile = 0;
  for (const image of images) {
    const src = image.getAttribute("src") || "",
      alt = image.getAttribute("alt") || "";
    let target: string | undefined;
    if (/^https:\/\/[^\s<>]+$/i.test(src)) target = src;
    else if (
      /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=]+$/i.test(src)
    ) {
      const encoded = src.slice(src.indexOf(",") + 1);
      if (encoded.length > 14 * 1024 * 1024)
        throw new Error("粘贴图片过大，请缩小后重试");
      const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      const asset = await imageFromBytes(bytes, alt || "粘贴图片");
      assets.push(asset);
      target = `typetada-image:${asset.id}`;
    } else {
      const file = files[nextFile++];
      if (file) target = await fileAsset(file);
    }
    if (target) image.setAttribute("src", target);
    else {
      image.replaceWith(
        document.createTextNode(
          `〔图片未带入${alt ? `：${alt}` : ""}，请插入配图〕`,
        ),
      );
      warnings.push("部分图片未包含可访问地址或文件，请用「插入配图」补上。");
    }
  }
  const converter = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });
  converter.addRule("image", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLElement,
        src = el.getAttribute("src") || "",
        alt = (el.getAttribute("alt") || "").replace(/[\[\]\\]/g, "\\$&");
      return `![${alt}](<${src}>)`;
    },
  });
  converter.addRule("spanFormatting", {
    filter: ["span", "mark", "u"],
    replacement: (content, node) => {
      const el = node as HTMLElement;
      if (!content.trim()) return content;
      if (el.tagName === "U" || /underline/.test(el.style.textDecoration))
        content = `<u>${content}</u>`;
      if (el.tagName === "MARK") content = `==${content}==`;
      if (el.style.fontStyle === "italic") content = `*${content}*`;
      if (/^(bold|bolder|[6-9]00)$/.test(el.style.fontWeight))
        content = `**${content}**`;
      return content;
    },
  });
  converter.addRule("strike", {
    filter: (node) => ["S", "DEL", "STRIKE"].includes(node.nodeName),
    replacement: (c) => `~~${c}~~`,
  });
  converter.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLElement;
      if (
        table.querySelector(
          '[colspan]:not([colspan="1"]),[rowspan]:not([rowspan="1"])',
        )
      )
        throw new Error("合并单元格暂不支持粘贴，请先转换为简单表格");
      const rows = [...table.querySelectorAll("tr")].map((row) =>
        [...row.children].map((cell) =>
          converter
            .turndown(cell.innerHTML)
            .replace(/\n+/g, " ")
            .replace(/\|/g, "\\|"),
        ),
      );
      if (!rows.length) return "";
      const width = Math.max(...rows.map((row) => row.length));
      if (width > 4) throw new Error("表格暂支持最多4列，请先拆分");
      const line = (row: string[]) =>
        "| " +
        Array.from({ length: width }, (_, i) => row[i] || "").join(" | ") +
        " |";
      return (
        "\n\n" +
        [
          line(rows[0]),
          line(Array(width).fill("---")),
          ...rows.slice(1).map(line),
        ].join("\n") +
        "\n\n"
      );
    },
  });
  converter.addRule("safeLinks", {
    filter: "a",
    replacement: (c, node) => {
      const href = (node as HTMLElement).getAttribute("href") || "";
      return /^https?:\/\/[^\s<>]+$/i.test(href) ? `[${c}](<${href}>)` : c;
    },
  });
  // Keep images in the template's inert document, so pasting never loads remote URLs.
  let result = converter.turndown(template.content);
  // Some apps provide an image file without an HTML img (e.g. screenshot paste).
  for (const file of files) {
    if (imported.has(file)) continue;
    const known = new Set(assets.map((a) => a.url));
    const target = await fileAsset(file);
    const asset = imported.get(file)!;
    if (known.has(asset.url)) {
      assets.splice(assets.indexOf(asset), 1);
      continue;
    }
    result += `\n\n![](${target})`;
    if (
      images.some((image) => /^https:/i.test(image.getAttribute("src") || ""))
    )
      warnings.push("剪贴板附带的本机图片已追加，请确认是否与原图重复。");
  }
  return { markdown: result, assets, warnings: [...new Set(warnings)] };
}
