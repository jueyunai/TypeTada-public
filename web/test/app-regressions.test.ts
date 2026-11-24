// Regressions for existing image semantics, refresh races and global preferences.
// IndexedDB is fake; platform/library calls are fully mocked.
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as store from "../src/db";
import App from "../src/App";
import * as library from "../src/library";
import * as imports from "../src/imports";
import * as images from "../src/images";
import * as walletModule from "../src/wallet";
import * as pipelineModule from "../src/pipeline";

vi.mock("../src/wallet", async (original) => ({
  ...(await original<any>()),
  finishAuthorization: vi.fn(async () => null),
  walletStatus: vi.fn(async () => ({
    connected: false,
    remember: false,
    balanceYuan: null,
  })),
}));
vi.mock("../src/library", () => ({
  themes: vi.fn(async () => [
    {
      id: "moyu-green",
      name: "测试",
      color: "#059669",
      description: "test",
      skillId: "gzh-design",
    },
  ]),
  loadDemo: vi.fn(async () => ({
    title: "demo",
    sourceMarkdown: "demo",
    themeId: "moyu-green",
    demo: true,
    htmlFragment:
      '<section style="text-align:left"><p><span leaf="">示例。</span></p></section>',
    validation: { ready: true, errors: [], warnings: [] },
    imageStatus: "none",
    plainText: "示例。",
    usage: {},
    enhancements: [],
    decisions: [],
  })),
  contextFor: vi.fn(async () => ({
    context: "test",
    skillId: "gzh-design",
    skillRevision: "test",
    skillContentHash: "test",
  })),
}));
let root: Root;
let host: HTMLDivElement;
beforeEach(async () => {
  vi.restoreAllMocks();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  await store.clearLocal();
  history.replaceState(null, "", "/editor");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  host.remove();
});
async function mount(title: string) {
  await act(async () => {
    root.render(createElement(App));
  });
  for (let i = 0; i < 150; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    if (
      host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')
        ?.value === title
    )
      return;
  }
  throw new Error("mount failed: " + host.textContent?.slice(0, 500));
}
async function setTitle(value: string) {
  const input = host.querySelector<HTMLInputElement>(
    'input[aria-label="文章标题"]',
  )!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("renders an external image in original preview while the external-image checkbox remains unchecked", async () => {
  await store.createArticle(
    "原稿",
    "![](https://tracker.invalid/pixel.png?document=secret)",
  );
  await mount("原稿");
  const image = host.querySelector<HTMLImageElement>(".source-prose img");
  expect(image?.getAttribute("src")).toBe(
    "https://tracker.invalid/pixel.png?document=secret",
  );
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('button[aria-label="排版设置"]')!
      .click();
  });
  const label = [...host.querySelectorAll("label")].find((el) =>
    el.textContent?.includes("加载外链图片"),
  )!;
  expect(
    label.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked,
  ).toBe(false);
});

