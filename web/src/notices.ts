// User-facing wording for validation results. The checker keeps stable,
// technical messages (also sent to the model for repair and kept in history);
// this module turns them into plain language for authors.
import {
  inspectFragment,
  sourceManifest,
  type ResultLocations,
  type SourceBlock,
} from "./content";
import type { LayoutResult } from "./types";

export type NoticeLevel = "action" | "review" | "auto";
export type NoticeAction = "fill_author" | "remove_placeholder";
/** What to highlight in the preview for a notice. */
export type NoticeTarget =
  { kind: "block"; id: string } | { kind: "enhancement"; index: number };
export type Notice = {
  key: string;
  level: NoticeLevel;
  title: string;
  detail?: string;
  actions?: NoticeAction[];
  target?: NoticeTarget;
  /** The exact text the notice is about, quoted to the author. */
  quote?: string;
  /** Items listed under a summary notice, e.g. decorative text. */
  items?: DecorationItem[];
  /** Original checker messages, shown only under technical details. */
  technical: string[];
};
export type DecorationItem = {
  /** Index into result.enhancements. */
  index: number;
  type: string;
  text: string;
  location?: string;
};
export type NoticeGroups = {
  action: Notice[];
  review: Notice[];
  auto: Notice[];
};
type BlockInfo = Pick<SourceBlock, "id" | "kind" | "text">;
type Enhancement = { type: string; text: string };

function snippet(value: string, max = 14) {
  const chars = [...value.replace(/\s+/g, " ").trim()];
  return chars.length > max
    ? chars.slice(0, max).join("") + "…"
    : chars.join("");
}

/** Describes a source block by its own words instead of an internal id. */
export function describeBlock(id: string, blocks: BlockInfo[]) {
  const index = blocks.findIndex((b) => b.id === id);
  const block = blocks[index];
  if (!block) return "其中一段原文";
  if (block.kind === "hr") {
    const next = blocks.slice(index + 1).find((b) => b.kind !== "hr" && b.text);
    return next ? `「${snippet(next.text)}」前的分隔线` : "文末的分隔线";
  }
  const words = snippet(
    ["fence", "code_block"].includes(block.kind)
      ? block.text.split("\n").find((line) => line.trim()) || ""
      : block.text,
  );
  if (!words) return "一张配图";
  if (block.kind === "heading_open") return `小标题「${words}」`;
  if (["fence", "code_block"].includes(block.kind)) return `代码块「${words}」`;
  if (block.kind === "table_open") return `表格「${words}」`;
  if (["bullet_list_open", "ordered_list_open"].includes(block.kind))
    return `列表「${words}」`;
  return `「${words}」这段`;
}

function listBlocks(ids: string[], blocks: BlockInfo[], limit = 3) {
  const shown = ids.slice(0, limit).map((id) => describeBlock(id, blocks));
  return shown.join("、") + (ids.length > limit ? ` 等 ${ids.length} 处` : "");
}

export function friendlyLocation(location: string, blocks: BlockInfo[]) {
  if (location === "正文前") return "文章开头";
  if (location === "正文后") return "文章结尾";
  const match = /^(s\d+) 后$/.exec(location);
  return match ? describeBlock(match[1], blocks) + "之后" : location;
}

export function formatTokens(value: number | null) {
  if (value === null) return "未知";
  if (value < 10000) return String(value);
  return (value / 10000).toFixed(1).replace(/\.0$/, "") + " 万";
}

type WarningRule = {
  key: string;
  level: NoticeLevel;
  pattern: RegExp;
};
// Order matters only for display: groups appear in this order within a level.
const WARNING_RULES: WarningRule[] = [
  { key: "placeholder", level: "action", pattern: /^成稿包含模板占位符/ },
  { key: "body_only", level: "action", pattern: /^部分原文待核对：原文(s\d+)/ },
  {
    key: "heading_plain",
    level: "review",
    pattern: /^原文(s\d+)未保留标题结构/,
  },
  {
    key: "divider_missing",
    level: "review",
    pattern: /^原文(s\d+)的分隔线未能确认/,
  },
  { key: "punctuation", level: "review", pattern: /半角标点|英文直引号/ },
  { key: "width", level: "review", pattern: /width|box-sizing/ },
  { key: "gradient", level: "review", pattern: /渐变背景/ },
  { key: "leaf", level: "review", pattern: /span leaf/ },
  { key: "align", level: "review", pattern: /text-align/ },
  {
    key: "chapter",
    level: "auto",
    pattern: /^原文(s\d+)的标题已改为主题章节样式/,
  },
  {
    key: "chapter",
    level: "auto",
    pattern: /^原文(s\d+)的分隔线已由主题章节间距代替/,
  },
];

