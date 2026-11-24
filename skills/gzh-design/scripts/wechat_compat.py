"""共享微信对齐／深色模式／宽度溢出检查，只解析内联样式，不模拟微信渲染。"""

import re
from html.parser import HTMLParser

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
SKIP_TAGS = {"head", "style", "script", "template"}
TABLE_TAGS = {"table", "thead", "tbody", "tr", "th", "td", "col", "colgroup"}
GRADIENT = re.compile(r"(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(", re.I)
PHYSICAL_ALIGN = {"left", "right", "center", "justify"}
ZERO_WIDTH = re.compile(r"[\u200b-\u200d\ufeff]")
FIXED_PX_WIDTH = re.compile(r"^(\d+(?:\.\d+)?)px$")
MARGIN_ZERO = {"0", "0px", "auto"}

WIDTH_PROPS = {
    "width", "box-sizing", "flex-shrink",
    "margin", "margin-left", "margin-right",
    "padding", "padding-left", "padding-right",
    "border", "border-left", "border-right",
    "border-width", "border-left-width", "border-right-width",
}


def _nonzero_dim(token):
    return token not in MARGIN_ZERO and bool(re.search(r"[1-9]", token))


def _has_horizontal_box_extra(style):
    for key in ("padding-left", "padding-right"):
        if key in style and _nonzero_dim(style[key]):
            return True
    if "padding" in style:
        parts = style["padding"].split()
        horiz = parts[1] if len(parts) >= 2 else parts[0]
        if _nonzero_dim(horiz) or (len(parts) == 4 and _nonzero_dim(parts[3])):
            return True
    for key in ("border", "border-left", "border-right", "border-width", "border-left-width", "border-right-width"):
        val = style.get(key, "")
        if val and val not in {"0", "0px", "none"} and re.search(r"\d", val):
            if re.search(r"[1-9]", val):
                return True
    return False


def _has_horizontal_margin(style):
    if _nonzero_dim(style.get("margin-left", "0")) or _nonzero_dim(style.get("margin-right", "0")):
        return True
    if "margin" in style:
        parts = style["margin"].split()
        if len(parts) == 1 and _nonzero_dim(parts[0]):
            return True
        if len(parts) >= 2 and (_nonzero_dim(parts[1]) or (len(parts) == 4 and _nonzero_dim(parts[3]))):
            return True
    return False


def style_values(style):
    """取相关声明的最终值，识别!important和简写覆盖。"""
    values = {}
    priorities = {}
    tracked = {"text-align", "background", "background-image"} | WIDTH_PROPS
    for declaration in style.split(";"):
        if ":" not in declaration:
            continue
        key, value = declaration.split(":", 1)
        key = key.strip().lower()
        if key not in tracked:
            continue
        value = value.strip()
        important = bool(re.search(r"!\s*important\s*$", value, re.I))
        value = re.sub(r"!\s*important\s*$", "", value, flags=re.I).strip().lower()
        target = "background-image" if key == "background" else key
        if priorities.get(target, False) and not important:
            continue
        priorities[target] = important
        values[target] = value
    return values


class CompatibilityChecker(HTMLParser):
    def __init__(self, check_root=False):
        super().__init__(convert_charrefs=True)
        self.check_root = check_root
        self.stack = []
        self.nodes = []

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        parent = self.stack[-1] if self.stack else None
        node = {
            "tag": tag,
            "style": style_values(ad.get("style", "") or ""),
            "line": self.getpos()[0],
            "text": False,
            "ignore_width": "data-ignore-width" in ad,
            "skip": tag in SKIP_TAGS or bool(parent and parent["skip"]),
            "root": parent is None,
        }
        self.nodes.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        # 剔除零宽字符占位符，避免 1px 渐变装饰线误判为含文字容器
        if not ZERO_WIDTH.sub("", data).strip() or not self.stack or self.stack[-1]["skip"]:
            return
        for node in self.stack:
            node["text"] = True

    def findings(self):
        found = []
        for node in self.nodes:
            if node["skip"]:
                continue
            where = f"第{node['line']}行 <{node['tag']}>"
            align = node["style"].get("text-align")
            if align in {"start", "end"}:
                found.append(("ERROR", f"text-align-logical：{where} 使用{align}，"
                              "改用left／right／center／justify以避免微信跨端对齐差异"))
            if (self.check_root and node["root"] and node["text"]
                    and align not in PHYSICAL_ALIGN and align not in {"start", "end"}):
                found.append(("WARN", f"root-text-align：{where} 未明确物理对齐值，"
                              "浏览器默认可能为start；在文章外层显式设置text-align:left"))
            if node["text"] and GRADIENT.search(node["style"].get("background-image", "")):
                found.append(("WARN", f"darkmode-no-gradient：{where} 的渐变背景包含文字，"
                              "微信深色模式可能转为纯色；优先纯色背景或border-bottom"))
            if not node["ignore_width"]:
                w = node["style"].get("width", "")
                bs = node["style"].get("box-sizing", "")
                if w == "100%" and _has_horizontal_margin(node["style"]):
                    found.append(("WARN", f"width-overflow：{where} 同时设置width:100%与左右margin，"
                                  "易触发微信#1.4 width水平溢出；改用默认流式宽度或外层padding"))
                elif w.endswith("%") and _has_horizontal_box_extra(node["style"]) and bs != "border-box":
                    found.append(("WARN", f"width-border-box：{where} 使用width:{w}搭配padding/border但缺少"
                                  "box-sizing:border-box，易在微信端超宽溢出"))
                elif node["text"] and node["tag"] not in TABLE_TAGS:
                    m = FIXED_PX_WIDTH.match(w)
                    if m and float(m.group(1)) > 120:
                        found.append(("WARN", f"width-fixed-large：{where} 使用固定像素width:{w}，"
                                      "小屏或横滑场景易触发微信#1.4 width溢出；改用width:auto;min-width或自适应布局"))
        return found


def check_compatibility(html, check_root=False):
    checker = CompatibilityChecker(check_root=check_root)
    checker.feed(html)
    checker.close()
    return checker.findings()