it("preserves a local edit made while a background refresh is suspended", async () => {
  const initial = await store.createArticle("初稿", "原文。");
  await mount("初稿");
  let entered = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const originalGet = store.getArticle;
  vi.spyOn(store, "getArticle").mockImplementation(async (key) => {
    const fresh = await originalGet(key);
    entered = true;
    await gate;
    return fresh;
  });
  try {
    // Another tab saves revision 2. This dispatches the same data-change event as BroadcastChannel.
    await act(async () => {
      await store.saveArticle({ ...initial, title: "另一窗口的新稿" });
    });
    await act(async () => {
      await vi.waitFor(() => expect(entered).toBe(true), {
        timeout: 1000,
        interval: 5,
      });
    });
    // The local editor was clean when refresh began, but becomes dirty during openArticle's awaited read.
    await setTitle("本窗口刚输入的草稿");
    expect(
      host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')
        ?.value,
    ).toBe("本窗口刚输入的草稿");
    const draft = await store.loadRecovery(initial.id);
    expect(draft).toMatchObject({ title: "本窗口刚输入的草稿", revision: 1 });
    await act(async () => {
      release();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(
      host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')
        ?.value,
    ).toBe("本窗口刚输入的草稿");
    const current = await originalGet(initial.id);
    expect(current.revision).toBe(2);
    expect((await store.loadRecovery(initial.id))!.revision).toBeLessThan(
      current.revision,
    );
    expect(host.textContent).toContain("当前输入已保留");
    // The unsaved edit remains visible and recoverable instead of being replaced.
  } finally {
    release();
  }
});

it("opening a historical result preserves the saved default theme", async () => {
  const initial = await store.createArticle("当前稿", "Original");
  const article = await store.createArticle("历史稿", "Original");
  await store.putMeta("lastArticle", initial.id);
  await store.putMeta("preferences", {
    theme: "moyu-green",
    mode: "auto",
    consent: false,
    showImages: false,
  });
  await (
    await store.database
  ).put(
    "results",
    {
      resultId: "synthetic-history",
      articleId: article.id,
      sourceRevision: 1,
      createdAt: 1,
      title: article.title,
      sourceMarkdown: article.sourceMarkdown,
      themeId: "red-white",
      skillId: "gzh-design",
      skillRevision: "test",
      skillContentHash: "test",
      model: "test",
      htmlSha256: "test",
      htmlFragment:
        '<section style="text-align:left"><p><span leaf="">Original</span></p></section>',
      validation: { ready: true, errors: [], warnings: [] },
      imageStatus: "none",
      plainText: "Original",
      usage: { inputTokens: null, outputTokens: null },
      enhancements: [],
      decisions: [],
    },
    "synthetic-history",
  );
  await mount("当前稿");
  for (let i = 0; i < 40; i++)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('button.article-link[title="历史稿"]')!
      .click();
  });
  for (let i = 0; i < 60; i++)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  expect((await store.getPreferences()).theme).toBe("moyu-green");
});

it("loads existing local articles when both the rule index and demo fail", async () => {
  await store.createArticle("本地可用", "Original");
  vi.mocked(library.themes).mockRejectedValueOnce(new Error("offline"));
  vi.mocked(library.loadDemo).mockRejectedValueOnce(new Error("offline"));
  await mount("本地可用");
  expect(host.textContent).toContain("本机文章仍可编辑");
  await setTitle("离线编辑仍保留");
  expect((await store.listArticles())[0].sourceMarkdown).toBe("Original");
  expect(
    host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')?.value,
  ).toBe("离线编辑仍保留");
});

it("shows and can stop a global task while another article is selected", async () => {
  const a = await store.createArticle("运行稿", "A");
  const b = await store.createArticle("当前稿", "B");
  await store.putMeta("lastArticle", b.id);
  await store.claimJob({
    id: "global-test",
    articleId: a.id,
    sourceRevision: 1,
    status: "running",
    stage: "generate",
    sent: true,
    callCount: 1,
    startedAt: 1,
  });
  await mount("当前稿");
  expect(host.textContent).toContain("另一篇文章有未结束的排版任务：运行稿");
  const stop = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === "停止并标记未知",
  )!;
  await act(async () => {
    stop.click();
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(await store.activeJob()).toBeNull();
  expect(await store.latestJob(a.id)).toMatchObject({
    status: "outcome_unknown",
    callCount: 1,
  });
  expect(
    host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')?.value,
  ).toBe("当前稿");
});

it("keeps Markdown editing mode after a rich paste and saves the converted content", async () => {
  const article = await store.createArticle("编辑稿", "Original");
  await mount("编辑稿");
  await act(async () => {
    [...host.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.textContent === "Markdown")!
      .click();
  });
  const area = host.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="文章原稿"]',
  )!;
  area.setSelectionRange(area.value.length, area.value.length);
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      files: [],
      getData: (type: string) =>
        type === "text/html" ? "<p><strong>Added</strong></p>" : "Added",
    },
  });
  await act(async () => {
    area.dispatchEvent(event);
  });
  for (let i = 0; i < 30; i++)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  expect(host.querySelector('textarea[aria-label="文章原稿"]')).not.toBeNull();
  expect((await store.getArticle(article.id)).sourceMarkdown).toContain(
    "**Added**",
  );
});

