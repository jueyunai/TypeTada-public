import { beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { version } from "../package.json";
import * as store from "../src/db";
import {
  authorizeUrl,
  finishAuthorization,
  disconnectWallet,
  ENDPOINTS,
} from "../src/wallet";
import { generateLayout } from "../src/pipeline";
import { DEFAULT_PREFERENCES } from "../src/types";
import { exportBackup, importBackup } from "../src/backup";
import { escapeHtml } from "../src/content";
import { hydrateImages } from "../src/images";
import {
  previewDocument,
  copyRichText,
  layoutFailureReport,
} from "../src/output";
let requests: any[] = [];
let replaceOutput: ((value: string) => string) | undefined;
let interrupt = false;
let traceparents: string[] = [];
let interruptBody = false;
function response(request: any) {
  const payload = JSON.parse(request.body);
  requests.push(payload);
  const sources = JSON.parse(payload.messages[1].content).sources;
  let html =
    '<section style="text-align:left">' +
    sources
      .map(
        (s: any) =>
          `<section data-source="${s.id}"><p><span leaf="">${escapeHtml(s.text)}</span></p></section>`,
      )
      .join("") +
    '<section data-enhancement="cta"><p><span leaf="">欢迎点赞和转发。</span></p></section></section>';
  if (replaceOutput) html = replaceOutput(html);
  return new Response(
    JSON.stringify({
      choices: [{ finish_reason: "stop", message: { content: html } }],
      usage: { prompt_tokens: 20, completion_tokens: 30 },
    }),
  );
}
beforeEach(async () => {
  await disconnectWallet();
  await store.clearLocal();
  requests = [];
  replaceOutput = undefined;
  interrupt = false;
  traceparents = [];
  interruptBody = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: any) => {
      if (String(url) === ENDPOINTS.exchange)
        return new Response(JSON.stringify({ key: "test-personal-key" }));
      if (String(url) === ENDPOINTS.chat) {
        expect(init.headers["X-App-URL"]).toBe("https://example.com");
        const traceparent = new Headers(init.headers).get("traceparent")!;
        expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
        traceparents.push(traceparent);
        if (interrupt) throw new TypeError("network");
        const traceId = traceparent.split("-")[1];
        const headers = { "X-Trace-Id": traceId };
        if (interruptBody) {
          return new Response(new ReadableStream({
            start(controller) { controller.error(new Error("body interrupted")); },
          }), { headers });
        }
        const successful = response(init);
        successful.headers.set("X-Trace-Id", traceId);
        return successful;
      }
      if (String(url).startsWith("/library/"))
        return new Response(readFileSync("public" + url, "utf8"));
      throw new Error("Unexpected network URL " + url);
    }),
  );
  const auth = await authorizeUrl(false),
    returnUrl = new URL(new URL(auth).searchParams.get("callback_url")!);
  returnUrl.searchParams.set("code", "test-code");
  history.replaceState(null, "", returnUrl);
  await finishAuthorization();
});
it("completes generation locally with exact attribution; result survives data reload and backups omit credentials", async () => {
  const article = await store.createArticle("测试", "价格19.9元。");
  const result = await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  expect(requests).toHaveLength(1);
  const traceId = traceparents[0].split("-")[1];
  expect((await store.latestJob(article.id))?.attempts?.[0]).toMatchObject({
    traceId,
    platformTraceId: traceId,
  });
  expect(JSON.parse(requests[0].messages[1].content).layoutMonth).toMatch(
    /^\d{4} \/ \d{2}$/,
  );
  expect(requests[0].model).toBe("test-model");
  expect(result.model).toBe("test-model");
  expect(requests[0].thinking).toEqual({ type: "enabled" });
  expect(requests[0].reasoning_effort).toBe("high");
  expect(requests[0].max_tokens).toBe(65536);
  expect((await store.getResult(result.resultId)).htmlFragment).toContain(
    "欢迎点赞",
  );
  const backup = await exportBackup();
  expect(backup).not.toContain("test-personal-key");
  const file = { size: backup.length, text: async () => backup } as File;
  await importBackup(file);
  expect(await store.listArticles()).toHaveLength(2);
  expect(await store.listVersions(article.id)).toHaveLength(1);
  expect(JSON.parse(backup).results[0].sourceHtml).toContain("data-source");
});
it("delivers a long draft with Skill-specific custom cards in one request and indexes all additions", async () => {
  const markdown = Array.from(
    { length: 38 },
    (_, i) =>
      `第${i + 1}段记录一次工具试用。我保存了原始笔记和截图，再按实际步骤复盘。每一步都说明为什么这样安排，读者可以按顺序核对过程。最后我把仍需确认的问题写成了清单，准备下次逐项检查。`,
  ).join("\n\n");
  expect(markdown.length).toBeGreaterThan(3000);
  replaceOutput = (html) =>
    html.replace(
      '<section data-enhancement="cta">',
      '<section data-enhancement="cover" data-refs="s001"><p><span leaf="">合规封面。</span></p></section>' +
        '<section data-enhancement="quote" data-refs="s002，s003"><p><span leaf="">引用格式可自由扩展。</span></p></section>' +
        '<section data-enhancement="summary" data-refs="s001"><p><span leaf="">新扩展卡片。</span></p></section>' +
        '<section data-enhancement="intro" data-refs="s999"><p><span leaf="">自定义导语。</span></p></section>' +
        '<section data-enhancement="toc"><p><span leaf="">导读目录。</span></p></section>' +
        '<section data-enhancement="cta">',
    );
  const article = await store.createArticle("长文回归", markdown);
  const result = await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, theme: "little-growth", consent: true },
    new AbortController(),
    () => {},
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].messages[0].content).not.toMatch(
    /AskUserQuestion|自定义主题生成（第二条工作流）/,
  );
  expect(result.enhancements.map((entry) => entry.type)).toEqual([
    "cover",
    "quote",
    "summary",
    "intro",
    "toc",
    "cta",
  ]);
  expect(result.plainText).toContain("第38段记录一次工具试用。");
  expect(result.plainText).toContain("新扩展卡片。");
  expect(result.notice).toBeUndefined();
  expect((await store.getResult(result.resultId)).validation.ready).toBe(true);
});
it("repairs fenced sibling sections and missing leaf spans before requesting another model call", async () => {
  replaceOutput = (html) =>
    "```html\n" +
    html
      .replace(/^<section style="text-align:left">|<\/section>$/g, "")
      .replaceAll('<span leaf="">', "")
      .replaceAll("</span>", "") +
    "\n```";
  const article = await store.createArticle(
    "格式回归",
    "价格19.9元。\n\n下一段不丢失。",
  );
  const result = await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  const job = (await store.latestJob(article.id))!;
  expect(requests).toHaveLength(1);
  expect(result.plainText).toContain("价格19.9元。\n下一段不丢失。");
  expect(result.enhancements.map((entry) => entry.type)).toEqual(["cta"]);
  expect(job.attempts?.[0].initialValidation?.errors).toContain(
    "正文必须只有一个section根节点",
  );
  expect(job.attempts?.[0].validation?.ready).toBe(true);
  expect(await store.getFailureResponses(job.id)).toBeUndefined();
});
it("blocks unsafe output after one attempt and keeps model text out of the default report", async () => {
  replaceOutput = (html) =>
    html.replace("19.9", "199") + "额外文字不应静默删掉";
  const article = await store.createArticle("测试", "价格19.9元。");
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("未通过");
  expect(requests).toHaveLength(1);
  expect(await store.listVersions(article.id)).toEqual([]);
  const job = (await store.latestJob(article.id))!;
  expect(job.attempts?.map((attempt) => attempt.stage)).toEqual([
    "generate",
  ]);
  for (const attempt of job.attempts ?? []) {
    expect(attempt.validation?.errors).toContain("原文s001文字变化");
    expect(attempt.validation?.errors).toContain(
      "正文必须只有一个section根节点",
    );
  }
  const responses = (await store.getFailureResponses(job.id))!;
  expect(responses).toHaveLength(1);
  expect(responses[0].content).toContain("额外文字不应静默删掉");
  const report = layoutFailureReport(job);
  expect(job.appVersion).toBe(version);
  expect(JSON.parse(report)).toMatchObject({
    schemaVersion: 1,
    appVersion: version,
  });
  expect(report).not.toMatch(/价格|test-personal-key|额外文字不应静默删掉/);
  expect(
    JSON.parse(layoutFailureReport(job, responses)).modelResponses,
  ).toEqual(responses);
  expect(await exportBackup()).not.toContain("额外文字不应静默删掉");
  await store.deleteArticle(article.id);
  expect(await store.getFailureResponses(job.id)).toBeUndefined();
});
it("leaves unknown call ledger after a network failure and does not retry", async () => {
  interrupt = true;
  const article = await store.createArticle("测试", "原文。");
  const platformFetch = fetch;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    if (url === ENDPOINTS.chat) {
      const traceId = new Headers(init.headers).get("traceparent")?.split("-")[1];
      expect((await store.latestJob(article.id))?.attempts?.[0]).toMatchObject({ traceId });
    }
    return platformFetch(url, init);
  });
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("未知");
  const job = (await store.latestJob(article.id))!;
  expect(job.status).toBe("outcome_unknown");
  expect(job.callCount).toBe(1);
  expect(traceparents).toHaveLength(1);
  expect(JSON.parse(layoutFailureReport(job)).attempts[0]).toMatchObject({
    traceId: traceparents[0].split("-")[1],
  });
  expect(job.attempts?.[0].platformTraceId).toBeUndefined();
});
it("keeps the platform trace ID when the response body cannot be read", async () => {
  interruptBody = true;
  const article = await store.createArticle("读取中断", "原文。");
  await expect(generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  )).rejects.toThrow("响应读取中断");
  const job = (await store.latestJob(article.id))!;
  const traceId = traceparents[0].split("-")[1];
  expect(JSON.parse(layoutFailureReport(job))).toMatchObject({
    status: "outcome_unknown",
    callCount: 1,
    attempts: [{ traceId, platformTraceId: traceId }],
  });
});
it("rejects forged backup HTML instead of trusting imported ready flags", async () => {
  const article = await store.createArticle("测试", "原文。");
  await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  const backup = JSON.parse(await exportBackup());
  backup.results[0].sourceHtml +=
    '<img onerror="evil()" src="https://evil/x.png">';
  const json = JSON.stringify(backup);
  await expect(
    importBackup({ size: json.length, text: async () => json } as File),
  ).rejects.toThrow("未通过安全");
  expect(await store.listArticles()).toHaveLength(1);
});
it("hydrates local image IDs into actual data src and copy uses HTML/plain rather than blob/file references", () => {
  const url = "data:image/png;base64,iVBORw0KGgo=";
  const html = hydrateImages(
    '<section><img src="typetada-image:image_one"></section>',
    new Map([["image_one", url]]),
  );
  expect(html).toContain(url);
  expect(html).not.toContain("blob:");
});
it("preview does not load external images until user enables them", () => {
  const result: any = {
    htmlFragment:
      '<section style="text-align:left"><p><span leaf="">图。</span></p><img src="https://example.com/x.png"></section>',
    validation: { ready: true },
    plainText: "图。",
  };
  expect(previewDocument(result)).not.toContain('src="https://example.com');
  expect(previewDocument(result, true)).toContain('src="https://example.com');
  const data: Record<string, string> = {};
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: () => {
      const event = new Event("copy", { cancelable: true });
      Object.defineProperty(event, "clipboardData", {
        value: {
          setData: (type: string, value: string) => (data[type] = value),
        },
      });
      document.dispatchEvent(event);
      return true;
    },
  });
  copyRichText(result);
  expect(data["text/html"]).toBe(result.htmlFragment);
  expect(data["text/plain"]).toBe("图。");
});
it("known quota rejection stays failed with explicit recovery and retains wallet", async () => {
  const original = globalThis.fetch;
  vi.stubGlobal("fetch", async (url: string, init: any) =>
    url === ENDPOINTS.chat
      ? new Response("{}", {
          status: 403,
          headers: { "TokenDance-Recovery-Action": "top_up_balance" },
        })
      : original(url, init),
  );
  const article = await store.createArticle("测试", "原文。");
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("HTTP 403");
  const job = await store.latestJob(article.id);
  expect(job?.status).toBe("failed");
  expect(job?.error?.recoveryAction).toBe("top_up_balance");
});
it("cleared or disconnected task cannot commit a late successful result", async () => {
  const original = globalThis.fetch;
  vi.stubGlobal("fetch", async (url: string, init: any) => {
    const r = await original(url, init);
    if (url === ENDPOINTS.chat) await store.clearLocal();
    return r;
  });
  const article = await store.createArticle("测试", "原文。");
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow();
  expect(await store.listArticles()).toEqual([]);
  expect(await store.listVersions(article.id)).toEqual([]);
});

