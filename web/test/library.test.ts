import { expect, it, vi } from "vitest";
it("retries a failed rule index request instead of retaining a rejected promise", async () => {
  vi.resetModules();
  const { library } = await import("../src/library");
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(new Response('{"packages":[]}'));
  vi.stubGlobal("fetch", fetcher);
  try {
    await expect(library()).rejects.toThrow("offline");
    await expect(library()).resolves.toEqual({ packages: [] });
    expect(fetcher).toHaveBeenCalledTimes(2);
  } finally {
    vi.unstubAllGlobals();
  }
});
