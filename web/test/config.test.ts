import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_TOKENDANCE_APP_URL", "https://example.com");
  vi.stubEnv("VITE_TOKENDANCE_KEY_NAME", "Example TypeTada");
  vi.stubEnv("VITE_TOKENDANCE_MODEL", "test-model");
  history.replaceState(null, "", "/editor");
  sessionStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

it.each(["", "http://example.com", "not-a-url"])(
  "blocks OAuth without a valid application URL (%s), before writing a flow or sending requests",
  async (value) => {
    vi.stubEnv("VITE_TOKENDANCE_APP_URL", value);
    const store = await import("../src/db");
    await store.clearLocal();
    const wallet = await import("../src/wallet");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(wallet.authorizeUrl(false)).rejects.toThrow("应用信息");
    expect(await store.getMeta("authFlow")).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
    // Local editing remains available even when the integration is disabled.
    const article = await store.createArticle("本地稿", "保留正文");
    expect((await store.getArticle(article.id)).sourceMarkdown).toBe(
      "保留正文",
    );
  },
);

it.each(["VITE_TOKENDANCE_KEY_NAME", "VITE_TOKENDANCE_MODEL"])(
  "blocks generation without %s, before creating a task or making requests",
  async (name) => {
    vi.stubEnv(name, "");
    const store = await import("../src/db");
    await store.clearLocal();
    const { generateLayout } = await import("../src/pipeline");
    const { DEFAULT_PREFERENCES } = await import("../src/types");
    const article = await store.createArticle("本地稿", "保留正文");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateLayout(
        article,
        { ...DEFAULT_PREFERENCES, consent: true },
        new AbortController(),
        () => {},
      ),
    ).rejects.toThrow("尚未配置");
    expect(await store.latestJob(article.id)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
    if (name === "VITE_TOKENDANCE_KEY_NAME") {
      const wallet = await import("../src/wallet");
      await expect(wallet.authorizeUrl(false)).rejects.toThrow("应用信息");
    }
  },
);

it("requires reauthorization for an old or different application without deleting local articles", async () => {
  const store = await import("../src/db");
  await store.clearLocal();
  const article = await store.createArticle("保留", "原文");
  const version = "previous-version";
  await store.putMeta("walletVersion", version);
  await store.putMeta("wallet", {
    key: "synthetic-test-key",
    version,
    epoch: await store.epoch(),
    remember: true,
    application: "https://other.example\0Other app",
  });
  const wallet = await import("../src/wallet");
  expect(await wallet.credential()).toBeUndefined();
  expect(await wallet.walletStatus()).toMatchObject({
    connected: false,
    message: expect.stringContaining("重新连接"),
  });
  expect((await store.getArticle(article.id)).sourceMarkdown).toBe("原文");
});

it("rejects a callback started under another application before exchanging its code", async () => {
  const store = await import("../src/db");
  await store.clearLocal();
  const wallet = await import("../src/wallet");
  const url = await wallet.authorizeUrl(false);
  const record = await store.getMeta<any>("authFlow");
  await store.putMeta("authFlow", { ...record, application: "different-app" });
  const flow = new URL(
    new URL(url).searchParams.get("callback_url")!,
  ).searchParams.get("flow");
  history.replaceState(
    null,
    "",
    "/editor?flow=" + flow + "&code=synthetic-code",
  );
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(wallet.finishAuthorization()).rejects.toThrow("失效");
  expect(location.search).toBe("");
  expect(fetcher).not.toHaveBeenCalled();
});

it("shows site filing numbers only from the deploying site's own settings", async () => {
  vi.stubEnv("VITE_SITE_ICP_FILING", "");
  vi.stubEnv("VITE_SITE_PUBLIC_SECURITY_FILING", "");
  let config = await import("../src/config");
  expect([config.ICP_FILING, config.PUBLIC_SECURITY_FILING]).toEqual(["", ""]);

  vi.resetModules();
  vi.stubEnv("VITE_SITE_ICP_FILING", " 京ICP备12345678号-1 ");
  vi.stubEnv("VITE_SITE_PUBLIC_SECURITY_FILING", "京公网安备11010502012345号");
  config = await import("../src/config");
  expect(config.ICP_FILING).toBe("京ICP备12345678号-1");
  expect(config.PUBLIC_SECURITY_FILING_CODE).toBe("11010502012345");
});
