import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { vi } from "vitest";
vi.stubEnv("VITE_TOKENDANCE_APP_URL", "https://example.com");
vi.stubEnv("VITE_TOKENDANCE_KEY_NAME", "Example TypeTada");
vi.stubEnv("VITE_TOKENDANCE_MODEL", "test-model");
Object.defineProperty(globalThis, "crypto", { value: webcrypto });
Object.defineProperty(globalThis, "BroadcastChannel", { value: undefined });
Object.defineProperty(globalThis, "createImageBitmap", {
  value: vi.fn(async () => ({ width: 10, height: 10, close() {} })),
});

// jsdom 缺少测量 API，补齐供 ProseMirror 选区与滚动逻辑使用的轻量兜底
if (typeof Range !== "undefined") {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () =>
      ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
      }) as DOMRectList;
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
      }) as DOMRect;
  }
}
if (typeof document !== "undefined" && !document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
