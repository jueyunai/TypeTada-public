import { CORE_OUTPUT_CONTRACT, ENHANCEMENT_CONTRACT } from "./content";

export type BlindBoxStyle = "random" | "tech" | "minimal" | "magazine";
export type ResolvedBlindBoxStyle = Exclude<BlindBoxStyle, "random">;

export const BLIND_BOX_STYLES: {
  id: BlindBoxStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "random",
    label: "完全随机",
    description: "全风格自由开箱，160+ 组配色与版式每次都有新鲜感",
  },
  {
    id: "tech",
    label: "科技感",
    description: "清爽理性、内刊档案或硬核凭证感家族，适合 AI、工具、开发与教程",
  },
  {
    id: "minimal",
    label: "极简留白",
    description: "大留白、暖杏手账、报刊衬线与细线秩序，适合观点、随笔与深思",
  },
  {
    id: "magazine",
    label: "杂志编辑",
    description: "杂志专刊、复古报刊、手账笔记与纸感票据家族，适合专题、测评与长文",
  },
];

export type BlindBoxPalette = {
  id: string;
  name: string;
  styles: ResolvedBlindBoxStyle[];
  /** 主强调色（需保证 #FFFFFF 白字对比度 ≥ 4.5:1） */
  primary: string;
  /** 深字色（需保证在 tint 浅底上对比度 ≥ 4.5:1） */
  deep: string;
  /** 浅背景色（用于导语、重点卡、标签胶囊底色） */
  tint: string;
  /** 点缀色（关键词下划线、柔和边线等） */
  accent: string;
  /** 柔和描边色（卡片边框、细分割线） */
  border: string;
  /** 荧光笔/暖色高亮点睛色（关键词背景或粗底线） */
  highlight: string;
  /** 正文主色（需保证在 surface 上对比度 ≥ 7:1） */
  ink: string;
  /** 辅助说明文字色 */
  muted: string;
  /** 页面整体底色 */
  surface: string;
  /** 柔和阴影色 rgba(...) */
  shadow: string;
};

export type BlindBoxFamilyInfo = {
  id: string;
  name: string;
  vibe: string;
};

export type BlindBoxTrait = {
  id: string;
  label: string;
  instruction: string;
  /** 注入当前色板真实 Hex 后的同家族高定 HTML 积木 */
  html: string;
};

export type BlindBoxBrief = {
  style: BlindBoxStyle;
  resolvedStyle: ResolvedBlindBoxStyle;
  family: BlindBoxFamilyInfo;
  palette: BlindBoxPalette;
  opener: BlindBoxTrait;
  sectionHeader: BlindBoxTrait;
  rhythm: BlindBoxTrait;
  emphasis: BlindBoxTrait;
  closer: BlindBoxTrait;
  summary: string;
};

/** 预留给二期「盲盒结果存为个人模板」的脱敏样式快照契约。 */
export type TemplateStyleSnapshot = {
  id: string;
  name: string;
  createdAt: number;
  style: ResolvedBlindBoxStyle;
  palette: BlindBoxPalette;
  bodyTypography: {
    fontSize: string;
    lineHeight: string;
    marginBottom: string;
    letterSpacing: string;
  };
  snippets: {
    opener?: string;
    sectionHeader?: string;
    quote?: string;
    closer?: string;
  };
};

// 15 套精选高品味色板（全量通过 WCAG 2.1 对比度及微信深浅模式适配核验）
export const BLIND_BOX_PALETTES: BlindBoxPalette[] = [
  // magazine（5 套）
  {
    id: "emerald-press",
    name: "翡翠专刊",
    styles: ["magazine"],
    primary: "#047857",
    deep: "#065F46",
    tint: "#ECFDF5",
    accent: "#A7F3D0",
    border: "#BBF7D0",
    highlight: "#FDE68A",
    ink: "#1F2937",
    muted: "#6B7280",
    surface: "#FFFFFF",
    shadow: "rgba(4,120,87,0.12)",
  },
  {
    id: "editorial-crimson",
    name: "编辑正红",
    styles: ["magazine"],
    primary: "#DC2626",
    deep: "#991B1B",
    tint: "#FEF2F2",
    accent: "#FECACA",
    border: "#FEE2E2",
    highlight: "#FDE68A",
    ink: "#1C1917",
    muted: "#6B7280",
    surface: "#FFFFFF",
    shadow: "rgba(220,38,38,0.13)",
  },
  {
    id: "berry-edition",
    name: "绯莓微刊",
    styles: ["magazine"],
    primary: "#BE123C",
    deep: "#881337",
    tint: "#FFF1F2",
    accent: "#FECDD3",
    border: "#FFE4E6",
    highlight: "#FDE68A",
    ink: "#27272A",
    muted: "#71717A",
    surface: "#FFFFFF",
    shadow: "rgba(190,18,60,0.12)",
  },
  {
    id: "terracotta-studio",
    name: "落日陶橙",
    styles: ["magazine"],
    primary: "#C2410C",
    deep: "#9A3412",
    tint: "#FFF7ED",
    accent: "#FED7AA",
    border: "#FFEDD5",
    highlight: "#FEF08A",
    ink: "#292524",
    muted: "#78716C",
    surface: "#FFFFFF",
    shadow: "rgba(194,65,12,0.12)",
  },
  {
    id: "prussian-press",
    name: "普鲁士蓝刊",
    styles: ["magazine"],
    primary: "#0F4C81",
    deep: "#0A365C",
    tint: "#F0F6FB",
    accent: "#BAE6FD",
    border: "#D6E8F8",
    highlight: "#FDE68A",
    ink: "#1E293B",
    muted: "#64748B",
    surface: "#FFFFFF",
    shadow: "rgba(15,76,129,0.12)",
  },
  // tech（4 套）
  {
    id: "forward-blue",
    name: "向前明蓝",
    styles: ["tech"],
    primary: "#1E4FD0",
    deep: "#1D2D48",
    tint: "#EFF5FF",
    accent: "#CDDEFF",
    border: "#DFE8F5",
    highlight: "#F8D977",
    ink: "#1E293B",
    muted: "#64748B",
    surface: "#FFFFFF",
    shadow: "rgba(30,79,208,0.11)",
  },
  {
    id: "iris-flash",
    name: "鸢尾快讯",
    styles: ["tech"],
    primary: "#6D28D9",
    deep: "#4C1D95",
    tint: "#F5F3FF",
    accent: "#DDD6FE",
    border: "#EDE9FE",
    highlight: "#FDE68A",
    ink: "#1F2937",
    muted: "#6B7280",
    surface: "#FFFFFF",
    shadow: "rgba(109,40,217,0.12)",
  },
  {
    id: "pine-terminal",
    name: "冷杉松青",
    styles: ["tech"],
    primary: "#0F766E",
    deep: "#115E59",
    tint: "#F0FDFA",
    accent: "#99F6E4",
    border: "#CCFBF1",
    highlight: "#FDE68A",
    ink: "#1E293B",
    muted: "#64748B",
    surface: "#FFFFFF",
    shadow: "rgba(15,118,110,0.12)",
  },
  {
    id: "carbon-press",
    name: "铅字炭黑",
    styles: ["tech"],
    primary: "#1E293B",
    deep: "#0F172A",
    tint: "#F1F5F9",
    accent: "#CBD5E1",
    border: "#E2E8F0",
    highlight: "#FEF08A",
    ink: "#1E293B",
    muted: "#64748B",
    surface: "#FFFFFF",
    shadow: "rgba(15,23,42,0.10)",
  },
  // minimal（3 套）
  {
    id: "zen-moss",
    name: "留白墨绿",
    styles: ["minimal"],
    primary: "#3D5A4C",
    deep: "#2B3F35",
    tint: "#F2F6F4",
    accent: "#B5C8BC",
    border: "#E2EAE5",
    highlight: "#E4EFE9",
    ink: "#2B2B2B",
    muted: "#737373",
    surface: "#FFFFFF",
    shadow: "rgba(61,90,76,0.08)",
  },
  {
    id: "ink-stone",
    name: "东方暖石",
    styles: ["minimal"],
    primary: "#44403C",
    deep: "#292524",
    tint: "#F5F5F4",
    accent: "#D6D3D1",
    border: "#E7E5E4",
    highlight: "#FEF3C7",
    ink: "#292524",
    muted: "#78716C",
    surface: "#FFFFFF",
    shadow: "rgba(41,37,36,0.08)",
  },
  {
    id: "slate-mist",
    name: "青瓷云灰",
    styles: ["minimal"],
    primary: "#334155",
    deep: "#1E293B",
    tint: "#F4F7FA",
    accent: "#CBD5E1",
    border: "#E2E8F0",
    highlight: "#E2E8F0",
    ink: "#1E293B",
    muted: "#64748B",
    surface: "#FFFFFF",
    shadow: "rgba(51,65,85,0.08)",
  },
  // 新增 3 套（内刊橄榄 / 复古报刊 / 温暖手账）
  {
    id: "olive-archive",
    name: "橄榄内刊",
    styles: ["magazine", "tech"],
    primary: "#3F5528",
    deep: "#23251D",
    tint: "#F2F3EE",
    accent: "#ED7B2F",
    border: "#C9CBC1",
    highlight: "#FDE68A",
    ink: "#23251D",
    muted: "#65675E",
    surface: "#FDFDF8",
    shadow: "rgba(35,37,29,0.08)",
  },
  {
    id: "gazette-ink",
    name: "报刊油墨",
    styles: ["magazine", "minimal"],
    primary: "#1F2937",
    deep: "#111827",
    tint: "#F6F5F1",
    accent: "#991B1B",
    border: "#D6D3CB",
    highlight: "#FEF08A",
    ink: "#1C1917",
    muted: "#6B7280",
    surface: "#FFFFFF",
    shadow: "rgba(17,24,39,0.08)",
  },
  {
    id: "warm-latte",
    name: "暖杏手账",
    styles: ["minimal", "magazine"],
    primary: "#9A4A1C",
    deep: "#6E3211",
    tint: "#FDF6EE",
    accent: "#E8B892",
    border: "#EEDCC8",
    highlight: "#FDE68A",
    ink: "#2E241E",
    muted: "#7A6A5F",
    surface: "#FFFDF9",
    shadow: "rgba(154,74,28,0.09)",
  },
];

type FamilyVariant = {
  id: string;
  label: string;
  instruction: string;
  template: string;
};

type DesignFamilySpec = {
  id: string;
  name: string;
  vibe: string;
  styles: ResolvedBlindBoxStyle[];
  paletteIds: string[];
  openers: FamilyVariant[];
  sectionHeaders: FamilyVariant[];
  rhythm: FamilyVariant;
  emphasis: FamilyVariant;
  closer: FamilyVariant;
};

