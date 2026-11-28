import { Zlib } from "fflate";

const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  let crc = byte;
  for (let bit = 0; bit < 8; bit++)
    crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  return crc;
});

function chunk(type: string, data: Uint8Array) {
  const bytes = new Uint8Array(data.length + 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) bytes[4 + i] = type.charCodeAt(i);
  bytes.set(data, 8);
  let crc = 0xffffffff;
  for (let i = 4; i < bytes.length - 4; i++)
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  view.setUint32(bytes.length - 4, crc ^ 0xffffffff);
  return bytes;
}

/** Encodes consecutive canvas slices as one PNG without a full-height canvas. */
export function createPngWriter(width: number) {
  const compressed: BlobPart[] = [];
  const zlib = new Zlib({ level: 6 }, (data) => {
    if (data.length) compressed.push(chunk("IDAT", data));
  });
  const rowBytes = width * 4;
  const previousRow = new Uint8Array(rowBytes);
  let height = 0;
  return {
    append(canvas: HTMLCanvasElement) {
      const context = canvas.getContext("2d");
      if (!context || canvas.width !== width || !canvas.height)
        throw new Error("没能读取长图内容，请刷新后重试。");
      // PNG's Up filter subtracts the previous row. Retain just that
      // row between reads, including at the boundary between slices.
      for (let y = 0; y < canvas.height; y += 32) {
        const rows = Math.min(32, canvas.height - y);
        const { data } = context.getImageData(0, y, width, rows);
        const filtered = new Uint8Array(rows * (rowBytes + 1));
        for (let row = 0; row < rows; row++) {
          const input = row * rowBytes;
          const output = row * (rowBytes + 1);
          filtered[output] = 2;
          for (let x = 0; x < rowBytes; x++)
            filtered[output + 1 + x] = data[input + x] - previousRow[x];
          previousRow.set(data.subarray(input, input + rowBytes));
        }
        zlib.push(filtered);
      }
      height += canvas.height;
    },
    finish() {
      zlib.push(new Uint8Array(0), true);
      const header = new Uint8Array(13);
      const view = new DataView(header.buffer);
      view.setUint32(0, width);
      view.setUint32(4, height);
      header[8] = 8; // Bits per channel
      header[9] = 6; // RGBA
      return new Blob(
        [signature, chunk("IHDR", header), ...compressed, chunk("IEND", new Uint8Array(0))],
        { type: "image/png" },
      );
    },
  };
}
