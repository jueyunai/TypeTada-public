import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as store from "../src/db";
import {
  generateLayout,
  recoverFailedLayout,
  recoverFromFailureReportFile,
} from "../src/pipeline";
import { DEFAULT_PREFERENCES, type Job } from "../src/types";
import App from "../src/App";

const mockReadPlatform = vi.fn();

vi.mock("../src/wallet", async (original) => ({
  ...(await original<any>()),
  finishAuthorization: vi.fn(async () => null),
  walletStatus: vi.fn(async () => ({
    connected: false,
    remember: false,
    balanceYuan: null,
  })),
  credential: vi.fn(async () => ({
    key: "test-key",
    version: "v1",
  })),
  clearWalletRecovery: vi.fn(async () => {}),
  readPlatform: (...args: unknown[]) => mockReadPlatform(...args),
}));

vi.mock("../src/library", () => ({
  themes: vi.fn(async () => [
    {
      id: "sunset-studio",
      name: "落日工坊",
      color: "#C2410C",
      description: "sunset",
      skillId: "gzh-design",
    },
    {
      id: "moyu-green",
      name: "摸鱼绿",
      color: "#059669",
      description: "green",
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
  contextFor: vi.fn(async (_skill: string, themeId: string) => ({
    context: "test-context",
    skillId: "gzh-design",
    skillRevision: "rev-1",
    skillContentHash: `hash-${themeId}`,
  })),
}));

beforeEach(async () => {
  vi.restoreAllMocks();
  mockReadPlatform.mockReset();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  await store.clearLocal();
  await store.putMeta("walletVersion", "v1");
});

async function seedFailedJob(
  articleId: string,
  overrides: Partial<Job> = {},
): Promise<Job> {
  const { status: finalOverride, ...rest } = overrides;
  const job: Job = {
    id: rest.id ?? `job_${crypto.randomUUID()}`,
    articleId,
    sourceRevision: rest.sourceRevision ?? 1,
    stage: "validate",
    callCount: 1,
    sent: false,
    startedAt: rest.startedAt ?? 1000,
    layout: {
      model: "deepseek-v4.1-flash-1017",
      themeId: "sunset-studio",
      sourceCharacters: 10,
      sourceBlocks: 1,
    },
    ...rest,
    status: "running",
  };
  await store.claimJob(job);
  const finalStatus =
    finalOverride && finalOverride !== "running" ? finalOverride : "failed";
  const failed: Job = {
    ...job,
    status: finalStatus,
    error: overrides.error ?? { message: "排版检查未通过：测试错误" },
    hasFailureResponses: overrides.hasFailureResponses ?? true,
  };
  return failed;
}

describe("zero-cost failure recovery and history records", () => {
  it("stores per-job captures up to 8, lists failed jobs, and cleans up on deleteJob/deleteArticle", async () => {
    const a1 = await store.createArticle("文章一", "正文一。");
    const jobIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const j = await seedFailedJob(a1.id, {
        id: `job_cap_${i}`,
        startedAt: 100 + i,
      });
      await store.updateJob(
        j,
        [{ stage: "generate", content: `<p>v${i}</p>`, truncated: false }],
        { sourceMarkdown: `原文${i}`, themeId: "sunset-studio" },
      );
      jobIds.push(j.id);
    }

    const failedList = await store.listFailedJobs(a1.id);
    expect(failedList).toHaveLength(10);
    expect(failedList[0].id).toBe("job_cap_9");

    const capIds = await store.listFailureCaptureJobIds();
    // Max 8 per-job captures kept (most recent 8: job_cap_2..job_cap_9)
    expect(capIds.has("job_cap_0")).toBe(false);
    expect(capIds.has("job_cap_1")).toBe(false);
    expect(capIds.has("job_cap_9")).toBe(true);
    expect(capIds.size).toBe(8);

    await store.deleteJob("job_cap_9");
    expect((await store.listFailedJobs(a1.id)).map((j) => j.id)).not.toContain(
      "job_cap_9",
    );
    expect(await store.getFailureCapture("job_cap_9")).toBeUndefined();

    await store.deleteArticle(a1.id);
    expect(await store.listFailedJobs(a1.id)).toEqual([]);
    expect((await store.listFailureCaptureJobIds()).size).toBe(0);
  });

  it("recovers at zero cost using stored snapshot even if the article was edited afterward", async () => {
    let article = await store.createArticle("快照恢复", "原始第一段。");
    const j = await seedFailedJob(article.id, { id: "job_snap" });
    await store.updateJob(
      j,
      [
        {
          stage: "generate",
          content:
            '<section style="text-align:left"><p><span leaf="">原始第一段。</span></p></section>',
          truncated: false,
        },
      ],
      {
        sourceMarkdown: "原始第一段。",
        sourceRevision: article.revision,
        title: article.title,
        themeId: "sunset-studio",
        model: "deepseek-v4.1-flash-1017",
      },
    );

    // User edits the article after failure.
    article = await store.saveArticle({
      ...article,
      sourceMarkdown: "用户后来改写的全新段落。",
    });

    const recovered = await recoverFailedLayout(article, j, DEFAULT_PREFERENCES);
    expect(mockReadPlatform).not.toHaveBeenCalled();
    expect(recovered.validation.ready).toBe(true);
    expect(recovered.sourceMarkdown).toBe("原始第一段。");
    expect(recovered.decisions).toContain("从本地留存的模型响应零费用重新核对恢复");

    const jobAfter = await store.getJob(j.id);
    expect(jobAfter?.status).toBe("succeeded");
    expect(await store.listFailedJobs(article.id)).toEqual([]);
    const versions = await store.listVersions(article.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].id).toBe(recovered.resultId);
  });

  it("recovers legacy latestLayoutFailureResponses without snapshot using sunset-studio failure HTML", async () => {
    const md = [
      "前言第一段。",
      "",
      "![截图](https://example.com/a.png)",
      "",
      "文有样逐字差异核对面板",
    ].join("\n");
    const article = await store.createArticle("历史格式恢复", md);
    const j = await seedFailedJob(article.id, {
      id: "job_legacy_sunset",
      sourceRevision: article.revision,
    });
    await store.updateJob(j); // Store failed job status cleanly first.
    await store.putMeta("latestLayoutFailureResponses", {
      jobId: j.id,
      articleId: article.id,
      responses: [
        {
          stage: "generate",
          content: `说明文字\n\`\`\`html\n<section style="text-align:left"><section data-body=""><p><span leaf="">前言第一段。</span></p><section><span leaf=""><img src="https://example.com/a.png" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span></section><p><span leaf="">— 文有样逐字差异核对面板</span></p></section></section>\n\`\`\`\n总结文字`,
          truncated: false,
        },
      ],
    });

    const ids = await store.listFailureCaptureJobIds();
    expect(ids.has(j.id)).toBe(true);

    const recovered = await recoverFailedLayout(article, j);
    expect(mockReadPlatform).not.toHaveBeenCalled();
    expect(recovered.validation.ready).toBe(true);
    expect(recovered.plainText).toContain("文有样逐字差异核对面板");
  });

  it("recovers minor text mismatch as a review draft (待核对稿) and still rejects hard XSS without deleting capture", async () => {
    const a1 = await store.createArticle("待核对恢复", "原文一。\n\n原文二。");
    const draftJob = await seedFailedJob(a1.id, { id: "job_review_draft" });
    await store.updateJob(
      draftJob,
      [
        {
          stage: "generate",
          content:
            '<section style="text-align:left"><p><span leaf="">原文一。</span></p><p><span leaf="">原文改动。</span></p></section>',
          truncated: false,
        },
      ],
      { sourceMarkdown: a1.sourceMarkdown, themeId: "moyu-green" },
    );

    const draftResult = await recoverFailedLayout(a1, draftJob);
    expect(mockReadPlatform).not.toHaveBeenCalled();
    expect(draftResult.validation.ready).toBe(false);
    expect(draftResult.reviewIssues?.length).toBeGreaterThan(0);
    expect((await store.listVersions(a1.id))[0].needsReview).toBe(true);

    const badJob = await seedFailedJob(a1.id, { id: "job_xss" });
    await store.updateJob(
      badJob,
      [
        {
          stage: "generate",
          content:
            '<section style="text-align:left"><script>alert(1)</script><p><span leaf="">原文一。</span></p><p><span leaf="">原文二。</span></p></section>',
          truncated: false,
        },
      ],
      { sourceMarkdown: a1.sourceMarkdown, themeId: "moyu-green" },
    );

    await expect(recoverFailedLayout(a1, badJob)).rejects.toThrow(
      /重新核对仍未通过/,
    );
    expect(await store.getFailureCapture(badJob.id)).toBeTruthy();
    expect((await store.getJob(badJob.id))?.status).toBe("failed");
  });

  it("recovers from an exported failure report JSON file and rejects reports without modelResponses", async () => {
    const article = await store.createArticle("导入报告恢复", "正文章节内容。");
    const goodReport = new File(
      [
        JSON.stringify({
          schemaVersion: 1,
          jobId: "job_missing_local",
          layout: { themeId: "sunset-studio", model: "deepseek-v4.1-flash-1017" },
          lastResponse: { inputTokens: 120, outputTokens: 80 },
          modelResponses: [
            {
              stage: "generate",
              content:
                '```html\n<section style="text-align:left"><p><span leaf="">正文章节内容。</span></p></section>\n```',
              truncated: false,
            },
          ],
        }),
      ],
      "report.json",
      { type: "application/json" },
    );

    const res = await recoverFromFailureReportFile(article, goodReport);
    expect(mockReadPlatform).not.toHaveBeenCalled();
    expect(res.validation.ready).toBe(true);
    expect(res.themeId).toBe("sunset-studio");
    expect(res.usage).toEqual({ inputTokens: 120, outputTokens: 80 });

    const summaryOnly = new File(
      [JSON.stringify({ schemaVersion: 1, jobId: "job_x" })],
      "summary.json",
      { type: "application/json" },
    );
    await expect(
      recoverFromFailureReportFile(article, summaryOnly),
    ).rejects.toThrow("这份诊断报告不包含模型正文");
  });

  it("persists sourceMarkdown and themeId snapshot inside capture when generateLayout fails", async () => {
    const article = await store.createArticle("生成失败快照", "正文原文。");
    mockReadPlatform.mockResolvedValue({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content:
              '<section style="text-align:left"><script>alert(1)</script><p><span leaf="">正文原文。</span></p></section>',
          },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });

    await expect(
      generateLayout(
        article,
        { ...DEFAULT_PREFERENCES, theme: "sunset-studio", consent: true },
        new AbortController(),
        () => {},
      ),
    ).rejects.toThrow(/排版检查未通过/);

    const failed = await store.listFailedJobs(article.id);
    expect(failed).toHaveLength(1);
    const capture = await store.getFailureCapture(failed[0].id);
    expect(capture?.sourceMarkdown).toBe("正文原文。");
    expect(capture?.themeId).toBe("sunset-studio");
  });
});

