import { unzipSync } from "fflate";
import { epoch } from "./db";
import { imageFromBytes } from "./images";

function checkedZip(bytes: Uint8Array) {
  if (bytes.length > 10 * 1024 * 1024) throw new Error("Word文件不能超过10MiB");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      offset = i;
      break;
    }
  if (offset < 0) throw new Error("不是合法DOCX压缩包");
  const count = view.getUint16(offset + 10, true),
    directory = view.getUint32(offset + 16, true),
    directoryEnd = directory + view.getUint32(offset + 12, true);
  if (count > 1000 || count === 65535) throw new Error("Word条目超过限制");
  if (
    view.getUint16(offset + 4, true) ||
    view.getUint16(offset + 6, true) ||
    view.getUint16(offset + 8, true) !== count ||
    offset + 22 + view.getUint16(offset + 20, true) !== bytes.length ||
    directoryEnd !== offset ||
    directory > offset ||
    (offset >= 20 && view.getUint32(offset - 20, true) === 0x07064b50)
  )
    throw new Error("Word目录不一致或使用不支持的分卷/ZIP64格式");
  let pos = directory,
    total = 0;
  const entries = new Map<
    string,
    { size: number; compressed: number; method: number }
  >();
  for (let i = 0; i < count; i++) {
    if (pos + 46 > directoryEnd || view.getUint32(pos, true) !== 0x02014b50)
      throw new Error("Word目录损坏");
    const flags = view.getUint16(pos + 8, true),
      size = view.getUint32(pos + 24, true),
      compressed = view.getUint32(pos + 20, true),
      nameSize = view.getUint16(pos + 28, true),
      extra = view.getUint16(pos + 30, true),
      comment = view.getUint16(pos + 32, true);
    if (pos + 46 + nameSize + extra + comment > directoryEnd)
      throw new Error("Word目录条目越界");
    if (view.getUint16(pos + 34, true) !== 0)
      throw new Error("不支持分卷Word压缩条目");
    total += size;
    if (
      total > 50 * 1024 * 1024 ||
      (size > 0 && (!compressed || size / compressed > 200)) ||
      flags & 1
    )
      throw new Error("Word解压大小/比例异常或文件加密");
    const name = new TextDecoder().decode(
      bytes.slice(pos + 46, pos + 46 + nameSize),
    );
    if (
      name.includes("..") ||
      name.startsWith("/") ||
      name.includes("\\") ||
      /vbaproject/i.test(name)
    )
      throw new Error("Word包含不安全路径或宏");
    const local = view.getUint32(pos + 42, true),
      method = view.getUint16(pos + 10, true);
    if (
      entries.has(name) ||
      ![0, 8].includes(method) ||
      local + 30 > directory ||
      view.getUint32(local, true) !== 0x04034b50 ||
      local +
        30 +
        view.getUint16(local + 26, true) +
        view.getUint16(local + 28, true) +
        compressed >
        directory
    )
      throw new Error("Word压缩条目损坏或重复");
    entries.set(name, { size, compressed, method });
    pos += 46 + nameSize + extra + comment;
  }
  if (pos !== directoryEnd) throw new Error("Word目录长度不一致");
  const result = unzipSync(bytes, {
    filter: (file) => {
      const entry = entries.get(file.name);
      if (
        !entry ||
        entry.size !== file.originalSize ||
        entry.compressed !== file.size ||
        entry.method !== file.compression
      )
        throw new Error("Word解压元数据与预检不一致");
      return /\.xml$|\.rels$|^word\/media\//.test(file.name);
    },
  });
  for (const [name, data] of Object.entries(result))
    if (data.byteLength !== entries.get(name)!.size)
      throw new Error("Word实际解压长度不一致");
  return result;
}
function xml(bytes: Uint8Array | undefined) {
  if (!bytes) throw new Error("Word缺少必要文档结构");
  const value = new TextDecoder().decode(bytes);
  if (/<!DOCTYPE|<!ENTITY/i.test(value)) throw new Error("不支持XML实体或DTD");
  const doc = new DOMParser().parseFromString(value, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Word XML损坏");
  return doc;
}
const elements = (e: Element | Document, name: string) => [
  ...e.getElementsByTagNameNS("*", name),
];
const attr = (e: Element, name: string) =>
  e.getAttributeNS(
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    name,
  ) ||
  e.getAttribute(name) ||
  "";
function textOf(e: Element) {
  return [...e.querySelectorAll("*")]
    .map((node) =>
      node.localName === "t"
        ? node.textContent || ""
        : node.localName === "tab"
          ? "    "
          : node.localName === "br"
            ? "\n"
            : "",
    )
    .join("");
}
const escapeMD = (s: string) => s.replace(/([\\`*_[\]<>])/g, "\\$1");
export async function importWord(file: File) {
  const generation = await epoch(),
    archive = checkedZip(new Uint8Array(await file.arrayBuffer()));
  for (const [name, bytes] of Object.entries(archive))
    if (/\.xml$|\.rels$/.test(name)) xml(bytes);
  const doc = xml(archive["word/document.xml"]),
    body = elements(doc, "body")[0];
  if (!body) throw new Error("Word没有正文");
  const relation = new Map<string, string>();
  if (archive["word/_rels/document.xml.rels"])
    for (const r of elements(
      xml(archive["word/_rels/document.xml.rels"]),
      "Relationship",
    )) {
      if (r.getAttribute("TargetMode") === "External") continue;
      const target = r.getAttribute("Target") || "";
      if (target.startsWith("media/"))
        relation.set(r.getAttribute("Id") || "", "word/" + target);
    }
  const styles = new Map<string, number>();
  if (archive["word/styles.xml"])
    for (const style of elements(xml(archive["word/styles.xml"]), "style")) {
      const match = /heading\s*([1-6])|标题\s*([1-6])/i.exec(
        attr(elements(style, "name")[0] || style, "val"),
      );
      if (match)
        styles.set(attr(style, "styleId"), Number(match[1] || match[2]));
    }
  const parts: string[] = [],
    assets: import("./types").Asset[] = [];
  const warnings = [
    "请确认提取原稿。批注/脚注/文本框/复杂列表和合并单元格需对照原文件；不加载外部关系或图片。",
  ];
  async function paragraph(p: Element) {
    const chunks: {
      value: string;
      bold: boolean;
      underline: boolean;
      image?: boolean;
    }[] = [];
    for (const run of elements(p, "r")) {
      const enabled = (name: string) => {
        const property = elements(run, name)[0];
        return (
          !!property &&
          !["0", "false", "off", "none"].includes(
            attr(property, "val").toLowerCase(),
          )
        );
      };
      const bold = enabled("b"),
        underline = enabled("u");
      for (const node of [...run.querySelectorAll("*")]) {
        if (["t", "br", "tab"].includes(node.localName)) {
          const value =
            node.localName === "t"
              ? node.textContent || ""
              : node.localName === "br"
                ? "\n"
                : "    ";
          const last = chunks.at(-1);
          if (
            last &&
            !last.image &&
            last.bold === bold &&
            last.underline === underline
          )
            last.value += value;
          else chunks.push({ value, bold, underline });
        }
        if (node.localName !== "blip") continue;
        const blip = node;
        const rid =
            blip.getAttributeNS(
              "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
              "embed",
            ) || "",
          path = relation.get(rid);
        if (path && archive[path]) {
          if (assets.length >= 20) throw new Error("Word配图超过20张");
          const asset = await imageFromBytes(
            archive[path],
            path.split("/").at(-1) || "Word配图",
          );
          assets.push(asset);
          chunks.push({
            value: `\n\n![](typetada-image:${asset.id})\n\n`,
            bold: false,
            underline: false,
            image: true,
          });
        }
      }
    }
    const result = chunks
      .map((chunk) =>
        chunk.image
          ? chunk.value
          : chunk.value
              .split("\n")
              .map((line) => {
                const match = /^(\s*)(.*?)(\s*)$/.exec(line)!;
                let value = escapeMD(match[2]);
                if (value && chunk.bold) value = `**${value}**`;
                if (value && chunk.underline) value = `<u>${value}</u>`;
                return match[1] + value + match[3];
              })
              .join("  \n"),
      )
      .join("");
    const style = elements(p, "pStyle")[0],
      level = style ? styles.get(attr(style, "val")) : undefined;
    return (
      (level
        ? "#".repeat(level) + " "
        : elements(p, "numPr").length
          ? "- "
          : "") + result.trim()
    );
  }
  for (const child of [...body.children]) {
    if (child.localName === "p") parts.push(await paragraph(child));
    if (child.localName === "tbl") {
      const rows = elements(child, "tr").map((row) =>
        [...row.children]
          .filter((c) => c.localName === "tc")
          .map((c) =>
            escapeMD(
              elements(c, "p").map(textOf).join(" ").replace(/\n/g, " "),
            ).replace(/\|/g, "\\|"),
          ),
      );
      if (rows.some((r) => r.length > 4))
        warnings.push("检测到超过4列的表格，排版前请拆分。");
      if (rows[0])
        parts.push(
          [
            `| ${rows[0].join(" | ")} |`,
            `| ${rows[0].map(() => "---").join(" | ")} |`,
            ...rows.slice(1).map((r) => `| ${r.join(" | ")} |`),
          ].join("\n"),
        );
    }
  }
  // Parsing is side-effect free. The caller commits article + assets only after confirmation.
  return {
    title: file.name.replace(/\.docx$/i, ""),
    sourceMarkdown: parts.filter(Boolean).join("\n\n"),
    warnings,
    images: assets.length,
    assets,
    generation,
  };
}
