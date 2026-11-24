import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { zipSync, strToU8 } from "fflate";
import * as store from "../src/db";
import * as wallet from "../src/wallet";
import * as library from "../src/library";
import { generateLayout } from "../src/pipeline";
import { DEFAULT_PREFERENCES } from "../src/types";
import {
  checkResult,
  escapeHtml,
  sourceManifest,
  canonical,
  markdown,
} from "../src/content";
import { exportBackup, importBackup } from "../src/backup";
import { importWord } from "../src/imports";
import { imageFromBytes } from "../src/images";
import { readPaste } from "../src/paste";

vi.mock("../src/library", () => ({
  themes: vi.fn(async () => [{ id: "moyu-green", description: "test" }]),
  contextFor: vi.fn(async () => ({
    context: "test",
    skillId: "gzh-design",
    skillRevision: "test",
    skillContentHash: "test",
  })),
}));
const png = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1EAAAAASUVORK5CYII=",
  ),
  (c) => c.charCodeAt(0),
);
const file = (value: string) =>
  ({
    size: new TextEncoder().encode(value).length,
    text: async () => value,
  }) as File;
const doc = (body: string) =>
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
const word = (bytes: Uint8Array) =>
  ({
    name: "sample.docx",
    size: bytes.length,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  }) as File;
