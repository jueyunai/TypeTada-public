import { unzlibSync } from "fflate";
import { expect, it } from "vitest";
import { createPngWriter } from "../src/png";

it("writes two canvas slices as one PNG without losing rows at the join", async () => {
  const width = 2;
  const rowBytes = width * 4;
  const pixels = Uint8ClampedArray.from(
    { length: rowBytes * 35 },
    (_, index) => (index * 13) % 256,
  );
  const slice = (top: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = {
      getImageData(_x: number, y: number, _width: number, rows: number) {
        return {
          data: pixels.subarray((top + y) * rowBytes, (top + y + rows) * rowBytes),
        };
      },
    };
    canvas.getContext = (() => context) as typeof canvas.getContext;
    return canvas;
  };
  const writer = createPngWriter(width);
  writer.append(slice(0, 33));
  writer.append(slice(33, 2));
  const file = writer.finish();
  expect(file.type).toBe("image/png");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(view.getUint32(16)).toBe(width);
  expect(view.getUint32(20)).toBe(35);
  const compressed: number[] = [];
  for (let offset = 8; offset < bytes.length;) {
    const size = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === "IDAT")
      compressed.push(...bytes.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  const filtered = unzlibSync(Uint8Array.from(compressed));
  const decoded = new Uint8Array(pixels.length);
  for (let row = 0; row < 35; row++) {
    const input = row * (rowBytes + 1);
    const output = row * rowBytes;
    expect(filtered[input]).toBe(2);
    for (let byte = 0; byte < rowBytes; byte++)
      decoded[output + byte] =
        filtered[input + 1 + byte] + (decoded[output - rowBytes + byte] ?? 0);
  }
  expect(Array.from(decoded)).toEqual(Array.from(pixels));
});
