#!/usr/bin/env python3
"""杂志卡片风多色主题生成脚本（v1.0.0）。

以单一规整骨架（16px／1.8 阅读参数 + 补全三步流程卡、三列对比卡、浅黄荧光笔）
与 5 套语义色板配置为单一来源，批量生成：
1. references/theme-{id}.md
2. assets/theme-previews/theme-{id}.html

用法：
    python3 skills/gzh-design/scripts/generate_magazine_themes.py
"""

from pathlib import Path

VERSION = "1.0.0"

SKILL_ROOT = Path(__file__).resolve().parent.parent
REFERENCES_DIR = SKILL_ROOT / "references"
PREVIEWS_DIR = SKILL_ROOT / "assets" / "theme-previews"

THEMES = [
    {
        "id": "moyu-blue",
        "name": "晴空手记",
        "legacy_note": "（原名「摸鱼蓝」，保留标识 `moyu-blue` 兼容历史偏好与备份）",
        "color_label": "明蓝",
        "primary": "#2563EB",
        "secondary": "#3B82F6",
        "gradient_end": "#60A5FA",
        "tint_bg": "#EFF6FF",
        "badge_bg": "#DBEAFE",
        "deep_text": "#1E40AF",
        "underline": "#BFDBFE",
        "primary_rgb": "37,99,235",
        "negative_border": "#FECACA",
        "description": "教程、测评、工具清单、产品实践（明蓝杂志风，16px/1.8 舒适阅读，卡片与横滑导读齐全）",
        "tip_title": "明蓝提示",
        "info_title": "明蓝信息",
        "cover": {
            "column": "PRODUCT · 实践手记",
            "date": "2026／11",
            "title_prefix": "从一次",
            "title_highlight": "尝试",
            "title_line2": "到一次次被选择",
            "keywords": "真实使用 · 兑现承诺 · 反馈取舍",
            "brand": "产品实践 · 迭代专栏",
            "tag1": "产品",
            "tag2": "迭代",
        },
    },
    {
        "id": "iris-dispatch",
        "name": "鸢尾快讯",
        "legacy_note": "",
        "color_label": "紫罗兰",
        "primary": "#7C3AED",
        "secondary": "#8B5CF6",
        "gradient_end": "#A78BFA",
        "tint_bg": "#F5F3FF",
        "badge_bg": "#EDE9FE",
        "deep_text": "#5B21B6",
        "underline": "#DDD6FE",
        "primary_rgb": "124,58,237",
        "negative_border": "#FECACA",
        "description": "AI 与大模型评测、新工具盘点、前沿科技（紫罗兰杂志风，配暖黄高亮辨识度强）",
        "tip_title": "紫罗兰提示",
        "info_title": "紫罗兰信息",
        "cover": {
            "column": "AI REVIEW · 工具评测",
            "date": "2026／11",
            "title_prefix": "把复杂能力",
            "title_highlight": "拆开实测",
            "title_line2": "看清真正好用的那一环",
            "keywords": "实测对比 · 场景边界 · 效率增量",
            "brand": "前沿工具 · 评测快讯",
            "tag1": "AI工具",
            "tag2": "实测",
        },
    },
    {
        "id": "lead-journal",
        "name": "铅字刊物",
        "legacy_note": "",
        "color_label": "炭墨黑",
        "primary": "#1E293B",
        "secondary": "#334155",
        "gradient_end": "#64748B",
        "tint_bg": "#F8FAFC",
        "badge_bg": "#E2E8F0",
        "deep_text": "#0F172A",
        "underline": "#CBD5E1",
        "primary_rgb": "30,41,59",
        "negative_border": "#FECACA",
        "description": "商业观察、深度复盘、极客教程（炭墨黑配暖黄荧光笔，沉稳百搭不挑题材）",
        "tip_title": "铅字提示",
        "info_title": "铅字信息",
        "cover": {
            "column": "DEEP DIVE · 深度复盘",
            "date": "2026／11",
            "title_prefix": "剥开热潮之后",
            "title_highlight": "看本质",
            "title_line2": "那些真正留下的规律",
            "keywords": "结构拆解 · 长期主义 · 方法沉淀",
            "brand": "商业与技术 · 深度观察",
            "tag1": "复盘",
            "tag2": "方法",
        },
    },
    {
        "id": "sunset-studio",
        "name": "落日工坊",
        "legacy_note": "",
        "color_label": "赤陶橙",
        "primary": "#C2410C",
        "secondary": "#EA580C",
        "gradient_end": "#FB923C",
        "tint_bg": "#FFF7ED",
        "badge_bg": "#FFEDD5",
        "deep_text": "#9A3412",
        "underline": "#FED7AA",
        "primary_rgb": "194,65,12",
        "negative_border": "#94A3B8",
        "description": "实战经验、运营增长、独立开发与副业分享（赤陶暖橙杂志风，温暖有行动力）",
        "tip_title": "暖橙提示",
        "info_title": "暖橙信息",
        "cover": {
            "column": "BUILDER · 实战手记",
            "date": "2026／11",
            "title_prefix": "从零跑通",
            "title_highlight": "第一步",
            "title_line2": "把想法变成真实交付",
            "keywords": "实战经验 · 运营增长 · 持续迭代",
            "brand": "独立开发 · 实战工坊",
            "tag1": "实战",
            "tag2": "增长",
        },
    },
    {
        "id": "berry-digest",
        "name": "绯莓微刊",
        "legacy_note": "",
        "color_label": "复古莓红",
        "primary": "#BE123C",
        "secondary": "#E11D48",
        "gradient_end": "#FB7185",
        "tint_bg": "#FFF1F2",
        "badge_bg": "#FFE4E6",
        "deep_text": "#9F1239",
        "underline": "#FECDD3",
        "primary_rgb": "190,18,60",
        "negative_border": "#94A3B8",
        "description": "好物种草、产品体验、热点解读与清单盘点（复古莓红轻快卡片风，与严肃编辑风区隔）",
        "tip_title": "莓红提示",
        "info_title": "莓红信息",
        "cover": {
            "column": "DIGEST · 精选清单",
            "date": "2026／11",
            "title_prefix": "挑出真正",
            "title_highlight": "值得用",
            "title_line2": "的那些宝藏细节",
            "keywords": "体验清单 · 亮点拆解 · 避坑指南",
            "brand": "好物与体验 · 微刊",
            "tag1": "清单",
            "tag2": "体验",
        },
    },
]