const AUTHOR_PLACEHOLDER =
  /\{\{\s*(?:作者名|作者|笔名|署名|昵称|名字|一句话简介|一句话介绍|作者简介|个人简介|简介|作者身份|身份|介绍)/;

function placeholderExample(enhancements: Enhancement[]) {
  const text =
    enhancements.find((e) => /\{\{[^{}]*\}\}/.test(e.text))?.text || "";
  const line = text.split("\n").find((l) => /\{\{[^{}]*\}\}/.test(l)) || "";
  return snippet(line, 30);
}

function renderGroup(
  key: string,
  level: NoticeLevel,
  messages: string[],
  ids: string[],
  blocks: BlockInfo[],
  enhancements: Enhancement[],
): Notice {
  const base = { key, level, technical: messages };
  const n = ids.length || messages.length;
  switch (key) {
    case "placeholder": {
      const example = placeholderExample(enhancements);
      const item = enhancements.find((e) => /\{\{[^{}]*\}\}/.test(e.text));
      const atEnd =
        (item as { location?: string } | undefined)?.location === "正文后";
      if (AUTHOR_PLACEHOLDER.test(example || item?.text || "")) {
        return {
          ...base,
          title: atEnd ? "文末署名还没填" : "署名还没填",
          quote: example || undefined,
          detail:
            "主题按模板放了一段作者署名，但你还没有设置署名。不处理的话，「{{作者名}}」这类文字会原样出现在公众号里。",
          actions: ["fill_author", "remove_placeholder"],
        };
      }
      return {
        ...base,
        title: "有一段模板文字还没填",
        quote: example || undefined,
        detail:
          "不处理的话，「{{…}}」这类文字会原样出现在公众号里。可以删掉这一段，或重新排版。",
        actions: ["remove_placeholder"],
      };
    }
    case "body_only":
      return {
        ...base,
        title: `${listBlocks(ids, blocks)}只出现在封面或引用里`,
        detail:
          "正文里可能漏掉了这部分内容。请在右侧预览里确认；如果确实漏了，建议重新排版。",
      };
    case "heading_plain":
      return {
        ...base,
        title: `${n} 个小标题看起来和正文一样`,
        detail: `${listBlocks(ids, blocks)}。读者可能认不出这是标题；介意的话可以换个主题重新排版。`,
      };
    case "divider_missing":
      return {
        ...base,
        title: `${n} 处分隔线没有出现在成稿里`,
        detail: `位置：${listBlocks(ids, blocks)}。主题通常用留白分段，一般不影响阅读。`,
      };
    case "punctuation":
      return {
        ...base,
        title: "正文里有英文标点",
        detail:
          "中文后面跟了 , ; ! ? 或英文引号，在手机上看着不整齐。代码和英文名称里的可以忽略。",
      };
    case "width":
      return {
        ...base,
        title: `${n} 处卡片宽度可能超出手机屏幕`,
        detail:
          "在窄屏手机上可能被挤出屏幕或出现横向滚动。复制到公众号后，请用手机预览确认。",
      };
    case "gradient":
      return {
        ...base,
        title: "有卡片用了渐变底色",
        detail: "读者打开深色模式时，卡片上的文字可能看不清。",
      };
    case "leaf":
      return {
        ...base,
        title: "有部分文字的格式不标准",
        detail:
          "粘贴到公众号后，这部分文字的样式可能丢失。复制后请在公众号里看一眼，问题明显的话可以重新排版。",
      };
    case "align":
      return {
        ...base,
        title: "文章没有设定整体对齐方式",
        detail: "粘贴到公众号后，段落可能变成居中或两端对齐。复制后请看一眼。",
      };
    case "chapter": {
      const headings = messages.filter((m) => m.includes("标题")).length;
      const dividers = messages.length - headings;
      const title = headings
        ? `主题把 ${headings} 个小标题做成了章节样式${dividers ? `，${dividers} 处分隔线也换成了章节间距` : ""}`
        : `主题用章节间距代替了 ${dividers} 处分隔线`;
      return {
        ...base,
        title,
        detail: "这是主题的设计，原文文字没有改动，不需要处理。",
      };
    }
    default:
      return {
        ...base,
        title: "还有一条排版提示",
        detail: messages.join("；"),
      };
  }
}

export function describeWarnings(
  warnings: string[],
  blocks: BlockInfo[] = [],
  enhancements: Enhancement[] = [],
): NoticeGroups {
  const groups = new Map<
    string,
    { level: NoticeLevel; messages: string[]; ids: string[] }
  >();
  for (const message of [...new Set(warnings)]) {
    const rule = WARNING_RULES.find((r) => r.pattern.test(message));
    const key = rule?.key ?? "other:" + message;
    const group = groups.get(key) ?? {
      level: rule?.level ?? "review",
      messages: [],
      ids: [],
    };
    group.messages.push(message);
    const id = rule && rule.pattern.exec(message)?.[1];
    if (id && !group.ids.includes(id)) group.ids.push(id);
    groups.set(key, group);
  }
  const out: NoticeGroups = { action: [], review: [], auto: [] };
  const order = [...new Set(WARNING_RULES.map((r) => r.key))];
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a),
      ib = order.indexOf(b);
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  });
  for (const key of keys) {
    const g = groups.get(key)!;
    const notice = renderGroup(
      key.startsWith("other:") ? "other" : key,
      g.level,
      g.messages,
      g.ids,
      blocks,
      enhancements,
    );
    const target = targetFor(notice.key, g.ids, blocks, enhancements);
    out[g.level].push(target ? { ...notice, target } : notice);
  }
  return out;
}

