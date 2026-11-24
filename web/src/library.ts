import type { Theme, LayoutResult } from "./types";
import {
  formatChecks,
  inert,
  sanitize,
  serialize,
  visibleText,
  sha256,
} from "./content";
type Package = {
  id: string;
  revision: string;
  hash: string;
  themes: (Theme & { contextPath: string; contextHash: string })[];
};
let indexPromise: Promise<{ packages: Package[] }> | undefined;
export async function library(): Promise<{ packages: Package[] }> {
  return (indexPromise ??= fetch("/library/index.json", {
    cache: "no-cache",
  })
    .then((r) => {
      if (!r.ok) throw new Error("排版规则尚未加载，请刷新页面");
      return r.json() as Promise<{ packages: Package[] }>;
    })
    .catch((error) => {
      indexPromise = undefined;
      throw error;
    }));
}
export async function themes() {
  return (await library()).packages.flatMap((p) => p.themes);
}
export async function contextFor(skillId: string, themeId: string) {
  const pkg = (await library()).packages.find((p) => p.id === skillId),
    theme = pkg?.themes.find((t) => t.id === themeId);
  if (!pkg || !theme) throw new Error("主题与Skill不匹配");
  const response = await fetch(theme.contextPath);
  if (!response.ok) throw new Error("主题规则加载失败");
  const context = await response.text();
  if ((await sha256(context)) !== theme.contextHash)
    throw new Error("主题资源版本不一致，请刷新后重试");
  return {
    context,
    skillId: pkg.id,
    skillRevision: pkg.revision,
    skillContentHash: pkg.hash,
  };
}
export async function loadDemo(): Promise<LayoutResult> {
  const response = await fetch("/library/demo.json");
  if (!response.ok) throw new Error("示例读取失败");
  const demo = await response.json();
  const clean = sanitize(demo.htmlFragment, []),
    format = formatChecks(clean.dom),
    html = serialize(clean.dom);
  return {
    ...demo,
    resultId: "demo",
    articleId: "demo",
    createdAt: 0,
    sourceRevision: 1,
    themeId: "moyu-green",
    skillId: "gzh-design",
    skillRevision: "demo",
    skillContentHash: "",
    model: "none",
    demo: true,
    notice:
      "上游示例，原作者甲木；文字渐变改纯色，未消耗模型额度。",
    plainText: visibleText(inert(html)),
    htmlFragment: html,
    htmlSha256: await sha256(html),
    validation: {
      ready:
        !clean.errors.length &&
        !format.errors.length &&
        !format.warnings.length,
      errors: [...clean.errors, ...format.errors],
      warnings: format.warnings,
    },
    usage: { inputTokens: null, outputTokens: null },
    imageStatus: "none",
    enhancements: [],
    decisions: [],
  };
}