def build_components(t: dict) -> list[dict]:
    """根据色板配置构建全部有序组件定义，供文档与预览 HTML 共用。"""
    p = t["primary"]
    s = t["secondary"]
    g_end = t["gradient_end"]
    tint = t["tint_bg"]
    badge = t["badge_bg"]
    deep = t["deep_text"]
    ul = t["underline"]
    rgb = t["primary_rgb"]
    neg = t["negative_border"]
    cl = t["color_label"]
    cv = t["cover"]

    return [
        {
            "key": "cover",
            "title": f"{cl}杂志封面",
            "doc_note": (
                "沿用已确认无图封面的杂志编排。公众号标题栏负责提出问题，封面负责用正文已有的核心判断、"
                "变化或阅读价值写一句独立导语；不把文章标题拆两行再放进卡片。例如，外标题"
                "《我不想再比价了：AI助理该替我省什么？》可提炼为“把麻烦交给AI／把生活的滋味留给自己”。"
                "封面提炼不改正文、原文标题或结尾。\n\n"
                "保留“栏目＋细线／月份→两行导语→装饰短线＋关键词→主色来源条＋主题标签”的层次。"
                "栏目和主题标签可据文章内容提炼，不视为需要外部核实的事实；来源条优先填原文已说明的活动或系列，"
                "缺少时再用已知作者品牌。日期优先使用作者确认的刊期；无指定刊期可用实际时钟取得的排版月份，"
                "不能把它当作活动日期或发布日。不确定的字段单独省略，不因缺少显式元数据而删掉整条刊头或所有主题标签。"
                "保留已确认的字号、留白及纯色文字背景，不为恢复层次重加有文字的渐变。"
            ),
            "wrap_body": False,
            "doc_html": f"""<section style="margin:0 0 32px;background:#fff;border:1.5px solid rgba({rgb},0.15);border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);width:100%;box-sizing:border-box;">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="width:6px;height:6px;background:{p};border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:{p};"><span leaf="">{{{{栏目标签}}}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,rgba({rgb},0.12),transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:#D1D5DB;font-weight:600;"><span leaf="">{{{{日期}}}}</span></span>
    </section>
    <section>
      <p style="font-size:24px;font-weight:900;color:#111827;margin:0;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{{{{主标题前半}}}}</span>
        <span style="color:{p};"><span leaf="">{{{{主色词}}}}</span></span>
      </p>
      <p style="font-size:24px;font-weight:900;color:{p};margin:0 0 16px;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{{{{主标题第二行}}}}</span>
      </p>
      <section style="width:48px;height:3px;background:linear-gradient(to right,{p},{g_end});border-radius:2px;margin-bottom:12px;">
        <span leaf=""><br></span>
      </section>
      <p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;letter-spacing:0.5px;">
        <span leaf="">{{{{副标题关键词}}}}</span>
      </p>
    </section>
  </section>
  <section style="background:{p};padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{{{主题或品牌}}}}</span>
    </p>
    <section style="display:flex;gap:4px;">
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{{{{标签一}}}}</span></span>
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{{{{标签二}}}}</span></span>
    </section>
  </section>
</section>""",
            "preview_html": f"""<section style="margin:0 0 32px;background:#fff;border:1.5px solid rgba({rgb},0.15);border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);width:100%;box-sizing:border-box;">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="width:6px;height:6px;background:{p};border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:{p};"><span leaf="">{cv["column"]}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,rgba({rgb},0.12),transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:#D1D5DB;font-weight:600;"><span leaf="">{cv["date"]}</span></span>
    </section>
    <section>
      <p style="font-size:24px;font-weight:900;color:#111827;margin:0;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{cv["title_prefix"]}</span>
        <span style="color:{p};"><span leaf="">{cv["title_highlight"]}</span></span>
      </p>
      <p style="font-size:24px;font-weight:900;color:{p};margin:0 0 16px;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{cv["title_line2"]}</span>
      </p>
      <section style="width:48px;height:3px;background:linear-gradient(to right,{p},{g_end});border-radius:2px;margin-bottom:12px;">
        <span leaf=""><br></span>
      </section>
      <p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;letter-spacing:0.5px;">
        <span leaf="">{cv["keywords"]}</span>
      </p>
    </section>
  </section>
  <section style="background:{p};padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{cv["brand"]}</span>
    </p>
    <section style="display:flex;gap:4px;">
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{cv["tag1"]}</span></span>
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{cv["tag2"]}</span></span>
    </section>
  </section>
</section>""",
        },
        {
            "key": "toc",
            "title": "横滑精选导读",
            "doc_note": (
                "紧跟封面、位于前言之前；只选三条看点，按实际数量改说明，不补造“写在最后”。\n\n"
                "卡片采用inline-block、width:auto、min-width:144px和显式border-box，按短标题与说明的实际内容撑宽；"
                "卡片内部nowrap保留三行结构，父容器负责横滑。三张卡片使用相同内边距与1px边框，不再固定110px内容宽度。"
                "长说明应移入正文，避免把段落塞进导读。"
            ),
            "wrap_body": False,
            "doc_html": f"""<section style="margin:0 20px 32px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <p style="font-size:10px;color:#9CA3AF;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
      <span leaf="">精选导读 · 三个看点</span>
    </p>
    <p style="font-size:10px;color:#9CA3AF;margin:0;">
      <span leaf="">👉 滑动</span>
    </p>
  </section>
  <section style="overflow-x:scroll;-webkit-overflow-scrolling:touch;white-space:nowrap;padding-bottom:8px;">
    <!-- 第一个（当前高亮，主色背景） -->
    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:{p};border:1px solid {p};border-radius:12px;padding:12px;margin-right:8px;">
      <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.75);letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 01</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{{{看点一标题}}}}</span>
      </p>
      <p style="font-size:10px;color:rgba(255,255,255,0.75);margin:0;">
        <span leaf="">{{{{看点一说明}}}}</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 02</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{{{看点二标题}}}}</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">{{{{看点二说明}}}}</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 03</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{{{看点三标题}}}}</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">{{{{看点三说明}}}}</span>
      </p>
    </section>
  </section>
</section>""",
            "preview_html": f"""<section style="margin:0 20px 32px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <p style="font-size:10px;color:#9CA3AF;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
      <span leaf="">精选导读 · 三个看点</span>
    </p>
    <p style="font-size:10px;color:#9CA3AF;margin:0;">
      <span leaf="">👉 滑动</span>
    </p>
  </section>
  <section style="overflow-x:scroll;-webkit-overflow-scrolling:touch;white-space:nowrap;padding-bottom:8px;">
    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:{p};border:1px solid {p};border-radius:12px;padding:12px;margin-right:8px;">
      <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.75);letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 01</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">看点一标题占位</span>
      </p>
      <p style="font-size:10px;color:rgba(255,255,255,0.75);margin:0;">
        <span leaf="">看点一说明占位</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 02</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">看点二标题占位</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">看点二说明占位</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 03</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">看点三标题占位</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">看点三说明占位</span>
      </p>
    </section>
  </section>
</section>""",
        },
        {
            "key": "chapter",
            "title": "编号章节",
            "doc_note": (
                "首章margin-top改16px，其余48px；编号01／02／03，只有结语章才用///与LAST。"
                "装饰序号统一24px，此组件含正文20px边距，章内不再套一层。"
            ),
            "wrap_body": False,
            "doc_html": f"""<section style="margin-top:48px;margin-bottom:32px;padding:0 20px;">
  <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:24px;font-weight:900;color:{p};line-height:1;letter-spacing:-2px;">
        <span leaf="">{{{{章节编号}}}}</span>
      </p>
      <p style="margin:0;font-size:8px;font-weight:700;color:#D1D5DB;letter-spacing:2px;">
        <span leaf="">PART</span>
      </p>
    </section>
    <span style="width:1px;height:36px;background:#E5E7EB;flex-shrink:0;"><span leaf=""><br></span></span>
    <section>
      <p style="margin:0 0 1px;font-size:17px;font-weight:900;color:#111827;letter-spacing:0.3px;">
        <span leaf="">{{{{中文标题}}}}</span>
      </p>
      <p style="margin:0;font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1.5px;">
        <span leaf="">{{{{ENGLISH · 英文副标题}}}}</span>
      </p>
    </section>
  </section>

  <!-- 本章节正文内容放在这里 -->

</section>""",
            "preview_html": f"""<section style="margin-top:16px;margin-bottom:16px;padding:0 20px;">
  <section style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:24px;font-weight:900;color:{p};line-height:1;letter-spacing:-2px;">
        <span leaf="">01</span>
      </p>
      <p style="margin:0;font-size:8px;font-weight:700;color:#D1D5DB;letter-spacing:2px;">
        <span leaf="">PART</span>
      </p>
    </section>
    <span style="width:1px;height:36px;background:#E5E7EB;flex-shrink:0;"><span leaf=""><br></span></span>
    <section>
      <p style="margin:0 0 1px;font-size:17px;font-weight:900;color:#111827;letter-spacing:0.3px;">
        <span leaf="">章节中文标题占位</span>
      </p>
      <p style="margin:0;font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1.5px;">
        <span leaf="">CHAPTER · 英文副标题占位</span>
      </p>
    </section>
  </section>
</section>""",
        },
        {
            "key": "plain",
            "title": "正文段落",
            "doc_note": "默认16px／1.8；每段关键词用underline，强调继承大小。",
            "wrap_body": True,
            "doc_html": """<p style="margin:0 0 20px;font-size:16px;line-height:1.8;text-align:justify;color:#374151;"><span leaf="">{{正文内容}}</span></p>""",
            "preview_html": """<p style="margin:0 0 20px;font-size:16px;line-height:1.8;text-align:justify;color:#374151;"><span leaf="">正文内容占位：保持16px字号与1.8行高，配合行内重点标记让手机阅读更舒适。</span></p>""",
        },
        {
            "key": "strong",
            "title": "主色加粗",
            "doc_note": "核心概念、关键结论或产品名；替换占位内容，按语义使用，不新增原文事实。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": f"""<strong style="color:{p};"><span leaf="">文字</span></strong>""",
            "preview_html": f"""<strong style="color:{p};"><span leaf="">主色加粗强调文字</span></strong>""",
        },
        {
            "key": "tint",
            "title": "主色浅底强调",
            "doc_note": "纯色极浅主色底纹标签；替换占位内容，按语义使用，不新增原文事实。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": f"""<strong style="color:{p};background:rgba({rgb},0.1);padding:0 4px;border-radius:2px;"><span leaf="">文字</span></strong>""",
            "preview_html": f"""<strong style="color:{p};background:rgba({rgb},0.1);padding:0 4px;border-radius:2px;"><span leaf="">主色浅底强调文字</span></strong>""",
        },
        {
            "key": "highlight",
            "title": "黄色荧光笔高亮",
            "doc_note": "一段话中最想让读者注意的短语（纯色浅黄荧光笔底色），每段不超过 1-2 处。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": """<span style="background:#FEF3C7;padding:1px 4px;border-radius:3px;font-weight:600;color:#111827;"><span leaf="">文字</span></span>""",
            "preview_html": """<span style="background:#FEF3C7;padding:1px 4px;border-radius:3px;font-weight:600;color:#111827;"><span leaf="">黄色荧光笔高亮文字</span></span>""",
        },
        {
            "key": "yellow-line",
            "title": "黄色底部高亮",
            "doc_note": "重点短句底部粗黄线标注；替换占位内容，按语义使用，不新增原文事实。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": """<span style="color:#111827;font-weight:bold;border-bottom:3px solid #FDE68A;"><span leaf="">文字</span></span>""",
            "preview_html": """<span style="color:#111827;font-weight:bold;border-bottom:3px solid #FDE68A;"><span leaf="">黄色底部高亮文字</span></span>""",
        },
        {
            "key": "underline",
            "title": "正文关键词下划线",
            "doc_note": "次要强调与正文关键词默认标记，色值以 theme-index.md 为单一来源。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": f"""<span style="border-bottom:2px solid {ul};font-weight:600;"><span leaf="">文字</span></span>""",
            "preview_html": f"""<span style="border-bottom:2px solid {ul};font-weight:600;"><span leaf="">正文关键词下划线</span></span>""",
        },
        {
            "key": "negative",
            "title": "对比下划线",
            "doc_note": "用于对比、否定或警示差异点；不用于普通正向强调。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": f"""<span style="border-bottom:2px solid {neg};"><span leaf="">文字</span></span>""",
            "preview_html": f"""<span style="border-bottom:2px solid {neg};"><span leaf="">对比与否定提示词</span></span>""",
        },
        {
            "key": "inline",
            "title": "行内代码",
            "doc_note": "行内命令、变量或文件名标记；内部半角符号保持原样。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": """<span style="background:#F3F4F6;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:600;"><span leaf="">code</span></span>""",
            "preview_html": """<span style="background:#F3F4F6;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:600;"><span leaf="">npm run build</span></span>""",
        },
        {
            "key": "keyword",
            "title": "获取方式标签",
            "doc_note": "用于文末关键词回复或工具获取入口提示。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": """<span style="background:#FDE68A;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:700;"><span leaf="">「关键词」</span></span>""",
            "preview_html": """<span style="background:#FDE68A;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:700;"><span leaf="">「关键词」</span></span>""",
        },
        {
            "key": "strike",
            "title": "删除线",
            "doc_note": "用于被替代或淘汰的旧做法。",
            "wrap_body": True,
            "wrap_inline": True,
            "doc_html": """<span style="background:#F3F4F6;color:#6B7280;padding:2px 6px;border-radius:4px;text-decoration:line-through;font-weight:600;"><span leaf="">旧词</span></span>""",
            "preview_html": """<span style="background:#F3F4F6;color:#6B7280;padding:2px 6px;border-radius:4px;text-decoration:line-through;font-weight:600;"><span leaf="">旧观念占位</span></span>""",
        },
        {
            "key": "step",
            "title": "步骤说明",
            "doc_note": "标签和步骤标题保留原大小，步骤完整说明16px／1.8。",
            "wrap_body": True,
            "doc_html": """<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">STEP 01</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">{{步骤标题}}</span>
    </h4>
  </section>
  <p style="margin:0 0 16px;color:#4B5563;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">{{步骤内容}}</span>
  </p>
</section>""",
            "preview_html": """<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">STEP 01</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">步骤标题占位</span>
    </h4>
  </section>
  <p style="margin:0 0 16px;color:#4B5563;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">步骤说明内容占位，保持16px字号与1.8行高。</span>
  </p>
</section>""",
        },
        {
            "key": "case",
            "title": "案例短标",
            "doc_note": "案例分节标题；下方接 plain 正文或卡片。",
            "wrap_body": True,
            "doc_html": """<section style="margin-bottom:28px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#E5E7EB;color:#6B7280;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">CASE 01</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">{{案例标题}}</span>
    </h4>
  </section>
  <!-- 案例内容 -->
</section>""",
            "preview_html": """<section style="margin-bottom:28px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#E5E7EB;color:#6B7280;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">CASE 01</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">案例标题占位</span>
    </h4>
  </section>
</section>""",
        },
        {
            "key": "tool-label",
            "title": "工具短标",
            "doc_note": "工具或 Skill 盘点短标，可按内容改为 `TOOL 01` 等。",
            "wrap_body": True,
            "doc_html": """<section style="margin-bottom:28px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">SKILL 1</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">{{名称}}</span>
    </h4>
  </section>
</section>""",
            "preview_html": """<section style="margin-bottom:28px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">SKILL 1</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">工具名称占位</span>
    </h4>
  </section>
</section>""",
        },
        {
            "key": "quote",
            "title": "内容引用",
            "doc_note": "灰色虚线框是本系列保留的视觉特征；引用内容16px／1.8，不缩成注释。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:justify;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{{{引用内容，可嵌入{cl}加粗等内联样式}}}}</span>
  </p>
</section>""",
            "preview_html": """<section style="background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:justify;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">引用内容占位：灰色虚线框保留原杂志质感，内容维持16px与1.8行高。</span>
  </p>
</section>""",
        },
        {
            "key": "oneliner",
            "title": "一句话亮点",
            "doc_note": "居中金句亮点卡片；不把 font-size 和 border-bottom 直接打在 strong 上。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#FFF;border:1px dashed {ul};border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:{p};font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">{{{{亮点内容}}}}</span></span>
  </p>
</section>""",
            "preview_html": f"""<section style="background:#FFF;border:1px dashed {ul};border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:{p};font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">一句话核心亮点占位</span></span>
  </p>
</section>""",
        },
        {
            "key": "oneliner-caption",
            "title": "亮点附短标签",
            "doc_note": "两段式居中亮点卡：上方引导语 + 下方金句。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#FFF;border:1px dashed {ul};border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="font-size:12px;color:#9CA3AF;margin:0 0 6px;line-height:1.5;">
    <span leaf="">{{{{引导语}}}}</span>
  </p>
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:{p};font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">{{{{亮点内容}}}}</span></span>
  </p>
</section>""",
            "preview_html": f"""<section style="background:#FFF;border:1px dashed {ul};border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="font-size:12px;color:#9CA3AF;margin:0 0 6px;line-height:1.5;">
    <span leaf="">引导语占位</span>
  </p>
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:{p};font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">亮点内容占位</span></span>
  </p>
</section>""",
        },
        {
            "key": "subheading",
            "title": "黄色下划线小标题",
            "doc_note": "三级小节标题；可按需加 `margin-top:32px`。",
            "wrap_body": True,
            "doc_html": """<p style="font-size:15px;font-weight:900;color:#111827;margin-bottom:16px;">
  <span style="border-bottom:4px solid #FDE68A;padding:0 4px;"><span leaf="">{{小节标题}}</span></span>
</p>""",
            "preview_html": """<p style="font-size:15px;font-weight:900;color:#111827;margin-bottom:16px;">
  <span style="border-bottom:4px solid #FDE68A;padding:0 4px;"><span leaf="">小节标题占位</span></span>
</p>""",
        },
        {
            "key": "divider",
            "title": "居中金句分隔",
            "doc_note": "章节内观点收束或转折分隔。",
            "wrap_body": True,
            "doc_html": f"""<p style="margin-bottom:20px;text-align:center;color:{p};font-weight:700;letter-spacing:1px;border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;padding:12px 0;font-size:16px;line-height:1.8;">
  <span leaf="">{{{{居中金句}}}}</span>
</p>""",
            "preview_html": f"""<p style="margin-bottom:20px;text-align:center;color:{p};font-weight:700;letter-spacing:1px;border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;padding:12px 0;font-size:16px;line-height:1.8;">
  <span leaf="">居中金句分隔占位</span>
</p>""",
        },
        {
            "key": "warn",
            "title": "风险提示",
            "doc_note": "踩坑与限制提示；正文部分维持16px／1.8。",
            "wrap_body": True,
            "doc_html": """<section style="padding:6px 0 4px;margin-bottom:16px;">
  <p style="margin-bottom:6px;font-size:12px;font-weight:700;color:#9CA3AF;letter-spacing:1px;">
    <span style="color:rgb(255,76,0);"><span leaf="">！踩坑提示 🕳</span></span>
  </p>
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span style="color:rgb(136,136,136);font-weight:bold;"><span leaf="">{{提示内容}}</span></span>
  </p>
</section>""",
            "preview_html": """<section style="padding:6px 0 4px;margin-bottom:16px;">
  <p style="margin-bottom:6px;font-size:12px;font-weight:700;color:#9CA3AF;letter-spacing:1px;">
    <span style="color:rgb(255,76,0);"><span leaf="">！踩坑提示 🕳</span></span>
  </p>
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span style="color:rgb(136,136,136);font-weight:bold;"><span leaf="">踩坑提示内容占位</span></span>
  </p>
</section>""",
        },
        {
            "key": "tip",
            "title": t["tip_title"],
            "doc_note": "轻量正向经验提示；正文部分维持16px／1.8。",
            "wrap_body": True,
            "doc_html": f"""<section style="padding:6px 0 4px;margin-bottom:16px;">
  <p style="margin-bottom:6px;font-size:12px;font-weight:700;color:#9CA3AF;letter-spacing:1px;">
    <span style="color:{p};"><span leaf="">✦ {{{{提示标题}}}}</span></span>
  </p>
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{{{提示内容}}}}</span>
  </p>
</section>""",
            "preview_html": f"""<section style="padding:6px 0 4px;margin-bottom:16px;">
  <p style="margin-bottom:6px;font-size:12px;font-weight:700;color:#9CA3AF;letter-spacing:1px;">
    <span style="color:{p};"><span leaf="">✦ 实用建议占位</span></span>
  </p>
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">主色提示内容占位</span>
  </p>
</section>""",
        },
        {
            "key": "warning",
            "title": "黄色警告",
            "doc_note": "高优先级注意事项或重要前提提示。",
            "wrap_body": True,
            "doc_html": """<section style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
  <p style="color:#92400E;margin:0;font-weight:700;font-size:16px;line-height:1.8;">
    <span leaf="">{{警告内容}}</span>
  </p>
</section>""",
            "preview_html": """<section style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
  <p style="color:#92400E;margin:0;font-weight:700;font-size:16px;line-height:1.8;">
    <span leaf="">重要前提或警告内容占位</span>
  </p>
</section>""",
        },
        {
            "key": "info",
            "title": t["info_title"],
            "doc_note": "主色浅底说明框；正文部分维持16px／1.8。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:{tint};padding:12px 16px;border-radius:8px;border:1px solid {ul};margin-bottom:20px;">
  <p style="color:#374151;margin:0;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">{{{{信息内容}}}}</span>
  </p>
</section>""",
            "preview_html": f"""<section style="background:{tint};padding:12px 16px;border-radius:8px;border:1px solid {ul};margin-bottom:20px;">
  <p style="color:#374151;margin:0;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">信息说明卡片占位，纯色浅底在微信深色模式下更稳妥。</span>
  </p>
</section>""",
        },
        {
            "key": "pill",
            "title": "概念胶囊",
            "doc_note": "仅用作短概念标签，完整列表项用 ordered 或 bullet。",
            "wrap_body": True,
            "doc_html": f"""<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:{p};background:rgba({rgb},0.08);padding:3px 10px;border-radius:999px;"><span style="display:inline-block;width:6px;height:6px;background:{p};border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span><span leaf="">{{{{列表项文字}}}}</span></span>
  </p>
</section>""",
            "preview_html": f"""<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:{p};background:rgba({rgb},0.08);padding:3px 10px;border-radius:999px;"><span style="display:inline-block;width:6px;height:6px;background:{p};border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span><span leaf="">概念胶囊标签</span></span>
  </p>
</section>""",
        },
        {
            "key": "pill-description",
            "title": "概念及正文解释",
            "doc_note": "胶囊短标 + 16px／1.8 正文解释。",
            "wrap_body": True,
            "doc_html": f"""<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:{p};background:rgba({rgb},0.08);padding:3px 10px;border-radius:999px;"><span style="display:inline-block;width:6px;height:6px;background:{p};border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span><span leaf="">{{{{标题}}}}</span></span>
  </p>
  <p style="color:#4B5563;margin:0;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">{{{{描述内容}}}}</span>
  </p>
</section>""",
            "preview_html": f"""<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:{p};background:rgba({rgb},0.08);padding:3px 10px;border-radius:999px;"><span style="display:inline-block;width:6px;height:6px;background:{p};border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span><span leaf="">概念标题占位</span></span>
  </p>
  <p style="color:#4B5563;margin:0;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">对应的详细解释内容占位，保持16px字号与1.8行高。</span>
  </p>
</section>""",
        },
        {
            "key": "flow-cards",
            "title": "三步横排流程卡",
            "doc_note": "三步逻辑串联或流程拆解；每张卡片文字保持精炼短语，箭头 `→` 可按语义改为 `×` 做对比。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#F9FAFB;padding:16px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:24px;">
  <section style="display:flex;align-items:stretch;justify-content:center;gap:6px;">
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:{p};border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{{{步骤1标题}}}}</span>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">
        <span leaf="">{{{{步骤1描述}}}}</span>
      </p>
    </section>
    <section style="display:flex;align-items:center;color:#D1D5DB;font-size:14px;padding:0 4px;flex-shrink:0;">
      <span leaf="">→</span>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{{{步骤2标题}}}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{{{步骤2描述}}}}</span>
      </p>
    </section>
    <section style="display:flex;align-items:center;color:#D1D5DB;font-size:14px;padding:0 4px;flex-shrink:0;">
      <span leaf="">→</span>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid {ul};border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:{p};margin:0 0 3px;">
        <span leaf="">{{{{步骤3标题}}}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{{{步骤3描述}}}}</span>
      </p>
    </section>
  </section>
  <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:12px 0 0;letter-spacing:0.5px;">
    <span leaf="">{{{{底部说明文字}}}}</span>
  </p>