it("separates reasoning-only output exhaustion from valid text and stores safe diagnostic counts without the reasoning", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  vi.stubGlobal("fetch", async (url: string, init: any) => {
    if (url !== ENDPOINTS.chat) return original(url, init);
    calls++;
    return new Response(
      JSON.stringify({
        choices: [
          {
            finish_reason: "length",
            message: { content: "", reasoning_content: "private reasoning" },
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 16384 },
      }),
    );
  });
  const article = await store.createArticle("测试", "原文。");
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("思考阶段");
  const job = await store.latestJob(article.id);
  expect(calls).toBe(1);
  expect(job?.diagnostic).toMatchObject({
    finishReason: "length",
    contentCharacters: 0,
    reasoningCharacters: 17,
    outputTokens: 16384,
  });
  expect(JSON.stringify(job)).not.toContain("private reasoning");
  expect(await store.listVersions(article.id)).toHaveLength(0);
});
it("shows local embedded pictures by default without enabling external image requests", () => {
  const result: any = {
    htmlFragment:
      '<section style="text-align:left"><p><span leaf="">配图。</span></p><img src="data:image/png;base64,iVBORw0KGgo="><img src="https://example.com/a.png"></section>',
  };
  const preview = previewDocument(result, false);
  expect(preview).toContain('src="data:image/png;base64,');
  expect(preview).not.toContain('src="https://example.com');
});
it("imports legacy backup with fixed pixel width while preserving security checks", async () => {
  const article = await store.createArticle("旧备份", "历史段落。");
  await (
    await store.database
  ).put(
    "results",
    {
      resultId: "legacy-width-result",
      articleId: article.id,
      createdAt: 1,
      title: article.title,
      sourceMarkdown: article.sourceMarkdown,
      sourceRevision: 1,
      themeId: "moyu-blue",
      skillId: "gzh-design",
      skillRevision: "local-20261112",
      skillContentHash: "hash",
      model: "test-model",
      htmlFragment:
        '<section style="text-align:left"><section style="width:150px;padding:12px"><p><span leaf="">历史段落。</span></p></section></section>',
      sourceHtml:
        '<section style="text-align:left"><section data-source="s001" style="width:150px;padding:12px"><p><span leaf="">历史段落。</span></p></section></section>',
      plainText: "历史段落。",
      htmlSha256: "h",
      validation: { ready: true, errors: [], warnings: [] },
      imageStatus: "none",
      usage: { inputTokens: 1, outputTokens: 1 },
      enhancements: [],
      decisions: [],
    },
    "legacy-width-result",
  );
  const raw = await exportBackup(article.id);
  await store.clearLocal();
  const imported = await importBackup({
    size: raw.length,
    text: async () => raw,
  } as File);
  expect(imported).toEqual({ articles: 1, results: 1 });
});

