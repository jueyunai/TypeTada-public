import { openDB, type DBSchema } from "idb";
import type {
  Article,
  Asset,
  Job,
  LayoutFailureResponse,
  LayoutResult,
  Preferences,
} from "./types";
import { id, DEFAULT_PREFERENCES } from "./types";

interface LocalDB extends DBSchema {
  articles: { key: string; value: Article };
  results: { key: string; value: LayoutResult };
  assets: { key: string; value: Asset };
  jobs: { key: string; value: Job };
  recovery: { key: string; value: Article };
  meta: { key: string; value: unknown };
}
const channel =
  typeof BroadcastChannel === "function"
    ? new BroadcastChannel("typetada-local")
    : null;
export function changed() {
  channel?.postMessage("changed");
  window.dispatchEvent(new Event("typetada-data"));
}
channel?.addEventListener("message", () =>
  window.dispatchEvent(new Event("typetada-data")),
);
const database = openDB<LocalDB>("typetada-local", 1, {
  upgrade(db) {
    for (const name of [
      "articles",
      "results",
      "assets",
      "jobs",
      "recovery",
      "meta",
    ] as const)
      db.createObjectStore(name);
  },
  blocked() {
    window.dispatchEvent(new Event("typetada-db-blocked"));
  },
});
export class ConflictError extends Error {
  constructor() {
    super(
      "文章已在另一窗口修改。当前输入仍在，请另存副本或重新打开；不会覆盖另一窗口的内容。",
    );
  }
}
export async function epoch() {
  return ((await (await database).get("meta", "epoch")) as number) || 0;
}
export async function getMeta<T>(key: string) {
  return (await (await database).get("meta", key)) as T | undefined;
}
export async function putMeta(key: string, value: unknown) {
  await (await database).put("meta", value, key);
  changed();
}
export async function putMetaAtEpoch(
  key: string,
  value: unknown,
  expectedEpoch: number,
) {
  const db = await database,
    tx = db.transaction("meta", "readwrite");
  if (((await tx.store.get("epoch")) || 0) === expectedEpoch)
    await tx.store.put(value, key);
  await tx.done;
}
export async function listArticles() {
  return (await (await database).getAll("articles")).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
}
export async function getArticle(key: string) {
  const value = await (await database).get("articles", key);
  if (!value) throw new Error("文章已删除，请返回文章列表");
  return value;
}
export async function createArticle(
  title: string,
  sourceMarkdown: string,
  assets: Asset[] = [],
  expectedEpoch?: number,
) {
  const article: Article = {
    id: id("article"),
    title,
    sourceMarkdown,
    revision: 1,
    updatedAt: Date.now() / 1000,
  };
  const tx = (await database).transaction(
    ["articles", "assets", "meta"],
    "readwrite",
  );
  if (
    expectedEpoch !== undefined &&
    ((await tx.objectStore("meta").get("epoch")) || 0) !== expectedEpoch
  ) {
    await tx.done;
    throw new Error("数据已清除，导入已停止");
  }
  await tx.objectStore("articles").put(article, article.id);
  for (const asset of assets)
    await tx.objectStore("assets").put(asset, asset.id);
  await tx.done;
  changed();
  return article;
}
export async function saveArticle(
  current: Article,
  assets: Asset[] = [],
  expectedEpoch?: number,
) {
  const db = await database,
    tx = db.transaction(["articles", "assets", "meta"], "readwrite");
  if (
    expectedEpoch !== undefined &&
    ((await tx.objectStore("meta").get("epoch")) || 0) !== expectedEpoch
  ) {
    await tx.done;
    throw new Error("数据已清除，粘贴已停止");
  }
  const saved = await tx.objectStore("articles").get(current.id);
  if (!saved || saved.revision !== current.revision) {
    await tx.done;
    throw new ConflictError();
  }
  const next = {
    ...current,
    revision: current.revision + 1,
    updatedAt: Date.now() / 1000,
  };
  for (const asset of assets)
    await tx.objectStore("assets").put(asset, asset.id);
  await tx.objectStore("articles").put(next, current.id);
  await tx.done;
  changed();
  return next;
}
export async function saveRecovery(article: Article) {
  const db = await database,
    tx = db.transaction(["articles", "recovery"], "readwrite");
  if (await tx.objectStore("articles").get(article.id))
    await tx.objectStore("recovery").put(article, article.id);
  await tx.done;
}
export async function loadRecovery(key: string) {
  return (await database).get("recovery", key);
}
export async function removeRecovery(key: string) {
  await (await database).delete("recovery", key);
}
type FailureCapture = {
  jobId: string;
  articleId: string;
  responses: LayoutFailureResponse[];
};
const FAILURE_CAPTURE_KEY = "latestLayoutFailureResponses";

