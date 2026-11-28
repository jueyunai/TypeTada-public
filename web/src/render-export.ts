import html2canvas, { type Options } from "html2canvas";
import { canDownloadLayout, cleanResultHtml, isResultUsable } from "./output";
import { createPngWriter } from "./png";
import type { LayoutResult } from "./types";

export type RenderExportFormat = "pdf" | "png";

const MARGIN_MM = 13;
const CONTENT_WIDTH_MM = 210 - MARGIN_MM * 2;
const WIDTH = Math.round((CONTENT_WIDTH_MM * 96) / 25.4);
const MM_PER_PIXEL = CONTENT_WIDTH_MM / WIDTH;
const PAGE_HEIGHT = Math.floor((297 - MARGIN_MM * 2) / MM_PER_PIXEL);
const SCALE = 1.6;
// Keep each image within a bounded canvas on desktop and mobile browsers.
const IMAGE_SEGMENT_HEIGHT = Math.floor(4096 / SCALE);

function loadImage(image: HTMLImageElement) {
  const source = image.getAttribute("src") || "";
  return new Promise<boolean>((resolve) => {
    const finish = (loaded: boolean) => {
      window.clearTimeout(timeout);
      image.onload = image.onerror = null;
      resolve(loaded);
    };
    const timeout = window.setTimeout(() => finish(false), 5000);
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    if (source.startsWith("https:")) image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.src = source;
  });
}

function protectedAreas(body: HTMLElement) {
  const origin = body.getBoundingClientRect().top;
  const areas: { top: number; bottom: number }[] = [];
  function record({ top, bottom }: DOMRect) {
    const start = top - origin;
    const end = bottom - origin;
    if (end > start && end - start <= PAGE_HEIGHT)
      areas.push({ top: start, bottom: end });
  }
  for (const element of body.querySelectorAll("figure,img,h3,h4,tr,.pdf-note"))
    record(element.getBoundingClientRect());
  const range = body.ownerDocument.createRange();
  const texts = body.ownerDocument.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  while (texts.nextNode()) {
    if (!texts.currentNode.textContent?.trim()) continue;
    range.selectNodeContents(texts.currentNode);
    for (const rect of range.getClientRects()) record(rect);
  }
  return areas;
}

export async function createRenderExport(
  result: LayoutResult,
  format: RenderExportFormat,
  confirmMissingImages: (images: string[]) => Promise<boolean>,
) {
  if (!canDownloadLayout(result))
    throw new Error("当前成稿无法导出，请先查看检查结果。");
  const { dom, errors } = cleanResultHtml(result);
  if (errors.length) throw new Error("当前 HTML 未通过安全检查，不能导出。");

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.tabIndex = -1;
  frame.style.cssText = `position:fixed;left:-10000px;top:0;border:0;width:${WIDTH}px;height:${PAGE_HEIGHT}px`;
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc?.body) throw new Error("无法打开导出区域，请重试。");
    doc.documentElement.lang = "zh-CN";
    const style = doc.createElement("style");
    style.textContent = `
      body { margin: 0; width: ${WIDTH}px; background: #fff; overflow-wrap: anywhere; }
      img { max-width: 100%; }
      pre { white-space: pre-wrap; }
      .pdf-note { margin: 0 0 12px; padding: 8px 10px; border-left: 3px solid #c18b43;
        background: #fdf6e9; color: #674618; font: 13px/1.5 system-ui, sans-serif; }
    `;
    doc.head.append(style);
    if (!isResultUsable(result)) {
      const note = doc.createElement("p");
      note.className = "pdf-note";
      note.textContent = "待核对稿 · 这份稿子有原文差异，发布前请对照原稿。";
      doc.body.append(note);
    }

    const images = [...dom.querySelectorAll("img")];
    const loading = images.map(loadImage);
    doc.body.append(dom);
    const missing: string[] = [];
    const loaded = await Promise.all(loading);
    images.forEach((image, index) => {
      if (!loaded[index]) {
        const description = image.alt.trim().slice(0, 80);
        const label = `第 ${index + 1} 张配图`;
        missing.push(description || label);
        const note = doc.createElement("span");
        note.className = "pdf-note";
        note.style.display = "block";
        note.textContent = description
          ? `未能导出${label}（${description}）`
          : `未能导出${label}`;
        image.replaceWith(note);
        return;
      }
      const box = image.getBoundingClientRect();
      const maxHeight = PAGE_HEIGHT - 80;
      if (format === "pdf" && box.height > maxHeight) {
        image.style.setProperty(
          "width",
          `${(box.width * maxHeight) / box.height}px`,
          "important",
        );
        image.style.setProperty("height", `${maxHeight}px`, "important");
      }
    });
    if (missing.length && !(await confirmMissingImages(missing))) return null;
    await doc.fonts.ready;

    const pdf =
      format === "pdf"
        ? new (await import("jspdf")).jsPDF({ format: "a4", compress: true })
        : null;
    pdf?.setProperties({ title: result.title });
    const segmentHeight = pdf ? PAGE_HEIGHT : IMAGE_SEGMENT_HEIGHT;
    let png: ReturnType<typeof createPngWriter> | undefined;
    let height = 0;
    let top = 0;
    let areas: ReturnType<typeof protectedAreas> = [];
    do {
      const options: Partial<Options> = {
        width: WIDTH,
        windowWidth: WIDTH,
        windowHeight: PAGE_HEIGHT,
        scrollX: 0,
        scrollY: 0,
        scale: SCALE,
        backgroundColor: "#fff",
        useCORS: true,
        logging: false,
        onclone(clone) {
          // Measure the same DOM that will be painted. The rasterizer's iframe
          // can lay out tables and fonts differently from the source iframe.
          if (top === 0) {
            height = Math.max(
              clone.body.scrollHeight,
              Math.ceil(clone.body.getBoundingClientRect().height),
              1,
            );
            if (pdf) areas = protectedAreas(clone.body).sort((a, b) => b.top - a.top);
          }
          let bottom = Math.min(top + segmentHeight, height);
          if (bottom < height) {
            for (const area of areas) {
              if (area.top <= top) break;
              // Collapsed table borders can overlap neighbouring rows by a
              // fraction of a pixel. Moving again at those joins splits tables
              // into one-row pages.
              if (area.top < bottom - 1 && area.bottom > bottom + 1)
                bottom = area.top;
            }
          }
          options.y = top;
          options.height = Math.max(1, Math.round(bottom) - top);
        },
      };
      const canvas = await html2canvas(doc.body, options);
      const renderedHeight = options.height!;
      try {
        if (pdf) {
          const picture = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.9),
          );
          if (!picture) throw new Error("图片生成失败，请刷新后重试。");
          if (top > 0) pdf.addPage();
          pdf.addImage(
            new Uint8Array(await picture.arrayBuffer()),
            "JPEG",
            MARGIN_MM,
            MARGIN_MM,
            CONTENT_WIDTH_MM,
            renderedHeight * MM_PER_PIXEL,
          );
        } else {
          png ??= createPngWriter(canvas.width);
          png.append(canvas);
        }
      } finally {
        canvas.width = canvas.height = 0;
      }
      top += renderedHeight;
    } while (top < height);
    if (pdf) return { file: pdf.output("blob"), extension: "pdf" };
    return { file: png!.finish(), extension: "png" };
  } finally {
    frame.remove();
  }
}