</section>""",
            "preview_html": f"""<section style="background:#F9FAFB;padding:16px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:24px;">
  <section style="display:flex;align-items:stretch;justify-content:center;gap:6px;">
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:{p};border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">输入原稿</span>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">
        <span leaf="">识别结构</span>
      </p>
    </section>
    <section style="display:flex;align-items:center;color:#D1D5DB;font-size:14px;padding:0 4px;flex-shrink:0;">
      <span leaf="">→</span>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">匹配组件</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">校验兼容</span>
      </p>
    </section>
    <section style="display:flex;align-items:center;color:#D1D5DB;font-size:14px;padding:0 4px;flex-shrink:0;">
      <span leaf="">→</span>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid {ul};border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:{p};margin:0 0 3px;">
        <span leaf="">一键复制</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">直贴发文</span>
      </p>
    </section>
  </section>
  <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:12px 0 0;letter-spacing:0.5px;">
    <span leaf="">三步串联，一屏看清方法脉络</span>
  </p>
</section>""",
        },
        {
            "key": "three-col-cards",
            "title": "三列对比卡",
            "doc_note": "轻量三项并列对比或核心指标概览；数据列数多时用 table。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#F9FAFB;padding:16px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:28px;">
  <section style="display:flex;align-items:stretch;justify-content:center;gap:6px;">
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:{p};border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{{{卡片1标题}}}}</span>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">
        <span leaf="">{{{{卡片1描述}}}}</span>
      </p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{{{卡片2标题}}}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{{{卡片2描述}}}}</span>
      </p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{{{卡片3标题}}}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{{{卡片3描述}}}}</span>
      </p>
    </section>
  </section>
</section>""",
            "preview_html": f"""<section style="background:#F9FAFB;padding:16px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:28px;">
  <section style="display:flex;align-items:stretch;justify-content:center;gap:6px;">
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:{p};border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">核心优势</span>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">
        <span leaf="">卡片丰富</span>
      </p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">阅读体验</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">16px / 1.8</span>
      </p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">微信兼容</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">纯色更稳</span>
      </p>
    </section>
  </section>
</section>""",
        },
        {
            "key": "timeline",
            "title": "纵向过程",
            "doc_note": "时间线或案例脉络；最后一个节点可省略竖线。",
            "wrap_body": True,
            "doc_html": f"""<section style="display:flex;margin-bottom:28px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:16px;flex-shrink:0;">
    <section style="width:14px;height:14px;border-radius:50%;border:3px solid {p};background:#fff;margin-top:4px;box-shadow:0 0 0 2px #fff;">
      <span leaf=""><br></span>
    </section>
    <section style="width:2px;background:#E5E7EB;flex:1;margin-top:4px;min-height:48px;">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:12px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">{{{{CASE 01}}}}</span></span>
      <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
        <span leaf="">{{{{标题}}}}</span>
      </h4>
    </section>
    <p style="font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1px;margin:0 0 12px;">
      <span leaf="">{{{{英文副标题}}}}</span>
    </p>
    <p style="margin:0 0 16px;color:#4B5563;text-align:justify;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{内容}}}}</span>
    </p>
  </section>
</section>""",
            "preview_html": f"""<section style="display:flex;margin-bottom:28px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:16px;flex-shrink:0;">
    <section style="width:14px;height:14px;border-radius:50%;border:3px solid {p};background:#fff;margin-top:4px;box-shadow:0 0 0 2px #fff;">
      <span leaf=""><br></span>
    </section>
    <section style="width:2px;background:#E5E7EB;flex:1;margin-top:4px;min-height:48px;">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:12px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">CASE 01</span></span>
      <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
        <span leaf="">阶段标题占位</span>
      </h4>
    </section>
    <p style="font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1px;margin:0 0 12px;">
      <span leaf="">STAGE ONE · 副标题占位</span>
    </p>
    <p style="margin:0 0 16px;color:#4B5563;text-align:justify;font-size:16px;line-height:1.8;">
      <span leaf="">纵向脉络内容占位，维持16px与1.8行高。</span>
    </p>
  </section>
</section>""",
        },
        {
            "key": "tool",
            "title": "工具说明卡",
            "doc_note": "工具或产品特性白底悬浮卡片。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 4px 16px rgba({rgb},0.12);margin-bottom:24px;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{{{说明内容}}}}</span>
  </p>
</section>""",
            "preview_html": f"""<section style="background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 4px 16px rgba({rgb},0.12);margin-bottom:24px;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">工具说明卡片占位：白底搭配主题色柔和投影。</span>
  </p>
</section>""",
        },
        {
            "key": "table",
            "title": "真实数据表",
            "doc_note": "仅数据表，不做布局；表中长说明拆到正文，不靠继续缩字塞下。",
            "wrap_body": True,
            "doc_html": f"""<section style="margin-bottom:24px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr>
        <th style="background:{p};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{{{列标题1}}}}</span></th>
        <th style="background:{p};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{{{列标题2}}}}</span></th>
        <th style="background:{p};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{{{列标题3}}}}</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">{{{{内容}}}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">{{{{内容}}}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">{{{{内容}}}}</span></td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">{{{{内容}}}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">{{{{内容}}}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">{{{{内容}}}}</span></td>
      </tr>
    </tbody>
  </table>
</section>""",
            "preview_html": f"""<section style="margin-bottom:24px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr>
        <th style="background:{p};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">维度</span></th>
        <th style="background:{p};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">方案A</span></th>
        <th style="background:{p};color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">方案B</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">字号</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">16px</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">14px</span></td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">行高</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">1.8</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">1.9</span></td>
      </tr>
    </tbody>
  </table>
</section>""",
        },
        {
            "key": "ordered",
            "title": "有序列表",
            "doc_note": "数字编号列表；项内正文16px／1.8。",
            "wrap_body": True,
            "doc_html": f"""<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">1</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{列表项内容}}}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">2</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{列表项内容}}}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">3</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{列表项内容}}}}</span>
    </p>
  </section>
</section>""",
            "preview_html": f"""<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">1</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">第一条有序列表项占位</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">2</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">第二条有序列表项占位</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">3</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">第三条有序列表项占位</span>
    </p>
  </section>
</section>""",
        },
        {
            "key": "bullet",
            "title": "无序列表",
            "doc_note": "圆点无序列表；项内正文16px／1.8。",
            "wrap_body": True,
            "doc_html": f"""<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{列表项内容}}}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{列表项内容}}}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{{{列表项内容}}}}</span>
    </p>
  </section>