let requests: any[] = [];
beforeEach(async () => {
  vi.restoreAllMocks();
  await wallet.disconnectWallet();
  await store.clearLocal();
  requests = [];
  history.replaceState(null, "", "/editor");
  vi.mocked(library.contextFor).mockImplementation(async () => ({
    context: "test",
    skillId: "gzh-design",
    skillRevision: "test",
    skillContentHash: "test",
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: any) => {
      if (url === wallet.ENDPOINTS.exchange)
        return new Response(JSON.stringify({ key: "synthetic-test-key" }));
      if (url !== wallet.ENDPOINTS.chat)
        throw new Error("Unexpected request: " + url);
      const payload = JSON.parse(init.body);
      requests.push(payload);
      const sources = JSON.parse(payload.messages[1].content).sources;
      const content = sources
        ? '<section style="text-align:left">' +
          sources
            .map(
              (s: any) =>
                `<section data-source="${s.id}"><p><span leaf="">${escapeHtml(s.text)}</span></p></section>`,
            )
            .join("") +
          "</section>"
        : JSON.stringify({ themeId: "moyu-green" });
      return new Response(
        JSON.stringify({
          choices: [{ finish_reason: "stop", message: { content } }],
          usage: { prompt_tokens: 20, completion_tokens: 30 },
        }),
      );
    }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function connect() {
  const url = await wallet.authorizeUrl(false),
    callback = new URL(new URL(url).searchParams.get("callback_url")!);
  history.replaceState(
    null,
    "",
    callback.pathname + callback.search + "&code=synthetic",
  );
  await wallet.finishAuthorization();
}

it.each([
  "font-size:0.0px",
  "line-height:.0",
  "color:#0000",
  "color:#00000000",
  "color:rgba(0,0,0,0.0)",
  "color:rgb(0 0 0 / 0%)",
  "text-indent:-999999px",
  "margin-left:-99999px",
  "height:1px;overflow:hidden auto",
  "overflow:hidden;height/**/:1px",
])("rejects hiding original text with %s", (style) => {
  const source = sourceManifest("Original 19.9");
  const result = checkResult(
    `<section style="text-align:left"><section data-source="s001"><p style="${style}"><span leaf="">Original 19.9</span></p></section></section>`,
    source.blocks,
    source.images,
  );
  expect(result.validation.ready).toBe(false);
});
it("rejects links invented in enhancements while preserving an original link", () => {
  const source = sourceManifest("[Original](https://example.com)");
  const html = (href: string) =>
    `<section style="text-align:left"><section data-source="s001"><p><a href="https://example.com"><span leaf="">Original</span></a></p></section><section data-enhancement="cta"><p><a href="${href}"><span leaf="">Read more</span></a></p></section></section>`;
  expect(
    checkResult(html("https://evil.example"), source.blocks, source.images)
      .validation.ready,
  ).toBe(false);
  expect(
    checkResult(html("https://example.com"), source.blocks, source.images)
      .validation.ready,
  ).toBe(true);
});
it("also rejects a link wrapped around an enhancement instead of inside it", () => {
  const source = sourceManifest("Original");
  const html =
    '<section style="text-align:left"><section data-source="s001"><p><span leaf="">Original</span></p></section><a href="https://evil.example"><section data-enhancement="cta"><p><span leaf="">Read more</span></p></section></a></section>';
  expect(checkResult(html, source.blocks, source.images).validation.ready).toBe(
    false,
  );
});
it("normalizes comments before checking a parent/child clipping combination", () => {
  const source = sourceManifest("Original");
  const html =
    '<section style="text-align:left"><section data-source="s001" style="max-height/**/:1px"><p style="overflow/**/:hidden"><span leaf="">Original</span></p></section></section>';
  expect(checkResult(html, source.blocks, source.images).validation.ready).toBe(
    false,
  );
});
it("preserves literal operators and token boundaries while supporting explicit highlight", () => {
  expect(sourceManifest("C++ 与 G++ 编译器").blocks[0].text).toContain(
    "C++ 与 G++",
  );
  expect(sourceManifest("a == 1 且 b == 2").blocks[0].text).toContain(
    "a == 1 且 b == 2",
  );
  expect(markdown.render("==高亮==")).toContain("<mark>高亮</mark>");
  expect(canonical("10 20")).not.toBe(canonical("1020"));
  const source = sourceManifest("10 20");
  expect(
    checkResult(
      '<section style="text-align:left"><section data-source="s001"><p><span leaf="">1020</span></p></section></section>',
      source.blocks,
      source.images,
    ).validation.ready,
  ).toBe(false);
  expect(() => sourceManifest("> - a\n>   - b")).toThrow("嵌套");
});
it("does not send a new request after cancellation before its atomic call reservation", async () => {
  await connect();
  const article = await store.createArticle("稿", "Original");
  const begin = store.beginJobCall;
  vi.spyOn(store, "beginJobCall").mockImplementationOnce(async (...args) => {
    await store.interruptJob(args[0]);
    return begin(...args);
  });
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("取消");
  expect(requests).toHaveLength(0);
  expect(await store.latestJob(article.id)).toMatchObject({
    status: "cancelled",
    callCount: 0,
    error: { billingState: "none" },
  });
});
it("keeps a conservative ledger and sends nothing if cancelled immediately after reservation", async () => {
  await connect();
  const article = await store.createArticle("稿", "Original"),
    begin = store.beginJobCall;
  vi.spyOn(store, "beginJobCall").mockImplementationOnce(async (...args) => {
    const value = await begin(...args);
    await store.interruptJob(args[0]);
    return value;
  });
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("取消");
  expect(requests).toHaveLength(0);
  expect(await store.latestJob(article.id)).toMatchObject({
    status: "outcome_unknown",
    callCount: 1,
    error: { billingState: "unknown" },
  });
});
it("stopping between completed analysis and generation retains the existing usage warning", async () => {
  await connect();
  const article = await store.createArticle("稿", "Original");
  vi.mocked(library.contextFor).mockImplementationOnce(async () => {
    await store.interruptJob((await store.latestJob(article.id))!.id);
    return {
      context: "test",
      skillId: "gzh-design",
      skillRevision: "test",
      skillContentHash: "test",
    };
  });
  await expect(
    generateLayout(
      article,
      { ...DEFAULT_PREFERENCES, mode: "auto", consent: true },
      new AbortController(),
      () => {},
    ),
  ).rejects.toThrow("取消");
  expect(requests).toHaveLength(1);
  expect(await store.latestJob(article.id)).toMatchObject({
    callCount: 1,
    error: { billingState: "may_have_usage" },
  });
  expect((await store.latestJob(article.id))!.error!.message).not.toContain(
    "未发模型",
  );
});
it("can round-trip more than 100 articles and long saved titles/drafts", async () => {
  for (let i = 0; i < 101; i++)
    await store.createArticle(
      i === 0 ? "题".repeat(201) : "稿" + i,
      i === 0 ? "a".repeat(100001) : "Original",
    );
  const value = await exportBackup();
  await store.clearLocal();
  expect(await importBackup(file(value))).toMatchObject({ articles: 101 });
  expect(
    (await store.listArticles()).find((a) => a.title.length === 201)
      ?.sourceMarkdown,
  ).toHaveLength(100001);
});
it("backs up uninserted assets, preserves code literals, and remaps only real Markdown/HTML images", async () => {
  const asset = await imageFromBytes(png, "local.png");
  await store.putAsset(asset, await store.epoch());
  const source = `Literal typetada-image:image_example\n\n\`typetada-image:${asset.id}\`\n\n\`\`\`md\n![](typetada-image:${asset.id})\n\`\`\`\n\n![](typetada-image:${asset.id})`;
  await store.createArticle("代码", source);
  const spare = await imageFromBytes(png, "spare.png");
  await store.putAsset(spare, await store.epoch());
  const value = await exportBackup();
  expect(JSON.parse(value).assets).toHaveLength(2);
  await store.clearLocal();
  await importBackup(file(value));
  const restored = (await store.listArticles())[0].sourceMarkdown;
  expect(restored).toContain(`\`typetada-image:${asset.id}\``);
  expect(restored).toContain(
    `\`\`\`md\n![](typetada-image:${asset.id})\n\`\`\``,
  );
  expect(restored).toContain("typetada-image:image_example");
  expect(sourceManifest(restored).images[0]).not.toContain(asset.id);
  expect(await store.listAssets()).toHaveLength(2);
});
it("restores a draft with a missing asset as editable text rather than rejecting the backup", async () => {
  const article = await store.createArticle(
    "Missing",
    "![](typetada-image:missing)",
  );
  const value = await exportBackup(article.id);
  await store.clearLocal();
  await importBackup(file(value));
  expect((await store.listArticles())[0].sourceMarkdown).toContain(
    "typetada-image:missing",
  );
});
it("keeps Word run separators and disabled styles without writing assets before confirmation", async () => {
  const result = await importWord(
    word(
      zipSync({
        "word/document.xml": strToU8(
          doc(
            '<w:p><w:r><w:rPr><w:b w:val="0"/><w:u w:val="none"/></w:rPr><w:t>10</w:t><w:br/><w:t>20</w:t><w:tab/><w:t>30</w:t></w:r></w:p>',
          ),
        ),
      }),
    ),
  );
  expect(result.sourceMarkdown).toContain("10  \n20    30");
  expect(result.sourceMarkdown).not.toMatch(/\*\*|<u>/);
  expect(await store.listAssets()).toEqual([]);
  const table = await importWord(
    word(
      zipSync({
        "word/document.xml": strToU8(
          doc(
            "<w:tbl><w:tr><w:tc><w:p><w:r><w:t>10</w:t></w:r></w:p><w:p><w:r><w:t>20</w:t></w:r></w:p></w:tc></w:tr></w:tbl>",
          ),
        ),
      }),
    ),
  );
  expect(table.sourceMarkdown).toContain("10 20");
});
it("merges adjacent bold Word runs without producing broken Markdown", async () => {
  const result = await importWord(
    word(
      zipSync({
        "word/document.xml": strToU8(
          doc(
            "<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Hello </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>World</w:t></w:r></w:p>",
          ),
        ),
      }),
    ),
  );
  expect(markdown.render(result.sourceMarkdown)).toContain(
    "<strong>Hello World</strong>",
  );
});
it("rejects inconsistent ZIP entry counts before unzipping ignored or oversized entries", async () => {
  const bytes = zipSync({
    "word/document.xml": strToU8(
      doc("<w:p><w:r><w:t>Original</w:t></w:r></w:p>"),
    ),
    "word/media/padding.bin": new Uint8Array(500000),
  });
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint16(
    bytes.length - 22 + 10,
    1,
    true,
  );
  await expect(importWord(word(bytes))).rejects.toThrow("目录不一致");
});

it("rejects a central-directory entry assigned to another disk", async () => {
  const bytes = zipSync({
    "word/document.xml": strToU8(
      doc("<w:p><w:r><w:t>Original</w:t></w:r></w:p>"),
    ),
  });
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const directory = view.getUint32(bytes.length - 22 + 16, true);
  view.setUint16(directory + 34, 1, true);
  await expect(importWord(word(bytes))).rejects.toThrow("分卷");
});

it("preserves explicit HTML line breaks even when plain text resembles Markdown", async () => {
  const result = await readPaste({
    html: "<p># comment<br>Body</p>",
    text: "# comment\nBody",
    files: [],
  });
  expect(result.markdown).not.toBe("# comment\nBody");
  expect(markdown.render(result.markdown)).toContain("<br>");
});

it("saves pasted assets and article content together, and rejects stale writes without orphan assets", async () => {
  const article = await store.createArticle("稿", "Original");
  const asset = await imageFromBytes(png, "pasted.png");
  const next = await store.saveArticle(
    { ...article, sourceMarkdown: `![](typetada-image:${asset.id})` },
    [asset],
    await store.epoch(),
  );
  expect(await store.listAssets()).toHaveLength(1);
  expect((await store.getArticle(article.id)).sourceMarkdown).toContain(
    asset.id,
  );
  const other = await imageFromBytes(png, "other.png");
  await expect(
    store.saveArticle(article, [other], await store.epoch()),
  ).rejects.toThrow("另一窗口");
  expect(await store.listAssets()).toHaveLength(1);
  expect((await store.getArticle(article.id)).revision).toBe(next.revision);
});

it("round-trips reference-style and table images while preserving Markdown code examples", async () => {
  const asset = await imageFromBytes(png, "reference.png");
  await store.putAsset(asset, await store.epoch());
  await store.createArticle(
    "引用",
    `![图][p]\n\n[p]: typetada-image:${asset.id}\n\n| 图 |\n| --- |\n| ![](typetada-image:${asset.id}) |`,
  );
  const value = await exportBackup();
  await store.clearLocal();
  await importBackup(file(value));
  const restored = (await store.listArticles())[0];
  expect(sourceManifest(restored.sourceMarkdown).images).toHaveLength(2);
  expect(
    sourceManifest(restored.sourceMarkdown).images.every(
      (url) => !url.includes(asset.id),
    ),
  ).toBe(true);
});
it("prefers real rich structure despite a text comment and retains a distinct clipboard file", async () => {
  const result = await readPaste({
    text: "# comment\nBody",
    html: '<h2>Heading</h2><p><strong>Body</strong></p><img src="https://example.com/remote.png">',
    files: [
      {
        type: "image/png",
        size: png.length,
        name: "local.png",
        arrayBuffer: async () => png.buffer,
      } as File,
    ],
  });
  expect(result.markdown).toContain("## Heading");
  expect(result.markdown).toContain("**Body**");
  expect(result.markdown).toContain("https://example.com/remote.png");
  expect(result.assets).toHaveLength(1);
  expect(sourceManifest(result.markdown).images).toHaveLength(2);
});
it("normalizes short GIF failures and only clears the balance-related recovery on a positive balance", async () => {
  await expect(imageFromBytes(strToU8("GIF89a"), "short.gif")).rejects.toThrow(
    "图片无法解码",
  );
  await connect();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ balance: { balance: 1000000 } })),
    ),
  );
  await store.putMeta("walletRecovery", "top_up_balance");
  expect((await wallet.walletStatus(true)).recoveryAction).toBeUndefined();
  await store.putMeta("walletRecovery", "api_key_quota");
  expect((await wallet.walletStatus(true)).recoveryAction).toBe(
    "api_key_quota",
  );
});
it("a successful model request clears a stale quota recovery for the same wallet", async () => {
  await connect();
  await store.putMeta("walletRecovery", "api_key_quota");
  await generateLayout(
    await store.createArticle("稿", "Original"),
    { ...DEFAULT_PREFERENCES, consent: true },
    new AbortController(),
    () => {},
  );
  expect(await store.getMeta("walletRecovery")).toBeUndefined();
});