function targetFor(
  key: string,
  ids: string[],
  blocks: BlockInfo[],
  enhancements: Enhancement[],
): NoticeTarget | undefined {
  if (key === "placeholder") {
    const index = enhancements.findIndex((e) => /\{\{[^{}]*\}\}/.test(e.text));
    return index === -1 ? undefined : { kind: "enhancement", index };
  }
  // A missing divider is not in the layout; point at what follows it.
  const visible = ids
    .map((id) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (blocks[index]?.kind !== "hr") return id;
      return blocks.slice(index + 1).find((b) => b.kind !== "hr")?.id;
    })
    .filter((id): id is string => !!id);
  const id =
    key === "chapter"
      ? (visible.find(
          (v) => blocks.find((b) => b.id === v)?.kind === "heading_open",
        ) ?? visible[0])
      : visible[0];
  return id ? { kind: "block", id } : undefined;
}

/** Resolves a notice target to an element path in the preview. */
export function targetPath(
  target: NoticeTarget | undefined,
  locations: ResultLocations | null,
) {
  if (!target || !locations) return null;
  return target.kind === "block"
    ? (locations.blocks[target.id] ?? null)
    : (locations.enhancements[target.index] ?? null);
}

type ErrorRule = [RegExp, (block: string) => string];
const ERROR_RULES: ErrorRule[] = [
  [/^原文(s\d+)顺序变化$/, (b) => `${b}的位置被调换了`],
  [/^原文(s\d+)缺失或文字变化$/, (b) => `${b}不见了，或被改了字`],
  [/^原文(s\d+)代码缩进或内容变化$/, (b) => `${b}被改动了（内容或缩进）`],
  [/^原文(s\d+)代码块未保留在成稿HTML中$/, (b) => `${b}没有保留下来`],
  [/^原文(s\d+)文字变化$/, (b) => `${b}被改了字`],
  [/^原文(s\d+)配图变化$/, (b) => `${b}里的配图被换掉或弄丢了`],
  [/^原文(s\d+)链接变化$/, (b) => `${b}里的链接被改了`],
  [/^原文(s\d+)表格单元格变化$/, (b) => `${b}的内容被改了`],
  [/^原文(s\d+)的行内代码变化$/, (b) => `${b}里的代码文字被改了`],
  [/^成稿链接必须来自原稿$/, () => "AI 加了原稿里没有的链接"],
  [/^图片来源不属于当前原稿或协议不安全$/, () => "AI 加了原稿里没有的图片"],
  [/^链接协议不安全$/, () => "成稿里有不安全的链接"],
];