it("completes tagless custom Skill layout in one pass and keeps added content in review list", async () => {
  replaceOutput = () =>
    '<section style="text-align:left">' +
    '<section style="padding:19px;background:#F4F9F5;"><p>编者按</p><p>原文关键句。</p></section>' +
    '<section><p><span leaf="">欢迎点赞、在看、转发。</span></p></section>' +
    "</section>";
  const article = await store.createArticle("无标签新Skill", "原文关键句。");
  const result = await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, theme: "little-growth", consent: true },
    new AbortController(),
    () => {},
  );
  expect(requests).toHaveLength(1);
  expect(result.validation.ready).toBe(true);
  expect(result.plainText).toContain("编者按");
  expect(result.plainText).toContain("原文关键句。");
  expect(result.enhancements.some((e) => e.text === "编者按")).toBe(true);
  expect(result.notice).toBeUndefined();
});

it("fills leftover Skill signature placeholders from the author's own signature without another model call", async () => {
  const signature =
    '<section><p><span leaf="">我是 {{作者名}}，{{一句话简介，比如：一个爱琢磨 AI 的人}}。</span></p></section>';
  replaceOutput = (html) =>
    html.replace(
      '<section data-enhancement="cta">',
      signature + '<section data-enhancement="cta">',
    );
  const article = await store.createArticle("署名", "正文第一段。");
  const custom = await generateLayout(
    article,
    {
      ...DEFAULT_PREFERENCES,
      consent: true,
      authorMode: "custom",
      name: "李知云",
      bio: "写字的人",
    },
    new AbortController(),
    () => {},
  );
  expect(requests).toHaveLength(1);
  expect(custom.htmlFragment).toContain("我是李知云，写字的人。");
  expect(custom.validation.warnings.join()).not.toContain("模板占位符");
  expect(JSON.stringify(requests[0].messages[0].content)).toContain(
    "不得输出 {{…}} 形式的模板占位符",
  );

  const preserved = await generateLayout(
    await store.createArticle("署名2", "正文第一段。"),
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  // Without a signature from the author the placeholder is surfaced, not guessed.
  expect(preserved.htmlFragment).toContain("{{作者名}}");
  expect(preserved.notice).toContain("需要你处理");
});

it("keeps unified hard/soft gates across generation, copyRichText, and backup round-trip", async () => {
  replaceOutput = (html) =>
    html.replace(
      '<section data-enhancement="cta">',
      '<section style="width:200px"><p><span leaf="">半角标点,卡片</span></p></section><section data-enhancement="cta">',
    );
  const article = await store.createArticle("统一门禁", "正文第一段。");
  const result = await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  expect(requests).toHaveLength(1);
  expect(result.validation.ready).toBe(true);
  expect(result.validation.warnings.length).toBeGreaterThanOrEqual(2);
  expect(result.notice).toContain("条建议在复制前看一眼");

  const copied: Record<string, string> = {};
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: () => {
      const event = new Event("copy", { cancelable: true });
      Object.defineProperty(event, "clipboardData", {
        value: {
          setData: (type: string, value: string) => (copied[type] = value),
        },
      });
      document.dispatchEvent(event);
      return true;
    },
  });
  copyRichText(result);
  expect(copied["text/html"]).toBe(result.htmlFragment);

  const backup = await exportBackup();
  await store.clearLocal();
  const imported = await importBackup({
    size: backup.length,
    text: async () => backup,
  } as File);
  expect(imported).toEqual({ articles: 1, results: 1 });
});