</section>""",
            "preview_html": f"""<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">无序列表项一占位</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">无序列表项二占位</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:{p};color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">无序列表项三占位</span>
    </p>
  </section>
</section>""",
        },
        {
            "key": "dark",
            "title": "深色代码",
            "doc_note": "代码每行一个p，原半角标点与缩进不改；不使用white-space:pre。",
            "wrap_body": True,
            "doc_html": """<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#1E293B;box-shadow:0 4px 16px -8px rgba(15,23,42,0.4);">
  <section style="display:flex;align-items:center;padding:9px 14px;background:#0F172A;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF5F56;margin-right:7px;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FFBD2E;margin-right:7px;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#27C93F;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="margin-left:12px;font-size:12px;color:#64748B;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">python</span></span>
  </section>
  <section style="padding:11px 14px;">
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">def make_skill(name):</span></p>
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">　　return f"已生成 {name}"</span></p>
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">print(make_skill("gzh-design"))</span></p>
  </section>
</section>""",
            "preview_html": """<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#1E293B;box-shadow:0 4px 16px -8px rgba(15,23,42,0.4);">
  <section style="display:flex;align-items:center;padding:9px 14px;background:#0F172A;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF5F56;margin-right:7px;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FFBD2E;margin-right:7px;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#27C93F;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></span>
    <span style="margin-left:12px;font-size:12px;color:#64748B;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">python</span></span>
  </section>
  <section style="padding:11px 14px;">
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">def make_skill(name):</span></p>
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">　　return f"已生成 {name}"</span></p>
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">print(make_skill("gzh-design"))</span></p>
  </section>
