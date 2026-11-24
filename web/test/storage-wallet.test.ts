import { beforeEach, describe, expect, it, vi } from "vitest";
import * as store from "../src/db";
import * as wallet from "../src/wallet";
import { id, type Job } from "../src/types";
beforeEach(async () => {
  vi.unstubAllGlobals();
  await wallet.disconnectWallet();
  await store.clearLocal();
  sessionStorage.clear();
  history.replaceState(null, "", "/editor");
});
function callback(url: string) {
  const returnUrl = new URL(new URL(url).searchParams.get("callback_url")!);
  returnUrl.searchParams.set("code", "test-code");
  history.replaceState(null, "", returnUrl);
}
describe("IndexedDB is the source of truth", () => {
  it("atomically rejects two-window stale writes and retains recovery", async () => {
    const a = await store.createArticle("稿", "原文");
    const updated = await store.saveArticle({
      ...a,
      sourceMarkdown: "第一窗口",
    });
    await store.saveRecovery({ ...a, sourceMarkdown: "第二窗口未保存" });
    await expect(
      store.saveArticle({ ...a, sourceMarkdown: "第二窗口" }),
    ).rejects.toThrow("另一窗口");
    expect((await store.getArticle(a.id)).sourceMarkdown).toBe("第一窗口");
    expect((await store.loadRecovery(a.id))?.sourceMarkdown).toBe(
      "第二窗口未保存",
    );
    expect(updated.revision).toBe(2);
  });
  it("clearing invalidates in-flight saves and deletes every kind of local data", async () => {
    const article = await store.createArticle("稿", "原文");
    const version = await store.epoch();
    await store.saveRecovery(article);
    await store.putMeta("preferences", { note: "private" });
    await store.clearLocal();
    expect(await store.listArticles()).toEqual([]);
    expect(await store.loadRecovery(article.id)).toBeUndefined();
    await expect(store.saveArticle(article)).rejects.toThrow();
    await expect(
      store.putAsset(
        {
          id: "local",
          name: "img",
          url: "data:image/png;base64,AA==",
          mime: "image/png",
          createdAt: 0,
        },
        version,
      ),
    ).rejects.toThrow("清除");
  });
  it("claims one page task across tabs, and interrupted calls never become replayable", async () => {
    const article = await store.createArticle("稿", "原文");
    const job: Job = {
      id: id("job"),
      articleId: article.id,
      sourceRevision: 1,
      status: "running",
      stage: "generate",
      sent: true,
      callCount: 1,
      startedAt: 1,
    };
    await store.claimJob(job);
    await expect(store.claimJob({ ...job, id: id("job") })).rejects.toThrow(
      "已有窗口",
    );
    await store.interruptJob(job.id);
    expect((await store.getJob(job.id))?.status).toBe("outcome_unknown");
    await store.deleteArticle(article.id);
    expect(await store.getJob(job.id)).toBeUndefined();
    expect(await store.latestJob(article.id)).toBeNull();
  });
});
describe("browser OAuth and personal credential boundary", () => {
  it("uses exact attribution, PKCE verifier and once-only flow; memory-only by default", async () => {
    const url = await wallet.authorizeUrl(false),
      params = new URL(url).searchParams;
    expect(params.get("app_url")).toBe("https://example.com");
    expect(params.get("key_name")).toBe("Example TypeTada");
    const returnUrl = new URL(params.get("callback_url")!);
    expect(returnUrl.origin).toBe(location.origin);
    expect(returnUrl.pathname).toBe("/");
    const record = await store.getMeta<any>("authFlow");
    const challenge = btoa(
      String.fromCharCode(
        ...new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(record.verifier),
          ),
        ),
      ),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(params.get("code_challenge")).toBe(challenge);
    const fetcher = vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      expect(body.code).toBe("test-code");
      expect(body.code_verifier).toBe(record.verifier);
      expect(location.search).toBe("");
      return new Response(JSON.stringify({ key: "test-personal-key" }));
    });
    vi.stubGlobal("fetch", fetcher);
    callback(url);
    await wallet.finishAuthorization();
    expect((await wallet.walletStatus()).connected).toBe(true);
    expect(await store.getMeta("wallet")).toBeUndefined();
    callback(url);
    await expect(wallet.finishAuthorization()).rejects.toThrow("失效");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("persists only when chosen and removes remembered key on disconnect", async () => {
    const url = await wallet.authorizeUrl(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ key: "personal-remembered-test" })),
      ),
    );
    callback(url);
    await wallet.finishAuthorization();
    expect((await store.getMeta<any>("wallet")).key).toBe(
      "personal-remembered-test",
    );
    await wallet.setRemember(false);
    expect(await store.getMeta("wallet")).toBeUndefined();
    expect((await wallet.walletStatus()).connected).toBe(true);
    await wallet.disconnectWallet();
    expect((await wallet.walletStatus()).connected).toBe(false);
  });
  it("disconnect during exchange prevents late key resurrection", async () => {
    const url = await wallet.authorizeUrl(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        await wallet.disconnectWallet();
        return new Response(JSON.stringify({ key: "late-test-key" }));
      }),
    );
    callback(url);
    await expect(wallet.finishAuthorization()).rejects.toThrow("迟到");
    expect(await store.getMeta("wallet")).toBeUndefined();
    expect((await wallet.walletStatus()).connected).toBe(false);
  });
  it.each([
    "top_up_balance",
    "reauthorize_api_key",
    "api_key_quota",
    null,
    "unknown",
  ])("uses recovery header %s without guessing from status", async (action) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", {
            status: 403,
            headers: action ? { "TokenDance-Recovery-Action": action } : {},
          }),
      ),
    );
    try {
      await wallet.readPlatform(wallet.ENDPOINTS.chat, {});
      throw new Error("should fail");
    } catch (e) {
      expect(e).toBeInstanceOf(wallet.PlatformError);
      expect((e as wallet.PlatformError).recovery).toBe(
        ["top_up_balance", "reauthorize_api_key", "api_key_quota"].includes(
          action || "",
        )
          ? action
          : undefined,
      );
    }
  });
  it("network or exchange loss is never retried", async () => {
    const url = await wallet.authorizeUrl(true),
      fetcher = vi.fn(async () => {
        throw new TypeError("network failure");
      });
    vi.stubGlobal("fetch", fetcher);
    callback(url);
    await expect(wallet.finishAuthorization()).rejects.toThrow("交换结果未知");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(await store.getMeta("authFlow")).toBeUndefined();
    expect(await store.getMeta("wallet")).toBeUndefined();
  });
});
it("stale preference timers and recovery writes cannot repopulate cleared local state", async () => {
  const oldEpoch = await store.epoch(),
    article = await store.createArticle("old", "old");
  await store.clearLocal();
  await store.putMetaAtEpoch(
    "preferences",
    { note: "private stale text" },
    oldEpoch,
  );
  await store.saveRecovery(article);
  expect(await store.getMeta("preferences")).toBeUndefined();
  expect(await store.loadRecovery(article.id)).toBeUndefined();
});
