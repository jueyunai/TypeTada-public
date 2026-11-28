import { expect, it, vi } from "vitest";
import {
  previewDocument,
  previewExport,
  copyRichText,
  exportResult,
  layoutFailureFilename,
  layoutFailureReport,
} from "../src/output";
import type { Job, LayoutResult } from "../src/types";

it("names both report types by local job start time and an abbreviated task id", () => {
  const job = {
    id: "job_9b4acc79-0000-4000-8000-000000000000",
    startedAt: new Date(2026, 10, 23, 17, 8, 5).getTime() / 1000,
  };
  expect(layoutFailureFilename(job, false)).toBe(
    "文有样-排版错误-摘要-2026-11-23_17-08-05-9b4acc79.json",
  );
  expect(layoutFailureFilename(job, true)).toBe(
    "文有样-排版错误-含模型正文-2026-11-23_17-08-05-9b4acc79.json",
  );
});

it("exports the saved job version and leaves legacy jobs without a product version", () => {
  const job: Job = {
    id: "job_old",
    articleId: "article_old",
    sourceRevision: 1,
    startedAt: 0,
    status: "failed",
    stage: "generate",
    callCount: 1,
    sent: true,
  };
  expect(JSON.parse(layoutFailureReport(job))).not.toHaveProperty("appVersion");
  expect(
    JSON.parse(layoutFailureReport({ ...job, appVersion: "0.6.0" })),
  ).toMatchObject({ schemaVersion: 1, appVersion: "0.6.0" });
});

it("standalone export keeps exact HTML/plain copy payload and escapes hostile title/script text", () => {
  const result: any = {
    title: "</title><script>evil()</script> $` $$ $& $'",
    htmlFragment:
      '<section style="text-align:left"><p><span leaf="">原文。</span></p></section>',
    plainText: "</script>原文。 $` $$ $& $'",
    validation: { ready: true },
  };
  const output = previewExport(result);
  const dom = new DOMParser().parseFromString(output, "text/html");
  expect(dom.title).toBe(result.title);
  expect(dom.querySelectorAll("script")).toHaveLength(1);
  document.body.innerHTML =
    '<button id="copy"></button><span id="status"></span>';
  const data: Record<string, string> = {};
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: () => {
      const e = new Event("copy", { cancelable: true });
      Object.defineProperty(e, "clipboardData", {
        value: { setData: (t: string, v: string) => (data[t] = v) },
      });
      document.dispatchEvent(e);
      return true;
    },
  });
  new Function("document", dom.querySelector("script")!.textContent!)(document);
  (document.getElementById("copy") as HTMLButtonElement).click();
  expect(data["text/html"]).toBe(result.htmlFragment);
  expect(data["text/plain"]).toBe(result.plainText);
});

it("downloads a review draft as a full HTML page and asks before its copy action", () => {
  const draft = {
    title: "测试稿",
    htmlFragment: '<section><p><span leaf="">成稿内容。</span></p></section>',
    plainText: "成稿内容。",
    validation: { ready: false },
    reviewIssues: [{ sourceId: "s001", kind: "changed_text" }],
  } as LayoutResult;
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    function (this: HTMLAnchorElement) {
      expect(this.download).toBe("typetada-preview-待核对.html");
    },
  );
  try {
    exportResult(draft, "preview");
    expect(click).toHaveBeenCalledOnce();
  } finally {
    click.mockRestore();
  }
  const page = new DOMParser().parseFromString(previewExport(draft), "text/html");
  expect(page.title).toBe("待核对稿 · 测试稿");
  expect(page.querySelector(".export-review")?.textContent).toContain("发布前请对照原稿");
  const script = page.querySelector("script")!.textContent!;
  const scriptWindow = { confirm: vi.fn(() => false) };
  new Function("document", "window", script)(page, scriptWindow);
  (page.getElementById("copy") as HTMLButtonElement).click();
  expect(scriptWindow.confirm).toHaveBeenCalledOnce();
  const invalid = { ...draft, htmlFragment: "<section><footer>正文</footer></section>" };
  expect(() => previewExport(invalid)).toThrow("未通过安全检查");
});
it("previewDocument matches WeChat content-box model and copyRichText stays compatible with legacy fixed width", () => {
  const legacy: any = {
    title: "旧稿",
    htmlFragment:
      '<section style="text-align:left"><section style="width:150px;padding:14px"><p><span leaf="">历史导读卡</span></p></section></section>',
    plainText: "历史导读卡",
    validation: { ready: true },
  };
  const preview = previewDocument(legacy);
  expect(preview).not.toContain("*{box-sizing:border-box}");
  const data: Record<string, string> = {};
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: () => {
      const e = new Event("copy", { cancelable: true });
      Object.defineProperty(e, "clipboardData", {
        value: { setData: (t: string, v: string) => (data[t] = v) },
      });
      document.dispatchEvent(e);
      return true;
    },
  });
  copyRichText(legacy);
  expect(data["text/html"]).toBe(legacy.htmlFragment);
});

it("allows copyRichText when non-blocking format warnings exist, but blocks unsafe HTML", () => {
  const data: Record<string, string> = {};
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: () => {
      const e = new Event("copy", { cancelable: true });
      Object.defineProperty(e, "clipboardData", {
        value: { setData: (t: string, v: string) => (data[t] = v) },
      });
      document.dispatchEvent(e);
      return true;
    },
  });

  const softWarnResult: any = {
    title: "含提示",
    htmlFragment:
      '<section><p>未包裹leaf且有,半角</p></section>',
    plainText: "未包裹leaf且有,半角",
    validation: {
      ready: true,
      errors: [],
      warnings: ["文字未被span leaf包裹", "文章外层需显式text-align:left"],
    },
  };
  copyRichText(softWarnResult);
  expect(data["text/html"]).toBe(softWarnResult.htmlFragment);

  const unsafeResult: any = {
    title: "危险",
    htmlFragment:
      '<section style="text-align:left"><script>alert(1)</script><p><span leaf="">正文</span></p></section>',
    plainText: "正文",
    validation: { ready: true, errors: [], warnings: [] },
  };
  expect(() => copyRichText(unsafeResult)).toThrow("不能复制");
});
