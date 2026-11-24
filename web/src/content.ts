import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import { parse, generate, walk } from "css-tree";
import type { Validation } from "./types";

export const markdown = new MarkdownIt({ html: false, breaks: false }).enable([
  "table",
  "strikethrough",
]);
markdown.inline.ruler.before(
  "html_inline",
  "safe_underline",
  (state, silent) => {
    const match = /^<\/?u>/i.exec(state.src.slice(state.pos));
    if (!match) return false;
    if (!silent) {
      const token = state.push("html_inline", "", 0);
      token.content = match[0].toLowerCase();
    }
    state.pos += match[0].length;
    return true;
  },
);
markdown.inline.ruler.before("emphasis", "highlight", (state, silent) => {
  const marker = state.src.slice(state.pos, state.pos + 2);
  if (
    marker !== "==" ||
    /[\w=]/.test(state.src[state.pos - 1] || "") ||
    /\s|=/.test(state.src[state.pos + 2] || " ")
  )
    return false;
  const end = state.src.indexOf(marker, state.pos + 2);
  if (
    end < 0 ||
    /\s|=/.test(state.src[end - 1]) ||
    /[\w=]/.test(state.src[end + 2] || "")
  )
    return false;
  if (!silent) {
    const open = state.push("html_inline", "", 0);
    open.content = "<mark>";
    const text = state.push("text", "", 0);
    text.content = state.src.slice(state.pos + 2, end);
    const close = state.push("html_inline", "", 0);
    close.content = "</mark>";
  }
  state.pos = end + 2;
  return true;
});
export function inert(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
const text = (node: Node) => node.textContent || "";
// 剔除装饰线中的零宽空格占位符（&#8203; 等），保留其余可见文本判定
const stripZeroWidth = (value: string) =>
  value.replace(/[\u200b-\u200d\ufeff]/g, "");
const meaningful = (node: Node) => stripZeroWidth(text(node)).trim();
const punctuation: Record<string, string> = {
  ",": "，",
  ";": "；",
  "!": "！",
  "?": "？",
  '"': "“",
  "'": "‘",
  "”": "“",
  "’": "‘",
};
export const canonical = (value: string) =>
  stripZeroWidth(value)
    .replace(/\s+/g, (_space, offset, input) =>
      /[a-z0-9]/i.test(input[offset - 1] || "") &&
      /[a-z0-9]/i.test(input[offset + _space.length] || "")
        ? " "
        : "",
    )
    .replace(/[,;!?"'”’]/g, (c) => punctuation[c]);
export type LinkPair = {
  href: string;
  text: string;
  images: string[];
};

function anchorText(el: Element) {
  const parts: string[] = [];
  function walk(cur: Node) {
    if (cur.nodeType === Node.TEXT_NODE) {
      parts.push(cur.textContent || "");
      return;
    }
    if (cur.nodeType !== Node.ELEMENT_NODE) return;
    const nodeEl = cur as Element;
    if (nodeEl.tagName === "SVG") return;
    if (nodeEl.getAttribute("data-enhancement") === "label") return;
    for (const child of nodeEl.childNodes) walk(child);
  }
  walk(el);
  return canonical(parts.join(""));
}

function linkPair(anchor: Element): LinkPair {
  return {
    href: anchor.getAttribute("href") || "",
    text: anchorText(anchor),
    images: [...anchor.querySelectorAll("img")].map(
      (image) => image.getAttribute("src") || "",
    ),
  };
}

type CodeWhiteSpace = "preserve" | "pre-line" | "collapse";

function codeWhiteSpace(el: Element): CodeWhiteSpace | undefined {
  const style = el.getAttribute("style") || "";
  const value = /white-space\s*:/i.test(style)
    ? styleDeclarations(style).get("white-space")?.value
    : undefined;
  if (value === "inherit" || value === "unset") return;
  if (value === "pre" || value === "pre-wrap" || value === "break-spaces")
    return "preserve";
  if (value === "pre-line") return "pre-line";
  if (value) return "collapse";
  if (el.tagName === "PRE") return "preserve";
}

function inheritedCodeWhiteSpace(el: Element | null): CodeWhiteSpace {
  for (let cur = el; cur; cur = cur.parentElement) {
    const mode = codeWhiteSpace(cur);
    if (mode) return mode;
  }
  return "collapse";
}

function codeTextLines(raw: string, mode: CodeWhiteSpace) {
  if (mode === "collapse") return [raw.replace(/[ \t\r\n]+/g, " ")];
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  return mode === "pre-line"
    ? lines.map((line) => line.replace(/[ \t]+/g, " "))
    : lines;
}

function preserveIndentText(node: Node, initialMode: CodeWhiteSpace) {
  const BLOCK_BREAK_TAGS = new Set([
    "BR",
    "P",
    "DIV",
    "SECTION",
    "LI",
    "TR",
    "BLOCKQUOTE",
    "H1",
    "H2",
    "H3",
    "H4",
  ]);
  type Seg = { text: string; pre: boolean };
  const lines: Seg[][] = [[]];
  let endedWithBlockBreak = false;
  const pushNewline = (fromBlock = false) => {
    lines.push([]);
    endedWithBlockBreak = fromBlock;
  };
  const lastLine = () => lines[lines.length - 1];
  const hasLineContent = () =>
    lastLine().some((part) => part.pre || part.text.replace(/ /g, ""));
  function walk(cur: Node, mode: CodeWhiteSpace) {
    if (cur.nodeType === Node.TEXT_NODE) {
      const raw = cur.textContent || "";
      if (!raw) return;
      codeTextLines(raw, mode).forEach((part, idx) => {
        if (idx > 0) pushNewline();
        if (!part) return;
        lastLine().push({ text: part, pre: mode === "preserve" });
        if (mode === "preserve" || part.replace(/ /g, ""))
          endedWithBlockBreak = false;
      });
      return;
    }
    if (cur.nodeType !== Node.ELEMENT_NODE) return;
    const el = cur as Element;
    const tag = el.tagName;
    if (tag === "SVG") return;
    if (el.getAttribute("data-enhancement") === "label") return;
    if (tag === "BR") {
      pushNewline();
      return;
    }
    const childMode = codeWhiteSpace(el) ?? mode;
    const style = el.getAttribute("style") || "";
    const isBlock =
      cur !== node &&
      (BLOCK_BREAK_TAGS.has(tag) ||
        /(?:^|;)\s*display\s*:\s*(?:block|flex|grid|list-item|table-row)\b/i.test(
          style,
        ));
    if (isBlock && hasLineContent()) pushNewline(true);
    const startLine = lines.length;
    for (const child of el.childNodes) walk(child, childMode);
    if (isBlock && (hasLineContent() || lines.length === startLine))
      pushNewline(true);
  }
  walk(node, initialMode);
  if (endedWithBlockBreak) lines.pop();
  return lines
    .map((segs) => {
      if (!segs.length) return "";
      const copy = segs.map((s) => ({ ...s }));
      while (copy.length && !copy[0].pre) {
        copy[0].text = copy[0].text.replace(/^ +/, "");
        if (!copy[0].text) copy.shift();
        else break;
      }
      while (copy.length && !copy[copy.length - 1].pre) {
        copy[copy.length - 1].text = copy[copy.length - 1].text.replace(
          / +$/,
          "",
        );
        if (!copy[copy.length - 1].text) copy.pop();
        else break;
      }
      return copy.map((s) => s.text).join("");
    })
    .join("\n");
}

function normalizeCodeForCheck(raw: string) {
  return raw.replace(/\r\n?/g, "\n");
}

function codeTextMatches(actual: string, source: string) {
  const expected = normalizeCodeForCheck(source);
  const raw = normalizeCodeForCheck(actual);
  // WeChat 的多段代码样式用 NBSP 表示行首空格。
  const withSpaces = raw.replace(/^[ \u00a0]+/gm, (indent) =>
    indent.replace(/\u00a0/g, " "),
  );
  const withoutTerminator = expected.replace(/\n$/, "");
  return [raw, withSpaces].some(
    (text) => text === expected || text === withoutTerminator,
  );
}

function legacyCodeTextMatches(actual: string, source: string) {
  const raw = normalizeCodeForCheck(actual);
  const expected = normalizeCodeForCheck(source).replace(/\t/g, "    ");
  // Older exports encoded every ASCII space as NBSP and expanded tabs.
  const encoded = expected.replace(/ /g, "\u00a0");
  if (!expected.includes("\u00a0"))
    return codeTextMatches(raw.replace(/\u00a0/g, " "), expected);
  return [expected, encoded].some(
    (code) => code === raw || code.replace(/\n$/, "") === raw,
  );
}

export type SourceBlock = {
  id: string;
  kind: string;
  markdown: string;
  text: string;
  code: string | null;
  images: string[];
  links: string[];
  linkPairs?: LinkPair[];
  tableRows: string[][];
  inlineCodes: string[];
};
export function sourceManifest(source: string) {
  const tokens = markdown.parse(source, {}),
    lines = source.split("\n"),
    blocks: SourceBlock[] = [],
    images: string[] = [];
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i];
    let end = i + 1;
    if (token.nesting === 1) {
      let depth = 1;
      while (end < tokens.length && depth) {
        depth += tokens[end].nesting;
        end++;
      }
    }
    const group = tokens.slice(i, end);
    if (token.map) {
      let lists = 0;
      for (const t of group) {
        if (
          ["bullet_list_open", "ordered_list_open"].includes(t.type) &&
          ++lists > 1
        )
          throw new Error("暂不支持嵌套列表，请先调整为简单列表");
        if (["bullet_list_close", "ordered_list_close"].includes(t.type))
          lists--;
      }
      const doc = inert(markdown.renderer.render(group, markdown.options, {}));
      const th = doc.querySelectorAll("th");
      if (th.length > 4) throw new Error("表格暂支持最多4列，请先拆分");
      const imgs = [...doc.querySelectorAll("img")].map(
        (e) => e.getAttribute("src") || "",
      );
      images.push(...imgs);
      blocks.push({
        id: `s${String(blocks.length + 1).padStart(3, "0")}`,
        kind: token.type,
        markdown: lines.slice(token.map[0], token.map[1]).join("\n"),
        text: visibleText(doc),
        code: ["fence", "code_block"].includes(token.type)
          ? token.content
          : null,
        images: imgs,
        links: [...doc.querySelectorAll("a")].map(
          (e) => e.getAttribute("href") || "",
        ),
        linkPairs: [...doc.querySelectorAll("a")].map(linkPair),
        tableRows: [...doc.querySelectorAll("tr")].map((r) =>
          [...r.children]
            .filter((e) => ["TD", "TH"].includes(e.tagName))
            .map(text),
        ),
        inlineCodes: [...doc.querySelectorAll("code")].map(text),
      });
    }
    i = end;
  }
  if (!blocks.length) throw new Error("请先输入文章正文");
  if (images.length > 20) throw new Error("暂支持最多20张配图");
  return { blocks, images };
}
const htmlTags =
  "section p span strong em b i del u br a img h3 h4 pre code figure figcaption hr ul ol li table thead tbody tr th td colgroup col".split(
    " ",
  );
// 仅放行静态矢量图标子集，严禁脚本、外链或嵌套文本容器
const svgTags = "svg path circle polyline polygon ellipse rect line".split(" ");
const svgTagSet = new Set(svgTags);
const tags = [...htmlTags, ...svgTags];
const attrs = [
  "style",
  "leaf",
  "href",
  "src",
  "alt",
  "colspan",
  "rowspan",
  "data-body",
  "data-source",
  "data-enhancement",
  "data-refs",
];
const svgAttrs = [
  "width",
  "height",
  "viewBox",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "xmlns",
  "style",
  "data-enhancement",
  "data-refs",
];
const svgAttrLower = new Set(svgAttrs.map((a) => a.toLowerCase()));
const silentStripAttrs = new Set(["nodeleaf", "aria-hidden", "role"]);
const ignoreCss = new Set(["cursor", "user-select", "-webkit-user-select"]);
const css = new Set(
  "margin margin-top margin-bottom margin-left margin-right padding padding-top padding-bottom padding-left padding-right color background background-color background-image border border-top border-bottom border-left border-right border-color border-width border-style border-radius border-collapse border-spacing box-shadow box-sizing display width min-width max-width height min-height max-height font-size font-family font-weight font-style font-variant-numeric line-height letter-spacing writing-mode text-align text-decoration text-decoration-color text-decoration-thickness text-underline-offset text-shadow text-transform text-indent list-style list-style-type list-style-position word-break overflow-wrap white-space vertical-align opacity overflow overflow-x overflow-y flex flex-direction flex-wrap flex-shrink flex-grow flex-basis align-items align-self justify-content gap row-gap column-gap -webkit-overflow-scrolling".split(
    " ",
  ),
);
const functions = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "linear-gradient",
  "radial-gradient",
]);
function transparentText(value: string) {
  if (value === "transparent") return true;
  if (/^#[a-f\d]{4}$/i.test(value)) return parseInt(value.slice(-1), 16) === 0;
  if (/^#[a-f\d]{8}$/i.test(value)) return parseInt(value.slice(-2), 16) === 0;
  const match = /^(rgba?|hsla?)\((.*)\)$/.exec(value);
  if (!match) return false;
  const args = match[2].split(/[\s,/]+/).filter(Boolean);
  return args.length === 4 && parseFloat(args[3]) <= 0;
}
function heightLimit(value: string) {
  return /(?:^|;)\s*(?:height|max-height)\s*:/i.test(value);
}
function parsedStyle(value: string) {
  try {
    return generate(parse(value, { context: "declarationList" }));
  } catch {
    return "";
  }
}
const marginZero = new Set(["0", "0px", "auto"]);
const hasNonZeroDim = (token: string) =>
  !marginZero.has(token) && /[1-9]/.test(token);
function styleDeclarations(style: string) {
  const map = new Map<string, { value: string; important: boolean }>();
  try {
    const tree = parse(style, { context: "declarationList" });
    walk(tree, {
      visit: "Declaration",
      enter(node) {
        const key = node.property.toLowerCase();
        const value = generate(node.value).trim().toLowerCase();
        const prev = map.get(key);
        if (!prev?.important || node.important)
          map.set(key, { value, important: !!node.important });
      },
    });
  } catch {
    return map;
  }
  return map;
}
function hasHorizontalBoxExtra(props: Map<string, { value: string }>) {
  for (const k of ["padding-left", "padding-right"]) {
    const v = props.get(k)?.value;
    if (v && hasNonZeroDim(v)) return true;
  }
  const pad = props.get("padding")?.value;
  if (pad) {
    const parts = pad.split(/\s+/);
    const horiz = parts.length >= 2 ? parts[1] : parts[0];
    if (hasNonZeroDim(horiz) || (parts.length === 4 && hasNonZeroDim(parts[3])))
      return true;
  }
  for (const k of [
    "border",
    "border-left",
    "border-right",
    "border-width",
    "border-left-width",
    "border-right-width",
  ]) {
    const v = props.get(k)?.value;
    if (v && !["0", "0px", "none"].includes(v) && /[1-9]/.test(v)) return true;
  }
  return false;
}
function hasHorizontalMargin(props: Map<string, { value: string }>) {
  if (
    hasNonZeroDim(props.get("margin-left")?.value || "0") ||
    hasNonZeroDim(props.get("margin-right")?.value || "0")
  )
    return true;
  const m = props.get("margin")?.value;
  if (!m) return false;
  const parts = m.split(/\s+/);
  if (parts.length === 1) return hasNonZeroDim(parts[0]);
  return (
    hasNonZeroDim(parts[1]) || (parts.length === 4 && hasNonZeroDim(parts[3]))
  );
}
export function safeStyle(value: string, hasContent: boolean) {
  const errors: string[] = [],
    out: string[] = [];
  const emittedProps = new Map<string, { value: string }>();
  try {
    const tree = parse(value, {
      context: "declarationList",
      positions: false,
      onParseError() {
        errors.push("CSS无法完整解析");
      },
    });
    const heightLimited = heightLimit(generate(tree));
    walk(tree, {
      visit: "Declaration",
      enter(node) {
        const property = node.property.toLowerCase(),
          v = generate(node.value).toLowerCase();
        let unsafe = false;
        walk(node.value, (n) => {
          if (
            n.type === "Url" ||
            n.type === "Raw" ||
            n.type === "Atrule" ||
            (n.type === "Function" && !functions.has(n.name.toLowerCase()))
          )
            unsafe = true;
        });
        if (
          ignoreCss.has(property) &&
          !unsafe &&
          !/[\\<>]|expression|javascript/i.test(v)
        )
          return;
        if (
          !css.has(property) ||
          unsafe ||
          /[\\<>]|expression|javascript/i.test(v)
        ) {
          errors.push("危险或不支持的CSS：" + property);
          return;
        }
        if (
          property === "display" &&
          ![
            "block",
            "inline",
            "inline-block",
            "flex",
            "inline-flex",
            "table",
            "table-cell",
            "table-row",
            "list-item",
          ].includes(v)
        ) {
          errors.push("不允许隐藏或网格正文");
          return;
        }
        if (property === "opacity" && !["1", "1.0"].includes(v)) {
          errors.push("不允许透明正文");
          return;
        }
        if (
          property === "text-align" &&
          !["left", "right", "center", "justify", "inherit"].includes(v)
        ) {
          errors.push("请使用明确的left/right/center/justify对齐");
          return;
        }
        if (
          property === "writing-mode" &&
          !["horizontal-tb", "vertical-rl", "vertical-lr", "inherit"].includes(
            v,
          )
        ) {
          errors.push("不支持的书写方向：" + v);
          return;
        }
        if (
          hasContent &&
          [
            "font-size",
            "line-height",
            "height",
            "max-height",
            "width",
            "max-width",
          ].includes(property) &&
          (() => {
            let invalid = false;
            walk(node.value, (n) => {
              if (
                ["Number", "Dimension", "Percentage"].includes(n.type) &&
                Number((n as { value: string }).value) <= 0
              )
                invalid = true;
            });
            return invalid;
          })()
        ) {
          errors.push("不允许零尺寸或负尺寸隐藏内容");
          return;
        }
        if (hasContent && property === "color" && transparentText(v)) {
          errors.push("不允许透明文字");
          return;
        }
        if (
          hasContent &&
          property.startsWith("overflow") &&
          /\b(hidden|clip)\b/.test(v) &&
          heightLimited
        ) {
          errors.push("不允许固定高度裁剪正文");
          return;
        }
        if (
          hasContent &&
          (property.startsWith("margin") || property === "text-indent")
        ) {
          let negative = false;
          walk(node.value, (n) => {
            if (
              ["Number", "Dimension", "Percentage"].includes(n.type) &&
              Number((n as { value: string }).value) < 0
            )
              negative = true;
          });
          if (negative) {
            errors.push("不允许负向偏移正文");
            return;
          }
        }
        emittedProps.set(property, { value: v });
        out.push(
          `${property}:${generate(node.value)}${node.important ? "!important" : ""}`,
        );
      },
    });
    // 百分比宽度叠加水平内边距或边框时自动补齐 border-box，避免微信编辑器 content-box 超宽
    const w = emittedProps.get("width")?.value || "";
    if (
      w.endsWith("%") &&
      !emittedProps.has("box-sizing") &&
      hasHorizontalBoxExtra(emittedProps)
    )
      out.push("box-sizing:border-box");
  } catch {
    errors.push("CSS解析失败");
  }
  return { style: out.join(";"), errors };
}
export function safeImageUrl(url: string) {
  return (
    /^https:\/\/[^\s<>]+$/i.test(url) ||
    /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(url) ||
    /^typetada-image:[a-z0-9_-]+$/i.test(url)
  );
}
export function sanitize(fragment: string, allowedImages: string[]) {
  const dom = inert(fragment),
    errors: string[] = [];
  for (const el of [...dom.querySelectorAll("*")]) {
    if (!dom.contains(el)) continue;
    const tag = el.tagName.toLowerCase();
    // 静默清理微信编辑器辅助空标记
    if (tag === "mp-style-type") {
      el.remove();
      continue;
    }
    if (!tags.includes(tag)) {
      errors.push("不支持的标签：" + tag);
      el.remove();
      continue;
    }
    const isSvg = svgTagSet.has(tag);
    if (isSvg && !el.closest("svg")) {
      errors.push("不支持的标签：" + tag);
      el.remove();
      continue;
    }
    if (!isSvg && el.closest("svg")) {
      errors.push("SVG内部不允许嵌套HTML标签：" + tag);
      el.remove();
      continue;
    }
    for (const attr of [...el.attributes]) {
      const lowerName = attr.name.toLowerCase();
      if (silentStripAttrs.has(lowerName)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (isSvg) {
        if (!svgAttrLower.has(lowerName)) {
          errors.push("不允许的属性：" + attr.name);
          el.removeAttribute(attr.name);
          continue;
        }
        const val = attr.value.trim();
        const safeSvgVal = (() => {
          if (lowerName === "xmlns")
            return tag === "svg" && val === "http://www.w3.org/2000/svg";
          if (
            lowerName === "style" ||
            lowerName === "data-enhancement" ||
            lowerName === "data-refs"
          )
            return true;
          if (lowerName === "d")
            return /^[0-9eE.,+\-\sMmLlHhVvCcSsQqTtAaZz]*$/.test(val);
          if (lowerName === "fill" || lowerName === "stroke")
            return (
              !/url\s*\(|javascript:|expression|[<>\\]/i.test(val) &&
              val.length <= 64
            );
          if (lowerName === "stroke-linecap")
            return ["butt", "round", "square", "inherit"].includes(val);
          if (lowerName === "stroke-linejoin")
            return ["miter", "round", "bevel", "inherit"].includes(val);
          return /^[0-9eE.,+\-\s%px]*$/.test(val);
        })();
        if (!safeSvgVal) {
          errors.push("不允许的SVG属性值：" + attr.name);
          el.removeAttribute(attr.name);
        }
        continue;
      }
      if (!attrs.includes(attr.name)) {
        errors.push("不允许的属性：" + attr.name);
        el.removeAttribute(attr.name);
      }
    }
    if (el.hasAttribute("style")) {
      if (
        meaningful(el) &&
        /overflow(?:-[xy])?\s*:[^;]*\b(hidden|clip)\b/i.test(
          parsedStyle(el.getAttribute("style") || ""),
        )
      ) {
        for (
          let parent = el.parentElement;
          parent;
          parent = parent.parentElement
        )
          if (heightLimit(parsedStyle(parent.getAttribute("style") || ""))) {
            errors.push("不允许跨节点固定高度裁剪正文");
            break;
          }
      }
      const clean = safeStyle(
        el.getAttribute("style") || "",
        !!meaningful(el) || !!el.querySelector("img"),
      );
      el.setAttribute("style", clean.style);
      errors.push(...clean.errors);
    }
    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      if (!allowedImages.includes(src) || !safeImageUrl(src)) {
        errors.push("图片来源不属于当前原稿或协议不安全");
        el.remove();
      }
    }
    if (
      tag === "a" &&
      !/^https?:\/\/[^\s<>]+$/i.test(el.getAttribute("href") || "")
    ) {
      errors.push("链接协议不安全");
      el.removeAttribute("href");
    }
  }
  // DOMPurify is a second parser-based boundary, preserving empty decorative spans.
  const holder = document.createElement("div");
  holder.append(dom);
  const clean = DOMPurify.sanitize(holder.innerHTML, {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR: [...attrs, ...svgAttrs],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: [
      "leaf",
      "data-body",
      "data-source",
      "data-enhancement",
      "data-refs",
    ],
    ALLOW_UNKNOWN_PROTOCOLS: true,
    RETURN_DOM_FRAGMENT: true,
  });
  const roots = [...clean.childNodes].filter(
    (n) => n.nodeType === Node.ELEMENT_NODE || !!meaningful(n),
  );
  if (
    roots.length !== 1 ||
    !(roots[0] instanceof Element) ||
    roots[0].tagName !== "SECTION"
  )
    errors.push("正文必须只有一个section根节点");
  return { dom: clean, errors: [...new Set(errors)] };
}
export function visibleText(node: Node) {
  const clone = node.cloneNode(true) as ParentNode;
  for (const e of clone.querySelectorAll("p,h3,h4,li,figcaption,tr"))
    e.append("\n");
  for (const e of clone.querySelectorAll("br")) e.replaceWith("\n");
  return text(clone as Node).trim();
}
// 检测微信公众号 #1.4 width 溢出风险（用于新生成校验）
const widthTableTags = new Set([
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
  "COL",
  "COLGROUP",
]);
function isCodeContext(node: Node) {
  const parent = node.parentElement;
  if (!parent) return false;
  if (parent.closest("[data-code]")) return true;
  for (let el: HTMLElement | null = parent; el; el = el.parentElement) {
    if (
      /monospace|consolas|courier|white-space\s*:\s*pre/i.test(
        el.getAttribute("style") || "",
      )
    )
      return true;
  }
  return false;
}
function elementWidthIssue(el: HTMLElement): string | null {
  const props = styleDeclarations(el.getAttribute("style") || "");
  const w = props.get("width")?.value || "";
  if (!w) return null;
  const bs = props.get("box-sizing")?.value || "";
  if (w === "100%" && hasHorizontalMargin(props))
    return "width:100% 与左右 margin 共存易触发微信公众号 #1.4 width 水平溢出，请移除 width:100% 或改用外层 padding";
  if (w.endsWith("%") && bs !== "border-box" && hasHorizontalBoxExtra(props))
    return `width:${w} 搭配 padding/border 时缺少 box-sizing:border-box，易在微信端溢出`;
  if (meaningful(el) && !widthTableTags.has(el.tagName)) {
    const m = /^(\d+(?:\.\d+)?)px$/i.exec(w);
    if (m && parseFloat(m[1]) > 120)
      return `含文字容器使用固定像素 width:${w}，易触发微信公众号 #1.4 width 溢出，请改用 width:auto;min-width 自适应`;
  }
  return null;
}
export function formatChecks(dom: DocumentFragment) {
  const errors: string[] = [],
    warnings: string[] = [],
    resolvedExceptions: string[] = [];
  const root = dom.firstElementChild as HTMLElement | null;
  if (
    root &&
    !["left", "right", "center", "justify"].includes(root.style.textAlign)
  )
    warnings.push("文章外层需显式text-align:left");
  for (const el of dom.querySelectorAll<HTMLElement>("[style]")) {
    if (meaningful(el) && /gradient\(/i.test(el.style.backgroundImage))
      warnings.push("承载文字的渐变背景有微信深色模式风险，请改纯色");
  }
  const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode,
      value = meaningful(node);
    if (!value) continue;
    const parent = node.parentElement;
    if (!parent?.closest("span[leaf]")) warnings.push("文字未被span leaf包裹");
    if (
      !isCodeContext(node) &&
      /[一-鿿㐀-䶿]/.test(value) &&
      (/[一-鿿㐀-䶿][,;!?]/.test(value) || /["']/.test(value))
    )
      warnings.push(
        "正文有疑似半角标点或英文直引号，请修复；代码和专名需逐项确认",
      );
  }
  if (!dom.querySelector("span[leaf]") && meaningful(dom))
    warnings.push("全文缺少span leaf");
  return {
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    resolvedExceptions,
  };
}
export function widthChecks(dom: DocumentFragment) {
  const warnings: string[] = [];
  for (const el of dom.querySelectorAll<HTMLElement>("[style]")) {
    const issue = elementWidthIssue(el);
    if (issue) warnings.push(issue);
  }
  return [...new Set(warnings)];
}
export async function sha256(value: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export function serialize(dom: DocumentFragment) {
  const holder = document.createElement("div");
  holder.append(dom.cloneNode(true));
  return holder.innerHTML;
}
export function codeHTML(code: string) {
  const body = escapeHtml(
    normalizeCodeForCheck(code).replace(/\n$/, ""),
  ).replace(/\n/g, "<br>");
  return `<section style="font-family:Consolas,monospace;background:#f1f5f9;padding:12px"><p style="margin:0"><span leaf="" style="white-space:pre-wrap">${body}</span></p></section>`;
}

function isDivider(el: Element) {
  if (el.tagName === "HR") return true;
  if (
    !["SECTION", "P"].includes(el.tagName) ||
    meaningful(el) ||
    el.querySelector("img,svg,a")
  )
    return false;
  const props = styleDeclarations(el.getAttribute("style") || "");
  for (const side of ["top", "bottom"]) {
    const border = props.get(`border-${side}`)?.value || "";
    if (
      /\b[1-9]\d*(?:\.\d+)?px\b/.test(border) &&
      /\b(solid|dotted|dashed|double)\b/.test(border)
    )
      return true;
  }
  const height = props.get("height")?.value || "";
  const background =
    props.get("background")?.value ||
    props.get("background-color")?.value ||
    props.get("background-image")?.value;
  return (
    /^[1-4](?:\.\d+)?px$/.test(height) &&
    !!background &&
    background !== "none" &&
    !transparentText(background)
  );
}

const PLACEHOLDER_PATTERN = /\{\{[^{}]*\}\}/g;
/** Template placeholders such as {{作者名}} that do not come from the source. */
export function addedPlaceholders(html: string, sourceMarkdown: string) {
  const own = new Set(sourceMarkdown.match(PLACEHOLDER_PATTERN) || []);
  return (html.match(PLACEHOLDER_PATTERN) || []).filter((p) => !own.has(p));
}

function emphasized(el: Element) {
  if (/^(STRONG|B|H3|H4)$/.test(el.tagName)) return true;
  const props = styleDeclarations(el.getAttribute("style") || "");
  const weight = props.get("font-weight")?.value || "";
  if (/^(bold|bolder|[6-9]00)$/.test(weight)) return true;
  const size = props.get("font-size")?.value || "";
  const px = /^(\d+(?:\.\d+)?)px$/.exec(size);
  const rel = /^(\d+(?:\.\d+)?)(?:em|rem)$/.exec(size);
  return (
    (!!px && parseFloat(px[1]) >= 17) || (!!rel && parseFloat(rel[1]) >= 1.1)
  );
}

/** A heading rendered by the theme as bold or larger text still reads as a heading. */
function looksLikeHeading(el: Element) {
  const target = canonical(visibleText(el));
  if (!target) return false;
  // The article root has no parent in a fragment and is not a heading style.
  for (
    let cur: Element | null = el;
    cur?.parentElement;
    cur = cur.parentElement
  )
    if (emphasized(cur)) return true;
  return [...el.querySelectorAll("*")].some(
    (child) => emphasized(child) && canonical(visibleText(child)) === target,
  );
}

function isBlankCodeLine(el: Element) {
  return (
    el.tagName === "P" &&
    !meaningful(el) &&
    !el.querySelector("img,svg,a") &&
    (el.querySelectorAll("br").length === 1 ||
      (el.querySelector("span[leaf]") &&
        (inheritedCodeWhiteSpace(el) === "preserve" ||
          /font-family:[^;]*(monospace|consolas|courier)/i.test(
            el.getAttribute("style") || "",
          ))))
  );
}

const ATOMIC_BLOCK_TAGS = new Set([
  "P",
  "H3",
  "H4",
  "FIGCAPTION",
  "HR",
  "TABLE",
  "UL",
  "OL",
  "PRE",
]);
const SUBBLOCK_SELECTOR =
  "section,p,h3,h4,pre,ul,ol,table,figcaption,hr,figure,blockquote";

type DomUnit = {
  index: number;
  primaryIndex: number | null;
  el: Element;
  node: Node;
  rawText: string;
  canonicalText: string;
  rawIndentText: string;
  inlineLabels: string[];
  images: string[];
  links: string[];
  linkPairs: LinkPair[];
  inlineCodes: string[];
  tableRows: string[][];
  hasTable: boolean;
  isList: boolean;
  isHr: boolean;
  outsideBody: boolean;
  sourceAttr: string | null;
  enhancementAncestor: Element | null;
  enhancementType: string | null;
  enhancementRefs: string[];
};

function sourceWithoutLabels(region: Element) {
  const pure = region.cloneNode(true) as Element;
  for (const label of pure.querySelectorAll('[data-enhancement="label"]'))
    label.remove();
  return pure;
}

const LABEL = '[data-enhancement="label"]';
/** A node that only carries decorative labels, directly or inside a wrapper. */
function isLabelWrapper(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  if (el.matches(LABEL)) return true;
  return (
    !!el.querySelector(LABEL) &&
    !el.querySelector("img,svg") &&
    !meaningful(sourceWithoutLabels(el))
  );
}

function isCodeSlot(el: Element, block: SourceBlock, singleBlock: boolean) {
  if (
    el.tagName !== "SECTION" ||
    el.getAttribute("data-source") !== block.id ||
    el.matches("[data-body],[data-enhancement]") ||
    el.closest("a") ||
    el.querySelector(
      '[data-body],[data-source],[data-enhancement]:not([data-enhancement="label"]),img,a,table,ul,ol,svg,hr',
    )
  )
    return false;
  for (const label of el.querySelectorAll(LABEL)) {
    let top: Element = label;
    while (top.parentElement && top.parentElement !== el)
      top = top.parentElement;
    if (top.parentElement !== el || !isLabelWrapper(top)) return false;
  }
  if (el.parentElement) return true;
  if (!singleBlock || block.code === null) return false;
  const pure = sourceWithoutLabels(el);
  return (
    !meaningful(pure) ||
    codeTextMatches(
      preserveIndentText(pure, inheritedCodeWhiteSpace(el)),
      block.code,
    )
  );
}

function elementTableRows(el: Element) {
  return [...el.querySelectorAll("tr")].map((r) =>
    [...r.children]
      .filter((e) => ["TH", "TD"].includes(e.tagName))
      .map((e) => canonical(text(e))),
  );
}

const STRICT_NON_BODY_ENHANCEMENTS = new Set([
  "cover",
  "toc",
  "footer",
  "cta",
  "author",
  "label",
]);

function findEffectiveEnhancementAncestor(el: Element): Element | null {
  let cur: Element | null = el;
  while (cur) {
    const enh: Element | null = cur.closest("[data-enhancement]");
    if (!enh) return null;
    const body: Element | null = cur.closest("[data-body]");
    if (body && enh.contains(body) && body !== enh) {
      return null;
    }
    const type = (enh.getAttribute("data-enhancement") || "")
      .trim()
      .toLowerCase();
    if (!STRICT_NON_BODY_ENHANCEMENTS.has(type)) {
      const src: Element | null = cur.closest("[data-source]");
      if (src && enh.contains(src) && src !== enh) {
        cur = enh.parentElement;
        continue;
      }
    }
    return enh;
  }
  return null;
}

function collectDomUnits(dom: DocumentFragment, blocks: SourceBlock[]) {
  const units: DomUnit[] = [];
  const hasExplicitBody = dom.querySelectorAll("[data-body]").length > 0;
  const codeSources = new Map(
    blocks.filter((b) => b.code !== null).map((b) => [b.id, b]),
  );
  // Source links whose only content is images, e.g. [![alt](img)](href).
  const imageOnlyLinks = blocks
    .flatMap((b) => b.linkPairs || [])
    .filter((pair) => pair.images.length && !pair.text);
  function isImageOnlyLink(anchor: Element) {
    const href = anchor.getAttribute("href") || "";
    const srcs = [...anchor.querySelectorAll("img")].map(
      (img) => img.getAttribute("src") || "",
    );
    return imageOnlyLinks.some(
      (pair) => pair.href === href && sameStringArray(pair.images, srcs),
    );
  }

  function pushElementUnit(el: Element, captionsAsLabels = false) {
    const hasInlineLabel = !!el.querySelector('[data-enhancement="label"]');
    const inlineLabels = hasInlineLabel
      ? [...el.querySelectorAll('[data-enhancement="label"]')]
          .map((lbl) => stripZeroWidth(visibleText(lbl)).trim())
          .filter(Boolean)
      : [];
    let pure = hasInlineLabel ? sourceWithoutLabels(el) : el;
    if (captionsAsLabels) {
      // Captions inside an image-only link card are decoration, not source text.
      if (pure === el) pure = el.cloneNode(true) as Element;
      const walker = document.createTreeWalker(pure, NodeFilter.SHOW_TEXT);
      const texts: Text[] = [];
      while (walker.nextNode()) texts.push(walker.currentNode as Text);
      const captions = new Map<Node, string[]>();
      for (const node of texts) {
        const value = stripZeroWidth(node.data).trim();
        const owner =
          node.parentElement?.closest("p,h3,h4,li,figcaption,section") ?? pure;
        node.remove();
        if (!value) continue;
        captions.set(owner, [...(captions.get(owner) || []), value]);
      }
      for (const parts of captions.values()) inlineLabels.push(parts.join(""));
    }
    const rawText = visibleText(pure);
    const enhancementAncestor = findEffectiveEnhancementAncestor(el);
    const outsideBody =
      enhancementAncestor !== null ||
      (hasExplicitBody && !el.closest("[data-body]"));
    const directEnh = el.closest("[data-enhancement]");
    const enhNode = enhancementAncestor ?? directEnh;
    const enhancementType = enhNode
      ? (enhNode.getAttribute("data-enhancement") || "").trim() || "added"
      : null;
    const enhancementRefs = enhNode
      ? (enhNode.getAttribute("data-refs") || "").split(/\s+/).filter(Boolean)
      : [];
    const rawIndentText = preserveIndentText(pure, inheritedCodeWhiteSpace(el));
    const unit: DomUnit = {
      index: units.length,
      primaryIndex: null,
      el,
      node: el,
      rawText,
      canonicalText: canonical(rawText),
      inlineLabels,
      images: [
        ...pure.querySelectorAll("img"),
        ...(pure.tagName === "IMG" ? [pure] : []),
      ]
        .filter((img, idx, arr) => arr.indexOf(img) === idx)
        .map((e) => e.getAttribute("src") || ""),
      rawIndentText:
        rawIndentText === "\n" && isBlankCodeLine(pure) ? "" : rawIndentText,
      links: [
        ...pure.querySelectorAll("a"),
        ...(pure.tagName === "A" ? [pure] : []),
      ]
        .filter((a, idx, arr) => arr.indexOf(a) === idx)
        .map((e) => e.getAttribute("href") || ""),
      linkPairs: [
        ...pure.querySelectorAll("a"),
        ...(pure.tagName === "A" ? [pure] : []),
      ]
        .filter((a, idx, arr) => arr.indexOf(a) === idx)
        .map(linkPair),
      inlineCodes: [
        ...pure.querySelectorAll("code"),
        ...(pure.tagName === "CODE" ? [pure] : []),
      ]
        .filter((c, idx, arr) => arr.indexOf(c) === idx)
        .map(text),
      tableRows:
        pure.tagName === "TABLE" || pure.querySelector("table")
          ? elementTableRows(pure)
          : [],
      hasTable: pure.tagName === "TABLE" || !!pure.querySelector("table"),
      isList: pure.tagName === "UL" || pure.tagName === "OL",
      isHr: isDivider(pure),
      outsideBody,
      sourceAttr:
        el.getAttribute("data-source") ||
        el.closest("[data-source]")?.getAttribute("data-source") ||
        null,
      enhancementAncestor,
      enhancementType,
      enhancementRefs,
    };
    units.push(unit);
  }

  function pushTextUnit(node: Text) {
    const el = node.parentElement;
    if (!el) return;
    const rawText = stripZeroWidth(text(node)).trim();
    if (!rawText) return;
    const enhancementAncestor = findEffectiveEnhancementAncestor(el);
    const outsideBody =
      enhancementAncestor !== null ||
      (hasExplicitBody && !el.closest("[data-body]"));
    const directEnh = el.closest("[data-enhancement]");
    const enhNode = enhancementAncestor ?? directEnh;
    units.push({
      index: units.length,
      primaryIndex: null,
      el,
      node,
      rawText,
      canonicalText: canonical(rawText),
      rawIndentText: preserveIndentText(node, inheritedCodeWhiteSpace(el)),
      inlineLabels: [],
      images: [],
      links: [],
      linkPairs: [],
      inlineCodes: [],
      tableRows: [],
      hasTable: false,
      isList: false,
      isHr: false,
      outsideBody,
      sourceAttr:
        el.closest("[data-source]")?.getAttribute("data-source") || null,
      enhancementAncestor,
      enhancementType: enhNode
        ? (enhNode.getAttribute("data-enhancement") || "").trim() || "added"
        : null,
      enhancementRefs: enhNode
        ? (enhNode.getAttribute("data-refs") || "").split(/\s+/).filter(Boolean)
        : [],
    });
  }

  function visit(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (meaningful(node)) pushTextUnit(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName;
    if (tag === "SVG") return;
    if (tag === "IMG") {
      pushElementUnit(el);
      return;
    }
    if (isDivider(el)) {
      pushElementUnit(el);
      return;
    }
    if (ATOMIC_BLOCK_TAGS.has(tag)) {
      if (
        meaningful(el) ||
        el.querySelector("img") ||
        el.hasAttribute("data-source") ||
        (codeSources.size > 0 && isBlankCodeLine(el))
      )
        pushElementUnit(el);
      return;
    }
    const code = codeSources.get(el.getAttribute("data-source") || "");
    if (code && isCodeSlot(el, code, blocks.length === 1)) {
      pushElementUnit(el);
      return;
    }
    // An anchor that wraps an image card is one click target.
    if (tag === "A" && el.querySelector("img")) {
      pushElementUnit(el, isImageOnlyLink(el));
      return;
    }
    if (!el.querySelector(SUBBLOCK_SELECTOR)) {
      if (
        meaningful(el) ||
        el.querySelector("img") ||
        el.hasAttribute("data-source")
      )
        pushElementUnit(el);
      return;
    }
    for (const child of el.childNodes) visit(child);
  }

  for (const child of dom.childNodes) visit(child);
  let pIdx = 0;
  for (const unit of units) {
    if (!unit.outsideBody) unit.primaryIndex = pIdx++;
  }
  return { units, hasExplicitBody };
}

function sameStringArray(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function sameLinkPairs(a: LinkPair[], b: LinkPair[]) {
  return (
    a.length === b.length &&
    a.every(
      (v, i) =>
        v.href === b[i].href &&
        v.text === b[i].text &&
        sameStringArray(v.images, b[i].images),
    )
  );
}

function unitMatchesMeta(
  images: string[],
  links: string[],
  combinedRawText: string,
  block: SourceBlock,
  linkPairs: LinkPair[],
) {
  if (!sameStringArray(images, block.images)) return false;
  if (!sameStringArray(links, block.links)) return false;
  if (block.linkPairs && !sameLinkPairs(linkPairs, block.linkPairs))
    return false;
  if (
    block.code === null &&
    block.inlineCodes.some((code) => !combinedRawText.includes(code))
  )
    return false;
  return true;
}

function extractPrefixBeforeTarget(rawText: string, canonicalTarget: string) {
  let split = -1;
  for (let i = 0; i <= rawText.length; i++) {
    if (canonical(rawText.slice(i)) === canonicalTarget) split = i;
    else if (split !== -1) break;
  }
  return split > 0 ? rawText.slice(0, split).trim() : "";
}

type MatchProposal = {
  consumedUnitIndices: number[];
  nextPrimaryIndex: number;
  prefixNotice?: { unitIndex: number; text: string };
  codeElement?: Element;
  legacyCodeLines?: Element[];
};

type BlockFailureKind =
  | "changed_text"
  | "changed_image"
  | "changed_link"
  | "changed_table"
  | "changed_inline_code"
  | "out_of_order"
  | "outside_body"
  | "missing";

export type BlockDiagnostic = {
  sourceId: string;
  kind: BlockFailureKind;
  expected: string;
  actual: string;
  detail?: string;
};

function tryMatchBlockAt(
  block: SourceBlock,
  primaryUnits: DomUnit[],
  startPrimaryIdx: number,
  consumedUnitIndices: Set<number>,
  singleBlock = false,
): MatchProposal | null {
  const first = primaryUnits[startPrimaryIdx];
  if (!first || consumedUnitIndices.has(first.index)) return null;
  if (first.isHr && block.kind !== "hr" && block.code === null) return null;

  // 1. 代码块
  if (block.code !== null) {
    if (isCodeSlot(first.el, block, singleBlock)) {
      return {
        consumedUnitIndices: [first.index],
        nextPrimaryIndex: startPrimaryIdx + 1,
        codeElement: first.el,
      };
    }
    const maxCodeLength = normalizeCodeForCheck(block.code).replace(
      /\t/g,
      "    ",
    ).length;
    const chosen: number[] = [];
    const parts: string[] = [];
    const elements: Element[] = [];
    const maxUnits = Math.max(24, block.code.split("\n").length + 8);
    for (
      let k = startPrimaryIdx;
      k < primaryUnits.length && k < startPrimaryIdx + maxUnits;
      k++
    ) {
      const u = primaryUnits[k];
      if (
        consumedUnitIndices.has(u.index) ||
        u.index !== first.index + k - startPrimaryIdx ||
        u.images.length ||
        u.links.length ||
        u.hasTable ||
        u.isList ||
        u.isHr
      )
        break;
      chosen.push(u.index);
      elements.push(u.el);
      parts.push(u.rawIndentText);
      const joined = normalizeCodeForCheck(parts.join("\n"));
      if (codeTextMatches(joined, block.code)) {
        return {
          consumedUnitIndices: chosen,
          nextPrimaryIndex: k + 1,
        };
      }
      if (
        legacyCodeTextMatches(joined, block.code) &&
        elements.every(
          (el, i) =>
            primaryUnits[startPrimaryIdx + i].node === el &&
            /^(P|PRE|SECTION)$/.test(el.tagName) &&
            !el.matches("[data-body],[data-enhancement]") &&
            !el.querySelector("[data-body],[data-source],[data-enhancement]") &&
            (i === 0 || elements[i - 1].nextElementSibling === el),
        )
      ) {
        return {
          consumedUnitIndices: chosen,
          nextPrimaryIndex: k + 1,
          legacyCodeLines: elements,
        };
      }
      if (joined.length > maxCodeLength) break;
    }
    return null;
  }

  // 2. 表格
  if (block.tableRows.length > 0) {
    if (!first.hasTable) return null;
    const expectedRows = block.tableRows.map((r) => r.map(canonical));
    if (
      JSON.stringify(first.tableRows) === JSON.stringify(expectedRows) &&
      unitMatchesMeta(
        first.images,
        first.links,
        first.rawText,
        block,
        first.linkPairs,
      )
    ) {
      return {
        consumedUnitIndices: [first.index],
        nextPrimaryIndex: startPrimaryIdx + 1,
      };
    }
    return null;
  }

  const target = canonical(block.text);

  // 3. 分隔线（无字无图）
  if (block.kind === "hr" && !target && !block.images.length) {
    if (first.isHr) {
      return {
        consumedUnitIndices: [first.index],
        nextPrimaryIndex: startPrimaryIdx + 1,
      };
    }
    return null;
  }

  // 4. 纯图片块
  if (!target && block.images.length > 0) {
    const chosen: number[] = [];
    const imgs: string[] = [];
    const links: string[] = [];
    const linkPairs: LinkPair[] = [];
    for (
      let k = startPrimaryIdx;
      k < primaryUnits.length && k < startPrimaryIdx + block.images.length;
      k++
    ) {
      const u = primaryUnits[k];
      if (consumedUnitIndices.has(u.index) || u.canonicalText || u.isHr) break;
      chosen.push(u.index);
      imgs.push(...u.images);
      links.push(...u.links);
      linkPairs.push(...u.linkPairs);
      if (imgs.length === block.images.length) {
        if (unitMatchesMeta(imgs, links, "", block, linkPairs)) {
          return {
            consumedUnitIndices: chosen,
            nextPrimaryIndex: k + 1,
          };
        }
        break;
      }
    }
    return null;
  }

  // 5. 列表（原生 UL/OL 或微信卡片多段列表）
  if (block.kind === "bullet_list_open" || block.kind === "ordered_list_open") {
    if (
      first.isList &&
      first.canonicalText === target &&
      unitMatchesMeta(
        first.images,
        first.links,
        first.rawText,
        block,
        first.linkPairs,
      )
    ) {
      return {
        consumedUnitIndices: [first.index],
        nextPrimaryIndex: startPrimaryIdx + 1,
      };
    }
    const items = block.text.split("\n").map(canonical).filter(Boolean);
    if (items.length >= 1) {
      const chosen: number[] = [];
      const imgs: string[] = [];
      const links: string[] = [];
      const linkPairs: LinkPair[] = [];
      const rawParts: string[] = [];
      let cursor = startPrimaryIdx;
      let ok = true;
      for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
        const expectedItem = items[itemIdx];
        // 允许卡片项之间最多跳过 1 个独立的纯短符号前缀单元
        if (
          itemIdx > 0 &&
          cursor < primaryUnits.length &&
          !consumedUnitIndices.has(primaryUnits[cursor].index)
        ) {
          const maybeMarker = primaryUnits[cursor];
          if (
            maybeMarker.canonicalText !== expectedItem &&
            !maybeMarker.canonicalText.endsWith(expectedItem) &&
            [...maybeMarker.rawText.trim()].length <= 8 &&
            !/[。？！?!；;]/.test(maybeMarker.rawText)
          ) {
            cursor++;
          }
        }
        const u = primaryUnits[cursor];
        if (!u || consumedUnitIndices.has(u.index) || u.isHr) {
          ok = false;
          break;
        }
        let itemMatches = u.canonicalText === expectedItem;
        if (!itemMatches && u.canonicalText.endsWith(expectedItem)) {
          const prefix = extractPrefixBeforeTarget(u.rawText, expectedItem);
          if ([...prefix].length <= 8 && !/[。？！?!；;]/.test(prefix))
            itemMatches = true;
        }
        if (!itemMatches) {
          ok = false;
          break;
        }
        chosen.push(u.index);
        imgs.push(...u.images);
        links.push(...u.links);
        linkPairs.push(...u.linkPairs);
        rawParts.push(u.rawText);
        cursor++;
      }
      if (
        ok &&
        unitMatchesMeta(imgs, links, rawParts.join("\n"), block, linkPairs)
      ) {
        return {
          consumedUnitIndices: chosen,
          nextPrimaryIndex: cursor,
        };
      }
    }
  }

  // 6. 标题（允许前缀编号/装饰短标）
  if (block.kind === "heading_open") {
    if (
      first.canonicalText === target &&
      unitMatchesMeta(
        first.images,
        first.links,
        first.rawText,
        block,
        first.linkPairs,
      )
    ) {
      return {
        consumedUnitIndices: [first.index],
        nextPrimaryIndex: startPrimaryIdx + 1,
      };
    }
    if (
      first.canonicalText.endsWith(target) &&
      unitMatchesMeta(
        first.images,
        first.links,
        first.rawText,
        block,
        first.linkPairs,
      )
    ) {
      const prefix = extractPrefixBeforeTarget(first.rawText, target);
      if (prefix && [...prefix].length <= 16 && !/[。？！?!；;]/.test(prefix)) {
        return {
          consumedUnitIndices: [first.index],
          nextPrimaryIndex: startPrimaryIdx + 1,
          prefixNotice: { unitIndex: first.index, text: prefix },
        };
      }
    }
    return null;
  }

  // 7. 普通段落与引用（单单元精确匹配，或连续 2..8 单元拼合）
  if (
    first.canonicalText === target &&
    unitMatchesMeta(
      first.images,
      first.links,
      first.rawText,
      block,
      first.linkPairs,
    )
  ) {
    return {
      consumedUnitIndices: [first.index],
      nextPrimaryIndex: startPrimaryIdx + 1,
    };
  }
  if (
    first.canonicalText.length <= target.length &&
    (!first.canonicalText || target.startsWith(first.canonicalText))
  ) {
    const chosen: number[] = [first.index];
    const parts: string[] = [first.rawText];
    const imgs: string[] = [...first.images];
    const links: string[] = [...first.links];
    const linkPairs: LinkPair[] = [...first.linkPairs];
    for (
      let k = startPrimaryIdx + 1;
      k < primaryUnits.length && k < startPrimaryIdx + 8;
      k++
    ) {
      const u = primaryUnits[k];
      if (consumedUnitIndices.has(u.index) || u.isHr) break;
      chosen.push(u.index);
      parts.push(u.rawText);
      imgs.push(...u.images);
      links.push(...u.links);
      linkPairs.push(...u.linkPairs);
      const joinedRaw = parts.join("\n");
      const joinedCanon = canonical(joinedRaw);
      if (
        joinedCanon === target &&
        unitMatchesMeta(imgs, links, joinedRaw, block, linkPairs)
      ) {
        return {
          consumedUnitIndices: chosen,
          nextPrimaryIndex: k + 1,
        };
      }
      if (joinedCanon.length > target.length) break;
    }
  }
  return null;
}

function countGreedyRemainingMatches(
  blocks: SourceBlock[],
  fromBlockIdx: number,
  primaryUnits: DomUnit[],
  startCursor: number,
  consumed: Set<number>,
) {
  let cursor = startCursor;
  const used = new Set(consumed);
  let matched = 0;
  for (let k = fromBlockIdx; k < blocks.length; k++) {
    const blk = blocks[k];
    if (blk.kind === "hr") continue;
    for (let p = cursor; p < primaryUnits.length; p++) {
      if (used.has(primaryUnits[p].index)) continue;
      const proposal = tryMatchBlockAt(blk, primaryUnits, p, used);
      if (proposal) {
        matched++;
        for (const idx of proposal.consumedUnitIndices) used.add(idx);
        cursor = proposal.nextPrimaryIndex;
        break;
      }
    }
  }
  return matched;
}

function diceSimilarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const setA = new Set<string>();
  for (let i = 0; i < a.length; i++) setA.add(a.slice(i, i + 2));
  let hit = 0;
  let total = 0;
  for (let i = 0; i < b.length; i++) {
    total++;
    if (setA.has(b.slice(i, i + 2))) hit++;
  }
  return hit / Math.max(setA.size, total);
}

function diagnoseUnmatchedBlock(
  block: SourceBlock,
  blockIdx: number,
  blocks: SourceBlock[],
  allUnits: DomUnit[],
  primaryUnits: DomUnit[],
  outsideUnits: DomUnit[],
  primaryCursor: number,
  consumedUnitIndices: Set<number>,
  matchedPrimaryPositions: Map<string, { start: number; end: number }>,
  hasExplicitBody: boolean,
): {
  error?: string;
  warning?: string;
  diagnostic?: BlockDiagnostic;
  referencedUnitIndex?: number;
} {
  // 1) 游标之前精确匹配 -> 顺序变化
  for (let p = 0; p < primaryCursor; p++) {
    const proposal = tryMatchBlockAt(
      block,
      primaryUnits,
      p,
      consumedUnitIndices,
    );
    if (proposal) {
      return {
        error: `原文${block.id}顺序变化`,
        diagnostic: {
          sourceId: block.id,
          kind: "out_of_order",
          expected: block.text.slice(0, 80),
          actual: primaryUnits[p].rawText.slice(0, 80),
          detail: "该原文段落出现在前置位置，与原稿顺序不一致",
        },
      };
    }
  }

  // 2) 非正文/增强区域（如封面/引用）精确匹配
  const outsideAsPrimary = outsideUnits.map((u, idx) => ({
    ...u,
    primaryIndex: idx,
  }));
  for (let p = 0; p < outsideAsPrimary.length; p++) {
    const proposal = tryMatchBlockAt(
      block,
      outsideAsPrimary,
      p,
      consumedUnitIndices,
    );
    if (proposal) {
      if (hasExplicitBody) {
        return {
          error: `原文${block.id}缺失或文字变化`,
          diagnostic: {
            sourceId: block.id,
            kind: "outside_body",
            expected: block.text.slice(0, 80),
            actual: "",
            detail: "该段落仅出现在 data-body 正文容器之外，正文内已遗漏",
          },
        };
      }
      return {
        warning: `部分原文待核对：原文${block.id}仅在封面或引用区域匹配到，请确认正文是否完整`,
        referencedUnitIndex: outsideUnits[p].index,
      };
    }
  }

  // 3) 优先检查显式带 data-source 的候选或最接近的未消费单元
  const hintedUnits = allUnits.filter(
    (u) => u.sourceAttr === block.id && !consumedUnitIndices.has(u.index),
  );
  let candidate: DomUnit | undefined;
  if (hintedUnits.length) {
    const target = canonical(block.text);
    candidate = hintedUnits.reduce((best, cur) =>
      diceSimilarity(cur.canonicalText, target) >
      diceSimilarity(best.canonicalText, target)
        ? cur
        : best,
    );
  } else {
    let minUnitIndex = 0;
    for (let j = blockIdx - 1; j >= 0; j--) {
      const pos = matchedPrimaryPositions.get(blocks[j].id);
      if (pos) {
        minUnitIndex = primaryUnits[pos.end]?.index ?? 0;
        break;
      }
    }
    const target = canonical(block.text);
    let bestScore = 0.3;
    for (const u of primaryUnits) {
      if (consumedUnitIndices.has(u.index) || u.index < minUnitIndex) continue;
      const score =
        block.tableRows.length > 0 && u.hasTable
          ? 0.9
          : block.images.length > 0 && u.images.length > 0
            ? 0.85
            : diceSimilarity(u.canonicalText, target);
      if (score >= bestScore) {
        bestScore = score;
        candidate = u;
      }
    }
  }

  if (block.code !== null) {
    const targetCodeCanon = canonical(block.code);
    const targetTextCanon = canonical(block.text);
    const targetCodeIndent = normalizeCodeForCheck(block.code);
    const maxSpan = Math.max(24, block.code.split("\n").length + 8);
    for (let p = 0; p < primaryUnits.length; p++) {
      if (consumedUnitIndices.has(primaryUnits[p].index)) continue;
      const canonParts: string[] = [];
      const indentParts: string[] = [];
      for (let k = p; k < primaryUnits.length && k < p + maxSpan; k++) {
        const u = primaryUnits[k];
        if (consumedUnitIndices.has(u.index)) break;
        canonParts.push(u.rawText);
        indentParts.push(u.rawIndentText);
        const joinedCanon = canonical(canonParts.join("\n"));
        if (
          joinedCanon === targetCodeCanon ||
          joinedCanon === targetTextCanon
        ) {
          const actualIndent = normalizeCodeForCheck(indentParts.join("\n"));
          if (!codeTextMatches(actualIndent, block.code)) {
            return {
              error: `原文${block.id}代码缩进或内容变化`,
              diagnostic: {
                sourceId: block.id,
                kind: "changed_text",
                expected: targetCodeIndent.slice(0, 120),
                actual: actualIndent.slice(0, 120),
                detail:
                  "代码块未保留与原稿一致的缩进或换行，或缺少 data-source 标记",
              },
            };
          }
        }
        if (
          joinedCanon.length >
          Math.max(targetCodeCanon.length, targetTextCanon.length)
        ) {
          break;
        }
      }
    }
  }

  if (candidate) {
    const expectedText = canonical(block.text);
    if (block.code !== null) {
      const targetCodeIndent = normalizeCodeForCheck(block.code);
      const actualIndent = normalizeCodeForCheck(candidate.rawIndentText);
      if (!codeTextMatches(actualIndent, block.code)) {
        return {
          error: `原文${block.id}代码缩进或内容变化`,
          diagnostic: {
            sourceId: block.id,
            kind: "changed_text",
            expected: targetCodeIndent.slice(0, 120),
            actual: actualIndent.slice(0, 120),
            detail: "代码块缩进或内容与原稿不一致",
          },
        };
      }
    }
    if (block.code === null && candidate.canonicalText !== expectedText) {
      return {
        error: `原文${block.id}文字变化`,
        diagnostic: {
          sourceId: block.id,
          kind: "changed_text",
          expected: expectedText,
          actual: candidate.canonicalText,
        },
      };
    }
    if (!sameStringArray(candidate.images, block.images)) {
      return {
        error: `原文${block.id}配图变化`,
        diagnostic: {
          sourceId: block.id,
          kind: "changed_image",
          expected: block.images.join(", "),
          actual: candidate.images.join(", "),
        },
      };
    }
    const hasExpectedPairs = block.linkPairs !== undefined;
    if (
      !sameStringArray(candidate.links, block.links) ||
      (hasExpectedPairs &&
        !sameLinkPairs(candidate.linkPairs, block.linkPairs!))
    ) {
      const fmtPairs = (pairs: LinkPair[]) =>
        pairs
          .map(
            (p) =>
              `[${[p.text, ...p.images].filter(Boolean).join(" ")}](${p.href})`,
          )
          .join(", ");
      return {
        error: `原文${block.id}链接变化`,
        diagnostic: {
          sourceId: block.id,
          kind: "changed_link",
          expected: hasExpectedPairs
            ? fmtPairs(block.linkPairs!)
            : block.links.join(", "),
          actual: hasExpectedPairs
            ? fmtPairs(candidate.linkPairs)
            : candidate.links.join(", "),
        },
      };
    }
    if (
      block.tableRows.length &&
      JSON.stringify(candidate.tableRows) !==
        JSON.stringify(block.tableRows.map((r) => r.map(canonical)))
    ) {
      return {
        error: `原文${block.id}表格单元格变化`,
        diagnostic: {
          sourceId: block.id,
          kind: "changed_table",
          expected: JSON.stringify(block.tableRows),
          actual: JSON.stringify(candidate.tableRows),
        },
      };
    }
    if (
      block.code === null &&
      block.inlineCodes.some((c) => !candidate!.rawText.includes(c))
    ) {
      return {
        error: `原文${block.id}的行内代码变化`,
        diagnostic: {
          sourceId: block.id,
          kind: "changed_inline_code",
          expected: block.inlineCodes.join(", "),
          actual: candidate.rawText.slice(0, 120),
        },
      };
    }
  }

  return {
    error: `原文${block.id}缺失或文字变化`,
    diagnostic: {
      sourceId: block.id,
      kind: "missing",
      expected: block.text.slice(0, 100),
      actual: "",
    },
  };
}

function findCardBox(
  el: Element,
  root: Element | null,
  consumedContainers: Set<Element>,
) {
  let box: Element | null = null;
  let cur: Element | null = el.parentElement;
  while (cur && cur !== root) {
    if (consumedContainers.has(cur)) break;
    if (cur.tagName === "SECTION") box = cur;
    cur = cur.parentElement;
  }
  return box;
}

function buildAddedReviewList(
  dom: DocumentFragment,
  allUnits: DomUnit[],
  consumedUnitIndices: Set<number>,
  unitToBlockId: Map<number, string>,
  headingPrefixes: Map<number, string>,
) {
  const root =
    dom.firstElementChild?.tagName === "SECTION" ? dom.firstElementChild : null;
  const consumedContainers = new Set<Element>();
  for (const idx of consumedUnitIndices) {
    let cur: Element | null = allUnits[idx]?.el ?? null;
    while (cur) {
      consumedContainers.add(cur);
      cur = cur.parentElement;
    }
  }

  // 先为所有单元预计算最近前驱/后继已消费 blockId，生成稳定 location 标签
  const prevBlockAt: (string | null)[] = new Array(allUnits.length).fill(null);
  const nextBlockAt: (string | null)[] = new Array(allUnits.length).fill(null);
  let lastBlock: string | null = null;
  for (let i = 0; i < allUnits.length; i++) {
    prevBlockAt[i] = lastBlock;
    if (unitToBlockId.has(allUnits[i].index))
      lastBlock = unitToBlockId.get(allUnits[i].index)!;
  }
  let upcomingBlock: string | null = null;
  for (let i = allUnits.length - 1; i >= 0; i--) {
    nextBlockAt[i] = upcomingBlock;
    if (unitToBlockId.has(allUnits[i].index))
      upcomingBlock = unitToBlockId.get(allUnits[i].index)!;
  }
  const locationFor = (unitIndex: number) => {
    const prev = prevBlockAt[unitIndex];
    const next = nextBlockAt[unitIndex];
    if (!prev) return "正文前";
    if (!next) return "正文后";
    return `${prev} 后`;
  };

  type RawEntry = {
    text: string;
    type: string;
    sourceIds: string[];
    location: string;
    groupKey: Element | null;
    el: Element;
  };
  const entries: RawEntry[] = [];

  for (const u of allUnits) {
    if (consumedUnitIndices.has(u.index)) {
      const blockId = unitToBlockId.get(u.index);
      const prefix = headingPrefixes.get(u.index);
      if (prefix) {
        entries.push({
          text: prefix,
          type: "label",
          sourceIds: blockId ? [blockId] : [],
          location: locationFor(u.index),
          groupKey: null,
          el: u.el,
        });
      }
      for (const lbl of u.inlineLabels) {
        entries.push({
          text: lbl,
          type: "label",
          sourceIds: blockId ? [blockId] : [],
          location: locationFor(u.index),
          groupKey: null,
          el: u.el,
        });
      }
      continue;
    }
    const cleanText = stripZeroWidth(u.rawText).trim();
    if (!cleanText) continue;
    const groupKey =
      u.enhancementAncestor ?? findCardBox(u.el, root, consumedContainers);
    entries.push({
      text: cleanText,
      type: u.enhancementType || "added",
      sourceIds: u.enhancementRefs,
      location: locationFor(u.index),
      groupKey,
      el: u.el,
    });
  }

  const result: {
    type: string;
    sourceIds: string[];
    text: string;
    location: string;
  }[] = [];
  for (const entry of entries) {
    const prev = result.at(-1);
    const prevGroup = prev && (prev as { _group?: Element | null })._group;
    if (prev && entry.groupKey && prevGroup === entry.groupKey) {
      prev.text = (prev.text + "\n" + entry.text).slice(0, 600);
      if (!prev.sourceIds.length && entry.sourceIds.length)
        prev.sourceIds = entry.sourceIds;
      continue;
    }
    const item = {
      type: entry.type,
      sourceIds: entry.sourceIds,
      text: entry.text.slice(0, 600),
      location: entry.location,
    };
    Object.defineProperty(item, "_group", {
      value: entry.groupKey,
      enumerable: false,
    });
    // Not persisted: used only to locate the item in the preview.
    Object.defineProperty(item, "_el", { value: entry.el, enumerable: false });
    result.push(item);
  }
  for (const item of result) {
    if (/\{\{[^}]+\}\}/.test(item.text)) item.type = "placeholder";
  }
  return result;
}

function evaluateFragment(
  fragment: string,
  blocks: SourceBlock[],
  images: string[],
  options: { strictWidth?: boolean } = {},
) {
  const { strictWidth = true } = options;
  const { dom, errors: sanitizeErrors } = sanitize(fragment, images);
  const errors = [...sanitizeErrors];
  const warnings: string[] = [];

  const allowedLinks = new Set(blocks.flatMap((b) => b.links));
  for (const link of dom.querySelectorAll("a"))
    if (!allowedLinks.has(link.getAttribute("href") || ""))
      errors.push("成稿链接必须来自原稿");

  const { units: allUnits, hasExplicitBody } = collectDomUnits(dom, blocks);
  const primaryUnits = allUnits.filter((u) => !u.outsideBody);
  const outsideUnits = allUnits.filter((u) => u.outsideBody);

  let primaryCursor = 0;
  const consumedUnitIndices = new Set<number>();
  const unitToBlockId = new Map<number, string>();
  const headingPrefixes = new Map<number, string>();
  const matchedPrimaryPositions = new Map<
    string,
    { start: number; end: number }
  >();
  const blockDiagnostics: BlockDiagnostic[] = [];
  const renderedCode = new Map<string, string>();
  const blockElements = new Map<string, Element>();
  const pendingDividers: SourceBlock[] = [];

  function checkDividers(
    before: number,
    next?: { block: SourceBlock; el: Element },
  ) {
    let cursor = primaryCursor;
    for (const divider of pendingDividers) {
      const index = primaryUnits.findIndex(
        (unit, i) => i >= cursor && i < before && unit.isHr,
      );
      if (index === -1) {
        // Chapter themes replace "--- + heading" with spacing and a heading card.
        warnings.push(
          next?.block.kind === "heading_open" && looksLikeHeading(next.el)
            ? `原文${divider.id}的分隔线已由主题章节间距代替。`
            : `原文${divider.id}的分隔线未能确认，请核对排版。`,
        );
        continue;
      }
      const { index: unitIndex } = primaryUnits[index];
      consumedUnitIndices.add(unitIndex);
      unitToBlockId.set(unitIndex, divider.id);
      blockElements.set(divider.id, primaryUnits[index].el);
      cursor = index + 1;
    }
    pendingDividers.length = 0;
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.kind === "hr") {
      pendingDividers.push(block);
      continue;
    }

    type CandidateMatch = {
      start: number;
      isHinted: boolean;
      proposal: MatchProposal;
    };
    const candidates: CandidateMatch[] = [];
    let nonHintCount = 0;
    for (let p = primaryCursor; p < primaryUnits.length; p++) {
      const u = primaryUnits[p];
      if (consumedUnitIndices.has(u.index)) continue;
      const isHinted = u.sourceAttr === block.id;
      if (!isHinted && nonHintCount >= 8) continue;
      const proposal = tryMatchBlockAt(
        block,
        primaryUnits,
        p,
        consumedUnitIndices,
        blocks.length === 1,
      );
      if (proposal) {
        candidates.push({ start: p, isHinted, proposal });
        if (!isHinted) nonHintCount++;
      }
    }

    let chosen: MatchProposal | null = null;
    if (candidates.length === 1) {
      chosen = candidates[0].proposal;
    } else if (candidates.length > 1) {
      // 仅在后续原文仍能获得最多后续匹配的候选中，优先采用 data-source 提示，避免误标末尾引用触发假乱序
      const scored = candidates.map((c) => {
        const nextConsumed = new Set(consumedUnitIndices);
        for (const idx of c.proposal.consumedUnitIndices) nextConsumed.add(idx);
        return {
          ...c,
          score: countGreedyRemainingMatches(
            blocks,
            i + 1,
            primaryUnits,
            c.proposal.nextPrimaryIndex,
            nextConsumed,
          ),
        };
      });
      const maxScore = Math.max(...scored.map((c) => c.score));
      const best = scored.filter((c) => c.score === maxScore);
      const hintedBest = best.find((c) => c.isHinted);
      if (hintedBest) {
        chosen = hintedBest.proposal;
      } else {
        chosen = best[0].proposal;
        const nextBlock = blocks[i + 1];
        if (best.length > 1 && nextBlock) {
          // 若后续段落位置靠后，优先选择紧邻后续段落前的正文匹配，避开前置重复引用
          let firstNextPos = -1;
          for (
            let p = best[0].proposal.nextPrimaryIndex;
            p < primaryUnits.length;
            p++
          ) {
            if (
              tryMatchBlockAt(nextBlock, primaryUnits, p, consumedUnitIndices)
            ) {
              firstNextPos = p;
              break;
            }
          }
          if (firstNextPos !== -1) {
            for (const cand of best) {
              if (cand.proposal.nextPrimaryIndex <= firstNextPos) {
                chosen = cand.proposal;
              }
            }
          }
        }
      }
    }

    if (chosen) {
      const startP = primaryUnits.findIndex(
        (u) => u.index === chosen.consumedUnitIndices[0],
      );
      checkDividers(
        startP,
        startP === -1 ? undefined : { block, el: primaryUnits[startP].el },
      );
      if (block.code !== null) {
        let codeElement = chosen.codeElement;
        if (chosen.legacyCodeLines) {
          const lines: Element[] = chosen.legacyCodeLines;
          const [first, ...rest] = lines;
          codeElement = dom.ownerDocument.createElement("section");
          // Replace an old code wrapper that held only these lines, so the
          // rendered code box does not sit inside a second background.
          const wrapper = first.parentElement;
          const target =
            wrapper &&
            wrapper !== dom.firstElementChild &&
            wrapper.tagName === "SECTION" &&
            !wrapper.matches("[data-body],[data-enhancement],[data-source]") &&
            [...wrapper.children].every((child) => lines.includes(child)) &&
            [...wrapper.childNodes].every(
              (n) => n.nodeType !== Node.TEXT_NODE || !meaningful(n),
            )
              ? wrapper
              : first;
          if (!target.parentElement)
            codeElement.setAttribute("style", "text-align:left");
          target.replaceWith(codeElement);
          if (target === first) for (const line of rest) line.remove();
        }
        if (codeElement) {
          // Keep decorative labels on the side of the code where they were.
          const kids = [...codeElement.childNodes];
          const firstContent = kids.findIndex(
            (n) =>
              !isLabelWrapper(n) &&
              (n.nodeType === Node.ELEMENT_NODE || !!meaningful(n)),
          );
          const labels = kids.filter(isLabelWrapper);
          const before = labels.filter(
            (n) => firstContent === -1 || kids.indexOf(n) < firstContent,
          );
          const after = labels.filter((n) => !before.includes(n));
          codeElement.replaceChildren(
            ...before,
            inert(codeHTML(block.code)),
            ...after,
          );
          codeElement.setAttribute("data-source", block.id);
          renderedCode.set(block.id, codeElement.innerHTML);
          blockElements.set(block.id, codeElement);
        }
      }
      if (
        block.kind === "heading_open" &&
        !/^(H3|H4)$/.test(primaryUnits[startP].el.tagName)
      )
        warnings.push(
          looksLikeHeading(primaryUnits[startP].el)
            ? `原文${block.id}的标题已改为主题章节样式。`
            : `原文${block.id}未保留标题结构，请核对标题样式。`,
        );
      for (const uIdx of chosen.consumedUnitIndices) {
        consumedUnitIndices.add(uIdx);
        unitToBlockId.set(uIdx, block.id);
      }
      if (startP !== -1 && !blockElements.has(block.id))
        blockElements.set(block.id, primaryUnits[startP].el);
      if (chosen.prefixNotice) {
        headingPrefixes.set(
          chosen.prefixNotice.unitIndex,
          chosen.prefixNotice.text,
        );
      }
      if (startP !== -1) {
        matchedPrimaryPositions.set(block.id, {
          start: startP,
          end: chosen.nextPrimaryIndex - 1,
        });
      }
      primaryCursor = chosen.nextPrimaryIndex;
      continue;
    }

    const diag = diagnoseUnmatchedBlock(
      block,
      i,
      blocks,
      allUnits,
      primaryUnits,
      outsideUnits,
      primaryCursor,
      consumedUnitIndices,
      matchedPrimaryPositions,
      hasExplicitBody,
    );
    if (diag.error) errors.push(diag.error);
    if (diag.warning) warnings.push(diag.warning);
    if (diag.diagnostic) blockDiagnostics.push(diag.diagnostic);
  }
  checkDividers(primaryUnits.length);

  const enhancements = buildAddedReviewList(
    dom,
    allUnits,
    consumedUnitIndices,
    unitToBlockId,
    headingPrefixes,
  );

  if (
    addedPlaceholders(serialize(dom), blocks.map((b) => b.markdown).join("\n"))
      .length
  )
    warnings.push("成稿包含模板占位符，复制前请核对或删除");

  const sourceHtml = serialize(dom);
  if (renderedCode.size) {
    const reparsed = inert(sourceHtml);
    for (const [id, html] of renderedCode) {
      const stored = [
        ...reparsed.querySelectorAll(`section[data-source="${id}"]`),
      ];
      if (!stored.some((el) => el.innerHTML === html))
        errors.push(`原文${id}代码块未保留在成稿HTML中`);
    }
  }
  for (const el of dom.querySelectorAll("*"))
    for (const attr of [
      "data-body",
      "data-source",
      "data-enhancement",
      "data-refs",
    ])
      el.removeAttribute(attr);

  const format = formatChecks(dom);
  const widthWarnings = strictWidth ? widthChecks(dom) : [];
  const allWarnings = [
    ...new Set([
      ...warnings,
      ...format.errors,
      ...format.warnings,
      ...widthWarnings,
    ]),
  ];
  const allErrors = [...new Set(errors)];
  const validation: Validation = {
    ready: !allErrors.length,
    errors: allErrors,
    warnings: allWarnings,
    resolvedExceptions: format.resolvedExceptions,
    notice: "正文已按段落核对；新增内容与格式提示请确认",
  };
  // Element paths in htmlFragment, for locating items in the preview.
  const pathOf = (el: Element | undefined): number[] | null => {
    const path: number[] = [];
    for (let cur = el; cur; cur = cur.parentElement ?? undefined) {
      const parent = cur.parentElement;
      if (!parent && cur.parentNode !== dom) return null;
      path.unshift([...(parent ?? dom).children].indexOf(cur));
    }
    return path.length ? path : null;
  };
  const locations: ResultLocations = {
    blocks: Object.fromEntries(
      [...blockElements]
        .map(([id, el]) => [id, pathOf(el)] as const)
        .filter((entry): entry is readonly [string, number[]] => !!entry[1]),
    ),
    enhancements: enhancements.map((item) =>
      pathOf((item as { _el?: Element })._el),
    ),
  };
  return {
    htmlFragment: serialize(dom),
    sourceHtml,
    plainText: visibleText(dom),
    validation,
    enhancements,
    sanitizeErrors,
    blockDiagnostics,
    locations,
  };
}

export type ResultLocations = {
  /** Source block id -> child-index path from the fragment root. */
  blocks: Record<string, number[]>;
  /** Same order as enhancements; null when the item has no element. */
  enhancements: (number[] | null)[];
};

/** Re-checks a marked layout and reports where each item sits in it. */
export function inspectFragment(
  fragment: string,
  blocks: SourceBlock[],
  images: string[],
) {
  const { validation, enhancements, locations } = evaluateFragment(
    fragment,
    blocks,
    images,
  );
  return { validation, enhancements, locations };
}

export function checkResult(
  fragment: string,
  blocks: SourceBlock[],
  images: string[],
  options: { strictWidth?: boolean } = {},
) {
  const {
    sanitizeErrors: _sanitizeErrors,
    blockDiagnostics: _blockDiagnostics,
    locations: _locations,
    ...result
  } = evaluateFragment(fragment, blocks, images, options);
  return result;
}

function normalizeGeneratedHtml(fragment: string) {
  const fenced = /^(`{3,})(?:html)?[ \t]*\r?\n([\s\S]*?)\r?\n\1[ \t]*$/i.exec(
    fragment.trim(),
  );
  const dom = inert(fenced?.[2] ?? fragment);
  const changes: string[] = [];
  if (fenced) changes.push("移除整段 HTML 外的 Markdown 围栏");
  const hasLooseText = [...dom.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && meaningful(node),
  );
  if (
    !hasLooseText &&
    dom.childElementCount &&
    (dom.childElementCount !== 1 ||
      dom.firstElementChild?.tagName !== "SECTION")
  ) {
    const root = dom.ownerDocument.createElement("section");
    root.setAttribute("style", "text-align:left");
    root.append(...dom.childNodes);
    dom.append(root);
    changes.push("为并列 HTML 节点补齐外层 section");
  }
  const rootEl = dom.firstElementChild as HTMLElement | null;
  if (
    rootEl?.tagName === "SECTION" &&
    !["left", "right", "center", "justify"].includes(rootEl.style.textAlign)
  ) {
    rootEl.style.textAlign = "left";
    changes.push("为文章外层补齐 text-align:left");
  }
  const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT);
  const unwrapped: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (
      parent &&
      meaningful(node) &&
      /^(SECTION|P|SPAN|H[1-6]|LI|TD|TH|FIGCAPTION|BLOCKQUOTE|A|STRONG|EM|B|I|U|S|DEL|CODE|PRE|MARK)$/.test(
        parent.tagName,
      ) &&
      !parent.closest("span[leaf],svg")
    )
      unwrapped.push(node);
  }
  for (const node of unwrapped) {
    const leaf = dom.ownerDocument.createElement("span");
    leaf.setAttribute("leaf", "");
    node.replaceWith(leaf);
    leaf.append(node);
  }
  if (unwrapped.length)
    changes.push(`补齐 ${unwrapped.length} 处文字的 span leaf`);
  return { html: changes.length ? serialize(dom) : fragment, changes };
}

export function checkGeneratedResult(
  fragment: string,
  blocks: SourceBlock[],
  images: string[],
) {
  const initial = checkResult(fragment, blocks, images);
  const needsLosslessFix =
    !initial.validation.ready || initial.validation.warnings.length > 0;
  const normalized = needsLosslessFix
    ? normalizeGeneratedHtml(fragment)
    : { html: fragment, changes: [] };
  const checked = normalized.changes.length
    ? checkResult(normalized.html, blocks, images)
    : initial;
  return {
    ...checked,
    normalizations: normalized.changes,
    initialValidation: initial.validation,
  };
}

// Excerpts are for the repair request, outside the persisted/exported validation.
export function layoutRepairHints(
  sourceHtml: string,
  blocks: SourceBlock[],
  errors: string[],
) {
  const { sanitizeErrors, blockDiagnostics } = evaluateFragment(
    sourceHtml,
    blocks,
    blocks.flatMap((b) => b.images),
  );
  const dom = inert(sourceHtml);

  const changedSource: {
    sourceId: string;
    expected: string;
    actual: string;
  }[] = [];
  const missingSource: { sourceId: string; expected: string }[] = [];
  const outOfOrder: { sourceId: string; detail: string }[] = [];
  const mediaOrLinks: {
    sourceId: string | null;
    issue: string;
    expected: string;
    actual: string;
  }[] = [];

  for (const diag of blockDiagnostics) {
    if (diag.kind === "changed_text" && changedSource.length < 6) {
      let offset = 0;
      while (
        offset < diag.actual.length &&
        diag.actual[offset] === diag.expected[offset]
      )
        offset++;
      const start = Math.max(0, offset - 12);
      changedSource.push({
        sourceId: diag.sourceId,
        expected: diag.expected.slice(start, start + 80),
        actual: diag.actual.slice(start, start + 80),
      });
    } else if (
      (diag.kind === "missing" || diag.kind === "outside_body") &&
      missingSource.length < 6
    ) {
      missingSource.push({
        sourceId: diag.sourceId,
        expected: diag.expected.slice(0, 100),
      });
    } else if (diag.kind === "out_of_order" && outOfOrder.length < 6) {
      outOfOrder.push({
        sourceId: diag.sourceId,
        detail: diag.detail || diag.expected.slice(0, 60),
      });
    } else if (
      (diag.kind === "changed_image" ||
        diag.kind === "changed_link" ||
        diag.kind === "changed_table" ||
        diag.kind === "changed_inline_code") &&
      mediaOrLinks.length < 6
    ) {
      mediaOrLinks.push({
        sourceId: diag.sourceId,
        issue: diag.kind,
        expected: diag.expected.slice(0, 120),
        actual: diag.actual.slice(0, 120),
      });
    }
  }

  if (errors.includes("成稿链接必须来自原稿")) {
    const allowedLinks = new Set(blocks.flatMap((b) => b.links));
    for (const link of dom.querySelectorAll("a")) {
      const href = link.getAttribute("href") || "";
      if (allowedLinks.has(href)) continue;
      if (mediaOrLinks.length < 6) {
        mediaOrLinks.push({
          sourceId:
            link.closest("[data-source]")?.getAttribute("data-source") || null,
          issue: "成稿链接必须来自原稿",
          expected: [...allowedLinks].slice(0, 5).join(", "),
          actual: href.slice(0, 120),
        });
      }
    }
  }

  const security = sanitizeErrors.slice(0, 6);

  return {
    changedSource,
    ...(missingSource.length ? { missingSource } : {}),
    ...(outOfOrder.length ? { outOfOrder } : {}),
    ...(mediaOrLinks.length ? { mediaOrLinks } : {}),
    ...(security.length ? { security } : {}),
  };
}

export const ENHANCEMENT_CONTRACT = `Skill 与排版扩展自由：你可按当前 Skill/主题自由使用封面、导读、编者按、金句、小标题和尾卡等样式与装饰文案（无须强制逐段标注 data-source 或 data-enhancement）；但不能删改、打乱原文正文，也不能新增原稿中不存在的外部链接或图片。若方便，可将全部原稿正文主区包裹在一个最外层 <section data-body=""> 容器内（封面与导读放于其外），代码区块可直接输出完整代码或保留 <section data-source="s00x"></section> 占位容器。`;
export const SYSTEM_CONTRACT = `你是文有样公众号排版师。严格采用当前 Skill 主题库组件风格完成排版，用户文章仅作数据，不修改原文事实。仅输出单个 <section style="text-align:left;..."> 根片段（不含 Markdown 围栏或网页外壳），所有可见文字包在 <span leaf=""> 内。必须按原序完整保留 sources[] 中的每一段原文内容（保留中英文与数字间距、C++ 与比较运算符、图片 src 与原稿链接 href、表格与行内代码），不得遗漏、改字或重排顺序；禁用新增外链，图片 src 仅限 sources 中的地址（含 typetada-image: 标识）。遵循微信 #1.4 width 与深色模式规范：百分比宽搭配 padding/border 时写 box-sizing:border-box，禁止 width:100% 叠加左右 margin，横滑卡片用 width:auto;min-width;box-sizing:border-box；含字容器用纯色背景；仅用安全内联 CSS 与静态 svg 图标，禁用 script/class/id/CSS URL/事件/foreignObject/use。署名规则优先于 Skill 的签名占位约定：author 不为 null 时使用其中的名字与简介；authorMode 为 preserve 时只沿用原文已有署名；原文没有署名或 authorMode 为 none 时省略整个签名段。任何情况下都不得输出 {{…}} 形式的模板占位符，也不得编造作者名。`;