</section>""",
        },
        {
            "key": "light",
            "title": "浅色代码",
            "doc_note": "代码每行一个p，原半角标点与缩进不改；不使用white-space:pre。",
            "wrap_body": True,
            "doc_html": f"""<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#F6F8FA;border:1px solid #E5E7EB;border-left:3px solid {p};">
  <section style="padding:7px 14px;border-bottom:1px solid #E5E7EB;">
    <span style="font-size:12px;color:#9CA3AF;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">bash</span></span>
  </section>
  <section style="padding:11px 14px;">
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#24292F;"><span leaf="">npx skills add gzh-design</span></p>
  </section>
</section>""",
            "preview_html": f"""<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#F6F8FA;border:1px solid #E5E7EB;border-left:3px solid {p};">
  <section style="padding:7px 14px;border-bottom:1px solid #E5E7EB;">
    <span style="font-size:12px;color:#9CA3AF;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">bash</span></span>
  </section>
  <section style="padding:11px 14px;">
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#24292F;"><span leaf="">npx skills add gzh-design</span></p>
  </section>
</section>""",
        },
        {
            "key": "image",
            "title": "插图与图注",
            "doc_note": "保留用户给定URL；有说明才加图注，不带占位图发布。",
            "wrap_body": True,
            "doc_html": """<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="图片URL" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
