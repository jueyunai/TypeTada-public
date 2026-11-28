import { describe, expect, it } from "vitest";
import {
  checkGeneratedResult,
  checkResult,
  inert,
  layoutRepairHints,
  restoreOriginalBlock,
  sanitize,
  sourceManifest,
} from "../src/content";

describe("skill-agnostic source verification and unified gates", () => {
  it("matches a numbered heading split across one card, preserving its decoration and requiring the original number", () => {
    const { blocks, images } = sourceManifest("## 01 开口之前\n\n正文。");
    const card = (number: string, heading = "开口之前") => `
      <section style="display:flex">
        <section><p>${number}</p><p>PART</p></section>
        <span style="width:1px;height:36px"><span leaf=""><br></span></span>
        <section><p style="font-weight:900">${heading}</p><p>PURPOSE · 装饰短标</p></section>
      </section>`;
    const verify = (html: string) => checkGeneratedResult(
      `<section>${html}<p>正文。</p></section>`, blocks, images,
    );
    const ok = verify(card("01"));
    expect(ok.validation.ready).toBe(true);
    expect(ok.enhancements.map((item) => item.text).join("\n")).toContain("PART");
    expect(ok.enhancements.map((item) => item.text).join("\n")).not.toContain("01");
    for (const html of [
      card(""), card("02"), card("01", "开口之后"),
      "<section><p>01</p></section><section><h3>开口之前</h3></section>",
    ]) {
      const draft = verify(html);
      expect(draft.validation.ready).toBe(false);
      expect(draft.reviewIssues?.[0]).toMatchObject({ sourceId: "s001", kind: "changed_text" });
    }
    const unsafe = verify(card("02") + "<script>void 0</script>");
    expect(unsafe.validation.ready).toBe(false);
    expect(unsafe.reviewIssues).toBeUndefined();
  });

  it("accepts a brand-new Skill layout with zero data-* attributes and records all added segments in order", () => {
    const md = [
      "## 第一章",
      "",
      "这一段里有 **重点加粗**、一个[原稿链接](https://example.com/ok)和`inlineCode`。",
      "",
      "- 第一项要点",
      "- 第二项要点",
      "",
      "| 列一 | 列二 |",
      "|---|---|",
      "| 甲 | 乙 |",
      "",
      "```ts\nconst x = 1;\n```",
      "",
      "![](typetada-image:img_01)",
    ].join("\n");
    const { blocks, images } = sourceManifest(md);

    // 模拟全新 Skill（如“编者按”卡片、微信 <p> 列表、无任何 data-source/data-enhancement）
    const html = `<section style="text-align:left">
      <section style="padding:14px;background:#F5F9F5;">
        <p><span leaf="">编者按</span></p>
        <p><span leaf="">这是新 Skill 自带的编者按导语，无需在代码里预设。</span></p>
      </section>
      <section>
        <p><span leaf="">01 · 导读</span></p>
        <p><span leaf="">核心看点重复展示</span></p>
      </section>
      <section>
        <p><span leaf="">● 第一节</span></p>
        <h3><span leaf="">01 第一章</span></h3>
        <p><span leaf="">这一段里有</span><strong><span leaf="">重点加粗</span></strong><span leaf="">、一个</span><a href="https://example.com/ok"><span leaf="">原稿链接</span></a><span leaf="">和</span><span style="font-family:Consolas,monospace"><span leaf="">inlineCode</span></span><span leaf="">。</span></p>
        <p><span><span leaf="">•</span></span><span leaf="">第一项要点</span></p>
        <p><span><span leaf="">•</span></span><span leaf="">第二项要点</span></p>
        <table><thead><tr><th><span leaf="">列一</span></th><th><span leaf="">列二</span></th></tr></thead><tbody><tr><td><span leaf="">甲</span></td><td><span leaf="">乙</span></td></tr></tbody></table>
        <section style="background:#f8fafc"><p><span leaf="">const x = 1;</span></p></section>
        <figure><img src="typetada-image:img_01" alt="图"><figcaption><span leaf="">这是配图说明文字</span></figcaption></figure>
      </section>
      <section>
        <p><span leaf="">核心看点重复展示</span></p>
      </section>
    </section>`;

    const res = checkGeneratedResult(html, blocks, images);
    expect(res.validation.ready).toBe(true);
    expect(res.validation.errors).toEqual([]);
    expect(res.validation.warnings).toEqual([]);
    // 检查新增清单保留了“编者按”、重复出现两次的“核心看点重复展示”、标题前缀“01”及图注，且附带正确位置
    expect(res.enhancements.some((e) => e.text.includes("编者按") && e.location === "正文前")).toBe(true);
    expect(res.enhancements.filter((e) => e.text.includes("核心看点重复展示"))).toHaveLength(2);
    expect(res.enhancements.some((e) => e.type === "label" && e.text === "01")).toBe(true);
    expect(res.enhancements.some((e) => e.text === "这是配图说明文字" && e.location === "正文后")).toBe(true);
  });

  it("enforces body boundaries across the three cover-quote states", () => {
    const { blocks, images } = sourceManifest("第一段是开篇观点。\n\n第二段是后续论证。");

    // 1. 有 data-body="" 时，正文容器内删掉第一段只在封面引用 -> 硬错误拦截
    const withDataBodyMissing = `<section style="text-align:left">
      <section data-enhancement="cover" data-refs="s001"><p><span leaf="">第一段是开篇观点。</span></p></section>
      <section data-body=""><p><span leaf="">第二段是后续论证。</span></p></section>
    </section>`;
    const strictBlocked = checkResult(withDataBodyMissing, blocks, images);
    expect(strictBlocked.validation.ready).toBe(false);
    expect(strictBlocked.validation.errors).toContain("原文s001缺失或文字变化");

    // 2. 无 data-body 但封面带 data-enhancement="cover"：正文漏掉第一段只在封面引用 -> 软提示待核对，不阻断复制
    const withoutDataBodyMissing = `<section style="text-align:left">
      <section data-enhancement="cover" data-refs="s001"><p><span leaf="">第一段是开篇观点。</span></p></section>
      <section><p><span leaf="">第二段是后续论证。</span></p></section>
    </section>`;
    const softNotice = checkResult(withoutDataBodyMissing, blocks, images);
    expect(softNotice.validation.ready).toBe(true);
    expect(softNotice.validation.warnings.join()).toContain("部分原文待核对");
    expect(softNotice.enhancements.some((e) => e.text.includes("第一段是开篇观点"))).toBe(true);

    // 3. 正常保留正文第一段且封面同时引用 -> 完全通过、零提示，封面照常进清单
    const normal = `<section style="text-align:left">
      <section data-enhancement="cover" data-refs="s001"><p><span leaf="">第一段是开篇观点。</span></p></section>
      <section data-body="">
        <p><span leaf="">第一段是开篇观点。</span></p>
        <p><span leaf="">第二段是后续论证。</span></p>
      </section>
    </section>`;
    const ok = checkResult(normal, blocks, images);
    expect(ok.validation.ready).toBe(true);
    expect(ok.validation.warnings).toEqual([]);
    expect(ok.enhancements[0]).toMatchObject({
      type: "cover",
      location: "正文前",
    });
  });

  it("blocks all hard defects: missing source, tampered char, out-of-order, invented link/image, hidden CSS, and XSS", () => {
    const { blocks, images } = sourceManifest("第一段价格19.9元。\n\n第二段包含[原链接](https://ok.example)和![](typetada-image:pic_1)。");

    const cases = [
      // 缺段
      `<section style="text-align:left"><p><span leaf="">第一段价格19.9元。</span></p></section>`,
      // 改数字
      `<section style="text-align:left"><p><span leaf="">第一段价格199元。</span></p><p><span leaf="">第二段包含</span><a href="https://ok.example"><span leaf="">原链接</span></a><span leaf="">和</span><img src="typetada-image:pic_1"></p></section>`,
      // 乱序
      `<section style="text-align:left"><p><span leaf="">第二段包含</span><a href="https://ok.example"><span leaf="">原链接</span></a><span leaf="">和</span><img src="typetada-image:pic_1"></p><p><span leaf="">第一段价格19.9元。</span></p></section>`,
      // 新增外链
      `<section style="text-align:left"><p><span leaf="">第一段价格19.9元。</span></p><p><span leaf="">第二段包含</span><a href="https://ok.example"><span leaf="">原链接</span></a><span leaf="">和</span><img src="typetada-image:pic_1"></p><a href="https://evil.example"><span leaf="">推广外链</span></a></section>`,
      // 编造图片
      `<section style="text-align:left"><p><span leaf="">第一段价格19.9元。</span></p><p><span leaf="">第二段包含</span><a href="https://ok.example"><span leaf="">原链接</span></a><span leaf="">和</span><img src="typetada-image:pic_1"><img src="https://evil.example/x.png"></p></section>`,
      // 隐藏正文 CSS
      `<section style="text-align:left"><p style="opacity:0"><span leaf="">第一段价格19.9元。</span></p><p><span leaf="">第二段包含</span><a href="https://ok.example"><span leaf="">原链接</span></a><span leaf="">和</span><img src="typetada-image:pic_1"></p></section>`,
      // XSS 脚本
      `<section style="text-align:left"><script>alert(1)</script><p><span leaf="">第一段价格19.9元。</span></p><p><span leaf="">第二段包含</span><a href="https://ok.example"><span leaf="">原链接</span></a><span leaf="">和</span><img src="typetada-image:pic_1"></p></section>`,
    ];

    for (const html of cases) {
      expect(checkResult(html, blocks, images).validation.ready).toBe(false);
    }
  });

  it("treats WeChat compatibility issues and placeholders as non-blocking warnings while indexing placeholders", () => {
    const { blocks, images } = sourceManifest("中文正文结束。");
    const html = `<section style="text-align:left">
      <section style="background:linear-gradient(red,blue);width:200px"><p><span leaf="">{{作者名}} · 卡片,半角</span></p></section>
      <p><span leaf="">中文正文结束。</span></p>
    </section>`;
    const res = checkResult(html, blocks, images);
    expect(res.validation.ready).toBe(true);
    expect(res.validation.errors).toEqual([]);
    expect(res.validation.warnings.join()).toContain("渐变背景");
    expect(res.validation.warnings.join()).toContain("width:200px");
    expect(res.validation.warnings.join()).toContain("半角标点");
    expect(res.validation.warnings.join()).toContain("模板占位符");
    expect(res.enhancements[0]?.type).toBe("placeholder");
  });

  it("generates accurate layoutRepairHints for hard errors even without data-source tags", () => {
    const { blocks } = sourceManifest("第一段很长用于测试相似度匹配定位。\n\n第二段正文。\n\n第三段收尾。");
    const badHtml = `<section style="text-align:left">
      <p><span leaf="">第三段收尾。</span></p>
      <p><span leaf="">第一段很长用于测试相似度匹配改动。</span></p>
      <a href="https://evil.example"><span leaf="">新增外链</span></a>
    </section>`;
    const checked = checkResult(badHtml, blocks, []);
    expect(checked.validation.ready).toBe(false);
    const hints = layoutRepairHints(
      checked.sourceHtml,
      blocks,
      checked.validation.errors,
    );
    expect(hints.changedSource[0]).toMatchObject({
      sourceId: "s001",
    });
    expect(hints.missingSource?.some((m) => m.sourceId === "s002")).toBe(true);
    expect(hints.mediaOrLinks?.[0]).toMatchObject({
      issue: "成稿链接必须来自原稿",
      actual: "https://evil.example",
    });
  });

  it("isolates cover siblings with data-source descendants and standalone labels from body matching", () => {
    const { blocks, images } = sourceManifest("原文第一段。\n\n原文第二段。");
    const coverHtmlNoBody = `<section style="text-align:left">
      <section data-enhancement="cover"><span data-source="s999">封面装饰</span><p>原文第一段。</p></section>
      <section><p>原文第二段。</p></section>
    </section>`;
    const res1 = checkResult(coverHtmlNoBody, blocks, images);
    expect(res1.validation.ready).toBe(true);
    expect(res1.validation.warnings.join()).toContain("部分原文待核对");

    const coverHtmlWithBody = `<section style="text-align:left">
      <section data-enhancement="cover"><span data-source="s999">封面装饰</span><p>原文第一段。</p></section>
      <section data-body="true"><p>原文第二段。</p></section>
    </section>`;
    const res2 = checkResult(coverHtmlWithBody, blocks, images);
    expect(res2.validation.ready).toBe(false);
    expect(res2.validation.errors).toContain("原文s001缺失或文字变化");

    const labelHtmlNoBody = `<section style="text-align:left">
      <span data-enhancement="label">原文第一段。</span>
      <p>原文第二段。</p>
    </section>`;
    const res3 = checkResult(labelHtmlNoBody, blocks, images);
    expect(res3.validation.ready).toBe(true);
    expect(res3.validation.warnings.join()).toContain("部分原文待核对");

    const labelHtmlWithBody = `<section style="text-align:left">
      <section data-enhancement="label"><p>原文第一段。</p></section>
      <section data-body="true"><p>原文第二段。</p></section>
    </section>`;
    const res4 = checkResult(labelHtmlWithBody, blocks, images);
    expect(res4.validation.ready).toBe(false);
  });

  it("checks indentation and line structure for unmarked code blocks", () => {
    const { blocks, images } = sourceManifest(
      '说明文字。\n\n```python\ndef hello():\n    print("hi")\n```',
    );
    const strippedPre = `<section style="text-align:left"><p>说明文字。</p><section style="white-space:pre">def hello():\nprint("hi")</section></section>`;
    const r1 = checkResult(strippedPre, blocks, images);
    expect(r1.validation.ready).toBe(false);
    expect(r1.validation.errors.join()).toContain("代码缩进或内容变化");

    const strippedParas = `<section style="text-align:left"><p>说明文字。</p><p>def hello():</p><p>print("hi")</p></section>`;
    const r2 = checkResult(strippedParas, blocks, images);
    expect(r2.validation.ready).toBe(false);
    expect(r2.validation.errors.join()).toContain("代码缩进或内容变化");

    const validPre = `<section style="text-align:left"><p>说明文字。</p><section style="white-space:pre">def hello():\n    print("hi")</section></section>`;
    expect(checkResult(validPre, blocks, images).validation.ready).toBe(true);

    const validNbsp = `<section style="text-align:left"><p>说明文字。</p><p>def hello():</p><p>&nbsp;&nbsp;&nbsp;&nbsp;print("hi")</p></section>`;
    expect(checkResult(validNbsp, blocks, images).validation.ready).toBe(true);
  });

  it("only fills marked code containers whose repaired code survives serialization", () => {
    const source = [
      "     keep  ",
      "",
      "\tcontinue",
    ].join("\n");
    const { blocks, images } = sourceManifest(
      "```txt\n" + source + "\n```\n\n![](https://example.com/image.png)",
    );
    const wrap = (code: string) =>
      `<section style="text-align:left">${code}<img src="https://example.com/image.png"></section>`;
    const markedImage = wrap('<img data-source="s001" src="https://example.com/image.png">');
    expect(checkGeneratedResult(markedImage, blocks, images).validation.ready).toBe(false);
    expect(checkGeneratedResult(wrap('<p data-source="s001"></p>'), blocks, images).validation.ready).toBe(false);

    const valid = checkGeneratedResult(wrap('<section data-source="s001"></section>'), blocks, images);
    expect(valid.validation.ready).toBe(true);
    const code = inert(valid.htmlFragment).querySelector('span[style*="pre-wrap"]')!;
    expect(code.innerHTML.replaceAll("<br>", "\n")).toBe(source);
    expect(sanitize(valid.htmlFragment, images).errors).toEqual([]);
    expect(checkResult(valid.htmlFragment, blocks, images).validation.ready).toBe(true);
    expect(checkResult(valid.sourceHtml, blocks, images).htmlFragment).toBe(valid.htmlFragment);
  });

  it("checks interior empty lines, trailing spaces and the CSS that preserves them", () => {
    const source = 'message = """第一行  \n\n    最后一行"""';
    const { blocks, images } = sourceManifest("```python\n" + source + "\n```");
    const wrap = (style: string, code: string) =>
      `<section style="text-align:left"><section style="${style}"><span leaf="">${code}</span></section></section>`;
    for (const html of [
      wrap("white-space:pre-line", source),
      wrap("white-space:pre", source.replace("\n\n", "\n")),
      wrap("white-space:pre", source.replace("  \n", "\n")),
      wrap("white-space:pre", `<span style="white-space:normal">${source}</span>`),
    ]) {
      expect(checkGeneratedResult(html, blocks, images).validation.ready).toBe(false);
    }
    expect(checkGeneratedResult(wrap("white-space:pre-wrap", source), blocks, images).validation.ready).toBe(true);
    const pre = `<section style="text-align:left"><pre><code><span leaf="">${source}</span></code></pre></section>`;
    expect(checkGeneratedResult(pre, blocks, images).validation.ready).toBe(true);
    const lines = source.split("\n");
    const separateLines = `<section style="text-align:left"><p style="white-space:pre-wrap"><span leaf="">${lines[0]}</span></p><p><span leaf=""><br></span></p><p style="white-space:pre-wrap"><span leaf="">${lines[2]}</span></p></section>`;
    expect(checkGeneratedResult(separateLines, blocks, images).validation.ready).toBe(true);
  });

  it("recognizes legacy NBSP and expanded tabs, then restores actual source whitespace", () => {
    const source = 'message = "a b"\n\n  \n\tprint(message)  ';
    const { blocks, images } = sourceManifest("~~~txt\n" + source + "\n~~~");
    const legacy = (code: string) => `<section style="text-align:left"><section style="font-family:Consolas,monospace">${code.split("\n").map((line) =>
      `<p style="font-family:Consolas,monospace"><span leaf="">${line.replace(/\t/g, "    ").replace(/ /g, "&nbsp;")}</span></p>`,
    ).join("")}</section></section>`;
    const result = checkResult(legacy(source), blocks, images);
    expect(result.validation.ready).toBe(true);
    expect(inert(result.htmlFragment).querySelector('span[style*="pre-wrap"]')?.innerHTML.replaceAll("<br>", "\n")).toBe(source);
    expect(checkResult(result.sourceHtml, blocks, images).htmlFragment).toBe(result.htmlFragment);
    for (const changed of [source.replace("\n\n", "\n"), source.trimEnd(), source.replace('"a b"', '"ab"')]) {
      expect(checkResult(legacy(changed), blocks, images).validation.ready).toBe(false);
    }
  });

  it("keeps decorative labels and supports a root slot for a single code block", () => {
    const { blocks, images } = sourceManifest("~~~txt\nkeep this code\n~~~");
    const label = '<span data-enhancement="label" style="color:#555"><span leaf="">代码示例</span></span>';
    for (const html of [
      `<section style="text-align:left" data-source="s001">${label}</section>`,
      `<section style="text-align:left"><section data-source="s001">${label}</section></section>`,
    ]) {
      const result = checkGeneratedResult(html, blocks, images);
      expect(result.validation.ready).toBe(true);
      expect(result.htmlFragment).toContain("代码示例");
      expect(result.htmlFragment).toContain("keep this code");
      expect(result.enhancements).toContainEqual(expect.objectContaining({ type: "label", text: "代码示例" }));
      expect(checkResult(result.sourceHtml, blocks, images).htmlFragment).toBe(result.htmlFragment);
    }

    const mixed = sourceManifest("说明。\n\n~~~txt\nkeep this code\n~~~");
    const html = '<section style="text-align:left" data-source="s002"><p>说明。</p></section>';
    expect(checkGeneratedResult(html, mixed.blocks, mixed.images).validation.ready).toBe(false);
  });

  it("verifies anchor text and href pairs rather than href arrays alone", () => {
    const { blocks, images } = sourceManifest(
      "查看[原始说明](https://a.example)和[后续说明](https://b.example)。",
    );
    const swappedAnchorText = `<section style="text-align:left"><p>查看原始说明<a href="https://a.example">和</a><a href="https://b.example">后续说明</a>。</p></section>`;
    const bad = checkResult(swappedAnchorText, blocks, images);
    expect(bad.validation.ready).toBe(false);
    expect(bad.validation.errors).toContain("原文s001链接变化");

    const valid = `<section style="text-align:left"><p>查看<a href="https://a.example">原始说明</a>和<a href="https://b.example">后续说明</a>。</p></section>`;
    expect(checkResult(valid, blocks, images).validation.ready).toBe(true);

    const listSource = sourceManifest(
      "- 查看[原始说明](https://a.example)\n- 另有[后续说明](https://b.example)",
    );
    const badList = `<section style="text-align:left"><ul><li>查看原始<a href="https://a.example">说明</a></li><li>另有后续<a href="https://b.example">说明</a></li></ul></section>`;
    expect(
      checkResult(badList, listSource.blocks, listSource.images).validation
        .ready,
    ).toBe(false);
    const goodList = `<section style="text-align:left"><ul><li>查看<a href="https://a.example">原始说明</a></li><li>另有<a href="https://b.example">后续说明</a></li></ul></section>`;
    expect(
      checkResult(goodList, listSource.blocks, listSource.images).validation
        .ready,
    ).toBe(true);
  });

  it("keeps all three list items recognizable when a theme adds visible numbering", () => {
    const { blocks, images } = sourceManifest("- 核对原文\n- 下载成稿\n- 公众号发布");
    const items = ["核对原文", "下载成稿", "公众号发布"];
    const check = (list: string[]) =>
      checkGeneratedResult(
        `<section><ul>${list.map((item, i) => `<li><span>0${i + 1}、</span><p>${item}</p></li>`).join("")}</ul></section>`,
        blocks,
        images,
      );
    expect(check(items).validation.ready).toBe(true);
    expect(check(items.slice(1)).reviewIssues?.[0].sourceId).toBe("s001");
    expect(check([...items].reverse()).validation.ready).toBe(false);
  });

  it("restores a missing editorial note without replacing the next intact paragraph", () => {
    const { blocks, images } = sourceManifest(
      "开头。\n\n给编辑的备注：这段可整段删除。\n\n给编辑的备注：这段保留。\n\n下期继续验证。",
    );
    const html = "<section><p>开头。</p><p>给编辑的备注：这段保留。</p>" +
      '<p data-source="s004" style="color:#236442">下期继续观察。</p></section>';
    const initial = checkResult(html, blocks, images);
    expect(initial.reviewIssues?.map(({ sourceId, kind }) => ({ sourceId, kind }))).toEqual([
      { sourceId: "s002", kind: "missing" },
      { sourceId: "s004", kind: "changed_text" },
    ]);
    const partial = restoreOriginalBlock(html, blocks, images, "s002");
    expect(partial?.reviewIssues).toEqual(initial.reviewIssues?.slice(1));
    expect(partial?.plainText).toContain("这段可整段删除。\n给编辑的备注：这段保留。");
    const restored = restoreOriginalBlock(partial!.sourceHtml, blocks, images, "s004");
    expect(restored?.validation.ready).toBe(true);
    expect(restored?.plainText).toContain("下期继续验证。");
    expect(restored?.htmlFragment).toContain("color:#236442");
  });

  it("preserves each image's click target in both pure-image and mixed paragraphs", () => {
    const imagesMd = "[![甲图](https://example.com/a.png)](https://example.com/a) [![乙图](https://example.com/b.png)](https://example.com/b)";
    const a = '<img src="https://example.com/a.png">';
    const b = '<img src="https://example.com/b.png">';
    const html = (first: string, second: string, prefix: string, suffix = "") =>
      `<section style="text-align:left"><p>${prefix}<a href="https://example.com/a">${first}</a><a href="https://example.com/b">${second}</a>${suffix}</p></section>`;
    for (const prefix of ["", "打开大图："]) {
      const { blocks, images } = sourceManifest(prefix + imagesMd);
      expect(checkResult(html(a, b, prefix), blocks, images).validation.ready).toBe(true);
      const detached = checkResult(html("", "", prefix, a + b), blocks, images);
      expect(detached.validation.ready).toBe(false);
      expect(detached.validation.errors).toContain("原文s001链接变化");
    }
  });

  it("recognizes an outer anchor around an image card as the image's click target", () => {
    const { blocks, images } = sourceManifest(
      "说明。\n\n[![甲图](https://example.com/a.png)](https://example.com/page)",
    );
    const imageCard = '<section><img src="https://example.com/a.png" alt="甲图"></section>';
    const wrap = (card: string) => `<section style="text-align:left"><p><span leaf="">说明。</span></p>${card}</section>`;
    const correct = checkGeneratedResult(
      wrap(`<a href="https://example.com/page">${imageCard}</a>`),
      blocks,
      images,
    );
    expect(correct.validation.ready).toBe(true);
    expect(inert(correct.htmlFragment).querySelector("img")?.closest("a")?.getAttribute("href"))
      .toBe("https://example.com/page");
    const detached = checkGeneratedResult(wrap('<a href="https://example.com/page"></a>' + imageCard), blocks, images);
    expect(detached.validation.ready).toBe(false);
    expect(checkGeneratedResult(wrap(`<a href="https://example.com/elsewhere">${imageCard}</a>`), blocks, images).validation.ready).toBe(false);
  });

  it("warns about missing dividers and heading structure without blocking theme styling", () => {
    const { blocks, images } = sourceManifest("## 第一节\n\n---\n\n正文。");
    const wrap = (html: string) => `<section style="text-align:left">${html}</section>`;
    const missing = checkGeneratedResult(wrap("<p>第一节</p><p>正文。</p><hr>"), blocks, images);
    expect(missing.validation.ready).toBe(true);
    expect(missing.validation.warnings).toEqual(expect.arrayContaining([
      "原文s001未保留标题结构，请核对标题样式。",
      "原文s002的分隔线未能确认，请核对排版。",
    ]));
    for (const separator of [
      "<hr>",
      '<section style="border-top:1px solid #ddece4"></section>',
      '<section style="height:2px;background:#ddece4"><span leaf=""><br></span></section>',
    ]) {
      const styled = checkGeneratedResult(wrap(`<h3>第一节</h3><p>过场短句</p>${separator}<p>正文。</p>`), blocks, images);
      expect(styled.validation.ready).toBe(true);
      expect(styled.validation.warnings).toEqual([]);
    }
  });

  it("does not trigger false out-of-order failures from a mislabeled trailing duplicate data-source", () => {
    const { blocks, images } = sourceManifest("A段核心内容。\n\nB段补充说明。");
    const html = `<section style="text-align:left">
      <p>A段核心内容。</p>
      <p>B段补充说明。</p>
      <section data-source="s001"><p>A段核心内容。</p></section>
    </section>`;
    const res = checkResult(html, blocks, images);
    expect(res.validation.ready).toBe(true);
    expect(res.validation.errors).toEqual([]);
    expect(res.enhancements.some((e) => e.text.includes("A段核心内容"))).toBe(
      true,
    );
  });
});