// 5 套完整视觉家族：圆角、边线、阴影、字体与强调语义全部内部自洽，不再跨风格混拼
export const DESIGN_FAMILIES: DesignFamilySpec[] = [
  // 1. 轻杂志专刊家族（源自 moyu-green）
  {
    id: "moyu-magazine",
    name: "轻杂志专刊",
    vibe: "20px 大圆角封面、暖黄荧光点睛、三列看点导读与轻重列表交替",
    styles: ["magazine", "tech"],
    paletteIds: [
      "emerald-press",
      "prussian-press",
      "berry-edition",
      "terracotta-studio",
      "iris-flash",
      "pine-terminal",
    ],
    openers: [
      {
        id: "moyu-cover-card",
        label: "圆角双行快讯封面",
        instruction: "20px 大圆角柔光白底 + 顶部色点眉标 + 两行主观点 + 实心主色底条",
        template: `<section style="margin:0 0 26px;background-color:#FFFFFF;border:1.5px solid __BORDER__;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <section style="padding:24px 22px 20px;">
    <section style="display:flex;align-items:center;gap:8px;margin:0 0 18px;">
      <span style="display:inline-block;width:6px;height:6px;background-color:__PRIMARY__;border-radius:50%;overflow:hidden;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:2.5px;color:__PRIMARY__;line-height:1.4;"><span leaf="">FEATURE</span></span>
      <section style="flex:1;height:1px;background-color:__BORDER__;overflow:hidden;"><span leaf=""><br></span></section>
      <span style="font-size:11px;color:__MUTED__;font-weight:600;line-height:1.4;"><span leaf="">2026</span></span>
    </section>
    <p style="font-size:22px;font-weight:900;color:__INK__;margin:0 0 4px;line-height:1.3;"><span leaf="">用另一重视角打开本文</span></p>
    <p style="font-size:22px;font-weight:900;color:__PRIMARY__;margin:0 0 14px;line-height:1.3;"><span leaf="">一句话点破核心价值</span></p>
    <section style="width:44px;height:3px;background-color:__PRIMARY__;border-radius:2px;margin:0 0 12px;overflow:hidden;"><span leaf=""><br></span></section>
    <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.7;"><span leaf="">提炼文章三个关键词 · 不与正文大标题重复</span></p>
  </section>
  <section style="background-color:__PRIMARY__;padding:11px 22px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
    <p style="font-size:12px;color:#FFFFFF;margin:0;font-weight:600;line-height:1.5;"><span leaf="">本期导读</span></p>
    <section style="display:flex;gap:6px;">
      <span style="background-color:__DEEP__;padding:2px 8px;border-radius:4px;font-size:10px;color:#FFFFFF;font-weight:600;line-height:1.5;"><span leaf="">观点</span></span>
      <span style="background-color:__DEEP__;padding:2px 8px;border-radius:4px;font-size:10px;color:#FFFFFF;font-weight:600;line-height:1.5;"><span leaf="">实操</span></span>
    </section>
  </section>
</section>`,
      },
      {
        id: "moyu-cover-digest",
        label: "柔边速报导读卡",
        instruction: "16px 柔底框 + 主色细顶条 + 栏目标签 + 主旨判断与双签收口",
        template: `<section style="margin:0 0 26px;background-color:#FFFFFF;border:1px solid __BORDER__;border-top:4px solid __PRIMARY__;border-radius:16px;padding:22px;box-shadow:0 4px 18px __SHADOW__;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;color:__PRIMARY__;line-height:1.5;"><span leaf="">DIGEST · 编辑手记</span></p>
  <p style="margin:0 0 12px;font-size:20px;font-weight:900;color:__INK__;line-height:1.45;"><span leaf="">抛开表面套路，看清这篇稿子真正想交代的那件事。</span></p>
  <section style="background-color:__TINT__;border-radius:10px;padding:12px 14px;">
    <p style="margin:0;font-size:13px;color:__DEEP__;line-height:1.7;"><span leaf="">用 1-2 句概括全文探讨路径，读前先抓主脉络。</span></p>
  </section>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "moyu-sec-part",
        label: "主色大序号 + 竖线双行",
        instruction: "左侧 28px 主色粗序号 + 1px 竖线 + 右侧 <h3> 粗体中文标题与按章现写的英文短词",
        template: `<section style="margin:36px 0 20px;">
  <section style="display:flex;align-items:center;gap:14px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:28px;font-weight:900;color:__PRIMARY__;line-height:1;letter-spacing:-1px;"><span leaf="">01</span></p>
      <p style="margin:2px 0 0;font-size:9px;font-weight:700;color:__MUTED__;letter-spacing:2px;line-height:1.2;"><span leaf="">PART</span></p>
    </section>
    <span style="display:inline-block;width:1px;height:34px;background-color:__BORDER__;flex-shrink:0;overflow:hidden;"><span leaf=""><br></span></span>
    <section>
      <h3 style="margin:0 0 2px;font-size:18px;font-weight:900;color:__INK__;line-height:1.35;"><span leaf="">章节标题</span></h3>
      <p style="margin:0;font-size:11px;font-weight:600;color:__MUTED__;letter-spacing:1.2px;line-height:1.4;"><span leaf="">按本章内容提炼两三个英文词（或整行删掉）</span></p>
    </section>
  </section>
</section>`,
      },
      {
        id: "moyu-sec-pill",
        label: "主色圆角胶囊序号 + 细底线",
        instruction: "实心主色圆角「01」胶囊 + <h3> 粗体标题 + 1px 浅底分隔线",
        template: `<section style="margin:36px 0 20px;padding:0 0 11px;border-bottom:1px solid __BORDER__;">
  <section style="display:flex;align-items:center;gap:10px;">
    <span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;line-height:1.4;"><span leaf="">01</span></span>
    <h3 style="margin:0;font-size:18px;font-weight:900;color:__INK__;line-height:1.35;"><span leaf="">章节标题</span></h3>
  </section>
</section>`,
      },
    ],
    rhythm: {
      id: "moyu-rhythm",
      label: "杂志主标题 + 三列看点导读 + 暖黄小节 + 一句话亮点卡",
      instruction: "承接原稿 H1、长文≥3章放三列看点、小节用暖黄底线、关键转折放居中亮点金句",
      template: `<!-- 正文主标题（原稿有 # 一级标题 s001 时必须放在 <section data-body=""> 最顶部，一字不改） -->
<section style="margin:0 0 22px;padding:0 0 12px;border-bottom:1.5px solid __BORDER__;">
  <h3 style="margin:0;font-size:21px;font-weight:900;color:__INK__;line-height:1.4;"><span leaf="">原稿一级主标题</span></h3>
</section>
<!-- 精选 3 点导读（文章 ≥ 3 个章节时插入在封面后/正文前；只有 1-2 章则省略） -->
<section style="margin:0 0 26px;">
  <p style="font-size:12px;color:__MUTED__;margin:0 0 10px;font-weight:600;line-height:1.5;"><span leaf="">本文速览</span></p>
  <section style="display:flex;gap:8px;align-items:stretch;">
    <section style="flex:1;min-width:0;box-sizing:border-box;background-color:__TINT__;border:1px solid __BORDER__;border-radius:10px;padding:10px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:__PRIMARY__;line-height:1.4;"><span leaf="">01</span></p>
      <p style="margin:0;font-size:12px;font-weight:700;color:__INK__;line-height:1.45;"><span leaf="">核心看点一</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;background-color:__TINT__;border:1px solid __BORDER__;border-radius:10px;padding:10px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:__PRIMARY__;line-height:1.4;"><span leaf="">02</span></p>
      <p style="margin:0;font-size:12px;font-weight:700;color:__INK__;line-height:1.45;"><span leaf="">核心看点二</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;background-color:__TINT__;border:1px solid __BORDER__;border-radius:10px;padding:10px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:__PRIMARY__;line-height:1.4;"><span leaf="">03</span></p>
      <p style="margin:0;font-size:12px;font-weight:700;color:__INK__;line-height:1.45;"><span leaf="">核心看点三</span></p>
    </section>
  </section>
</section>
<!-- ### 小节标题 -->
<h4 style="margin:26px 0 14px;font-size:16px;font-weight:800;color:__INK__;line-height:1.5;"><span style="border-bottom:3px solid __HIGHLIGHT__;padding:0 2px 1px;"><span leaf="">小节标题</span></span></h4>
<!-- 一句话金句亮点卡（用于关键引语或核心论断） -->
<section style="background-color:#FFFFFF;border:1px dashed __BORDER__;border-radius:10px;padding:14px 16px;margin:0 0 22px;text-align:center;">
  <p style="margin:0;font-size:16px;line-height:1.75;color:__PRIMARY__;font-weight:700;"><span style="border-bottom:3px solid __HIGHLIGHT__;padding-bottom:2px;"><span leaf="">全文或该段最点睛的一句金句</span></span></p>
</section>`,
    },
    emphasis: {
      id: "moyu-emp",
      label: "柔色下划线 + 暖黄荧光 + 轻重双列表",
      instruction: "交替使用胶囊列表卡与圆点紧凑列表，避免长文连片同款方框",
      template: `<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 20px;text-align:left;"><span leaf="">正文用</span><strong style="color:__PRIMARY__;font-weight:700;"><span leaf="">主色加粗</span></strong><span leaf="">、</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;"><span leaf="">柔色下划线</span></span><span leaf="">与</span><span style="background-color:__HIGHLIGHT__;padding:1px 4px;border-radius:3px;font-weight:600;color:#111827;"><span leaf="">暖色高亮</span></span><span leaf="">交替。</span></p>
<section style="background-color:__TINT__;border-left:4px solid __PRIMARY__;border-radius:0 10px 10px 0;padding:14px 18px;margin:0 0 22px;">
  <p style="font-size:16px;color:__DEEP__;margin:0;line-height:1.8;font-weight:600;"><span leaf="">普通引用段落内容完整放入此卡片。</span></p>
</section>
<!-- 重列表卡（重要清单用 01 实色序号，整条含冒号保留在同一 <p>） -->
<section style="background-color:__TINT__;border:1px solid __BORDER__;border-radius:10px;padding:12px 15px;margin:0 0 10px;">
  <p style="font-size:16px;line-height:1.8;color:__INK__;margin:0;"><span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:11px;font-weight:700;padding:1px 7px;border-radius:4px;margin-right:8px;line-height:1.5;"><span leaf="">01</span></span><span leaf="">重要清单条目：完整保留冒号前后内容</span></p>
</section>
<!-- 轻列表条（次要清单用，避免满屏方框，整条含冒号保留在同一 <p>） -->
<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 12px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:900;margin-right:8px;"><span leaf="">•</span></span><span leaf="">轻量条目内容：同样完整保留冒号及全部字符</span></p>`,
    },
    closer: {
      id: "moyu-closer",
      label: "圆角浅底杂志收束卡",
      instruction: "若原文结尾已有作者介绍或三连提示，则省略本尾卡避免双重结尾",
      template: `<section style="margin:28px 0 8px;padding:16px 20px;background-color:__TINT__;border:1px solid __BORDER__;border-radius:14px;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.8px;color:__PRIMARY__;line-height:1.5;"><span leaf="">写在最后</span></p>
  <p style="margin:0;font-size:14px;color:__DEEP__;line-height:1.7;"><span leaf="">感谢阅读，欢迎点个在看或分享给身边的同好。</span></p>
</section>`,
    },
  },

  // 2. 经典编辑刊物家族（源自 red-white）
  {
    id: "editorial-classic",
    name: "经典编辑刊物",
    vibe: "12px 柔圆角、主色柔光阴影、淡色下划线锚点与经典编辑部节奏",
    styles: ["magazine", "minimal"],
    paletteIds: [
      "editorial-crimson",
      "berry-edition",
      "prussian-press",
      "emerald-press",
      "terracotta-studio",
    ],
    openers: [
      {
        id: "edit-cover-quote",
        label: "柔光阴影编辑金句卡",
        instruction: "12px 圆角白底 + 彩色柔光阴影 + 36px 上引号 + 实色白字关键词胶囊",
        template: `<section style="margin:4px 0 26px;background-color:#FFFFFF;border:1px solid __BORDER__;border-radius:12px;box-shadow:0 4px 24px -4px __SHADOW__;padding:24px 22px 20px;">
  <p style="font-size:36px;color:__PRIMARY__;font-weight:900;margin:0 0 8px;line-height:1;"><span leaf="">“</span></p>
  <p style="font-size:16px;font-weight:800;color:__INK__;margin:0 0 10px;line-height:1.8;">
    <span style="background-color:__PRIMARY__;color:#FFFFFF;padding:2px 8px;border-radius:4px;"><span leaf="">核心关键词</span></span>
    <span leaf=""> 之后的真正转折，往往落在最不起眼的细节判断上。</span>
  </p>
  <p style="text-align:right;font-size:12px;color:__MUTED__;margin:0;line-height:1.5;"><span leaf="">编者导读</span></p>
</section>`,
      },
      {
        id: "edit-cover-banner",
        label: "刊头细条编辑摘要卡",
        instruction: "顶边 3px 主色刊头细条 + 简洁刊期行 + 克制导语段落",
        template: `<section style="margin:0 0 26px;background-color:#FFFFFF;border:1px solid __BORDER__;border-top:3px solid __PRIMARY__;border-radius:10px;padding:22px;">
  <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:__PRIMARY__;margin:0 0 12px;line-height:1.4;"><span leaf="">EDITOR NOTE · 刊首语</span></p>
  <p style="font-size:19px;font-weight:800;color:__INK__;margin:0 0 10px;line-height:1.5;"><span leaf="">用克制而锐利的切口，点明本篇最核心的观察与立场。</span></p>
  <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.7;"><span leaf="">简要交代文章背景与推荐重点阅读段落。</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "edit-sec-badge",
        label: "实色圆角方徽章 + 主色底线",
        instruction: "实心圆角「01」方徽章 + 按章提炼英文眉标 + <h3> 粗标题 + 3px 主色底线",
        template: `<section style="margin:36px 0 22px;padding:0 0 12px;border-bottom:3px solid __PRIMARY__;">
  <section style="display:flex;align-items:center;">
    <span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:18px;font-weight:900;padding:4px 13px;border-radius:6px;margin-right:14px;line-height:1.3;"><span leaf="">01</span></span>
    <section>
      <p style="font-size:10px;color:__PRIMARY__;font-weight:700;letter-spacing:2px;margin:0 0 2px;line-height:1.4;"><span leaf="">章节英文短签</span></p>
      <h3 style="font-size:18px;font-weight:800;color:__INK__;margin:0;line-height:1.35;"><span leaf="">章节标题</span></h3>
    </section>
  </section>
</section>`,
      },
      {
        id: "edit-sec-center",
        label: "居中短粗主色条 + 刊物标题",
        instruction: "32px 短粗主色条居中 + 01 编号 + 居中 <h3> 标题，适合分章转折",
        template: `<section style="margin:38px 0 22px;text-align:center;">
  <section style="width:32px;height:3px;background-color:__PRIMARY__;margin:0 auto 10px;border-radius:2px;overflow:hidden;"><span leaf=""><br></span></section>
  <p style="font-size:11px;font-weight:800;color:__PRIMARY__;letter-spacing:2px;margin:0 0 4px;line-height:1.4;"><span leaf="">01</span></p>
  <h3 style="font-size:19px;font-weight:800;color:__INK__;margin:0;line-height:1.4;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "edit-rhythm",
      label: "编辑主标题 + 三列看点卡 + 左竖条小节 + 居中金句分隔",
      instruction: "正文主标题稳重收口、长文配三列看点卡、小节用左竖条、章节间点缀居中金句",
      template: `<section style="margin:0 0 22px;padding:0 0 12px;border-bottom:1px solid #E5E7EB;">
  <h3 style="margin:0;font-size:21px;font-weight:900;color:__INK__;line-height:1.4;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 26px;">
  <p style="font-size:12px;color:__MUTED__;margin:0 0 10px;line-height:1.5;"><span leaf="">本文看点</span></p>
  <section style="display:flex;gap:8px;align-items:stretch;">
    <section style="flex:1;min-width:0;box-sizing:border-box;background-color:__TINT__;border-radius:10px;padding:12px 10px;text-align:center;border:1px solid __BORDER__;">
      <p style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;margin:0 0 6px;line-height:1.4;"><span leaf="">01</span></p>
      <p style="font-size:12px;font-weight:700;color:__INK__;margin:0;line-height:1.45;"><span leaf="">看点一</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;background-color:__TINT__;border-radius:10px;padding:12px 10px;text-align:center;border:1px solid __BORDER__;">
      <p style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;margin:0 0 6px;line-height:1.4;"><span leaf="">02</span></p>
      <p style="font-size:12px;font-weight:700;color:__INK__;line-height:1.45;margin:0;"><span leaf="">看点二</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;background-color:__TINT__;border-radius:10px;padding:12px 10px;text-align:center;border:1px solid __BORDER__;">
      <p style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;margin:0 0 6px;line-height:1.4;"><span leaf="">03</span></p>
      <p style="font-size:12px;font-weight:700;color:__INK__;line-height:1.45;margin:0;"><span leaf="">看点三</span></p>
    </section>
  </section>
</section>
<h4 style="font-size:16px;font-weight:800;color:__INK__;margin:26px 0 14px;padding-left:10px;border-left:3px solid __PRIMARY__;line-height:1.45;"><span leaf="">小节标题</span></h4>
<p style="font-size:15px;margin:0 0 22px;text-align:center;color:__PRIMARY__;font-weight:700;border-top:1px solid __BORDER__;border-bottom:1px solid __BORDER__;padding:12px 8px;line-height:1.7;"><span leaf="">过渡或核心居中金句</span></p>`,
    },
    emphasis: {
      id: "edit-emp",
      label: "淡色下划线 + 轻边框条目卡 + 灰边旁注",
      instruction: "正文默认淡色下划线，白底微影条目卡与轻量圆点交替排版，保持整条冒号原文",
      template: `<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 20px;text-align:left;"><span leaf="">编辑风克制着色，日常重点用</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;"><span leaf="">浅色下划线</span></span><span leaf="">，最关键处偶尔用</span><strong style="color:__PRIMARY__;font-weight:700;"><span leaf="">主色加粗锚点</span></strong><span leaf="">。</span></p>
<section style="background-color:__TINT__;border-radius:0 10px 10px 0;border-left:4px solid __PRIMARY__;padding:15px 18px;margin:0 0 22px;">
  <p style="font-size:16px;font-weight:700;color:__DEEP__;margin:0;line-height:1.8;"><span leaf="">核心引用完整放进这里。</span></p>
</section>
<section style="background-color:#FFFFFF;border:1px solid __BORDER__;border-radius:10px;padding:12px 15px;box-shadow:0 3px 12px __SHADOW__;margin:0 0 10px;">
  <p style="font-size:16px;line-height:1.8;color:__INK__;margin:0;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">◆</span></span><span leaf="">重列表条目：冒号前后文字完整留在同一个段落内</span></p>
</section>
<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 12px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">•</span></span><span leaf="">轻列表条目：同样完整保留冒号及全部字符</span></p>`,
    },
    closer: {
      id: "edit-closer",
      label: "顶细线 END 签章收束条",
      instruction: "若原文已有署名或三连结尾则省略本条，避免叠双尾",
      template: `<section style="margin:30px 0 8px;padding:14px 0 0;border-top:1px solid __BORDER__;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
  <span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:10px;font-weight:800;padding:3px 9px;border-radius:4px;letter-spacing:1.5px;line-height:1.4;"><span leaf="">END</span></span>
  <p style="margin:0;font-size:13px;color:__MUTED__;line-height:1.6;"><span leaf="">感谢阅读，欢迎留言分享你的实践判断。</span></p>
</section>`,
    },
  },

  // 3. 纸感票据工坊家族（源自 moyu-ticket）
  {
    id: "ticket-craft",
    name: "纸感票据工坊",
    vibe: "0px 锐角边框、#FFFEF8 纸感底、2px 炭黑硬阴影与虚线撕票纹理",
    styles: ["magazine", "tech"],
    paletteIds: [
      "emerald-press",
      "terracotta-studio",
      "prussian-press",
      "carbon-press",
      "pine-terminal",
      "editorial-crimson",
    ],
    openers: [
      {
        id: "ticket-cover-stub",
        label: "双栏票据硬阴影封面",
        instruction: "2px #1A1A1A 边框与硬阴影 + 主色顶栏 + 右侧 NO.001 票根 + 虚线撕票底条",
        template: `<section style="background-color:#FFFEF8;border:2px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;margin:0 0 26px;">
  <section style="background-color:__PRIMARY__;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
    <p style="margin:0;color:#FFFEF8;font-size:11px;letter-spacing:2.5px;font-weight:700;line-height:1.4;"><span leaf="">ISSUE PASS</span></p>
    <p style="margin:0;color:#FFFEF8;font-size:11px;letter-spacing:2px;line-height:1.4;"><span leaf="">★★★★★</span></p>
  </section>
  <section style="display:flex;">
    <section style="flex:1;min-width:0;padding:18px 16px;border-right:2px dashed __BORDER__;">
      <p style="font-size:20px;font-weight:900;color:#1A1A1A;margin:0 0 6px;line-height:1.35;"><span leaf="">点题副视角短句</span></p>
      <p style="font-size:13px;color:__MUTED__;margin:0 0 12px;line-height:1.6;"><span leaf="">交代核心问题或对比焦点</span></p>
      <section style="background-color:__TINT__;border:1px solid __BORDER__;padding:10px 12px;">
        <p style="font-size:13px;color:__DEEP__;margin:0;line-height:1.65;"><span leaf="">摘要：用一句话告诉读者这篇值得带走什么。</span></p>
      </section>
    </section>
    <section style="width:52px;flex-shrink:0;padding:12px 4px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background-color:__TINT__;">
      <section style="text-align:center;">
        <p style="margin:0;font-size:9px;color:__MUTED__;line-height:1.3;"><span leaf="">NO.</span></p>
        <p style="margin:0;font-size:15px;font-weight:900;color:__PRIMARY__;line-height:1.2;"><span leaf="">001</span></p>
      </section>
      <section style="text-align:center;">
        <p style="margin:0;font-size:9px;color:__MUTED__;line-height:1.3;"><span leaf="">GRADE</span></p>
        <p style="margin:0;font-size:14px;font-weight:900;color:__PRIMARY__;line-height:1.2;"><span leaf="">S</span></p>
      </section>
    </section>
  </section>
  <section style="padding:8px 16px;border-top:2px dashed __BORDER__;display:flex;justify-content:space-between;align-items:center;">
    <p style="margin:0;font-size:10px;color:__MUTED__;letter-spacing:1px;line-height:1.4;"><span leaf="">VALID FOR ONE DEEP READ</span></p>
    <p style="margin:0;font-size:10px;color:__PRIMARY__;font-weight:700;line-height:1.4;"><span leaf="">ADMIT ONE</span></p>
  </section>
</section>`,
      },
      {
        id: "ticket-cover-archive",
        label: "硬框档案凭证开篇卡",
        instruction: "1.5px 实黑边 + 主色左竖带 + 编号档案号与实框摘要区",
        template: `<section style="background-color:#FFFEF8;border:2px solid #1A1A1A;border-left:6px solid __PRIMARY__;box-shadow:3px 3px 0 #1A1A1A;padding:18px 18px 16px;margin:0 0 26px;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:2px;color:__PRIMARY__;line-height:1.4;"><span leaf="">FILE #01 · 实战归档</span></p>
  <p style="margin:0 0 10px;font-size:20px;font-weight:900;color:#1A1A1A;line-height:1.4;"><span leaf="">把复杂做法收束为一张可对照复用的检查清单。</span></p>
  <p style="margin:0;font-size:13px;color:__MUTED__;line-height:1.65;"><span leaf="">核心议题 · 方法拆解 · 注意边界</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "ticket-sec-bar",
        label: "黑粗底线 + 锐角实色编号牌",
        instruction: "2px #1A1A1A 底线 + 锐角实色「01」标签 + <h3> 粗体标题",
        template: `<section style="margin:34px 0 20px;display:flex;align-items:center;gap:12px;padding:0 0 10px;border-bottom:2px solid #1A1A1A;flex-wrap:wrap;">
  <span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:12px;font-weight:800;padding:4px 10px;letter-spacing:1.5px;line-height:1.3;"><span leaf="">01</span></span>
  <h3 style="margin:0;font-size:18px;font-weight:800;color:#1A1A1A;line-height:1.35;"><span leaf="">章节标题</span></h3>
</section>`,
      },
      {
        id: "ticket-sec-box",
        label: "纸感浅底 + 粗黑竖边章节栏",
        instruction: "米白底 + 4px #1A1A1A 左竖条 + 锐角序号 + <h3> 标题，全部 0px 锐角",
        template: `<section style="margin:34px 0 20px;background-color:#FFFEF8;border:1px solid #1A1A1A;border-left:4px solid __PRIMARY__;padding:10px 14px;display:flex;align-items:center;gap:10px;">
  <span style="display:inline-block;background-color:#1A1A1A;color:#FFFFFF;font-size:11px;font-weight:800;padding:2px 8px;line-height:1.4;"><span leaf="">01</span></span>
  <h3 style="margin:0;font-size:18px;font-weight:800;color:#1A1A1A;line-height:1.35;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "ticket-rhythm",
      label: "纸感主标题 + 虚线导读票 + 竖条小节 + 凭证金句卡",
      instruction: "全程保持 0px 锐角与纸感边线，不混合圆角阴影",
      template: `<section style="margin:0 0 20px;padding:0 0 10px;border-bottom:1.5px dashed __BORDER__;">
  <h3 style="margin:0;font-size:21px;font-weight:900;color:#1A1A1A;line-height:1.4;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 24px;padding:14px 16px;background-color:#FFFEF8;border:1.5px dashed __PRIMARY__;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:__PRIMARY__;letter-spacing:1.5px;line-height:1.4;"><span leaf="">CHECKLIST · 导读</span></p>
  <p style="margin:0 0 5px;font-size:13px;color:#1A1A1A;line-height:1.6;"><span style="color:__PRIMARY__;font-weight:800;margin-right:6px;"><span leaf="">01</span></span><span leaf="">第一条关键看点</span></p>
  <p style="margin:0 0 5px;font-size:13px;color:#1A1A1A;line-height:1.6;"><span style="color:__PRIMARY__;font-weight:800;margin-right:6px;"><span leaf="">02</span></span><span leaf="">第二条关键看点</span></p>
  <p style="margin:0;font-size:13px;color:#1A1A1A;line-height:1.6;"><span style="color:__PRIMARY__;font-weight:800;margin-right:6px;"><span leaf="">03</span></span><span leaf="">第三条关键看点</span></p>
</section>
<h4 style="margin:24px 0 12px;font-size:16px;font-weight:800;color:#1A1A1A;padding-left:10px;border-left:4px solid __PRIMARY__;line-height:1.45;"><span leaf="">小节标题</span></h4>
<section style="background-color:#FFFEF8;border:2px solid #1A1A1A;box-shadow:3px 3px 0 __PRIMARY__;padding:14px 16px;margin:0 0 22px;">
  <p style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;line-height:1.75;"><span leaf="">关键一句核心金句</span></p>
</section>`,
    },
    emphasis: {
      id: "ticket-emp",
      label: "纸感高亮 + 虚线引语框 + 锐角双列表",
      instruction: "方正纸感边框与锐角编号条，整条清单含冒号保留在同一 <p> 内",
      template: `<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 20px;text-align:left;"><span leaf="">正文用</span><span style="background-color:__TINT__;padding:1px 5px;font-weight:700;color:__DEEP__;"><span leaf="">浅底硬高亮</span></span><span leaf="">或</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;"><span leaf="">下划线短语</span></span><span leaf="">突出重点。</span></p>
<section style="background-color:__TINT__;border:1px dashed __PRIMARY__;padding:14px 16px;margin:0 0 20px;">
  <p style="font-size:16px;color:__DEEP__;margin:0;line-height:1.8;"><span leaf="">原文引用块内容完整置于此虚线框内。</span></p>
</section>
<section style="background-color:#FFFEF8;border:1.5px solid #1A1A1A;padding:12px 14px;margin:0 0 10px;">
  <p style="font-size:16px;line-height:1.8;color:#1A1A1A;margin:0;"><span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:11px;font-weight:800;padding:1px 6px;margin-right:8px;line-height:1.4;"><span leaf="">01</span></span><span leaf="">清单重条目：冒号前后文字完整留在同一个段落内</span></p>
</section>
<p style="font-size:16px;line-height:1.8;color:#1A1A1A;margin:0 0 12px;padding-left:4px;"><span style="color:__PRIMARY__;font-weight:900;margin-right:8px;"><span leaf="">▪</span></span><span leaf="">清单轻条目：保留完整原文及冒号</span></p>`,
    },
    closer: {
      id: "ticket-closer",
      label: "虚线票尾收束卡",
      instruction: "原文已有作者收尾则省略本条",
      template: `<section style="margin:28px 0 8px;padding:12px 16px;background-color:#FFFEF8;border-top:2px dashed #1A1A1A;border-bottom:2px solid #1A1A1A;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
  <p style="margin:0;font-size:12px;font-weight:800;color:__PRIMARY__;letter-spacing:1.5px;line-height:1.5;"><span leaf="">TICKET STAMP · 完结存根</span></p>
  <p style="margin:0;font-size:13px;color:__INK__;line-height:1.6;"><span leaf="">觉得实用欢迎转发留存</span></p>
</section>`,
    },
  },

  // 4. 现代清爽科技家族（源自 forward-step）
  {
    id: "forward-step",
    name: "现代清爽科技",
    vibe: "温润一体浅底、暖金 #CEB589 极细短条、理性分步卡片与高对比清晰可读",
    styles: ["tech", "minimal"],
    paletteIds: [
      "forward-blue",
      "iris-flash",
      "pine-terminal",
      "carbon-press",
      "slate-mist",
    ],
    openers: [
      {
        id: "fwd-cover-card",
        label: "一体浅底暖金线判断卡",
        instruction: "18px 浅底卡 + 28px 暖金 #CEB589 细条 + 主色核心判断 + 细顶线导语",
        template: `<section style="margin:0 0 26px;border-radius:18px;border:1px solid __BORDER__;background-color:__TINT__;padding:22px 20px 18px;box-shadow:0 5px 18px __SHADOW__;">
  <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:__MUTED__;line-height:1.6;margin:0 0 14px;"><span leaf="">TECH BRIEF · 本期导读</span></p>
  <p style="font-size:21px;font-weight:800;line-height:1.55;color:__DEEP__;margin:0;"><span leaf="">先拆穿表面热词，</span><br><span leaf="">聚焦真正影响工程体验的那层约束。</span></p>
  <section style="width:28px;height:2px;background-color:#CEB589;margin:16px 0 14px;overflow:hidden;"><span leaf=""><br></span></section>
  <p style="font-size:19px;font-weight:800;line-height:1.55;color:__PRIMARY__;margin:0;"><span leaf="">提炼一句全文核心结论</span></p>
  <section style="margin:16px 0 0;padding:12px 0 0;border-top:1px solid __BORDER__;">
    <p style="font-size:12px;color:__MUTED__;line-height:1.7;margin:0;"><span leaf="">清晰列出本文方法与实践边界。</span></p>
  </section>
</section>`,
      },
      {
        id: "fwd-cover-steps",
        label: "错位方片双色科技摘要卡",
        instruction: "白底 16px 圆角卡片 + 双错位小色块标识 + 理性摘要与关键标签",
        template: `<section style="margin:0 0 26px;border-radius:16px;border:1px solid __BORDER__;background-color:#FFFFFF;padding:22px 20px;box-shadow:0 4px 16px __SHADOW__;">
  <section style="display:flex;align-items:center;gap:8px;margin:0 0 14px;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background-color:__PRIMARY__;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:3px;border:1.5px solid __PRIMARY__;box-sizing:border-box;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:__PRIMARY__;line-height:1.4;"><span leaf="">ENGINEERING NOTE</span></span>
  </section>
  <p style="font-size:20px;font-weight:800;color:__DEEP__;margin:0 0 10px;line-height:1.5;"><span leaf="">一句话先给结论：先把确定性留在底层，再谈上层灵活性。</span></p>
  <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.7;"><span leaf="">实操指南 · 边界清单 · 可复用模式</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "fwd-sec-pill",
        label: "浅底胶囊标签 + 阶梯粗标题",
        instruction: "浅底圆角「01 / 章节短签（随每章具体含义现写）」 + 20px <h3> 粗体标题",
        template: `<section style="margin:34px 0 18px;">
  <p style="margin:0 0 8px;line-height:1.4;">
    <span style="display:inline-block;font-size:11px;line-height:1.6;font-weight:700;color:__PRIMARY__;background-color:__TINT__;border-radius:6px;padding:3px 10px;"><span leaf="">01 / 本章主题短签</span></span>
  </p>
  <h3 style="font-size:20px;font-weight:800;line-height:1.45;color:__DEEP__;margin:0;"><span leaf="">章节标题</span></h3>
</section>`,
      },
      {
        id: "fwd-sec-bar",
        label: "左粗主色条 + 清爽序号分节",
        instruction: "4px 主色左竖条 + 小序号 + 19px <h3> 标题，左对齐利落干净",
        template: `<section style="margin:34px 0 18px;padding-left:12px;border-left:4px solid __PRIMARY__;">
  <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:__PRIMARY__;letter-spacing:1px;line-height:1.4;"><span leaf="">01</span></p>
  <h3 style="margin:0;font-size:19px;font-weight:800;color:__DEEP__;line-height:1.45;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "fwd-rhythm",
      label: "清晰主标题 + 一体浅底导读 + 简洁小节 + 主张卡",
      instruction: "全家族统一 14px/16px 温润圆角，绝不混用硬直角或虚线框",
      template: `<section style="margin:0 0 20px;padding:0 0 10px;border-bottom:1px solid __BORDER__;">
  <h3 style="margin:0;font-size:21px;font-weight:800;color:__DEEP__;line-height:1.45;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 24px;padding:16px 18px;background-color:__TINT__;border-radius:14px;">
  <p style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:__MUTED__;margin:0 0 10px;line-height:1.5;"><span leaf="">这一篇，重点看这 3 件事</span></p>
  <p style="font-size:13px;line-height:1.75;color:__INK__;margin:0 0 6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">01</span></span><span leaf="">看点一</span></p>
  <p style="font-size:13px;line-height:1.75;color:__INK__;margin:0 0 6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">02</span></span><span leaf="">看点二</span></p>
  <p style="font-size:13px;line-height:1.75;color:__INK__;margin:0;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">03</span></span><span leaf="">看点三</span></p>
</section>
<h4 style="font-size:17px;font-weight:700;color:__DEEP__;margin:24px 0 12px;line-height:1.5;"><span leaf="">小节标题</span></h4>
<section style="margin:0 0 22px;padding:16px 18px;background-color:__TINT__;border-radius:14px;">
  <p style="font-size:11px;line-height:1.5;color:__PRIMARY__;font-weight:700;margin:0 0 6px;"><span leaf="">把这句留下</span></p>
  <p style="font-size:16px;line-height:1.8;font-weight:700;color:__DEEP__;margin:0;"><span leaf="">关键判断或高张力金句</span></p>
</section>`,
    },
    emphasis: {
      id: "fwd-emp",
      label: "暖黄粗底线 + 浅底胶囊列表 + 清爽圆点列表",
      instruction: "暖色高亮底线与低饱和下划线配合，轻重列表交替保持呼吸感",
      template: `<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 20px;text-align:left;"><span leaf="">正文先用</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;"><span leaf="">轻量关键词下划线</span></span><span leaf="">标记重点，关键转折用</span><span style="border-bottom:3px solid __HIGHLIGHT__;font-weight:600;color:__DEEP__;"><span leaf="">暖色粗底线短语</span></span><span leaf="">或</span><span style="background-color:#F1F5F9;color:__DEEP__;padding:1px 6px;border-radius:4px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:14px;"><span leaf="">inlineCode()</span></span><span leaf="">。</span></p>
<section style="margin:0 0 22px;padding:15px 18px;background-color:#FFFFFF;border:1px solid __BORDER__;border-radius:14px;">
  <p style="margin:0;font-size:16px;line-height:1.8;color:__DEEP__;font-weight:600;"><span leaf="">原文引用段落内容完整置入此处。</span></p>
</section>
<section style="margin:0 0 10px;padding:12px 15px;background-color:__TINT__;border-radius:10px;">
  <p style="font-size:16px;line-height:1.8;color:__INK__;margin:0;"><span style="display:inline-block;font-size:11px;line-height:1.5;font-weight:700;color:#FFFFFF;background-color:__PRIMARY__;border-radius:5px;padding:1px 8px;margin-right:8px;"><span leaf="">01</span></span><span leaf="">分步或要点重卡：完整保留冒号及全部字符</span></p>
</section>
<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 12px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">•</span></span><span leaf="">轻量条目：同样完整保留冒号及全部字符</span></p>`,
    },
    closer: {
      id: "fwd-closer",
      label: "清爽浅底圆角收束卡",
      instruction: "若原文结尾已有作者收尾或三连提示，则省略本尾卡",
      template: `<section style="margin:28px 0 8px;padding:16px 18px;background-color:__TINT__;border-radius:14px;">
  <p style="margin:0;font-size:13px;color:__DEEP__;line-height:1.7;font-weight:600;"><span leaf="">以上为本篇梳理的全部要点，欢迎按需收藏参考或留言交流。</span></p>
</section>`,
    },
  },

  // 5. 东方留白禅意家族（源自 zen-whitespace）
  {
    id: "zen-whitespace",
    name: "东方留白禅意",
    vibe: "纯白极简几乎无色块、衬线大字题头、1px 细线秩序与 24px 呼吸段距",
    styles: ["minimal"],
    paletteIds: ["zen-moss", "ink-stone", "slate-mist", "carbon-press"],
    openers: [
      {
        id: "zen-cover-lines",
        label: "上下 1px 细线衬线引言",
        instruction: "纯白无色块，上下 1px #E5E7EB 细线 + 居中衬线字体开篇判断句",
        template: `<section style="margin:12px 0 32px;padding:28px 16px;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;text-align:center;background-color:#FFFFFF;">
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;color:__INK__;margin:0 0 16px;line-height:1.8;letter-spacing:0.5px;"><span leaf="">真正持久的力量，总来自对边界的克制与清醒。</span></p>
  <p style="font-size:12px;color:__MUTED__;margin:0;letter-spacing:1.5px;line-height:1.5;"><span leaf="">ESSAY · 随笔与观察</span></p>
</section>`,
      },
      {
        id: "zen-cover-epigraph",
        label: "极细竖线留白题记",
        instruction: "仅一条 2px 细竖线搭配衬线短判语与极小眉标，彻底零干扰开篇",
        template: `<section style="margin:12px 0 32px;padding:6px 0 6px 16px;border-left:2px solid __PRIMARY__;">
  <p style="font-size:11px;color:__PRIMARY__;font-weight:700;letter-spacing:2px;margin:0 0 10px;line-height:1.5;"><span leaf="">PROLOGUE · 引子</span></p>
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;color:__INK__;margin:0;line-height:1.8;"><span leaf="">退后一步看清楚结构，许多难题便自行消解。</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "zen-sec-serif",
        label: "大字距眉标 + 衬线短线标题",
        instruction: "主色大字距「01 · 英文短词」 + 21px 衬线 <h3> + 40px×2px 短色线",
        template: `<section style="margin:40px 0 22px;">
  <p style="font-size:10px;color:__PRIMARY__;font-weight:700;letter-spacing:3px;margin:0 0 8px;line-height:1.5;"><span leaf="">01 · 本章短签</span></p>
  <h3 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:__INK__;margin:0 0 12px;line-height:1.45;"><span leaf="">章节标题</span></h3>
  <section style="width:40px;height:2px;background-color:__PRIMARY__;overflow:hidden;"><span leaf=""><br></span></section>
</section>`,
      },
      {
        id: "zen-sec-hairline",
        label: "细线分隔 + 沉静序号衬线标题",
        instruction: "全宽 1px 浅细分隔线开启新章，配低调主色序号与 21px 衬线 <h3>",
        template: `<section style="margin:40px 0 22px;padding:24px 0 0;border-top:1px solid #E5E7EB;">
  <p style="font-size:11px;color:__MUTED__;font-weight:600;letter-spacing:2px;margin:0 0 6px;line-height:1.4;"><span leaf="">01</span></p>
  <h3 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:__INK__;margin:0;line-height:1.45;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "zen-rhythm",
      label: "衬线主标题 + 无色块三列细线脉络 + 衬线小节 + 细线金句",
      instruction: "严格保持无大色块、无满屏圆角胶囊的克制禅意语言",
      template: `<section style="margin:0 0 26px;">
  <h3 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:__INK__;margin:0;line-height:1.5;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 32px;">
  <p style="font-size:11px;color:__MUTED__;margin:0 0 12px;letter-spacing:2px;line-height:1.5;"><span leaf="">本文脉络</span></p>
  <section style="display:flex;gap:12px;border-top:1px solid #E5E7EB;">
    <section style="flex:1;min-width:0;box-sizing:border-box;padding:12px 4px 12px 0;border-bottom:1px solid #E5E7EB;">
      <p style="font-size:10px;color:__PRIMARY__;font-weight:700;margin:0 0 4px;line-height:1.4;"><span leaf="">01</span></p>
      <p style="font-size:12px;color:__INK__;margin:0;line-height:1.5;"><span leaf="">要点一</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;padding:12px 4px 12px 0;border-bottom:1px solid #E5E7EB;">
      <p style="font-size:10px;color:__PRIMARY__;font-weight:700;margin:0 0 4px;line-height:1.4;"><span leaf="">02</span></p>
      <p style="font-size:12px;color:__INK__;margin:0;line-height:1.5;"><span leaf="">要点二</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;padding:12px 0;border-bottom:1px solid #E5E7EB;">
      <p style="font-size:10px;color:__PRIMARY__;font-weight:700;margin:0 0 4px;line-height:1.4;"><span leaf="">03</span></p>
      <p style="font-size:12px;color:__INK__;margin:0;line-height:1.5;"><span leaf="">要点三</span></p>
    </section>
  </section>
</section>
<h4 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:__DEEP__;margin:28px 0 14px;line-height:1.5;"><span leaf="">小节标题</span></h4>
<section style="margin:24px 0;padding:16px 10px;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;text-align:center;">
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:17px;font-weight:600;color:__DEEP__;margin:0;line-height:1.75;"><span leaf="">克制凝练的全篇核心金句</span></p>
</section>`,
    },
    emphasis: {
      id: "zen-emp",
      label: "1.5px 低饱和下划线 + 纯白左竖线引语 + 极细底线清单",
      instruction: "绝不使用鲜艳高亮块或厚重卡片套列表；每条清单完整留在一个 <p> 内",
      template: `<p style="font-size:16px;line-height:1.85;color:__INK__;margin:0 0 24px;text-align:left;"><span leaf="">克制的留白让重点自然浮现，每段只挑选关键一句用</span><span style="border-bottom:1.5px solid __ACCENT__;font-weight:600;color:__DEEP__;"><span leaf="">浅色细下划线</span></span><span leaf="">点出，少量短语使用</span><strong style="color:__DEEP__;font-weight:700;"><span leaf="">深色加粗</span></strong><span leaf="">。</span></p>
<section style="margin:4px 0 24px;padding:4px 0 4px 16px;border-left:2px solid __PRIMARY__;">
  <p style="font-size:16px;line-height:1.85;color:__DEEP__;margin:0;"><span leaf="">引用内容保持纯白透亮，靠左竖线建立稳重秩序。</span></p>
</section>
<section style="margin:0 0 10px;padding:0 0 10px;border-bottom:1px solid #E5E7EB;">
  <p style="font-size:16px;line-height:1.85;color:__INK__;margin:0;"><span style="color:__PRIMARY__;font-weight:700;margin-right:8px;"><span leaf="">—</span></span><span leaf="">清单条目：冒号及前后文字全部保留在同一个段落内</span></p>
</section>
<p style="font-size:16px;line-height:1.85;color:__INK__;margin:0 0 14px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:700;margin-right:8px;"><span leaf="">·</span></span><span leaf="">极轻条目：同样保持完整原文与标点</span></p>`,
    },
    closer: {
      id: "zen-closer",
      label: "居中 40px 极细短线尾注",
      instruction: "若原文结尾已有署名与三连段落，则仅保留细线或省略本段",
      template: `<section style="margin:36px 0 8px;text-align:center;">
  <section style="width:40px;height:1px;background-color:__ACCENT__;margin:0 auto 14px;overflow:hidden;"><span leaf=""><br></span></section>
  <p style="margin:0;font-size:13px;color:__MUTED__;line-height:1.7;letter-spacing:0.5px;"><span leaf="">感谢读到这里，愿这篇文字带来几分钟清醒的专注。</span></p>
</section>`,
    },
  },

  // 6. 内刊档案手记家族（源自 olive-journal）
  {
    id: "olive-chronicle",
    name: "内刊档案手记",
    vibe: "6px 利落内刊小圆角、纸感浅框、醒目下划线与墨黑收口摘要条",
    styles: ["tech", "magazine"],
    paletteIds: [
      "olive-archive",
      "carbon-press",
      "prussian-press",
      "pine-terminal",
      "terracotta-studio",
    ],
    openers: [
      {
        id: "olive-cover-hero",
        label: "内刊纸感头图与墨黑底条",
        instruction: "6px 细边框内刊卡 + 双短色条分隔 + 底部墨黑 #1E1F23 收口摘要带",
        template: `<section style="margin:0 0 26px;background-color:__SURFACE__;border:1px solid __BORDER__;border-radius:6px;overflow:hidden;">
  <section style="padding:22px 20px 18px;">
    <section style="display:flex;align-items:center;gap:8px;margin:0 0 16px;">
      <span style="display:inline-block;width:7px;height:7px;background-color:#1E1F23;border-radius:50%;overflow:hidden;"><span leaf=""><br></span></span>
      <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:__MUTED__;line-height:1.4;"><span leaf="">JOURNAL · 内部档案</span></span>
      <section style="flex:1;height:1px;background-color:__BORDER__;overflow:hidden;"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:__MUTED__;font-weight:600;line-height:1.4;"><span leaf="">ISSUE 01</span></span>
    </section>
    <p style="font-size:21px;font-weight:800;color:__DEEP__;margin:0 0 12px;line-height:1.35;"><span leaf="">用清晰框架拆解一线实战细节</span></p>
    <section style="display:flex;align-items:center;gap:4px;margin:0 0 12px;">
      <section style="width:22px;height:3px;background-color:#1E1F23;border-radius:2px;overflow:hidden;"><span leaf=""><br></span></section>
      <section style="width:8px;height:3px;background-color:__ACCENT__;border-radius:2px;overflow:hidden;"><span leaf=""><br></span></section>
    </section>
    <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.65;"><span leaf="">理性观察 · 结构归纳 · 可落地校验规则</span></p>
  </section>
  <section style="background-color:#1E1F23;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
    <p style="font-size:12px;color:#FFFFFF;margin:0;font-weight:600;line-height:1.5;"><span leaf="">本期摘要归档</span></p>
    <span style="background-color:__TINT__;color:__DEEP__;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;line-height:1.4;"><span leaf="">手记整理</span></span>
  </section>
</section>`,
      },
      {
        id: "olive-cover-strip",
        label: "橄榄浅底内刊期号框",
        instruction: "浅底 6px 圆角卡片 + 顶边细条期号行 + 克制正文视角摘要",
        template: `<section style="margin:0 0 26px;background-color:__TINT__;border:1px solid __BORDER__;border-radius:6px;padding:18px 20px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin:0 0 12px;padding:0 0 8px;border-bottom:1px solid __BORDER__;">
    <span style="font-size:10px;font-weight:800;letter-spacing:2.5px;color:__DEEP__;line-height:1.4;"><span leaf="">FIELD NOTES</span></span>
    <span style="font-size:10px;color:__MUTED__;font-weight:600;line-height:1.4;"><span leaf="">ARCHIVE</span></span>
  </section>
  <p style="font-size:19px;font-weight:800;color:__DEEP__;margin:0 0 8px;line-height:1.45;"><span leaf="">先对齐真实上下文边界，再讨论自动化执行。</span></p>
  <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.65;"><span leaf="">本篇系统梳理实践过程中的问题、判断与复盘。</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "olive-sec-part",
        label: "手记竖线编号章节",
        instruction: "左侧 24px 粗编号 + PART 微标 + 1px 细竖线 + 右侧 <h3> 粗体标题",
        template: `<section style="margin:34px 0 18px;">
  <section style="display:flex;align-items:center;gap:12px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:24px;font-weight:800;color:__PRIMARY__;line-height:1;"><span leaf="">01</span></p>
      <p style="margin:2px 0 0;font-size:9px;font-weight:700;color:__MUTED__;letter-spacing:1.5px;line-height:1.2;"><span leaf="">PART</span></p>
    </section>
    <span style="display:inline-block;width:1px;height:32px;background-color:__BORDER__;flex-shrink:0;overflow:hidden;"><span leaf=""><br></span></span>
    <h3 style="margin:0;font-size:18px;font-weight:800;color:__DEEP__;line-height:1.35;"><span leaf="">章节标题</span></h3>
  </section>
</section>`,
      },
      {
        id: "olive-sec-strip",
        label: "浅底小圆角内刊章节条",
        instruction: "浅底 6px 圆角条 + 主色粗前导序号 + <h3> 标题，左右齐整",
        template: `<section style="margin:34px 0 18px;background-color:__TINT__;border:1px solid __BORDER__;border-radius:6px;padding:10px 14px;display:flex;align-items:center;gap:10px;">
  <span style="font-size:12px;font-weight:800;color:__PRIMARY__;letter-spacing:1px;line-height:1.4;"><span leaf="">01 ·</span></span>
  <h3 style="margin:0;font-size:17px;font-weight:800;color:__DEEP__;line-height:1.35;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "olive-rhythm",
      label: "内刊主标题 + 档案三点导读 + 小圆角小节 + 重点判断框",
      instruction: "全程保持 6px 小圆角与纸感边框，少阴影、重清晰",
      template: `<section style="margin:0 0 20px;padding:0 0 10px;border-bottom:1.5px solid __BORDER__;">
  <h3 style="margin:0;font-size:21px;font-weight:800;color:__DEEP__;line-height:1.4;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 24px;background-color:__TINT__;border:1px solid __BORDER__;border-radius:6px;padding:14px 16px;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:__PRIMARY__;letter-spacing:1.5px;line-height:1.4;"><span leaf="">摘要索引 · 导读</span></p>
  <p style="margin:0 0 5px;font-size:13px;color:__INK__;line-height:1.65;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">01</span></span><span leaf="">看点一</span></p>
  <p style="margin:0 0 5px;font-size:13px;color:__INK__;line-height:1.65;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">02</span></span><span leaf="">看点二</span></p>
  <p style="margin:0;font-size:13px;color:__INK__;line-height:1.65;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">03</span></span><span leaf="">看点三</span></p>
</section>
<h4 style="margin:24px 0 12px;font-size:16px;font-weight:800;color:__DEEP__;padding:4px 0 4px 10px;border-left:3px solid __ACCENT__;line-height:1.45;"><span leaf="">小节标题</span></h4>
<section style="background-color:#FFFFFF;border:1px solid __BORDER__;border-top:3px solid #1E1F23;border-radius:6px;padding:14px 16px;margin:0 0 22px;">
  <p style="margin:0;font-size:16px;font-weight:700;color:__DEEP__;line-height:1.75;"><span leaf="">全篇关键论断或总结性一句判断</span></p>
</section>`,
    },
    emphasis: {
      id: "olive-emp",
      label: "点缀橙下划线 + 内刊边框引语 + 6px 双列表",
      instruction: "正文关键短语用点缀色下划线，轻重列表交替保持整条含冒号在单一 <p>",
      template: `<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 20px;text-align:left;"><span leaf="">手记风格结构分明，</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;color:__DEEP__;"><span leaf="">核心关键词下划线</span></span><span leaf="">清晰抓眼，配合</span><strong style="color:__PRIMARY__;font-weight:700;"><span leaf="">主色加粗</span></strong><span leaf="">建立逻辑层次。</span></p>
<section style="background-color:__TINT__;border-left:3px solid __PRIMARY__;border-radius:0 6px 6px 0;padding:14px 16px;margin:0 0 20px;">
  <p style="font-size:16px;color:__DEEP__;margin:0;line-height:1.8;"><span leaf="">原文引用段完整置于此处，不增删改字。</span></p>
</section>
<section style="background-color:__TINT__;border:1px solid __BORDER__;border-radius:6px;padding:12px 14px;margin:0 0 10px;">
  <p style="font-size:16px;line-height:1.8;color:__INK__;margin:0;"><span style="display:inline-block;background-color:#1E1F23;color:#FFFFFF;font-size:11px;font-weight:700;padding:1px 7px;border-radius:4px;margin-right:8px;line-height:1.4;"><span leaf="">01</span></span><span leaf="">重要清单条目：完整保留冒号前后内容</span></p>
</section>
<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 12px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">▸</span></span><span leaf="">轻量清单条目：完整保留原文及冒号</span></p>`,
    },
    closer: {
      id: "olive-closer",
      label: "墨黑内刊档案收尾条",
      instruction: "若原文结尾已有作者介绍或三连提示，则省略本条",
      template: `<section style="margin:28px 0 8px;padding:12px 16px;background-color:#1E1F23;border-radius:6px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
  <p style="margin:0;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:1.5px;line-height:1.4;"><span leaf="">END OF FILE</span></p>
  <p style="margin:0;font-size:12px;color:#D1D5DB;line-height:1.5;"><span leaf="">感谢阅读，欢迎转发给需要这份参考的朋友</span></p>
</section>`,
    },
  },

  // 7. 复古报刊专栏家族
  {
    id: "paper-gazette",
    name: "复古报刊专栏",
    vibe: "经典双横线报头、衬线专栏标题、零圆角理性分栏与报纸排印节奏",
    styles: ["magazine", "minimal"],
    paletteIds: [
      "gazette-ink",
      "editorial-crimson",
      "prussian-press",
      "berry-edition",
      "ink-stone",
    ],
    openers: [
      {
        id: "gazette-cover-masthead",
        label: "报刊双横线专栏报头",
        instruction: "顶部 3px 粗线 + 刊期栏 + 1px 细线 + 居中衬线主旨句 + 细底线",
        template: `<section style="margin:0 0 28px;border-top:3px solid __DEEP__;border-bottom:1px solid __DEEP__;padding:14px 4px 18px;background-color:__SURFACE__;">
  <section style="display:flex;justify-content:space-between;align-items:center;padding:0 0 10px;border-bottom:1px solid __BORDER__;margin:0 0 16px;">
    <span style="font-size:10px;font-weight:800;letter-spacing:2.5px;color:__PRIMARY__;line-height:1.4;"><span leaf="">COLUMN · 深度专栏</span></span>
    <span style="font-size:10px;color:__MUTED__;font-weight:600;line-height:1.4;"><span leaf="">EDITION 2026</span></span>
  </section>
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:__DEEP__;margin:0 0 10px;line-height:1.55;text-align:center;"><span leaf="">从喧嚣表象里抽丝剥茧，还原问题本身的真实切面。</span></p>
  <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.65;text-align:center;"><span leaf="">专栏编者按 · 一线思考 · 结构沉淀</span></p>
</section>`,
      },
      {
        id: "gazette-cover-column",
        label: "双竖线报刊编者按",
        instruction: "左双色竖线 + 浅灰底报刊窄条 + 衬线核心导言",
        template: `<section style="margin:0 0 28px;padding:16px 18px;background-color:__TINT__;border-left:4px solid __PRIMARY__;border-top:1px solid __BORDER__;border-bottom:1px solid __BORDER__;">
  <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:2px;color:__ACCENT__;line-height:1.4;"><span leaf="">EDITORIAL VIEW</span></p>
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:__DEEP__;margin:0;line-height:1.7;"><span leaf="">当工具越容易获得，决定成品水准的反而是结构判断力。</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "gazette-sec-rule",
        label: "报头粗顶线 + 衬线专栏标题",
        instruction: "2px 顶线 + 实色小编号 + 19px 衬线 <h3> 标题 + 1px 底线",
        template: `<section style="margin:36px 0 20px;border-top:2px solid __DEEP__;border-bottom:1px solid __BORDER__;padding:12px 0;">
  <section style="display:flex;align-items:baseline;gap:10px;">
    <span style="font-size:12px;font-weight:800;color:__PRIMARY__;letter-spacing:1.5px;line-height:1.4;"><span leaf="">NO.01</span></span>
    <h3 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;margin:0;font-size:19px;font-weight:700;color:__DEEP__;line-height:1.4;"><span leaf="">章节标题</span></h3>
  </section>
</section>`,
      },
      {
        id: "gazette-sec-tag",
        label: "实色小方章 + 衬线分隔标题",
        instruction: "锐角小实色方章「01」 + 衬线 <h3> + 底部细线",
        template: `<section style="margin:36px 0 20px;padding:0 0 10px;border-bottom:1px solid __BORDER__;display:flex;align-items:center;gap:12px;">
  <span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:12px;font-weight:800;padding:3px 9px;line-height:1.3;"><span leaf="">01</span></span>
  <h3 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;margin:0;font-size:19px;font-weight:700;color:__DEEP__;line-height:1.4;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "gazette-rhythm",
      label: "报刊主标题 + 三栏细线导读 + 衬线小节 + 双线金句",
      instruction: "坚持报刊零圆角排印秩序，用双横线与衬线体拉出书卷质感",
      template: `<section style="margin:0 0 22px;padding:0 0 12px;border-bottom:1.5px solid __DEEP__;">
  <h3 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;margin:0;font-size:22px;font-weight:700;color:__DEEP__;line-height:1.45;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 26px;">
  <p style="font-size:11px;font-weight:800;letter-spacing:2px;color:__MUTED__;margin:0 0 10px;line-height:1.4;"><span leaf="">专栏导读</span></p>
  <section style="display:flex;gap:10px;border-top:1px solid __DEEP__;border-bottom:1px solid __BORDER__;">
    <section style="flex:1;min-width:0;box-sizing:border-box;padding:10px 6px 10px 0;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:__PRIMARY__;line-height:1.4;"><span leaf="">01</span></p>
      <p style="margin:0;font-size:12px;color:__DEEP__;font-weight:600;line-height:1.45;"><span leaf="">重点一</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;padding:10px 6px;border-left:1px solid __BORDER__;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:__PRIMARY__;line-height:1.4;"><span leaf="">02</span></p>
      <p style="margin:0;font-size:12px;color:__DEEP__;font-weight:600;line-height:1.45;"><span leaf="">重点二</span></p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;padding:10px 0 10px 6px;border-left:1px solid __BORDER__;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:__PRIMARY__;line-height:1.4;"><span leaf="">03</span></p>
      <p style="margin:0;font-size:12px;color:__DEEP__;font-weight:600;line-height:1.45;"><span leaf="">重点三</span></p>
    </section>
  </section>
</section>
<h4 style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;margin:26px 0 12px;font-size:17px;font-weight:700;color:__DEEP__;line-height:1.5;"><span leaf="">小节标题</span></h4>
<section style="margin:22px 0;padding:14px 12px;border-top:2px solid __BORDER__;border-bottom:2px solid __BORDER__;background-color:__TINT__;text-align:center;">
  <p style="font-family:'Noto Serif SC',Georgia,'Times New Roman',serif;margin:0;font-size:16px;font-weight:700;color:__DEEP__;line-height:1.75;"><span leaf="">专栏核心一句话判断</span></p>
</section>`,
    },
    emphasis: {
      id: "gazette-emp",
      label: "沉稳细下划线 + 报刊窄边引语 + 零圆角双列表",
      instruction: "正文沉稳克制，轻重列表保持零圆角与完整冒号原文",
      template: `<p style="font-size:16px;line-height:1.85;color:__INK__;margin:0 0 22px;text-align:left;"><span leaf="">报刊排印重在节制，关键观点配</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;color:__DEEP__;"><span leaf="">细下划线</span></span><span leaf="">与</span><strong style="color:__DEEP__;font-weight:700;"><span leaf="">粗体强调</span></strong><span leaf="">即可读性极高。</span></p>
<section style="background-color:__TINT__;border-left:3px solid __DEEP__;padding:14px 18px;margin:0 0 22px;">
  <p style="font-size:16px;line-height:1.8;color:__DEEP__;margin:0;"><span leaf="">原文引用完整放进此处。</span></p>
</section>
<section style="background-color:__TINT__;border:1px solid __BORDER__;padding:12px 15px;margin:0 0 10px;">
  <p style="font-size:16px;line-height:1.8;color:__INK__;margin:0;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">01</span></span><span leaf="">重要条目：完整保留冒号前后全部文字</span></p>
</section>
<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 12px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">•</span></span><span leaf="">轻条目：同样完整保留原文及冒号</span></p>`,
    },
    closer: {
      id: "gazette-closer",
      label: "报刊栏尾双细线收束",
      instruction: "若原文已有作者简介或三连结尾则省略本段",
      template: `<section style="margin:30px 0 8px;padding:12px 0;border-top:2px solid __DEEP__;border-bottom:1px solid __BORDER__;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;color:__PRIMARY__;line-height:1.4;"><span leaf="">专栏完</span></p>
  <p style="margin:0;font-size:13px;color:__MUTED__;line-height:1.6;"><span leaf="">欢迎在评论区留下你的观点</span></p>
</section>`,
    },
  },

  // 8. 温暖手账笔记家族
  {
    id: "warm-atelier",
    name: "温暖手账笔记",
    vibe: "奶油纸感底、14px 柔和圆角、细腻虚线分隔与温和亲切的复盘笔调",
    styles: ["minimal", "magazine"],
    paletteIds: [
      "warm-latte",
      "terracotta-studio",
      "emerald-press",
      "zen-moss",
      "ink-stone",
    ],
    openers: [
      {
        id: "warm-cover-note",
        label: "奶油手账虚线笔记卡",
        instruction: "暖白圆角卡 + 主色日期小胶囊 + 温和导语 + 虚线底部关键词条",
        template: `<section style="margin:0 0 26px;background-color:__SURFACE__;border:1.5px solid __BORDER__;border-radius:16px;padding:22px 20px;box-shadow:0 4px 18px __SHADOW__;">
  <p style="margin:0 0 12px;line-height:1.4;">
    <span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:1.5px;"><span leaf="">NOTE · 手账复盘</span></span>
  </p>
  <p style="font-size:20px;font-weight:800;color:__DEEP__;margin:0 0 12px;line-height:1.5;"><span leaf="">把做过的事沉淀下来，给下一个周期留一张好地图。</span></p>
  <section style="padding:12px 0 0;border-top:1px dashed __BORDER__;">
    <p style="font-size:13px;color:__MUTED__;margin:0;line-height:1.65;"><span leaf="">写给同样在打磨细节的同行 · 不复制外标题</span></p>
  </section>
</section>`,
      },
      {
        id: "warm-cover-margin",
        label: "暖底左竖条随手记卡",
        instruction: "暖杏浅底 14px 圆角 + 3px 左竖条 + 亲切的一句话开场引语",
        template: `<section style="margin:0 0 26px;background-color:__TINT__;border:1px solid __BORDER__;border-left:4px solid __PRIMARY__;border-radius:12px;padding:20px;">
  <p style="font-size:11px;font-weight:700;color:__PRIMARY__;letter-spacing:1.5px;margin:0 0 8px;line-height:1.4;"><span leaf="">今日笔记</span></p>
  <p style="font-size:18px;font-weight:800;color:__DEEP__;margin:0;line-height:1.65;"><span leaf="">真正的好方法，都是在真实踩坑后一点点磨出来的。</span></p>
</section>`,
      },
    ],
    sectionHeaders: [
      {
        id: "warm-sec-pill",
        label: "暖浅底编号胶囊章节",
        instruction: "浅底圆角「01」标 + 右侧 18px <h3> 粗体标题 + 柔和下分隔",
        template: `<section style="margin:34px 0 18px;padding:0 0 10px;border-bottom:1px dashed __BORDER__;display:flex;align-items:center;gap:10px;">
  <span style="display:inline-block;background-color:__TINT__;border:1px solid __BORDER__;color:__PRIMARY__;font-size:12px;font-weight:800;padding:2px 9px;border-radius:8px;line-height:1.5;"><span leaf="">01</span></span>
  <h3 style="margin:0;font-size:18px;font-weight:800;color:__DEEP__;line-height:1.4;"><span leaf="">章节标题</span></h3>
</section>`,
      },
      {
        id: "warm-sec-dot",
        label: "双圆点装饰手账标题",
        instruction: "两枚暖色小圆点 + 主色序号 + 18px <h3> 标题，轻快不沉重",
        template: `<section style="margin:34px 0 18px;display:flex;align-items:center;gap:8px;">
  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:__PRIMARY__;overflow:hidden;"><span leaf=""><br></span></span>
  <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background-color:__ACCENT__;overflow:hidden;"><span leaf=""><br></span></span>
  <h3 style="margin:0;font-size:18px;font-weight:800;color:__DEEP__;line-height:1.4;"><span leaf="">章节标题</span></h3>
</section>`,
      },
    ],
    rhythm: {
      id: "warm-rhythm",
      label: "手账主标题 + 暖纸 3 点清单 + 柔色底线小节 + 便签金句",
      instruction: "统一 12px/14px 柔和圆角与浅虚线，温柔耐读不刺眼",
      template: `<section style="margin:0 0 20px;padding:0 0 10px;border-bottom:1px solid __BORDER__;">
  <h3 style="margin:0;font-size:21px;font-weight:800;color:__DEEP__;line-height:1.45;"><span leaf="">原稿一级主标题</span></h3>
</section>
<section style="margin:0 0 24px;background-color:__TINT__;border:1px solid __BORDER__;border-radius:14px;padding:15px 17px;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:__PRIMARY__;line-height:1.4;"><span leaf="">这一篇会聊到的 3 件事</span></p>
  <p style="margin:0 0 5px;font-size:13px;color:__INK__;line-height:1.7;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">01</span></span><span leaf="">看点一</span></p>
  <p style="margin:0 0 5px;font-size:13px;color:__INK__;line-height:1.7;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">02</span></span><span leaf="">看点二</span></p>
  <p style="margin:0;font-size:13px;color:__INK__;line-height:1.7;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">03</span></span><span leaf="">看点三</span></p>
</section>
<h4 style="margin:24px 0 12px;font-size:16px;font-weight:800;color:__DEEP__;line-height:1.5;"><span style="background-color:__TINT__;padding:2px 8px;border-radius:6px;"><span leaf="">小节标题</span></span></h4>
<section style="background-color:__SURFACE__;border:1.5px solid __BORDER__;border-radius:14px;padding:15px 18px;margin:0 0 22px;text-align:center;">
  <p style="margin:0;font-size:16px;font-weight:700;color:__PRIMARY__;line-height:1.75;"><span style="border-bottom:3px solid __HIGHLIGHT__;padding-bottom:2px;"><span leaf="">手账里最想划线记住的一句话</span></span></p>
</section>`,
    },
    emphasis: {
      id: "warm-emp",
      label: "暖黄笔记荧光 + 奶油边框引语 + 温和双列表",
      instruction: "手账感下划线与柔色荧光笔配合，轻重列表交替保持整条冒号原文",
      template: `<p style="font-size:16px;line-height:1.85;color:__INK__;margin:0 0 20px;text-align:left;"><span leaf="">顺手的做法像在纸上圈重点，把核心语句用</span><span style="border-bottom:2px solid __ACCENT__;font-weight:600;color:__DEEP__;"><span leaf="">柔和下划线</span></span><span leaf="">标出，关键一句加上</span><span style="background-color:__HIGHLIGHT__;padding:1px 5px;border-radius:4px;font-weight:600;color:__INK__;"><span leaf="">暖黄荧光记号</span></span><span leaf="">。</span></p>
<section style="background-color:__TINT__;border-radius:12px;padding:14px 18px;margin:0 0 22px;">
  <p style="font-size:16px;line-height:1.8;color:__DEEP__;margin:0;"><span leaf="">原文引用块内容完整置于此暖纸框内。</span></p>
</section>
<section style="background-color:__SURFACE__;border:1px solid __BORDER__;border-radius:12px;padding:12px 15px;margin:0 0 10px;">
  <p style="font-size:16px;line-height:1.8;color:__INK__;margin:0;"><span style="display:inline-block;background-color:__PRIMARY__;color:#FFFFFF;font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;margin-right:8px;line-height:1.4;"><span leaf="">01</span></span><span leaf="">重要条目：完整保留冒号前后全部文字</span></p>
</section>
<p style="font-size:16px;line-height:1.8;color:__INK__;margin:0 0 12px;padding-left:6px;"><span style="color:__PRIMARY__;font-weight:800;margin-right:8px;"><span leaf="">•</span></span><span leaf="">轻量条目：同样完整保留原文与冒号</span></p>`,
    },
    closer: {
      id: "warm-closer",
      label: "奶油手账收束小卡",
      instruction: "若原文结尾已有作者署名与三连提示，则省略本条",
      template: `<section style="margin:28px 0 8px;padding:14px 18px;background-color:__TINT__;border:1px dashed __BORDER__;border-radius:14px;text-align:center;">
  <p style="margin:0;font-size:13px;color:__DEEP__;line-height:1.7;"><span leaf="">今日份的记录就到这里，感谢读完，愿对你有用。</span></p>
</section>`,
    },
  },
];

/** 判断主题 ID 是否属于盲盒模式（形如 blindbox:random / blindbox:tech / blindbox:minimal / blindbox:magazine）。 */
export function isBlindBoxThemeId(themeId: string): boolean {
  return themeId.startsWith("blindbox:");
}

/** 从 blindbox:* 主题 ID 解析风格偏好，非合法值回退 random。 */
export function parseBlindBoxStyle(themeId: string): BlindBoxStyle {
  if (!isBlindBoxThemeId(themeId)) return "random";
  const style = themeId.slice("blindbox:".length);
  if (style === "tech" || style === "minimal" || style === "magazine") {
    return style;
  }
  return "random";
}

/** 返回盲盒风格的中文标签。 */
export function blindBoxStyleLabel(style: BlindBoxStyle): string {
  return BLIND_BOX_STYLES.find((s) => s.id === style)?.label ?? "完全随机";
}

/** 生成编辑器历史列表、预览顶栏、核对详情共用的盲盒可读名称。 */
export function formatBlindBoxLabel(
  brief?: BlindBoxBrief | null,
  themeId?: string,
): string {
  if (brief?.family?.name && brief?.palette?.name) {
    return `盲盒 · ${brief.family.name}（${brief.palette.name}）`;
  }
  if (themeId && isBlindBoxThemeId(themeId)) {
    return `盲盒 · ${blindBoxStyleLabel(parseBlindBoxStyle(themeId))}`;
  }
  return "盲盒排版";
}

function renderBrick(template: string, palette: BlindBoxPalette): string {
  return template
    .replaceAll("__PRIMARY__", palette.primary)
    .replaceAll("__DEEP__", palette.deep)
    .replaceAll("__TINT__", palette.tint)
    .replaceAll("__ACCENT__", palette.accent)
    .replaceAll("__BORDER__", palette.border)
    .replaceAll("__HIGHLIGHT__", palette.highlight)
    .replaceAll("__INK__", palette.ink)
    .replaceAll("__MUTED__", palette.muted)
    .replaceAll("__SURFACE__", palette.surface)
    .replaceAll("__SHADOW__", palette.shadow);
}

function materializeVariant(
  item: FamilyVariant,
  palette: BlindBoxPalette,
): BlindBoxTrait {
  return {
    id: item.id,
    label: item.label,
    instruction: item.instruction,
    html: renderBrick(item.template, palette),
  };
}

/** 通用中性深色代码卡与白框自适应图片基准积木（供 Prompt 与单测共用） */
export const UNIVERSAL_HELPER_BRICKS = {
  codeSlotHint: `<section data-source="s00x"></section>`,
  darkCodeShowcase: `<section style="margin:0 0 22px;border-radius:10px;overflow:hidden;background-color:#1E293B;box-shadow:0 4px 16px -8px rgba(15,23,42,0.35);">
  <section style="display:flex;align-items:center;padding:9px 14px;background-color:#0F172A;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#FF5F56;margin-right:7px;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#FFBD2E;margin-right:7px;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:#27C93F;margin-right:10px;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="font-size:12px;color:#94A3B8;font-family:Consolas,Monaco,monospace;line-height:1.4;"><span leaf="">code</span></span>
  </section>
  <section style="padding:12px 14px;">
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">const ok = true;</span></p>
  </section>
</section>`,
  imageCard: `<section style="margin:0 0 22px;background-color:#FFFFFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.06);">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="图片SRC" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>`,
};

// 融合微信官方《公众平台编辑器插件开发规范》(plugin_spec.html §1–§4) 与 v2 实测经验的刚性规则
export const BLIND_BOX_SPEC = `盲盒完整视觉家族排版规范（必须 100% 严格执行）：
1. 输出纯度与呼吸边距：
   - 返回第 1 个字符必须是 <section，最后必须是 </section>；严禁开场白、结束语或 \`\`\`html 围栏。
   - 外层容器保留 padding:12px 14px;box-sizing:border-box 留白；将全部原稿正文（包括原稿 s001 的 # 一级主标题）放进唯一一个 <section data-body=""> 内，封面与导读放于 <section data-body=""> 之外顶部，尾卡放于其外底部。
   - 严格保持同一视觉家族内的圆角、边框、阴影与字号语言，严禁跨风格瞎改，也严禁多章节照抄完全相同的英文短签。
2. 微信 HTML/CSS 兼容性红线（plugin_spec.html）：
   - 禁用 <div>、<style>、<script>、class、id、position:fixed/absolute/sticky、float、display:grid、@media、@keyframes、var(--x)、!important。
   - 所有文字包裹在 <span leaf=""> 内，且 <span leaf=""> 内绝不嵌套 <section>/<p>/<div>/<h3>/<h4> 等块级元素。
   - 装饰圆点/细线写正数宽/高 + <span leaf=""><br></span>，严禁 font-size:0、line-height:0 或 height:0；含字容器禁固定 height + overflow:hidden、禁渐变背景（只用纯色 background-color）、禁 opacity:0 或透明 caret-color、禁 start/end 对齐。
3. 原稿 100% 保真与防坑铁律（极其重要）：
   - 若 sources[0] 为 # 一级主标题（s001），务必套用本家族「正文主标题」<h3> 放在 <section data-body=""> 最顶部且一字不改；封面卡另外用错开视角的新副题/导语，不要把 s001 移出 data-body！
   - ## 章节标题用 <h3>，### 小节标题用 <h4>。
   - 正文或行内代码中的 HTML 标签字面量（如 \`<img>\`、\`<script>\`、\`<pre>\`），写入 HTML 时务必转义为 &lt;img&gt;、&lt;script&gt;、&lt;pre&gt;，绝对禁止未转义写出尖括号！
   - 列表每一条必须把整条原文（包含冒号「：」及其前后全部字词标点）完整保留在同一 <p> 内；**加粗**、~~删除线~~、==高亮==、\`行内代码\` 必须原样保留全部文字；长文适时交替「重列表/轻列表」避免满屏同款方框。
   - 原文代码块（code 非空）直接输出 <section data-source="s00x"></section>（系统自动回填高质感深色代码卡，缩进零差错）。
   - 若原文最后一段已自带作者简介或点赞/转发结尾，则省略额外尾卡以免双重结尾。`;

function pickRandom<T>(items: T[], rng: () => number): T {
  if (!items.length) throw new Error("Cannot pick from an empty array");
  const idx = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[idx];
}

/**
 * 为当次「开盲盒」生成一套内部审美完全自洽的高定视觉家族简报：
 * 先按偏好选出视觉家族（优先避开上一盒家族），再从该家族协调色板池选色板与同气质 A/B 变奏。
 */
export function rollBlindBoxBrief(
  style: BlindBoxStyle,
  previous?: Partial<
    Pick<BlindBoxBrief, "family" | "palette" | "sectionHeader" | "opener">
  >,
  rng: () => number = Math.random,
): BlindBoxBrief {
  const familyPool =
    style === "random"
      ? DESIGN_FAMILIES
      : DESIGN_FAMILIES.filter((f) => f.styles.includes(style));
  const filteredFamilies = previous?.family
    ? familyPool.filter((f) => f.id !== previous.family!.id)
    : familyPool;
  const familySpec = pickRandom(
    filteredFamilies.length ? filteredFamilies : familyPool,
    rng,
  );

  const resolvedStyle: ResolvedBlindBoxStyle =
    style === "random" ? pickRandom(familySpec.styles, rng) : style;

  const palettePool = BLIND_BOX_PALETTES.filter((p) =>
    familySpec.paletteIds.includes(p.id),
  );
  const filteredPalettes = previous?.palette
    ? palettePool.filter((p) => p.id !== previous.palette!.id)
    : palettePool;
  const palette = pickRandom(
    filteredPalettes.length ? filteredPalettes : palettePool,
    rng,
  );

  const filteredOpeners = previous?.opener
    ? familySpec.openers.filter((o) => o.id !== previous.opener!.id)
    : familySpec.openers;
  const opener = materializeVariant(
    pickRandom(
      filteredOpeners.length ? filteredOpeners : familySpec.openers,
      rng,
    ),
    palette,
  );

  const filteredSections = previous?.sectionHeader
    ? familySpec.sectionHeaders.filter(
        (s) => s.id !== previous.sectionHeader!.id,
      )
    : familySpec.sectionHeaders;
  const sectionHeader = materializeVariant(
    pickRandom(
      filteredSections.length ? filteredSections : familySpec.sectionHeaders,
      rng,
    ),
    palette,
  );

  const rhythm = materializeVariant(familySpec.rhythm, palette);
  const emphasis = materializeVariant(familySpec.emphasis, palette);
  const closer = materializeVariant(familySpec.closer, palette);

  const family: BlindBoxFamilyInfo = {
    id: familySpec.id,
    name: familySpec.name,
    vibe: familySpec.vibe,
  };
  const styleMeta = BLIND_BOX_STYLES.find((s) => s.id === resolvedStyle)!;
  const summary = `${styleMeta.label} · ${family.name}（${palette.name}）· ${opener.label} + ${sectionHeader.label}`;

  return {
    style,
    resolvedStyle,
    family,
    palette,
    opener,
    sectionHeader,
    rhythm,
    emphasis,
    closer,
    summary,
  };
}

/** 供单元测试与校验脚本遍历全部「视觉家族 × 协调色板 × 同家族 A/B 变奏」。 */
export function renderAllBlindBoxBricksForTest(): {
  family: BlindBoxFamilyInfo;
  palette: BlindBoxPalette;
  opener: BlindBoxTrait;
  sectionHeader: BlindBoxTrait;
  rhythm: BlindBoxTrait;
  emphasis: BlindBoxTrait;
  closer: BlindBoxTrait;
  composedHtml: string;
}[] {
  const samples: {
    family: BlindBoxFamilyInfo;
    palette: BlindBoxPalette;
    opener: BlindBoxTrait;
    sectionHeader: BlindBoxTrait;
    rhythm: BlindBoxTrait;
    emphasis: BlindBoxTrait;
    closer: BlindBoxTrait;
    composedHtml: string;
  }[] = [];

  for (const fam of DESIGN_FAMILIES) {
    const family: BlindBoxFamilyInfo = {
      id: fam.id,
      name: fam.name,
      vibe: fam.vibe,
    };
    const matchingPalettes = BLIND_BOX_PALETTES.filter((p) =>
      fam.paletteIds.includes(p.id),
    );
    for (const palette of matchingPalettes) {
      for (let k = 0; k < Math.max(fam.openers.length, fam.sectionHeaders.length); k++) {
        const opener = materializeVariant(
          fam.openers[k % fam.openers.length],
          palette,
        );
        const sectionHeader = materializeVariant(
          fam.sectionHeaders[k % fam.sectionHeaders.length],
          palette,
        );
        const rhythm = materializeVariant(fam.rhythm, palette);
        const emphasis = materializeVariant(fam.emphasis, palette);
        const closer = materializeVariant(fam.closer, palette);
        const composedHtml = `<section style="text-align:left;max-width:677px;margin:0 auto;padding:12px 14px;box-sizing:border-box;background-color:${palette.surface};color:${palette.ink};font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;line-height:1.75;">
${opener.html}
<section data-body="">
${rhythm.html}
${sectionHeader.html}
${emphasis.html}
${UNIVERSAL_HELPER_BRICKS.darkCodeShowcase}
</section>
${closer.html}
</section>`;
        samples.push({
          family,
          palette,
          opener,
          sectionHeader,
          rhythm,
          emphasis,
          closer,
          composedHtml,
        });
      }
    }
  }
  return samples;
}

/** 生成方案 1 v3「完整视觉家族 × 同气质变奏 + 换色盲盒」完整 System Prompt。 */
export function buildBlindBoxSystemPrompt(brief: BlindBoxBrief): string {
  const styleLabel =
    BLIND_BOX_STYLES.find((s) => s.id === brief.resolvedStyle)?.label ??
    brief.resolvedStyle;

  const blueprintBlock = [
    `本盒专属视觉家族蓝图（同一套设计语言 + 已注入当前协调色板 Hex，直接沿用下方 HTML 骨架与质感填入文章内容）：`,
    `- 家族与配色：${styleLabel} · 「${brief.family.name}」家族 × 「${brief.palette.name}」色板（${brief.family.vibe}；primary=${brief.palette.primary}，deep=${brief.palette.deep}，tint=${brief.palette.tint}，accent=${brief.palette.accent}，border=${brief.palette.border}，highlight=${brief.palette.highlight}，ink=${brief.palette.ink}，muted=${brief.palette.muted}）`,
    `- 根容器（带呼吸边距）：<section style="text-align:left;max-width:677px;margin:0 auto;padding:12px 14px;box-sizing:border-box;background-color:${brief.palette.surface};color:${brief.palette.ink};line-height:1.75;">`,
    `\n【1. 开篇封面卡：${brief.opener.label}】（放于 <section data-body=""> 之外顶部；用副视角引语概括核心价值，严禁复读正文主标题）`,
    brief.opener.html,
    `\n【2. 全篇节奏包（正文主标题 / 3点导读 / <h4>小节 / 金句卡）】（s001 若为 # 主标题务必放在 data-body 内最前；≥3 章时放 3 点导读，短文省略导读；长文合理穿插金句卡）`,
    brief.rhythm.html,
    `\n【3. ## 章节标题：${brief.sectionHeader.label}】（按 01/02/03 递增；每章英文短签必须按真实章义现写或省略，严禁多章复制相同假词）`,
    brief.sectionHeader.html,
    `\n【4. 正文重点 × 引用 × 轻重双列表】（长文根据重要程度交替使用“重列表卡”和“轻列表条”，列表整条原文与冒号不可拆断）`,
    brief.emphasis.html,
    `\n【5. 文末收束卡：${brief.closer.label}】（放于 data-body 之外底部；若原文末段已有作者介绍或三连引导则直接省略本卡）`,
    brief.closer.html,
    `\n【代码与图片槽位】`,
    `- 代码块（sources[] 中 code 非空）：直接输出 ${UNIVERSAL_HELPER_BRICKS.codeSlotHint}（替换 s00x 为真实 ID），系统自动回填深色代码卡。`,
    `- 图片（sources[] 中 images 非空）：用以下白框图片结构填入原 src：\n${UNIVERSAL_HELPER_BRICKS.imageCard}`,
  ].join("\n");

  const enhancementNote = ENHANCEMENT_CONTRACT.replaceAll(
    "当前 Skill/主题",
    "本盒视觉家族蓝图",
  );

  return [
    `你是文有样公众号排版师。本次为「方案 1 完整视觉家族盲盒模式」：请严格以本盒同气质家族的完整组件体系排版，做到排版克制、节奏张弛有度、像精编杂志一样耐看。`,
    CORE_OUTPUT_CONTRACT,
    enhancementNote,
    BLIND_BOX_SPEC,
    blueprintBlock,
  ].join("\n\n");
}

function relativeLuminance(hex: string): number {
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const channels = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** 计算两个 Hex 颜色之间的 WCAG 2.1 对比度（1–21）。 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const ZERO_WIDTH_RE = /[\u200b-\u200d\ufeff]/g;
const CODE_STYLE_RE = /monospace|consolas|courier|sf\s*mono|white-space\s*:\s*pre/i;
const BLOCK_DESCENDANT_SELECTOR =
  "section,div,p,h1,h2,h3,h4,h5,h6,ul,ol,li,table,blockquote,pre,hr";

function parseStyleMap(styleText: string): {
  props: Map<string, string>;
  hasImportant: boolean;
} {
  const props = new Map<string, string>();
  let hasImportant = false;
  for (const decl of styleText.split(";")) {
    const colon = decl.indexOf(":");
    if (colon < 0) continue;
    const key = decl.slice(0, colon).trim().toLowerCase();
    let val = decl.slice(colon + 1).trim();
    if (!key || !val) continue;
    if (/!\s*important\s*$/i.test(val)) {
      hasImportant = true;
      val = val.replace(/!\s*important\s*$/i, "").trim();
    }
    props.set(key, val.toLowerCase());
  }
  return { props, hasImportant };
}

function visibleContent(node: Node): string {
  return (node.textContent || "").replace(ZERO_WIDTH_RE, "").trim();
}

function parsePx(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "0") return 0;
  const m = /^(\d+(?:\.\d+)?)px$/i.exec(trimmed);
  return m ? parseFloat(m[1]) : null;
}

function sameStyleSignature(a: Element, b: Element): boolean {
  return (a.getAttribute("style") || "").trim() === (b.getAttribute("style") || "").trim();
}

/**
 * 依据微信官方《公众平台编辑器插件开发规范》(plugin_spec.html §1–§4)
 * 执行补充静态合规检测，与现有 content.ts 的 align/width/gradient 检查互补。
 */
export function pluginSpecChecks(dom: DocumentFragment): {
  errors: string[];
  warnings: string[];
} {
  const errors = new Set<string>();
  const warnings = new Set<string>();

  for (const el of dom.querySelectorAll<HTMLElement>("[style]")) {
    const styleRaw = el.getAttribute("style") || "";
    const { props, hasImportant } = parseStyleMap(styleRaw);
    const fsPx = parsePx(props.get("font-size"));
    const hasReadableText = Boolean(visibleContent(el)) && fsPx !== 0;

    // §4.5.2 禁止内联 !important
    if (hasImportant) {
      warnings.add(
        `plugin_spec §4.5.2：<${el.tagName.toLowerCase()}> 使用了 !important，可能破坏公众号公共样式与深色模式转换`,
      );
    }

    // §1.1 禁止 img 设置 opacity:0（叠图黑科技）
    if (el.tagName === "IMG") {
      const opacity = props.get("opacity");
      if (opacity !== undefined && parseFloat(opacity) === 0) {
        errors.add(
          "plugin_spec §1.1：<img> 设置了 opacity:0，会导致公众号后台无法更换图片",
        );
      }
    }

    // §1.2 禁止透明 caret-color
    const caret = props.get("caret-color");
    if (
      caret &&
      (caret === "transparent" ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.0+)?\s*\)$/i.test(caret))
    ) {
      errors.add(
        "plugin_spec §1.2：caret-color 设为透明，会导致编辑器输入光标不可见",
      );
    }

    // §1.3 含文本元素 line-height 小于字号导致叠字
    const lhRaw = props.get("line-height");
    if (hasReadableText && lhRaw) {
      const lhPx = parsePx(lhRaw);
      const unitless = /^\d+(?:\.\d+)?$/.test(lhRaw) ? parseFloat(lhRaw) : null;
      if (
        (lhPx !== null && fsPx !== null && lhPx < fsPx) ||
        lhPx === 0 ||
        lhRaw === "0" ||
        (unitless !== null && unitless < 1)
      ) {
        errors.add(
          `plugin_spec §1.3：<${el.tagName.toLowerCase()}> 行高 (${lhRaw}) 小于字号，易造成多行文字重叠`,
        );
      }
    }

    // §1.5 含文本容器禁止 height:0 或固定小高度+overflow:hidden 裁切
    const hRaw = props.get("height");
    if (hasReadableText && hRaw && !el.closest("svg")) {
      const hPx = parsePx(hRaw);
      const overflow = props.get("overflow") || props.get("overflow-y") || "";
      if (hRaw === "0" || hPx === 0) {
        errors.add(
          `plugin_spec §1.5.1：含文本容器 <${el.tagName.toLowerCase()}> 设置 height:0，移动端将不可见`,
        );
      } else if (hPx !== null && overflow === "hidden") {
        warnings.add(
          `plugin_spec §1.5.2：含文本容器设置固定 height:${hRaw} + overflow:hidden，窄屏折行后可能被裁切`,
        );
      }
    }

    // §1.6 text-align 不得用 start / end
    const align = props.get("text-align");
    if (align === "start" || align === "end") {
      errors.add(
        `plugin_spec §1.6：text-align:${align} 存在跨端兼容差异，请改用 left/right/center/justify`,
      );
    }
  }

  // §1.8 禁止用 <pre> 包裹普通正文段落
  for (const pre of dom.querySelectorAll("pre")) {
    const preStyle = pre.getAttribute("style") || "";
    const hasCodeTag = Boolean(pre.querySelector("code"));
    if (!hasCodeTag && !CODE_STYLE_RE.test(preStyle) && visibleContent(pre)) {
      errors.add(
        "plugin_spec §1.8：禁止用 <pre> 包裹普通正文文本（默认不换行会横向截断），请改用 <section> 或 <p>",
      );
    }
  }

  // §2.2 <span leaf> 内不得包含块级元素
  for (const leaf of dom.querySelectorAll("span[leaf]")) {
    const blockChild = leaf.querySelector(BLOCK_DESCENDANT_SELECTOR);
    if (blockChild) {
      errors.add(
        `plugin_spec §2.2：<span leaf> 内包含块级元素 <${blockChild.tagName.toLowerCase()}>，违反行内容器规范`,
      );
    }
  }

  // §2.1 同标签、同样式单子节点连续嵌套超过 10 层
  for (const leafEl of dom.querySelectorAll("*")) {
    if (leafEl.children.length > 0) continue;
    let chain = 1;
    let cur: Element | null = leafEl;
    while (cur.parentElement) {
      const parent: Element = cur.parentElement;
      if (
        parent.children.length === 1 &&
        parent.tagName === cur.tagName &&
        sameStyleSignature(parent, cur)
      ) {
        chain += 1;
        if (chain > 10) {
          warnings.add(
            `plugin_spec §2.1：存在连续超过 10 层的同标签同样式单子节点嵌套（<${cur.tagName.toLowerCase()}>），编辑器会自动精简`,
          );
          break;
        }
      } else {
        chain = 1;
      }
      cur = parent;
    }
  }

  return { errors: [...errors], warnings: [...warnings] };
}