<p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0 0 24px;">
  <span leaf="">— 图片说明文字</span>
</p>""",
            "preview_html": f"""<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="https://placehold.orence.net/600x320/{tint.lstrip('#')}/{p.lstrip('#')}?text=Image+placeholder" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
<p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0 0 24px;">
  <span leaf="">— 图片说明文字</span>
</p>""",
        },
        {
            "key": "gif",
            "title": "动图与图注",
            "doc_note": "保留用户给定URL；有说明才加图注，不带占位图发布。",
            "wrap_body": True,
            "doc_html": f"""<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="动图URL.gif" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
<p style="text-align:center;margin:0 0 24px;">
  <span style="display:inline-block;background:{badge};color:{deep};font-size:11px;font-weight:700;padding:1px 8px;border-radius:4px;margin-right:6px;"><span leaf="">GIF 动图</span></span>
  <span style="font-size:12px;color:#9CA3AF;"><span leaf="">动图说明文字</span></span>
</p>""",
            "preview_html": f"""<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="https://placehold.orence.net/600x320/{tint.lstrip('#')}/{p.lstrip('#')}?text=GIF+placeholder" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
<p style="text-align:center;margin:0 0 24px;">
  <span style="display:inline-block;background:{badge};color:{deep};font-size:11px;font-weight:700;padding:1px 8px;border-radius:4px;margin-right:6px;"><span leaf="">GIF 动图</span></span>
  <span style="font-size:12px;color:#9CA3AF;"><span leaf="">动图说明文字</span></span>
</p>""",
        },
        {
            "key": "pending",
            "title": "居中待补素材",
            "doc_note": "居中静态待补区，不伪装已有图片或视频。",
            "wrap_body": True,
            "doc_html": """<section style="margin:0 0 24px;padding:30px 20px;border:1.5px dashed #DAD7D2;border-radius:14px;background:#FAFAF8;text-align:center;">
  <p style="margin:0 0 10px;font-size:24px;line-height:1;"><span leaf="">🎬</span></p>
  <p style="margin:0;font-size:14px;font-weight:700;color:#9CA3AF;letter-spacing:1px;"><span leaf="">待补素材</span></p>
  <p style="margin:8px 0 0;font-size:13px;color:#B8B5B0;line-height:1.7;"><span leaf="">此处插入：创建 skill 的录屏演示</span></p>
</section>""",
            "preview_html": """<section style="margin:0 0 24px;padding:30px 20px;border:1.5px dashed #DAD7D2;border-radius:14px;background:#FAFAF8;text-align:center;">
  <p style="margin:0 0 10px;font-size:24px;line-height:1;"><span leaf="">🎬</span></p>
  <p style="margin:0;font-size:14px;font-weight:700;color:#9CA3AF;letter-spacing:1px;"><span leaf="">待补素材</span></p>
  <p style="margin:8px 0 0;font-size:13px;color:#B8B5B0;line-height:1.7;"><span leaf="">此处插入：创建 skill 的录屏演示</span></p>
