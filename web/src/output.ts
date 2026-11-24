import type { Job, LayoutFailureResponse, LayoutResult } from "./types";
import { sanitize, serialize, escapeHtml, inert } from "./content";
// The same explicit copy-event mechanism as the bundled Skill preview template.
export function copyRichText(result: LayoutResult) {
  const clean = sanitize(
    result.htmlFragment,
    [...inert(result.htmlFragment).querySelectorAll("img")].map(
      (e) => e.getAttribute("src") || "",
    ),
  );
  if (clean.errors.length) throw new Error("当前HTML检查未通过，不能复制");
  if (!result.validation.ready)
    throw new Error("这份排版尚未通过原文或安全检查，不能复制");
  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = result.plainText;
  area.setAttribute("aria-hidden", "true");
  area.style.cssText = "position:fixed;left:-10000px;top:0;";
  document.body.append(area);
  area.select();
  let handled = false;
  const handler = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData("text/html", result.htmlFragment);
    event.clipboardData.setData("text/plain", result.plainText);
    event.preventDefault();
    handled = true;
  };
  document.addEventListener("copy", handler, true);
  try {
    if (!(document.execCommand("copy") && handled))
      throw new Error("完整格式未能复制，请在 Chrome 或 Edge 中重试");
  } finally {
    document.removeEventListener("copy", handler, true);
    area.remove();
    active?.focus();
  }
}

export function previewDocument(result: LayoutResult, showImages = false) {
  const dom = sanitize(
    result.htmlFragment,
    [...inert(result.htmlFragment).querySelectorAll("img")].map(
      (e) => e.getAttribute("src") || "",
    ),
  ).dom;
  if (!showImages)
    for (const image of dom.querySelectorAll("img")) {
      if ((image.getAttribute("src") || "").startsWith("data:image/")) continue;
      const p = document.createElement("p");
      p.textContent =
        "〔配图：" +
        (image.getAttribute("alt") || "在设置中开启外链图片") +
        "〕";
      image.replaceWith(p);
    }
  const body = serialize(dom);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: ${showImages ? "https:" : ""}; base-uri 'none'; form-action 'none'"><style>html{background:white}body{margin:0;padding:26px 14px;text-align:left;overflow-wrap:break-word;box-sizing:border-box}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`;
}

export function download(
  content: string,
  filename: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function layoutFailureFilename(
  job: Pick<Job, "id" | "startedAt">,
  includesModelResponses: boolean,
) {
  const startedAt = new Date(job.startedAt * 1000);
  const twoDigits = (number: number) => String(number).padStart(2, "0");
  const date = [
    startedAt.getFullYear(),
    twoDigits(startedAt.getMonth() + 1),
    twoDigits(startedAt.getDate()),
  ].join("-");
  const time = [
    startedAt.getHours(),
    startedAt.getMinutes(),
    startedAt.getSeconds(),
  ]
    .map(twoDigits)
    .join("-");
  const task = job.id.replace(/^job_/, "").slice(0, 8);
  const type = includesModelResponses ? "含模型正文" : "摘要";
  return `文有样-排版错误-${type}-${date}_${time}-${task}.json`;
}
export function layoutFailureReport(job: Job, responses?: LayoutFailureResponse[]) {
  return JSON.stringify({
    schemaVersion: 1,
    product: "TypeTada",
    jobId: job.id,
    startedAt: new Date(job.startedAt * 1000).toISOString(),
    status: job.status,
    stage: job.stage,
    callCount: job.callCount,
    sourceRevision: job.sourceRevision,
    layout: job.layout,
    error: job.error,
    lastResponse: job.diagnostic,
    attempts: job.attempts ?? [],
    ...(responses?.length ? { modelResponses: responses } : {}),
  }, null, 2);
}
export function previewExport(result: LayoutResult) {
  const body = previewDocument(result, true).replace(
    "</head>",
    () => "<title>" + escapeHtml(result.title) + "</title></head>",
  );
  const jsValue = (s: string) => JSON.stringify(s).replaceAll("<", "\\u003c");
  return body
    .replace(
      "default-src 'none';",
      "default-src 'none'; script-src 'unsafe-inline';",
    )
    .replace(
      "<body>",
      '<body><aside style="position:sticky;top:0;background:white;padding:10px;border-bottom:1px solid #ddd"><button id="copy">复制到公众号</button><span id="status"> 含图片时请在微信保存草稿并重开检查</span></aside>',
    )
    .replace(
      "</body>",
      () =>
        `<script>document.getElementById('copy').onclick=function(){var done=false;function handler(e){if(!e.clipboardData)return;e.clipboardData.setData('text/html',${jsValue(result.htmlFragment)});e.clipboardData.setData('text/plain',${jsValue(result.plainText)});e.preventDefault();done=true;}document.addEventListener('copy',handler,true);var area=document.createElement('textarea');area.value='copy';document.body.append(area);area.select();try{document.getElementById('status').textContent=document.execCommand('copy')&&done?' 已复制，请到公众号粘贴并保存检查':' 复制失败，请回工作台重试';}finally{document.removeEventListener('copy',handler,true);area.remove();}};</script></body>`,
    );
}
export function exportResult(
  result: LayoutResult,
  format: "fragment" | "markdown" | "preview",
) {
  if (format === "markdown") {
    download(result.sourceMarkdown, "typetada-source.md", "text/markdown");
    return;
  }
  if (format === "fragment") {
    download(result.htmlFragment, "typetada-article.html", "text/html");
    return;
  }
  download(previewExport(result), "typetada-preview.html", "text/html");
}
