export const upstreamThemes = new Set([
  "moyu-green",
  "red-white",
  "graphite-minimal",
  "zen-whitespace",
  "moyu-ticket",
  "olive-journal",
]);
export const themeImage = (id: string, thumbnail = false) =>
  `/theme-previews/${id}${thumbnail ? "-thumb" : ""}.webp`;
export const themeSampleLabel = (id: string) =>
  upstreamThemes.has(id) ? "上游真实样张" : "本地模板组件样张";