</section>""",
        },
        {
            "key": "author",
            "title": "作者与互动",
            "doc_note": (
                "文末只用一次；默认作者占位，按用户资料填写。点赞、眼睛、转发采用摸鱼绿原版20pxSVG、"
                f"1.8描边和原始路径，仅将转发底座与高亮调为{cl}配色；保留原40px图标底座。"
            ),
            "wrap_body": False,
            "doc_html": f"""<section style="margin:48px 20px 24px;">
<p style="margin:0 0 20px;font-size:14px;line-height:1.9;text-align:justify;">
  <span leaf="">我是{{{{作者名}}}}，{{{{简介}}}}</span>
</p>
<section style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:16px;padding:32px 20px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.03);margin:0 0 24px;">
  <p style="font-size:13px;font-weight:bold;color:#111827;margin-bottom:20px;line-height:1.6;">
    <span leaf="">如果你觉得今天这篇有收获，欢迎点赞、在看、转发三连，我们下篇见</span>
  </p>
  <section style="display:flex;justify-content:center;gap:24px;margin-bottom:16px;">
    <section style="text-align:center;color:#4B5563;">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:#fff;border-radius:12px;box-shadow:0 2px 4px rgba(0,0,0,0.05);border:1px solid #F3F4F6;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">点赞</span></span>
    </section>
    <section style="text-align:center;color:#4B5563;">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:#fff;border-radius:12px;box-shadow:0 2px 4px rgba(0,0,0,0.05);border:1px solid #F3F4F6;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"></circle><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">在看</span></span>
    </section>
    <section style="text-align:center;color:{p};">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:{tint};border-radius:12px;box-shadow:0 2px 4px rgba({rgb},0.15);border:1px solid {ul};">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-4a8 8 0 0 1 8-8h8"></path><polyline points="16 2 20 6 16 10"></polyline></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">转发</span></span>
    </section>
  </section>
  <p style="font-size:10px;color:#9CA3AF;letter-spacing:1px;margin:0;">
    <span leaf="">THANKS FOR READING</span>
  </p>
</section>
</section>""",
            "preview_html": f"""<section style="margin:48px 20px 24px;">
<p style="margin:0 0 20px;font-size:14px;line-height:1.9;text-align:justify;">
  <span leaf="">我是作者名占位，简介占位</span>
</p>
<section style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:16px;padding:32px 20px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.03);margin:0 0 24px;">
  <p style="font-size:13px;font-weight:bold;color:#111827;margin-bottom:20px;line-height:1.6;">
    <span leaf="">如果你觉得今天这篇有收获，欢迎点赞、在看、转发三连，我们下篇见</span>
  </p>
  <section style="display:flex;justify-content:center;gap:24px;margin-bottom:16px;">
    <section style="text-align:center;color:#4B5563;">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:#fff;border-radius:12px;box-shadow:0 2px 4px rgba(0,0,0,0.05);border:1px solid #F3F4F6;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">点赞</span></span>
    </section>
    <section style="text-align:center;color:#4B5563;">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:#fff;border-radius:12px;box-shadow:0 2px 4px rgba(0,0,0,0.05);border:1px solid #F3F4F6;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"></circle><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">在看</span></span>
    </section>
    <section style="text-align:center;color:{p};">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:{tint};border-radius:12px;box-shadow:0 2px 4px rgba({rgb},0.15);border:1px solid {ul};">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-4a8 8 0 0 1 8-8h8"></path><polyline points="16 2 20 6 16 10"></polyline></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">转发</span></span>
    </section>
  </section>
  <p style="font-size:10px;color:#9CA3AF;letter-spacing:1px;margin:0;">
    <span leaf="">THANKS FOR READING</span>
  </p>
