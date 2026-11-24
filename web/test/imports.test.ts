import { zipSync, strToU8 } from "fflate";
import { beforeEach, it, expect } from "vitest";
import { importWord } from "../src/imports";
import { clearLocal, listAssets, createArticle } from "../src/db";
import { sourceManifest } from "../src/content";
const doc = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:rPr><w:u/></w:rPr><w:t>保留19.9元与下划线</w:t></w:r></w:p><w:p><w:r><a:blip r:embed="rId1"/></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>名称</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>价格</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>19.9元</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>`;
function file(entries: Record<string, Uint8Array>) {
  const bytes = zipSync(entries);
  return {
    name: "测试.docx",
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer,
  } as File;
}
beforeEach(clearLocal);
it("extracts bounded DOCX text, underline, table and local image without any server", async () => {
  const png = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1EAAAAASUVORK5CYII=",
    ),
    (c) => c.charCodeAt(0),
  );
  const result = await importWord(
    file({
      "word/document.xml": strToU8(doc),
      "word/_rels/document.xml.rels": strToU8(
        '<Relationships><Relationship Id="rId1" Target="media/x.png"/></Relationships>',
      ),
      "word/media/x.png": png,
    }),
  );
  expect(result.images).toBe(1);
  const manifest = sourceManifest(result.sourceMarkdown);
  expect(manifest.blocks[0].text.trim()).toBe("保留19.9元与下划线");
  expect(manifest.blocks.at(-1)?.tableRows).toEqual([
    ["名称", "价格"],
    ["A", "19.9元"],
  ]);
  expect(manifest.images[0]).toMatch(/^typetada-image:/);
  expect(await listAssets()).toEqual([]);
  await createArticle(
    result.title,
    result.sourceMarkdown,
    result.assets,
    result.generation,
  );
  expect((await listAssets())[0].url).toMatch(/^data:image\/png;base64,/);
});
it("rejects DTD, traversal, macro and excessive decompression before import", async () => {
  await expect(
    importWord(file({ "word/document.xml": strToU8("<!DOCTYPE x>" + doc) })),
  ).rejects.toThrow("实体");
  await expect(
    importWord(file({ "../unsafe.xml": strToU8(doc) })),
  ).rejects.toThrow("路径");
  await expect(
    importWord(
      file({
        "word/vbaProject.bin": new Uint8Array(4),
        "word/document.xml": strToU8(doc),
      }),
    ),
  ).rejects.toThrow("宏");
  await expect(
    importWord(file({ "word/document.xml": strToU8("a".repeat(500000)) })),
  ).rejects.toThrow("比例");
  expect(await listAssets()).toEqual([]);
});