export async function getFailureResponses(jobId: string) {
  const capture = await getMeta<FailureCapture>(FAILURE_CAPTURE_KEY);
  return capture?.jobId === jobId ? capture.responses : undefined;
}

export async function deleteArticle(key: string) {
  const db = await database,
    tx = db.transaction(
      ["articles", "results", "jobs", "recovery", "meta"],
      "readwrite",
    );
  await tx.objectStore("articles").delete(key);
  await tx.objectStore("recovery").delete(key);
  for (const value of await tx.objectStore("results").getAll())
    if (value.articleId === key)
      await tx.objectStore("results").delete(value.resultId);
  for (const value of await tx.objectStore("jobs").getAll())
    if (value.articleId === key) await tx.objectStore("jobs").delete(value.id);
  const meta = tx.objectStore("meta");
  const capture = (await meta.get(FAILURE_CAPTURE_KEY)) as
    FailureCapture | undefined;
  if (capture?.articleId === key) await meta.delete(FAILURE_CAPTURE_KEY);
  await tx.done;
  changed();
}
export async function listVersions(
  articleId: string,
): Promise<import("./types").Version[]> {
  return (await (await database).getAll("results"))
    .filter((r) => r.articleId === articleId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => ({
      id: r.resultId,
      sourceRevision: r.sourceRevision,
      createdAt: r.createdAt,
      themeId: r.themeId,
    }));
}
export async function getResult(key: string) {
  const result = await (await database).get("results", key);
  if (!result) throw new Error("版本已删除");
  return result;
}
export async function deleteResult(key: string) {
  await (await database).delete("results", key);
  changed();
}
export class InvalidatedError extends Error {}
export async function saveResult(
  result: LayoutResult,
  expectedEpoch: number,
  jobId?: string,
  walletVersion?: string,
) {
  const db = await database,
    tx = db.transaction(["articles", "results", "meta", "jobs"], "readwrite");
  const job = jobId ? await tx.objectStore("jobs").get(jobId) : undefined;
  if (
    ((await tx.objectStore("meta").get("epoch")) || 0) !== expectedEpoch ||
    !(await tx.objectStore("articles").get(result.articleId)) ||
    (jobId && job?.status !== "running") ||
    (walletVersion &&
      (await tx.objectStore("meta").get("walletVersion")) !== walletVersion)
  ) {
    await tx.done;
    throw new InvalidatedError(
      "数据、文章、任务或钱包已失效，不再保存/展示迟到结果",
    );
  }
  await tx.objectStore("results").put(result, result.resultId);
  if (job)
    await tx.objectStore("jobs").put(
      {
        ...job,
        status: "succeeded",
        stage: "complete",
        sent: false,
        resultId: result.resultId,
      },
      job.id,
    );
  await tx.done;
  changed();
}
export async function listAssets() {
  return (await database).getAll("assets");
}
export async function putAsset(asset: Asset, expectedEpoch: number) {
  const db = await database,
    tx = db.transaction(["assets", "meta"], "readwrite");
  if (((await tx.objectStore("meta").get("epoch")) || 0) !== expectedEpoch) {
    await tx.done;
    throw new Error("数据已清除，导入已停止");
  }
  await tx.objectStore("assets").put(asset, asset.id);
  await tx.done;
  changed();
  return asset;
}
export async function deleteAsset(key: string) {
  const db = await database,
    tx = db.transaction(
      ["articles", "results", "assets", "recovery"],
      "readwrite",
    );
  const referenced =
    (await tx.objectStore("articles").getAll()).some((a) =>
      a.sourceMarkdown.includes(key),
    ) ||
    (await tx.objectStore("results").getAll()).some((r) =>
      r.sourceMarkdown.includes(key),
    ) ||
    // An unsaved draft kept for recovery may be the only user of the image.
    (await tx.objectStore("recovery").getAll()).some((a) =>
      a.sourceMarkdown.includes(key),
    );
  if (referenced) {
    await tx.done;
    throw new Error("配图仍被文章或版本引用，请先删除引用它的稿件/版本");
  }
  await tx.objectStore("assets").delete(key);
  await tx.done;
  changed();
}
export async function claimJob(job: Job) {
  const db = await database,
    tx = db.transaction(["jobs", "articles"], "readwrite");
  if (!(await tx.objectStore("articles").get(job.articleId))) {
    await tx.done;
    throw new Error("文章已删除");
  }
  const active = (await tx.objectStore("jobs").getAll()).some(
    (j) => j.status === "running",
  );
  if (active) {
    await tx.done;
    throw new Error(
      "已有窗口正在排版，请先完成或取消；中断任务请手动标为结果未知",
    );
  }
  await tx.objectStore("jobs").put(job, job.id);
  await tx.done;
  changed();
}
export async function updateJob(job: Job, responses?: LayoutFailureResponse[]) {
  const db = await database,
    tx = db.transaction(
      responses?.length ? ["jobs", "meta"] : ["jobs"],
      "readwrite",
    );
  const jobs = tx.objectStore("jobs");
  const old = await jobs.get(job.id);
  const updated = !!old && old.status === "running";
  if (updated) {
    await jobs.put(job, job.id);
    if (responses?.length) {
      const capture: FailureCapture = {
        jobId: job.id,
        articleId: job.articleId,
        responses,
      };
      await tx.objectStore("meta").put(capture, FAILURE_CAPTURE_KEY);
    }
  }
  await tx.done;
  changed();
  return updated;
}
export async function beginJobCall(
  key: string,
  stage: string,
  expectedEpoch: number,
  walletVersion: string,
) {
  const tx = (await database).transaction(
    ["jobs", "articles", "meta"],
    "readwrite",
  );
  const job = await tx.objectStore("jobs").get(key);
  if (
    !job ||
    job.status !== "running" ||
    ((await tx.objectStore("meta").get("epoch")) || 0) !== expectedEpoch ||
    (await tx.objectStore("meta").get("walletVersion")) !== walletVersion ||
    !(await tx.objectStore("articles").get(job.articleId))
  ) {
    await tx.done;
    throw new InvalidatedError("任务已取消或数据/钱包已失效，未开始新的请求");
  }
  if (job.callCount >= 3) {
    await tx.done;
    throw new Error("已达到本篇调用上限");
  }
  const next = { ...job, stage, callCount: job.callCount + 1, sent: true };
  await tx.objectStore("jobs").put(next, key);
  await tx.done;
  changed();
  return next;
}
export async function getJob(key: string) {
  return (await database).get("jobs", key);
}
export async function latestJob(articleId: string) {
  return (
    (await (await database).getAll("jobs"))
      .filter((j) => j.articleId === articleId)
      .sort((a, b) => b.startedAt - a.startedAt)[0] || null
  );
}
export async function activeJob() {
  return (
    (await (await database).getAll("jobs")).find(
      (j) => j.status === "running",
    ) || null
  );
}
export async function interruptJob(key: string) {
  const tx = (await database).transaction("jobs", "readwrite");
  const job = await tx.store.get(key);
  if (job?.status === "running") {
    job.status = job.sent ? "outcome_unknown" : "cancelled";
    job.error = {
      message: job.sent
        ? "页面任务已中断，结果未知，可能已计费；不会自动重发"
        : job.callCount > 0
          ? `任务已停止，已记录${job.callCount}次请求，可能已产生费用；不会自动重发`
          : "任务已停止，未发模型请求",
      billingState: job.sent
        ? "unknown"
        : job.callCount > 0
          ? "may_have_usage"
          : "none",
    };
    await tx.store.put(job, key);
  }
  await tx.done;
  changed();
}
export async function getPreferences() {
  return {
    ...DEFAULT_PREFERENCES,
    ...(await getMeta<Preferences>("preferences")),
  };
}
export async function clearLocal() {
  const db = await database,
    tx = db.transaction(
      ["articles", "results", "assets", "jobs", "recovery", "meta"],
      "readwrite",
    );
  const next =
    (((await tx.objectStore("meta").get("epoch")) as number) || 0) + 1;
  for (const name of tx.objectStoreNames) await tx.objectStore(name).clear();
  await tx.objectStore("meta").put(next, "epoch");
  await tx.done;
  sessionStorage.removeItem("typetada-auth-flow");
  changed();
}
export { database };