it("keeps a safe draft and only sends one repair call after it is requested", async () => {
  let callIndex = 0;
  replaceOutput = (html) => {
    callIndex++;
    if (callIndex <= 2) {
      return '<section style="text-align:left"><p><span leaf="">第二段。</span></p><p><span leaf="">第一段。</span></p></section>';
    }
    return html;
  };
  const article = await store.createArticle("乱序定位", "第一段。\n\n第二段。");
  const prefs = { ...DEFAULT_PREFERENCES, consent: true };
  const draft = await generateLayout(
    article,
    prefs,
    new AbortController(),
    () => {},
  );
  expect(requests).toHaveLength(1);
  expect(draft.validation.ready).toBe(false);
  expect(draft.reviewIssues).toEqual([expect.objectContaining({ kind: "out_of_order" })]);
  expect(await store.listVersions(article.id)).toEqual([expect.objectContaining({ id: draft.resultId, needsReview: true })]);
  expect(() => copyRichText(draft)).toThrow("不能复制");

  const repairDraft = () => generateLayout(article, prefs, new AbortController(), () => {}, draft);
  await expect(repairDraft()).rejects.toThrow("原待核对稿已保留");
  expect(requests).toHaveLength(2);
  expect(await store.getResult(draft.resultId)).toEqual(draft);
  expect(await store.listVersions(article.id)).toHaveLength(1);
  const repairPayload = JSON.parse(
    requests[1].messages.at(-1).content.split("重新输出完整正文：")[1],
  );
  expect(repairPayload.errors).toContain("原文s002顺序变化");
  expect(repairPayload.locations.outOfOrder[0].sourceId).toBe("s002");
  const result = await repairDraft();
  expect(requests).toHaveLength(3);
  expect(new Set(traceparents.map((header) => header.split("-")[1])).size).toBe(3);
  expect(result.validation.ready).toBe(true);
  expect(result.reviewIssues).toBeUndefined();
  expect(await store.listVersions(article.id)).toHaveLength(2);

  const backup = await exportBackup(article.id);
  await store.clearLocal();
  expect(await importBackup({ size: backup.length, text: async () => backup } as File)).toEqual({ articles: 1, results: 2 });
  const [restored] = await store.listArticles();
  expect((await store.listVersions(restored.id)).map((v) => v.needsReview)).toContain(true);
});

it("preserves non-blocking width compatibility warnings after backup import", async () => {
  replaceOutput = (html) =>
    html.replace(
      '<section data-enhancement="cta">',
      '<section style="width:200px"><p><span leaf="">固定宽度卡片</span></p></section><section data-enhancement="cta">',
    );
  const article = await store.createArticle("备份保留宽度提示", "正文内容。");
  const generated = await generateLayout(
    article,
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  expect(generated.validation.ready).toBe(true);
  expect(generated.validation.warnings.join()).toContain("width:200px");

  const raw = await exportBackup(article.id);
  await store.clearLocal();
  const imported = await importBackup({
    size: raw.length,
    text: async () => raw,
  } as File);
  expect(imported).toEqual({ articles: 1, results: 1 });

  const articles = await store.listArticles();
  const versions = await store.listVersions(articles[0].id);
  const restored = await store.getResult(versions[0].id);
  expect(restored.validation.ready).toBe(true);
  expect(restored.validation.warnings.join()).toContain("width:200px");
});