it("does not commit Word assets or a new article when import confirmation is cancelled", async () => {
  await store.createArticle("现有稿", "Original");
  await mount("现有稿");
  const asset = {
    id: "synthetic-word-image",
    name: "word.png",
    url: "data:image/png;base64,AA==",
    mime: "image/png",
    createdAt: 0,
  };
  vi.spyOn(imports, "importWord").mockResolvedValueOnce({
    title: "Word",
    sourceMarkdown: `![](typetada-image:${asset.id})`,
    images: 1,
    assets: [asset],
    generation: await store.epoch(),
    warnings: [],
  });
  const input = host.querySelector<HTMLInputElement>(
    'input[accept=".md,.txt,.docx"]',
  )!;
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [{ name: "test.docx", size: 20 }],
  });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(host.querySelector('[role="alertdialog"]')).not.toBeNull();
  const cancelBtn = host.querySelector<HTMLButtonElement>(
    '[role="alertdialog"] .confirm-cancel',
  )!;
  expect(cancelBtn.textContent).toBe("取消");
  await act(async () => {
    cancelBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(host.querySelector('[role="alertdialog"]')).toBeNull();
  expect(await store.listAssets()).toHaveLength(0);
  expect(await store.listArticles()).toHaveLength(1);
});

it("commits Word assets and opens new article when confirming in-app dialog", async () => {
  await store.createArticle("现有稿", "Original");
  await mount("现有稿");
  const asset = {
    id: "synthetic-word-confirmed",
    name: "word.png",
    url: "data:image/png;base64,AA==",
    mime: "image/png",
    createdAt: 0,
  };
  vi.spyOn(imports, "importWord").mockResolvedValueOnce({
    title: "Word导入稿",
    sourceMarkdown: `正文。\n\n![](typetada-image:${asset.id})`,
    images: 1,
    assets: [asset],
    generation: await store.epoch(),
    warnings: [],
  });
  const input = host.querySelector<HTMLInputElement>(
    'input[accept=".md,.txt,.docx"]',
  )!;
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [{ name: "test.docx", size: 20 }],
  });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(host.querySelector('[role="alertdialog"]')).not.toBeNull();
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('[role="alertdialog"] .confirm-accept')!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  expect(await store.listAssets()).toHaveLength(1);
  expect(await store.listArticles()).toHaveLength(2);
  expect(
    host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')?.value,
  ).toBe("Word导入稿");
});

