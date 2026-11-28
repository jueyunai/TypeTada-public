import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BLIND_BOX_PALETTES,
  BLIND_BOX_STYLES,
  blindBoxStyleLabel,
  buildBlindBoxSystemPrompt,
  contrastRatio,
  DESIGN_FAMILIES,
  formatBlindBoxLabel,
  isBlindBoxThemeId,
  parseBlindBoxStyle,
  pluginSpecChecks,
  renderAllBlindBoxBricksForTest,
  rollBlindBoxBrief,
} from "../src/blindbox";
import {
  checkGeneratedResult,
  CORE_OUTPUT_CONTRACT,
  escapeHtml,
  formatChecks,
  inert,
  sanitize,
  sourceManifest,
  SYSTEM_CONTRACT,
  widthChecks,
} from "../src/content";
import * as store from "../src/db";
import { generateLayout } from "../src/pipeline";
import { DEFAULT_PREFERENCES } from "../src/types";
import {
  authorizeUrl,
  disconnectWallet,
  ENDPOINTS,
  finishAuthorization,
} from "../src/wallet";

describe("blindbox visual families & palettes (v3 · 8 families / 15 palettes)", () => {
  it("preserves exact SYSTEM_CONTRACT prefix while sharing CORE_OUTPUT_CONTRACT", () => {
    expect(SYSTEM_CONTRACT).toBe(
      "你是文有样公众号排版师。严格采用当前 Skill 主题库组件风格完成排版，" +
        CORE_OUTPUT_CONTRACT,
    );
  });

  it("validates WCAG 2.1 contrast thresholds for all 15 curated palettes", () => {
    expect(BLIND_BOX_PALETTES).toHaveLength(15);
    for (const p of BLIND_BOX_PALETTES) {
      expect(
        contrastRatio("#FFFFFF", p.primary),
        `${p.id} white on primary (${p.primary})`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(p.deep, p.tint),
        `${p.id} deep (${p.deep}) on tint (${p.tint})`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(p.ink, p.surface),
        `${p.id} ink (${p.ink}) on surface (${p.surface})`,
      ).toBeGreaterThanOrEqual(7.0);
    }
  });

  it("rolls cohesive family + matched palette combos and avoids repeating family/palette/opener/sectionHeader in every style", () => {
    expect(DESIGN_FAMILIES).toHaveLength(8);
    const familyPaletteMap = new Map(
      DESIGN_FAMILIES.map((f) => [f.id, new Set(f.paletteIds)]),
    );

    for (const style of BLIND_BOX_STYLES) {
      let prev = rollBlindBoxBrief(style.id);
      for (let i = 0; i < 20; i++) {
        const next = rollBlindBoxBrief(style.id, prev);
        expect(familyPaletteMap.get(next.family.id)?.has(next.palette.id)).toBe(
          true,
        );
        expect(next.family.id).not.toBe(prev.family.id);
        expect(next.palette.id).not.toBe(prev.palette.id);
        expect(next.sectionHeader.id).not.toBe(prev.sectionHeader.id);
        expect(next.opener.id).not.toBe(prev.opener.id);
        if (style.id !== "random") {
          expect(next.resolvedStyle).toBe(style.id);
        }
        prev = next;
      }
    }
  });

  it("builds cohesive v3 family prompt with <=16000 chars, no placeholder leaks, s001 in data-body, HTML escaping, and smart closer rule", () => {
    for (const style of BLIND_BOX_STYLES) {
      const brief = rollBlindBoxBrief(style.id);
      const prompt = buildBlindBoxSystemPrompt(brief);
      const blueprintStart = prompt.indexOf("本盒专属视觉家族蓝图");
      expect(blueprintStart).toBeGreaterThan(0);
      const blueprintSection = prompt.slice(blueprintStart);

      expect(prompt.length).toBeLessThanOrEqual(16000);
      expect(prompt).not.toContain("严格采用当前 Skill 主题库");
      expect(blueprintSection).not.toContain("{{");
      expect(blueprintSection).not.toContain("}}");
      expect(blueprintSection).not.toMatch(/__[A-Z]+__/);

      expect(prompt).toContain(brief.family.name);
      expect(prompt).toContain(brief.palette.primary);
      expect(prompt).toContain("padding:12px 14px;box-sizing:border-box");
      expect(prompt).toContain("&lt;script&gt;");
      expect(prompt).toContain("s001");
      expect(prompt).toContain("data-body");
      expect(prompt).toContain("双重结尾");
    }
  });

  it("passes sanitize, formatChecks, widthChecks, and pluginSpecChecks with 0 errors and 0 warnings across ALL 8 families × palettes × variants", () => {
    const combos = renderAllBlindBoxBricksForTest();
    expect(combos.length).toBeGreaterThanOrEqual(78);

    for (const combo of combos) {
      const label = `${combo.family.id} × ${combo.palette.id} × ${combo.opener.id} + ${combo.sectionHeader.id}`;
      expect(combo.composedHtml, `${label} placeholders`).not.toContain("{{");
      expect(combo.composedHtml, `${label} gradient`).not.toMatch(
        /gradient\(/i,
      );

      const cleaned = sanitize(combo.composedHtml, []);
      expect(cleaned.errors, `${label} sanitize errors`).toEqual([]);

      const fmt = formatChecks(cleaned.dom);
      expect(fmt.errors, `${label} format errors`).toEqual([]);
      expect(fmt.warnings, `${label} format warnings`).toEqual([]);

      const widthWarnings = widthChecks(cleaned.dom);
      expect(widthWarnings, `${label} width warnings`).toEqual([]);

      const spec = pluginSpecChecks(cleaned.dom);
      expect(spec.errors, `${label} plugin_spec errors`).toEqual([]);
      expect(spec.warnings, `${label} plugin_spec warnings`).toEqual([]);
    }
  });

  it("passes end-to-end checkGeneratedResult with s001 inside data-body, escaped HTML tags, colon list, and data-source code backfill", () => {
    const markdown = [
      "# 视觉家族 v3 完整校验样本",
      "",
      "## 第一步：校验规范",
      "",
      "给 `<img>` 设 `opacity:0` 或混入 `<script>` 都会被拦截，保留 **核心加粗** 与 ~~旧写法~~。",
      "",
      "### 细项拆解",
      "",
      "> 引用块原文完整保留不删改。",
      "",
      "- 上下文边界：冒号前后文字必须完整保留在同一个段落内",
      "",
      "```js",
      "export function demo(ok) {",
      "  if (ok) return true;",
      "  return false;",
      "}",
      "```",
    ].join("\n");

    const { blocks, images } = sourceManifest(markdown);
    const codeBlock = blocks.find((b) => b.code !== null)!;
    const brief = rollBlindBoxBrief("tech");

    const sectionHtml = brief.sectionHeader.html.replace(
      "章节标题",
      "第一步：校验规范",
    );
    const bodyHtml = `<section style="text-align:left;max-width:677px;margin:0 auto;padding:12px 14px;box-sizing:border-box;background-color:${brief.palette.surface};color:${brief.palette.ink};line-height:1.75;">
${brief.opener.html}
<section data-body="">
<section style="margin:0 0 20px;"><h3 style="margin:0;font-size:21px;font-weight:800;color:${brief.palette.deep};line-height:1.45;"><span leaf="">视觉家族 v3 完整校验样本</span></h3></section>
${sectionHtml}
<p style="font-size:16px;line-height:1.8;color:${brief.palette.ink};margin:0 0 20px;"><span leaf="">给</span><span style="background-color:#F1F5F9;padding:1px 6px;border-radius:4px;font-family:monospace;"><span leaf="">&lt;img&gt;</span></span><span leaf="">设</span><span style="background-color:#F1F5F9;padding:1px 6px;border-radius:4px;font-family:monospace;"><span leaf="">opacity:0</span></span><span leaf="">或混入</span><span style="background-color:#F1F5F9;padding:1px 6px;border-radius:4px;font-family:monospace;"><span leaf="">&lt;script&gt;</span></span><span leaf="">都会被拦截，保留</span><strong style="color:${brief.palette.primary};font-weight:700;"><span leaf="">核心加粗</span></strong><span leaf="">与</span><span style="text-decoration:line-through;color:${brief.palette.muted};"><span leaf="">旧写法</span></span><span leaf="">。</span></p>
<h4 style="margin:24px 0 12px;font-size:16px;font-weight:700;color:${brief.palette.deep};line-height:1.5;"><span leaf="">细项拆解</span></h4>
<section style="background-color:${brief.palette.tint};border-left:4px solid ${brief.palette.primary};padding:14px 18px;margin:0 0 22px;"><p style="font-size:16px;color:${brief.palette.deep};margin:0;line-height:1.8;"><span leaf="">引用块原文完整保留不删改。</span></p></section>
<section style="background-color:${brief.palette.tint};border:1px solid ${brief.palette.border};border-radius:10px;padding:12px 15px;margin:0 0 12px;"><p style="font-size:16px;line-height:1.8;color:${brief.palette.ink};margin:0;"><span leaf="">上下文边界：冒号前后文字必须完整保留在同一个段落内</span></p></section>
<section data-source="${codeBlock.id}"></section>
</section>
${brief.closer.html}
</section>`;

    const checked = checkGeneratedResult(bodyHtml, blocks, images);
    expect(checked.validation.errors).toEqual([]);
    expect(checked.validation.warnings).toEqual([]);
    expect(checked.validation.ready).toBe(true);
    expect(checked.htmlFragment).toContain("export function demo(ok) {");
    expect(pluginSpecChecks(inert(checked.sourceHtml))).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("formats and parses blindbox theme identifiers consistently", () => {
    expect(isBlindBoxThemeId("blindbox:tech")).toBe(true);
    expect(isBlindBoxThemeId("moyu-green")).toBe(false);
    expect(parseBlindBoxStyle("blindbox:magazine")).toBe("magazine");
    expect(parseBlindBoxStyle("blindbox:invalid")).toBe("random");
    expect(blindBoxStyleLabel("tech")).toBe("科技感");
    const brief = rollBlindBoxBrief("minimal");
    expect(formatBlindBoxLabel(brief, "blindbox:minimal")).toBe(
      `盲盒 · ${brief.family.name}（${brief.palette.name}）`,
    );
    expect(formatBlindBoxLabel(null, "blindbox:magazine")).toBe("盲盒 · 杂志编辑");
  });
});

describe("pipeline blindbox integration (Phase 1 MVP)", () => {
  let requests: any[] = [];
  let dropFirstSource = false;

  beforeEach(async () => {
    await disconnectWallet();
    await store.clearLocal();
    requests = [];
    dropFirstSource = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: any) => {
        if (String(url) === ENDPOINTS.exchange) {
          return new Response(JSON.stringify({ key: "test-personal-key" }));
        }
        if (String(url) === ENDPOINTS.chat) {
          const payload = JSON.parse(init.body);
          requests.push(payload);
          const sources = JSON.parse(payload.messages[1].content).sources;
          const activeSources = dropFirstSource ? sources.slice(1) : sources;
          const html =
            '<section style="text-align:left"><section data-body="">' +
            activeSources
              .map(
                (s: any) =>
                  `<section data-source="${s.id}"><p><span leaf="">${escapeHtml(s.text)}</span></p></section>`,
              )
              .join("") +
            "</section></section>";
          return new Response(
            JSON.stringify({
              choices: [{ finish_reason: "stop", message: { content: html } }],
              usage: { prompt_tokens: 120, completion_tokens: 240 },
            }),
          );
        }
        throw new Error("Unexpected network URL " + url);
      }),
    );
    const auth = await authorizeUrl(false);
    const returnUrl = new URL(new URL(auth).searchParams.get("callback_url")!);
    returnUrl.searchParams.set("code", "test-code");
    history.replaceState(null, "", returnUrl);
    await finishAuthorization();
  });

  it("generates blindbox layout in one call, records brief & version label, deduplicates reroll, and locks brief during repair", async () => {
    const article = await store.createArticle(
      "盲盒测试",
      "第一段正文内容。\n\n第二段正文内容。",
    );
    const first = await generateLayout(
      article,
      {
        ...DEFAULT_PREFERENCES,
        mode: "blindbox",
        blindBoxStyle: "random",
        consent: true,
      },
      new AbortController(),
      () => {},
    );

    expect(requests).toHaveLength(1);
    expect(requests[0].messages[0].content).toContain("盲盒完整视觉家族排版规范");
    expect(first.skillId).toBe("blindbox");
    expect(first.blindBoxBrief).toBeDefined();
    expect(isBlindBoxThemeId(first.themeId)).toBe(true);

    const versions = await store.listVersions(article.id);
    expect(versions[0]?.themeLabel).toBe(
      formatBlindBoxLabel(first.blindBoxBrief, first.themeId),
    );

    // 再开一盒传入 previousBlindBox，保证不会抽出重复家族与色板
    const second = await generateLayout(
      article,
      {
        ...DEFAULT_PREFERENCES,
        mode: "blindbox",
        blindBoxStyle: "random",
        consent: true,
      },
      new AbortController(),
      () => {},
      undefined,
      first.blindBoxBrief,
    );
    expect(second.blindBoxBrief?.family.id).not.toBe(
      first.blindBoxBrief?.family.id,
    );
    expect(second.blindBoxBrief?.palette.id).not.toBe(
      first.blindBoxBrief?.palette.id,
    );

    // 模拟待核对稿返修：必须锁死同一份 draft.blindBoxBrief
    dropFirstSource = true;
    const draft = await generateLayout(
      article,
      {
        ...DEFAULT_PREFERENCES,
        mode: "blindbox",
        blindBoxStyle: "tech",
        consent: true,
      },
      new AbortController(),
      () => {},
    );
    expect(draft.validation.ready).toBe(false);
    expect(draft.reviewIssues?.length).toBeGreaterThan(0);

    dropFirstSource = false;
    const repaired = await generateLayout(
      article,
      {
        ...DEFAULT_PREFERENCES,
        mode: "blindbox",
        blindBoxStyle: "minimal",
        consent: true,
      },
      new AbortController(),
      () => {},
      draft,
    );
    expect(repaired.validation.ready).toBe(true);
    expect(repaired.blindBoxBrief).toEqual(draft.blindBoxBrief);
  });
});

