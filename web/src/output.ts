import type { Job, LayoutFailureResponse, LayoutResult } from "./types";
import { sanitize, serialize, escapeHtml, inert } from "./content";
export function isResultUsable(
  result: Pick<LayoutResult, "validation" | "reviewIssues" | "reviewAcceptedAt">,
) {
  return (
    result.validation.ready ||
    (!!result.reviewIssues?.length && !!result.reviewAcceptedAt)
  );
}

export function canDownloadLayout(
  result: Pick<LayoutResult, "validation" | "reviewIssues" | "reviewAcceptedAt">,
) {
  return isResultUsable(result) || !!result.reviewIssues?.length;
}

export function cleanResultHtml(result: LayoutResult) {
  return sanitize(
    result.htmlFragment,
    [...inert(result.htmlFragment).querySelectorAll("img")].map(
      (e) => e.getAttribute("src") || "",
    ),
  );
}

// The same explicit copy-event mechanism as the bundled Skill preview template.
export function copyRichText(result: LayoutResult, confirmedReview = false) {
  const clean = cleanResultHtml(result);
  if (clean.errors.length) throw new Error("当前HTML检查未通过，不能复制");
  if (
    !isResultUsable(result) &&
    !(confirmedReview && result.reviewIssues?.length)
  )
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
  return previewHtml(cleanResultHtml(result).dom, showImages);
}

function previewHtml(dom: DocumentFragment, showImages: boolean) {
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
  content: string | Blob,
  filename: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(
    typeof content === "string" ? new Blob([content], { type }) : content,
  );
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
    appVersion: job.appVersion,
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

const exportStyles = `<style>
  .export-tools {
    position: sticky;
    top: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    border-bottom: 1px solid #e2e8e4;
    background: #fff;
    color: #485b51;
    font: 13px/1.5 system-ui, sans-serif;
  }
  .export-tools button {
    padding: 6px 10px;
    border: 1px solid #c6d3ca;
    border-radius: 6px;
    background: #fff;
    color: #233b32;
    font: inherit;
    cursor: pointer;
  }
  .export-tools #copy {
    border-color: #285947;
    background: #285947;
    color: #fff;
  }
  .export-review {
    margin: 12px 0;
    padding: 8px 10px;
    border-left: 3px solid #c18b43;
    background: #fdf6e9;
    color: #674618;
    font: 13px/1.5 system-ui, sans-serif;
  }
</style>`;

export function previewExport(result: LayoutResult) {
  if (!canDownloadLayout(result))
    throw new Error("当前成稿无法导出，请在工作台查看检查结果。");
  const { dom, errors } = cleanResultHtml(result);
  if (errors.length) throw new Error("当前 HTML 未通过安全检查，不能下载。");
  const copyHtml = serialize(dom);
  const pending = !isResultUsable(result);
  const body = previewHtml(dom, true).replace(
    "</head>",
    () =>
      "<title>" +
      escapeHtml((pending ? "待核对稿 · " : "") + result.title) +
      "</title>" + exportStyles + "</head>",
  );
  const notice = pending
    ? '<p class="export-review"><strong>待核对稿</strong> · 这份稿子有原文差异，发布前请对照原稿。</p>'
    : "";
  const confirmCopy = pending
    ? 'if(!window.confirm("这份稿子有原文差异。仍然复制此稿？"))return;'
    : "";
  const jsValue = (s: string) => JSON.stringify(s).replaceAll("<", "\\u003c");
  return body
    .replace(
      "default-src 'none';",
      "default-src 'none'; script-src 'unsafe-inline';",
    )
    .replace(
      "<body>",
      '<body><aside class="export-tools"><button id="copy" type="button">复制到公众号</button><span id="status" role="status">含图片时请在微信保存草稿并重开检查</span></aside>' +
        notice,
    )
    .replace(
      "</body>",
      () =>
        `<script>
  document.getElementById("copy").addEventListener("click", () => {
    ${confirmCopy}
    let copied = false;
    function handleCopy(event) {
      if (!event.clipboardData) return;
      event.clipboardData.setData("text/html", ${jsValue(copyHtml)});
      event.clipboardData.setData("text/plain", ${jsValue(result.plainText)});
      event.preventDefault();
      copied = true;
    }
    document.addEventListener("copy", handleCopy, true);
    const selection = document.createElement("textarea");
    selection.value = "copy";
    document.body.append(selection);
    selection.select();
    try {
      document.getElementById("status").textContent = document.execCommand("copy") && copied
        ? "已复制，请到公众号粘贴并保存检查"
        : "复制失败，请回工作台重试";
    } finally {
      document.removeEventListener("copy", handleCopy, true);
      selection.remove();
    }
  });
</script></body>`,
    );
}
export function exportResult(
  result: LayoutResult,
  format: "markdown" | "preview",
) {
  if (format === "markdown") {
    download(result.sourceMarkdown, "typetada-source.md", "text/markdown");
    return;
  }
  download(
    previewExport(result),
    isResultUsable(result) ? "typetada-preview.html" : "typetada-preview-待核对.html",
    "text/html",
  );
}