</section>
</section>""",
        },
    ]


def render_markdown(t: dict) -> str:
    """生成指定主题的 Markdown 组件库文件。"""
    tid = t["id"]
    name = t["name"]
    cl = t["color_label"]
    p = t["primary"]
    s = t["secondary"]
    g_end = t["gradient_end"]
    tint = t["tint_bg"]
    badge = t["badge_bg"]
    deep = t["deep_text"]
    ul = t["underline"]
    neg = t["negative_border"]

    components = build_components(t)
    comp_map = {c["key"]: c for c in components}

    lines = [
        f"# 公众号排版组件库 —— {name}",
        "",
        f"基于「摸鱼绿」杂志卡片风融合升级的{cl}配色模板{t['legacy_note']}，保留杂志封面、横滑精选导读、编号章节、三步流程卡、三列对比卡与灰色虚线引用特征，并统一采用手机舒适阅读参数 16px／1.8。",
        "",
        f"- 标识：`{tid}`；适合{t['description']}。",
        f"- [完整组件预览](../assets/theme-previews/theme-{tid}.html)。正式组件以本文件为准，不在生成时再次临时全局换色。",
        "- [阅读参数](reading-typography.md)：正文、列表、步骤说明与内容引用默认 16px／1.8；用户确认的阅读参数优先。不将个人手机试读结果写成微信官方标准。",
        "- 文末保留摸鱼绿原版点赞／眼睛／转发 SVG 路径，仅调整主题主色与浅底底座；不替换为“赞／看／享”字符。文字和卡片背景默认使用纯色，避免触发微信 `darkmode-no-gradient` 检测。",
        "",
        "## 设计变量速查表",
        "",
        "| 参数 | 值 |",
        "|---|---|",
        f"| 主色／辅色 | {p}／{s} |",
        f"| 浅底／浅标 | {tint}／{badge} |",
        f"| 深字／标题／正文 | {deep}／#111827／#374151 |",
        f"| 关键词下划线 | border-bottom:2px solid {ul};font-weight:600; |",
        f"| 否定对比下划线 | border-bottom:2px solid {neg}; |",
        f"| 装饰渐变 | {p} → {g_end}（仅用于无文字细短线） |",
        "| 黄色荧光笔／底部高亮 | #FEF3C7（纯色浅底）／#FDE68A（底部粗线） |",
        "| 分隔／边框 | #D1D5DB／#E5E7EB |",
        "| 正文、列表、内容引用 | 16px；line-height:1.8 |",
        "| 正文段后／字距 | 20px／0.5px |",
        "| 内容左右边距／最大宽度 | 20px／677px |",
        "| 封面／章标题／装饰序号 | 24px／17px／24px |",
        "| 署名／图注／目录短标题 | 保留组件辅助层级，不按正文倍率放大 |",
        "",
        "字体栈：`-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif`。正文两端对齐；手机上若出现明显字缝，按用户反馈单独评估左对齐，不随字号变更默认重做。",
        "",
        "## 各组件完整 HTML",
        "",
        "cover、toc、chapter、author 自带边距，直接放全局容器；plain 等正文组件放前言容器或 chapter 内，不重复加 20px 边距。行内样式只插入段落，不独立撑开一块。",
        "",
    ]

    for comp in components:
        lines.extend(
            [
                f"### {comp['key']} · {comp['title']}",
                "",
                comp["doc_note"],
                "",
                "```html",
                comp["doc_html"],
                "```",
                "",
            ]
        )

    skeleton_html = "\n".join(
        [
            """<section style="max-width:677px;margin:0 auto;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#374151;line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;text-align:left;">""",
            comp_map["cover"]["doc_html"],
            comp_map["toc"]["doc_html"],
            """<section style="margin:0 20px 32px;">""",
            comp_map["plain"]["doc_html"],
            comp_map["oneliner"]["doc_html"],
            "</section>",
            f"""<section style="margin-top:16px;margin-bottom:32px;padding:0 20px;">
  <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:24px;font-weight:900;color:{p};line-height:1;letter-spacing:-2px;">
        <span leaf="">{{{{章节编号}}}}</span>
      </p>
      <p style="margin:0;font-size:8px;font-weight:700;color:#D1D5DB;letter-spacing:2px;">
        <span leaf="">PART</span>
      </p>
    </section>
    <span style="width:1px;height:36px;background:#E5E7EB;flex-shrink:0;"><span leaf=""><br></span></span>
    <section>
      <p style="margin:0 0 1px;font-size:17px;font-weight:900;color:#111827;letter-spacing:0.3px;">
        <span leaf="">{{{{中文标题}}}}</span>
      </p>
      <p style="margin:0;font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1.5px;">
        <span leaf="">{{{{ENGLISH · 英文副标题}}}}</span>
      </p>
    </section>
  </section>""",
            comp_map["plain"]["doc_html"],
            comp_map["quote"]["doc_html"],
            comp_map["plain"]["doc_html"],
            "</section>",
            "<!-- 后续章节按原文顺序重复（margin-top 改为 48px） -->",
            comp_map["author"]["doc_html"],
            "</section>",
        ]
    )

    lines.extend(
        [
            "## 完整文章模板骨架",
            "",
            "封面 → 三条精选导读 → 可选开头金句／前言 → 按序章节 → 唯一作者与互动。导读在前言之前，不为了凑目录编造章节。",
            "",
            "```html",
            skeleton_html,
            "```",
            "",
            "## 文章类型 → 组件组合配方",
            "",
            "所有类型共用 cover、toc、chapter、author；点缀组件种类每篇不超过 3 种，文章本有的代码和媒体仍完整保留。",
            "",
            "| 类型 | 核心 | 点缀 |",
            "|---|---|---|",
            "| 教程／操作 | step、ordered、dark 或 light | warn、info、flow-cards |",
            "| 工具／清单 | tool-label、tool、bullet | table、oneliner、three-col-cards |",
            "| 观点／深度分析 | plain、quote、oneliner | divider、subheading、highlight |",
            "| 访谈／人物 | plain、quote、timeline | image、oneliner |",
            "| 数据／报告 | three-col-cards、table、ordered | info、highlight |",
            "| 生活／随笔 | plain、oneliner | quote、divider |",
            "| 案例实战 | case、step、timeline | warning、flow-cards、image |",
            "",
            "## Markdown → 组件映射规则",
            "",
            "| 元素 | 组件／处理 |",
            "|---|---|",
            "| 文章标题 | 微信标题栏；cover 提炼另一个视角，不照搬长外标题 |",
            "| 开头引言 | oneliner 或 plain |",
            "| 二级标题 | chapter，01／02／03，只有结语才用 /// 和 LAST |",
            "| 三级标题 | subheading |",
            "| 普通段落 | plain＋underline 关键词，按需 strong |",
            "| 加粗／高亮／下划线／删除线 | strong／highlight／underline／strike，行内强调继承正文 |",
            "| 引用／补充说明 | quote 或 info，完整句子 16px／1.8 |",
            "| 有序／无序列表 | ordered／bullet |",
            "| 步骤／案例 | step／case＋plain |",
            "| 流程串联／三项对比 | flow-cards／three-col-cards |",
            "| 代码、命令、Prompt | dark 或 light；每行一个 `<p style=\"margin:0\">`，禁用 `white-space:pre` |",
            "| 行内代码 | inline |",
            "| Markdown 数据表 | table |",
            "| 图片／GIF | image／gif；没有说明就删图注 |",
            "| 待补素材／视频 | pending，静态提示；真实视频到微信编辑器补入 |",
            "| 链接 | 保留原文 URL 与文字，成文检查微信外链限制，不制造新链接 |",
            "| 分隔线 | 章节留白或细线，不连续堆叠分隔卡 |",
            "| 作者与互动 | author，一处署名一处互动，不加默认账号括号 |",
            "",
            "## 维护验证",
            "",
            "本文件与预览 HTML 均由 `scripts/generate_magazine_themes.py` 统一生成，改动请修改脚本后重新生成，不要手工单改一端。",
            "先跑 `component_lint.py`，再跑 `validate_gzh_html.py`。quote 的灰色虚线框属于明确保留的主题特征，源头检查可能提示风格 WARN，不能为清除该提示改掉已确认的引用外观。产物需无 ERROR、无文字包裹／标点 WARNING；再检查手机正文 16px／1.8、标题层级和卡片换行。",
            "",
        ]
    )

    return "\n".join(lines)


def render_preview_html(t: dict) -> str:
    """生成指定主题的完整组件预览 HTML。"""
    tid = t["id"]
    name = t["name"]
    p = t["primary"]
    components = build_components(t)

    header = [
        f"<!-- THEME-NAME: {name} -->",
        f"<!-- THEME-ID: theme-{tid} -->",
        f"<!-- THEME-COLOR: {p} -->",
        "<!-- THEME-BODY-FONT-SIZE: 16px -->",
        "<!-- THEME-BODY-LINE-HEIGHT: 1.8 -->",
    ]

    blocks = []
    for idx, comp in enumerate(components, start=1):
        num = f"{idx:02d}"
        inner = comp["preview_html"]
        if comp.get("wrap_inline"):
            inner = (
                '<p style="margin:0 0 20px;font-size:16px;line-height:1.8;'
                'text-align:justify;color:#374151;">'
                f"{inner}</p>"
            )
        if comp.get("wrap_body"):
            inner = f'<section style="margin:0 20px;">{inner}</section>'

        block = (
            f"<!-- Block: {comp['title']} -->\n"
            f'<section id="block-{tid}-{comp["key"]}" '
            'style="max-width:677px;margin:0 auto 34px;background:#FFFFFF;'
            "padding:22px 0;border-bottom:1px solid #E5E7EB;"
            "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;"
            'color:#374151;line-height:1.75;letter-spacing:0.5px;">'
            '<p style="margin:0 20px 18px;font-size:11px;color:#6B7280;">'
            f'<span leaf="">{num} ／ {comp["title"]} · 组件示意</span></p>'
            f"{inner}</section>"
        )
        blocks.append(block)

    return "\n".join(header + blocks) + "\n"


def main() -> None:
    """生成全部杂志卡片风配色组件库与预览 HTML。"""
    REFERENCES_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    for theme in THEMES:
        tid = theme["id"]
        md_path = REFERENCES_DIR / f"theme-{tid}.md"
        html_path = PREVIEWS_DIR / f"theme-{tid}.html"
        md_path.write_text(render_markdown(theme), encoding="utf-8")
        html_path.write_text(render_preview_html(theme), encoding="utf-8")
        print(f"Generated {theme['name']} ({tid}): {md_path.name}, {html_path.name}")


if __name__ == "__main__":
    main()