export function friendlyError(message: string, blocks: BlockInfo[] = []) {
  for (const [pattern, render] of ERROR_RULES) {
    const match = pattern.exec(message);
    if (match) return render(match[1] ? describeBlock(match[1], blocks) : "");
  }
  return "这版排版用了公众号不支持的格式";
}

export function friendlyErrors(errors: string[], blocks: BlockInfo[] = []) {
  return [...new Set(errors.map((e) => friendlyError(e, blocks)))];
}

/** Rewrites a stored job error (which may embed checker messages) for display. */
export function friendlyJobMessage(message: string, blocks: BlockInfo[] = []) {
  const failed = /^排版检查未通过：(.*)$/s.exec(message);
  if (!failed) return message;
  const items = friendlyErrors(failed[1].split("；").filter(Boolean), blocks);
  return `这版排版没通过原文核对，已拦下，不会交给你复制：${items.join("；")}。`;
}

const RECHECK = /未保留标题结构|分隔线未能确认|模板占位符/;

/**
 * Notices for a stored result. Results saved before the theme-aware checks
 * are re-checked from their marked HTML so old history reads the same way.
 */
export function describeResult(result: LayoutResult) {
  let blocks: SourceBlock[] = [];
  let images: string[] = [];
  try {
    ({ blocks, images } = sourceManifest(result.sourceMarkdown));
  } catch {
    /* Keep generic wording when the source can no longer be parsed. */
  }
  let warnings = result.validation.warnings;
  let locations: ResultLocations | null = null;
  if (blocks.length && result.sourceHtml) {
    try {
      const again = inspectFragment(result.sourceHtml, blocks, images);
      if (
        result.validation.ready &&
        again.validation.ready &&
        warnings.some((w) => RECHECK.test(w))
      )
        warnings = again.validation.warnings;
      locations = {
        blocks: again.locations.blocks,
        // Only trust item positions when the review list lines up.
        enhancements:
          again.enhancements.length === result.enhancements.length
            ? again.locations.enhancements
            : [],
      };
    } catch {
      /* Fall back to the stored warnings; locating is unavailable. */
    }
  }
  return {
    blocks,
    warnings,
    locations,
    notices: withDecorations(
      describeWarnings(warnings, blocks, result.enhancements),
      result.enhancements,
    ),
    errors: friendlyErrors(result.validation.errors, blocks),
  };
}

/**
 * Text the Skill adds for layout (cover, chapter numbers, English subtitles,
 * closing cards) is part of the theme, so it is summarized as handled rather
 * than listed for the author to confirm. Placeholders stay in "action".
 */
export function withDecorations(
  groups: NoticeGroups,
  enhancements: { type: string; text: string; location?: string }[],
): NoticeGroups {
  const items: DecorationItem[] = enhancements
    .map((e, index) => ({
      index,
      type: e.type,
      text: e.text,
      location: e.location,
    }))
    .filter(
      (e) =>
        e.type !== "placeholder" &&
        !/\{\{[^{}]*\}\}/.test(e.text) &&
        e.text.trim(),
    );
  if (!items.length) return groups;
  // Prefer readable examples over bare chapter numbers such as "01".
  const readable = items.filter((e) =>
    /[^\d\s·/]{2,}/.test(e.text.split("\n")[0]),
  );
  const examples = (readable.length ? readable : items)
    .slice(0, 3)
    .map((e) => `「${snippet(e.text.split("\n")[0], 12)}」`)
    .join("");
  const notice: Notice = {
    key: "decorations",
    level: "auto",
    title: `主题加了 ${items.length} 处装饰文字`,
    detail: `比如${examples}。封面、章节编号、英文副标题和文末卡片都属于主题版式，原文没有改动，不需要逐条确认。`,
    technical: [],
    items,
  };
  return { ...groups, auto: [...groups.auto, notice] };
}

export function completionNotice(groups: NoticeGroups) {
  if (groups.action.length)
    return `排版完成，有 ${groups.action.length} 处需要你处理，请看预览上方的提示。`;
  if (groups.review.length)
    return `排版完成，有 ${groups.review.length} 条建议在复制前看一眼。`;
  return undefined;
}