it("shows theme capsule in preview toolbar, renders default sample when article has no result yet, and supports fullscreen preview", async () => {
  await store.createArticle("待排文章", "一段正文。");
  await mount("待排文章");
  const themeBtn = host.querySelector<HTMLButtonElement>(
    ".preview-pane .pane-toolbar .theme-select",
  );
  expect(themeBtn).not.toBeNull();
  expect(themeBtn?.textContent).toContain("测试");
  expect(themeBtn?.textContent).toContain("换主题");
  expect(host.querySelector(".actionbar .theme-select")).toBeNull();
  await act(async () => {
    themeBtn!.click();
  });
  const themeDialog = host.querySelector(
    '[role="dialog"][aria-label="选择排版主题"]',
  );
  expect(themeDialog).not.toBeNull();
  expect(themeDialog?.textContent).toContain("为文章选个好模样");
  await act(async () => {
    themeDialog!
      .querySelector<HTMLButtonElement>('button[aria-label="关闭面板"]')!
      .click();
  });
  expect(
    host.querySelector('[role="dialog"][aria-label="选择排版主题"]'),
  ).toBeNull();
  expect(
    host.querySelector(
      '.preview-pane .theme-document-sample iframe[src="/library/moyu-green-sample.html"]',
    ),
  ).not.toBeNull();
  // 默认手机模式渲染等比缩放的闭合 iPhone 16 外壳、灵动岛与规格标识
  expect(
    host.querySelector(".preview-pane .phone-shell-docked"),
  ).not.toBeNull();
  expect(
    host.querySelector(".preview-pane .phone-dynamic-island"),
  ).not.toBeNull();
  expect(host.querySelector(".preview-pane .phone-home-bar")).not.toBeNull();
  expect(
    host.querySelector(".preview-pane .phone-scale-caption")?.textContent,
  ).toContain("iPhone 16 · 393×852");
  const fitBtn = [
    ...host.querySelectorAll<HTMLButtonElement>(".phone-zoom-toggle > button"),
  ].find((b) => b.textContent?.includes("适配"))!;
  const actualBtn = [
    ...host.querySelectorAll<HTMLButtonElement>(".phone-zoom-toggle > button"),
  ].find((b) => b.textContent?.includes("100%"))!;
  expect(fitBtn.getAttribute("aria-pressed")).toBe("true");
  expect(actualBtn.getAttribute("aria-pressed")).toBe("false");
  expect(
    host.querySelector(".preview-pane .phone-stage-slot.is-actual"),
  ).toBeNull();
  await act(async () => {
    actualBtn.click();
  });
  expect(
    host.querySelector(".preview-pane .phone-stage-slot.is-actual"),
  ).not.toBeNull();
  expect(actualBtn.getAttribute("aria-pressed")).toBe("true");
  expect(fitBtn.getAttribute("aria-pressed")).toBe("false");
  expect(
    host.querySelector(".preview-pane .phone-scale-caption")?.textContent,
  ).toContain("100%");
  await act(async () => {
    fitBtn.click();
  });
  expect(
    host.querySelector(".preview-pane .phone-stage-slot.is-actual"),
  ).toBeNull();
  expect(fitBtn.getAttribute("aria-pressed")).toBe("true");
  const wideBtn = [
    ...host.querySelectorAll<HTMLButtonElement>(".viewport-segmented > button"),
  ].find((b) => b.textContent?.includes("宽屏"))!;
  const phoneBtn = [
    ...host.querySelectorAll<HTMLButtonElement>(".viewport-segmented > button"),
  ].find((b) => b.textContent?.includes("手机"))!;
  await act(async () => {
    wideBtn.click();
  });
  expect(wideBtn.getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelector(".preview-pane .phone-shell")).toBeNull();
  expect(host.querySelector(".preview-pane .wide-preview")).not.toBeNull();
  await act(async () => {
    phoneBtn.click();
  });
  expect(phoneBtn.getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelector(".sample-mode-banner")?.textContent).toContain(
    "当前展示「测试」主题样张",
  );
  const copyBtn = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.includes("复制到公众号"),
  )!;
  expect(copyBtn.disabled).toBe(true);
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('button[aria-label="全屏预览"]')!
      .click();
  });
  const fullscreenModal = host.querySelector(
    '[role="dialog"][aria-label="全屏排版预览"]',
  );
  expect(fullscreenModal).not.toBeNull();
  expect(fullscreenModal?.querySelector(".phone-shell-full")).not.toBeNull();
  expect(fullscreenModal?.querySelector(".phone-home-bar")).not.toBeNull();
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  expect(
    host.querySelector('[role="dialog"][aria-label="全屏排版预览"]'),
  ).toBeNull();
});