describe("History drawer UI integration for failed jobs and zero-cost recovery", () => {
  let root: Root;
  let host: HTMLDivElement;

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    host?.remove();
  });

  it("renders failed records in the History drawer and recovers at zero cost on click", async () => {
    const article = await store.createArticle("历史恢复UI", "第一段测试文字。");
    const j = await seedFailedJob(article.id, {
      id: "job_ui_recover",
      sourceRevision: article.revision,
      error: { message: "排版检查未通过：测试误拦" },
    });
    await store.updateJob(
      j,
      [
        {
          stage: "generate",
          content:
            '```html\n<section style="text-align:left"><p><span leaf="">第一段测试文字。</span></p></section>\n```',
          truncated: false,
        },
      ],
      {
        sourceMarkdown: article.sourceMarkdown,
        sourceRevision: article.revision,
        title: article.title,
        themeId: "sunset-studio",
      },
    );
    await store.putMeta("lastArticle", article.id);

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(App));
    });
    for (let i = 0; i < 100; i++) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      if (
        host.querySelector<HTMLInputElement>('input[aria-label="文章标题"]')
          ?.value === "历史恢复UI"
      )
        break;
    }

    const historyBtn = host.querySelector<HTMLButtonElement>(
      'button[aria-label="历史版本"]',
    )!;
    await act(async () => {
      historyBtn.click();
    });

    const failedCard = host.querySelector(".failed-version");
    expect(failedCard?.textContent).toContain("校验未通过");
    expect(failedCard?.textContent).toContain("落日工坊");

    const recoverBtn = [...failedCard!.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("重新核对并恢复"),
    )!;
    await act(async () => {
      recoverBtn.click();
      await new Promise((r) => setTimeout(r, 40));
    });

    expect(mockReadPlatform).not.toHaveBeenCalled();
    expect(host.querySelector(".failed-version")).toBeNull();
    expect(await store.listFailedJobs(article.id)).toEqual([]);
    const versions = await store.listVersions(article.id);
    expect(versions).toHaveLength(1);
    expect(host.textContent).toContain("0 费用恢复成稿");
  });
});
