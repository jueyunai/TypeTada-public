import { epoch, putAsset, listAssets } from "./db";
import { id, type Asset } from "./types";
export const localImageId = (url: string) =>
  /^typetada-image:([a-z0-9_-]+)$/i.exec(url)?.[1];
export async function imageFromBytes(
  bytes: Uint8Array,
  name: string,
): Promise<Asset> {
  if (bytes.length > 10 * 1024 * 1024) throw new Error("单张图片不能超过10MiB");
  let mime = "";
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)
    mime = "image/png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    mime = "image/jpeg";
  else if (String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8"))
    mime = "image/gif";
  else if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    mime = "image/webp";
  if (!mime)
    throw new Error("只支持实际PNG/JPEG/WebP/GIF，不支持SVG或伪装文件");
  if (mime === "image/gif") {
    if (bytes.length < 10) throw new Error("图片无法解码，请重新导出");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const pixels = view.getUint16(6, true) * view.getUint16(8, true);
    if (pixels > 12e6 || bytes.length > 3e6)
      throw new Error("GIF像素或体积过大，请缩小后导入");
  }
  const blob = new Blob([bytes as BlobPart], { type: mime });
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("图片无法解码，请重新导出");
  }
  const pixels = bitmap.width * bitmap.height;
  bitmap.close();
  if (pixels > 12e6) throw new Error("图片超过1200万像素，请缩小");
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
  return { id: id("image"), url, mime, name, createdAt: Date.now() / 1000 };
}
export async function importImage(file: File) {
  const version = await epoch(),
    asset = await imageFromBytes(
      new Uint8Array(await file.arrayBuffer()),
      file.name,
    );
  return putAsset(asset, version);
}
export async function imageMap() {
  return new Map((await listAssets()).map((a) => [a.id, a.url]));
}
export function hydrateImages(fragment: string, assets: Map<string, string>) {
  const template = document.createElement("template");
  template.innerHTML = fragment;
  for (const image of template.content.querySelectorAll("img")) {
    const key = localImageId(image.getAttribute("src") || "");
    if (key) {
      const url = assets.get(key);
      if (!url) throw new Error("原稿中的本地图片已丢失，请重新导入");
      image.setAttribute("src", url);
    }
  }
  return template.innerHTML;
}