it("opens directly in WYSIWYG writing mode without false dirty, supports fullscreen writing, rich image preview, and Markdown cursor insertion", async () => {
  const existing = await store.createArticle("非空稿", "已有正文内容。");
  await mount("非空稿");
  // 打开非空稿直接进入所见即所得「写作」态，且绝不触发假 dirty
  const prose = host.querySelector<HTMLElement>(".tiptap-prose");
  expect(prose).not.toBeNull();
  expect(prose?.textContent).toContain("已有正文内容。");
  expect(host.querySelector(".source-status")?.textContent).toContain(
    "已保存到本机",
  );
  expect(host.querySelector(".stale-note")).toBeNull();

  // 全屏专注写作与 Escape 退出
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('button[aria-label="全屏专注写作"]')!
      .click();
  });
  const writingDialog = host.querySelector(
    '[role="dialog"][aria-label="全屏专注写作"]',
  );
  expect(writingDialog).not.toBeNull();
  expect(writingDialog?.querySelector(".tiptap-prose")).not.toBeNull();
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  expect(
    host.querySelector('[role="dialog"][aria-label="全屏专注写作"]'),
  ).toBeNull();

  // 「写作」态上传本机图片：画布直接显图，原稿仅存 typetada-image 引用且不含 base64
  vi.spyOn(images, "importImage").mockResolvedValueOnce({
    id: "image_cursor_1",
    name: "rich.png",
    mime: "image/png",
    url: "data:image/png;base64,AA==",
    createdAt: 0,
  });
  const imgInput = host.querySelector<HTMLInputElement>(
    'input[accept*="image/png"]',
  )!;
  Object.defineProperty(imgInput, "files", {
    configurable: true,
    value: [{ name: "rich.png", size: 10, type: "image/png" }],
  });
  await act(async () => {
    imgInput.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  const richImg = host.querySelector<HTMLImageElement>(
    '.tiptap-prose .editor-image-figure img[src="data:image/png;base64,AA=="]',
  );
  expect(richImg).not.toBeNull();
  for (let i = 0; i < 80; i++) {
    const saved = await store.getArticle(existing.id);
    if (saved.sourceMarkdown.includes("typetada-image:image_cursor_1")) break;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
  const afterRichSave = await store.getArticle(existing.id);
  expect(afterRichSave.sourceMarkdown).toContain(
    "typetada-image:image_cursor_1",
  );
  expect(afterRichSave.sourceMarkdown).not.toContain("data:image/");

  // 新建空白稿并切换至 Markdown 源码态，光标中间插图依然精确生效
  await act(async () => {
    host.querySelector<HTMLButtonElement>("button.new-article")!.click();
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
  expect(host.querySelector(".tiptap-prose")).not.toBeNull();
  await act(async () => {
    [...host.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.textContent === "Markdown")!
      .click();
  });
  const editor = host.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="文章原稿"]',
  )!;
  expect(editor).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(editor, "第一段第二段");
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.setSelectionRange(3, 3);
    editor.dispatchEvent(new Event("select", { bubbles: true }));
  });
  vi.spyOn(images, "importImage").mockResolvedValueOnce({
    id: "image_cursor_2",
    name: "pic.png",
    mime: "image/png",
    url: "data:image/png;base64,AA==",
    createdAt: 0,
  });
  Object.defineProperty(imgInput, "files", {
    configurable: true,
    value: [{ name: "pic.png", size: 10, type: "image/png" }],
  });
  await act(async () => {
    imgInput.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
  expect(
    host.querySelector<HTMLTextAreaElement>('textarea[aria-label="文章原稿"]')
      ?.value,
  ).toContain("第一段\n\n![](typetada-image:image_cursor_2)\n\n第二段");
});

it("refreshes wallet automatically when opened, marks current version in history, and opens inspect drawer", async () => {
  const article = await store.createArticle("成稿稿", "原文。");
  await (
    await store.database
  ).put(
    "results",
    {
      resultId: "res-inspect-1",
      articleId: article.id,
      sourceRevision: 1,
      createdAt: 1,
      title: article.title,
      sourceMarkdown: article.sourceMarkdown,
      themeId: "moyu-green",
      skillId: "gzh-design",
      skillRevision: "test",
      skillContentHash: "test",
      model: "test",
      htmlSha256: "test",
      htmlFragment:
        '<section style="text-align:left"><p><span leaf="">原文。</span></p></section>',
      validation: { ready: true, errors: [], warnings: [] },
      imageStatus: "none",
      plainText: "原文。",
      usage: { inputTokens: 120, outputTokens: 340 },
      enhancements: [
        { type: "quote", text: "精选金句展示", sourceIds: ["s001"] },
      ],
      decisions: ["按教程类文章选择摸鱼绿"],
    },
    "res-inspect-1",
  );
  await mount("成稿稿");
  await act(async () => {
    host.querySelector<HTMLButtonElement>(".preview-inspect-btn")!.click();
  });
  expect(host.textContent).toContain("精选金句展示");
  expect(host.textContent).toContain("按教程类文章选择摸鱼绿");
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('button[aria-label="历史版本"]')!
      .click();
  });
  expect(host.querySelector(".version-badge")?.textContent).toBe("当前预览");
  vi.mocked(walletModule.walletStatus).mockClear();
  await act(async () => {
    host.querySelector<HTMLButtonElement>(".wallet-button")!.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(walletModule.walletStatus).toHaveBeenCalledWith(true);
});

it("shows running progress canvas, non-blocking edit hint, and persistent job alert card", async () => {
  await store.putMeta("preferences", {
    theme: "moyu-green",
    mode: "format_only",
    authorMode: "preserve",
    name: "",
    bio: "",
    note: "",
    consent: true,
    showImages: false,
  });
  vi.mocked(walletModule.walletStatus).mockResolvedValue({
    connected: true,
    remember: false,
    balanceYuan: 12.5,
  });
  const article = await store.createArticle("运行测试稿", "一段待排正文。");
  await mount("运行测试稿");
  let rejectRun!: (reason?: unknown) => void;
  let capturedOnStatus!: (job: any) => void;
  vi.spyOn(pipelineModule, "generateLayout").mockImplementationOnce(
    (_art, _prefs, _ctrl, onStatus) => {
      capturedOnStatus = onStatus;
      onStatus({
        id: "job_run_test",
        articleId: article.id,
        sourceRevision: 1,
        status: "running",
        stage: "generate",
        callCount: 1,
        sent: true,
        startedAt: Date.now() / 1000,
      });
      return new Promise((_, reject) => {
        rejectRun = reject;
      });
    },
  );
  await act(async () => {
    host.querySelector<HTMLButtonElement>("button.generate-button")!.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(host.querySelector(".running-preview-card")?.textContent).toContain(
    "正在按「测试」排版",
  );
  await setTitle("运行测试稿-等待期微调");
  expect(host.querySelector(".running-edit-hint")?.textContent).toContain(
    "本次排版正基于提交时的快照",
  );
  await act(async () => {
    capturedOnStatus({
      id: "job_run_test",
      articleId: article.id,
      sourceRevision: 1,
      status: "outcome_unknown",
      stage: "generate",
      callCount: 1,
      sent: false,
      startedAt: Date.now() / 1000,
      error: { message: "网络连接中断，结果未知" },
    });
    rejectRun(new Error("网络连接中断，结果未知"));
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(host.querySelector(".job-alert")?.textContent).toContain(
    "计费结果未知",
  );
  await act(async () => {
    host
      .querySelector<HTMLButtonElement>('button[aria-label="关闭异常提示"]')!
      .click();
  });
  expect(host.querySelector(".job-alert")).toBeNull();
});

it("shows pre-copy compatibility warning banner without blocking copy and renders added-item location in inspect drawer", async () => {
  const article = await store.createArticle("软提示前端", "原文。");
  await (
    await store.database
  ).put(
    "results",
    {
      resultId: "res-soft-warn",
      articleId: article.id,
      createdAt: Date.now() / 1000,
      title: "软提示前端",
      sourceMarkdown: "原文。",
      sourceRevision: 1,
      themeId: "moyu-green",
      skillId: "gzh-design",
      skillRevision: "local",
      skillContentHash: "hash",
      model: "m",
      htmlFragment:
        '<section style="text-align:left"><p><span leaf="">原文。</span></p></section>',
      validation: {
        ready: true,
        errors: [],
        warnings: [
          "正文有疑似半角标点或英文直引号，请修复；代码和专名需逐项确认",
        ],
      },
      imageStatus: "none",
      plainText: "原文。",
      usage: { inputTokens: 100, outputTokens: 200 },
      enhancements: [
        {
          type: "added",
          text: "编者按示例",
          sourceIds: [],
          location: "正文前",
        },
      ],
      decisions: [],
    },
    "res-soft-warn",
  );
  await mount("软提示前端");
  // A cosmetic hint stays out of the top banner and is summarized in plain words.
  expect(host.querySelector(".message.warning")).toBeNull();
  expect(host.querySelector(".preview-status")?.textContent).toContain(
    "1 条建议看一眼",
  );
  const copyButton = [
    ...host.querySelectorAll<HTMLButtonElement>("button"),
  ].find((btn) => btn.textContent?.includes("复制到公众号"));
  expect(copyButton?.disabled).toBe(false);

  await act(async () => {
    host.querySelector<HTMLButtonElement>(".preview-inspect-btn")?.click();
  });
  expect(host.textContent).toContain("建议看一眼（1）");
  expect(host.textContent).toContain("正文里有英文标点");
  // Skill decoration is summarized as handled, not listed for confirmation.
  expect(host.textContent).toContain("主题加了 1 处装饰文字");
  expect(host.querySelector(".decoration-list")?.textContent).toContain(
    "编者按示例",
  );
  expect(host.textContent).not.toContain("AI 新增的内容");
  expect(host.textContent).not.toContain("span leaf");
});