describe("pluginSpecChecks against WeChat official plugin_spec rules", () => {
  it("passes clean compliant markup including zero-size decorative dots", () => {
    const dom = inert(
      `<section style="text-align:left;max-width:677px;margin:0 auto;background-color:#ffffff;"><section style="margin:0 0 20px;border-radius:8px;background:#1E293B;"><section style="display:flex;padding:9px 14px;"><span style="display:inline-block;width:10px;height:10px;font-size:0;line-height:0;overflow:hidden;">.</span></section><p style="margin:0;font-family:monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">const ok = true;</span></p></section><p style="font-size:16px;line-height:1.8;color:#1F2937;margin:0 0 20px;"><span leaf="">正文段落完全符合微信规范。</span></p></section>`,
    );
    expect(pluginSpecChecks(dom)).toEqual({ errors: [], warnings: [] });
  });

  it("flags §1.1 opacity:0 on img", () => {
    const res = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><span leaf=""><img src="https://example.com/a.png" style="opacity:0;width:100%;" /></span></section>`,
      ),
    );
    expect(res.errors.some((e) => e.includes("§1.1"))).toBe(true);
  });

  it("flags §1.2 transparent caret-color", () => {
    const res = pluginSpecChecks(
      inert(
        `<section style="text-align:left;caret-color:rgba(0, 0, 0, 0);"><p><span leaf="">文字</span></p></section>`,
      ),
    );
    expect(res.errors.some((e) => e.includes("§1.2"))).toBe(true);
  });

  it("flags §1.3 line-height smaller than font-size on text container", () => {
    const res = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><p style="font-size:16px;line-height:12px;"><span leaf="">重叠文字</span></p></section>`,
      ),
    );
    expect(res.errors.some((e) => e.includes("§1.3"))).toBe(true);
  });

  it("flags §1.5.1 height:0 and §1.5.2 clipped fixed height with overflow:hidden", () => {
    const zeroH = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><section style="height:0px;"><p><span leaf="">被隐藏的内容</span></p></section></section>`,
      ),
    );
    expect(zeroH.errors.some((e) => e.includes("§1.5.1"))).toBe(true);

    const clipped = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><section style="height:24px;overflow:hidden;"><p><span leaf="">换行后会被裁掉的长文字内容</span></p></section></section>`,
      ),
    );
    expect(clipped.warnings.some((w) => w.includes("§1.5.2"))).toBe(true);
  });

  it("flags §1.6 logical text-align start/end", () => {
    const res = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><p style="text-align:start;"><span leaf="">逻辑对齐</span></p></section>`,
      ),
    );
    expect(res.errors.some((e) => e.includes("§1.6"))).toBe(true);
  });

  it("flags §1.8 plain prose inside <pre>", () => {
    const res = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><pre style="line-height:1.75em;"><span leaf="">这是一段不应该放进pre标签里的普通正文。</span></pre></section>`,
      ),
    );
    expect(res.errors.some((e) => e.includes("§1.8"))).toBe(true);
  });

  it("flags §2.1 >10 identical single-child nested layers and §2.2 block inside span[leaf]", () => {
    const open = "<section>".repeat(11);
    const close = "</section>".repeat(11);
    const deep = pluginSpecChecks(
      inert(`${open}<span leaf="">太深了</span>${close}`),
    );
    expect(deep.warnings.some((w) => w.includes("§2.1"))).toBe(true);

    const badLeaf = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><span leaf=""><section>块级元素不能放在span leaf里</section></span></section>`,
      ),
    );
    expect(badLeaf.errors.some((e) => e.includes("§2.2"))).toBe(true);
  });

  it("flags §4.5.2 inline !important", () => {
    const res = pluginSpecChecks(
      inert(
        `<section style="text-align:left;"><p style="color:#111 !important;"><span leaf="">强行覆盖</span></p></section>`,
      ),
    );
    expect(res.warnings.some((w) => w.includes("§4.5.2"))).toBe(true);
  });
});
