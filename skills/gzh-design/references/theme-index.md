# 主题索引与选择决策表

本表是主题信息的**单一来源**。工作流第 1 步据此向用户展示选项，第 2 步据"组件库文件"列读取对应库，下划线标记时据"正文下划线 CSS"列取值。

每个主题的**英文标识**（用于产物命名 `{中文名}({标识}).html`、Agent 引用）= "组件库文件"列去掉 `theme-` 前缀与 `.md` 后缀。展示给用户仍用中文名。

## 已注册主题

| 主题 | 主色 | 适用场景 | 组件库文件 | 正文下划线 CSS |
|------|------|---------|-----------|---------------|
| 摸鱼绿 | `#059669` emerald | 教程、测评、清单、工具盘点（卡片丰富、信息密度高，默认推荐） | `references/theme-moyu-green.md` | `border-bottom:2px solid #A7F3D0;font-weight:600;` |
| 红白色系 | `#DC2626` 正红 | 深度分析、观点、力量感话题（经典编辑风，编号章节+引言卡+签名区，红色克制点睛） | `references/theme-red-white.md` | `border-bottom:2px solid #FECACA;font-weight:600;` |
| 石墨极简风 | `#52525B` 石墨灰 | 设计、科技评论、专业观点、高端品牌（极简克制、留白理性、全灰阶） | `references/theme-graphite-minimal.md` | `border-bottom:2px solid #52525B;font-weight:600;` |
| 留白禅意风 | `#4A5D52` 墨绿 | 禅意冥想、极简生活、深度随笔、艺术留白（呼吸感最强） | `references/theme-zen-whitespace.md` | `border-bottom:1.5px solid #B5C8BC;font-weight:500;` |
| 摸鱼票据风 | `#059669` emerald | 测评、工具对比、创意评测（票据/门票视觉隐喻，星级评分+编号+硬阴影卡片） | `references/theme-moyu-ticket.md` | `border-bottom:2px solid #A7F3D0;font-weight:600;` |
| 橄榄手记 | `#1e1f23` 墨黑（配橙 `#ed7b2f`） | 内刊手记、深度评测、案例复盘、系统性说明文档（编辑部内刊质感，分节形式多样，信息密度偏高） | `references/theme-olive-journal.md` | `border-bottom:2px solid #ed7b2f;font-weight:600;` |
| 向前一格 | `#245BD6` 清蓝 | 产品实践、科技观察、案例复盘（阶形标识、一体浅蓝封面、轻量分节） | `references/theme-forward-step.md` | `border-bottom:2px solid #CDDEFF;font-weight:600;` |
| 小步生长 | `#087F74` 青绿 | 成长记录、深度随笔、个人实践（芽点刊头、白底、浅杏高亮、柔和引文） | `references/theme-little-growth.md` | `border-bottom:2px solid #C8E9DB;font-weight:600;` |
| 晴空手记 | `#2563EB` 明蓝 | 教程、测评、工具清单、产品实践（明蓝杂志风，16px/1.8 舒适阅读，卡片与横滑导读齐全） | `references/theme-moyu-blue.md` | `border-bottom:2px solid #BFDBFE;font-weight:600;` |
| 鸢尾快讯 | `#7C3AED` 紫罗兰 | AI 与大模型评测、新工具盘点、前沿科技（紫罗兰杂志风，配暖黄高亮辨识度强） | `references/theme-iris-dispatch.md` | `border-bottom:2px solid #DDD6FE;font-weight:600;` |
| 铅字刊物 | `#1E293B` 炭墨黑 | 商业观察、深度复盘、极客教程（炭墨黑配暖黄荧光笔，沉稳百搭不挑题材） | `references/theme-lead-journal.md` | `border-bottom:2px solid #CBD5E1;font-weight:600;` |
| 落日工坊 | `#C2410C` 赤陶橙 | 实战经验、运营增长、独立开发与副业分享（赤陶暖橙杂志风，温暖有行动力） | `references/theme-sunset-studio.md` | `border-bottom:2px solid #FED7AA;font-weight:600;` |
| 绯莓微刊 | `#BE123C` 复古莓红 | 好物种草、产品体验、热点解读与清单盘点（复古莓红轻快卡片风，与严肃编辑风区隔） | `references/theme-berry-digest.md` | `border-bottom:2px solid #FECDD3;font-weight:600;` |

## 选择建议

- **自动推荐、用户确认**：用户未指定时，按题材推荐最贴合的一套并给少量备选；用户要求“看全部”时展示本表全部主题，不把推荐当作已确认。与 SKILL.md 第 1 步一致。
- 全自动模式（用户明说"直接排"）才自动选：默认第一行主题，题材明显契合其它主题时选契合项并在交付时说明理由。
- 同一篇文章只用一套主题，不混搭。

## 阅读参数与预览

向前一格、小步生长、晴空手记（原摸鱼蓝）、鸢尾快讯、铅字刊物、落日工坊、绯莓微刊采用正文16px、行高1.8的默认阅读参数，具体分工与覆盖规则见 [reading-typography.md](reading-typography.md)。原有主题保留原默认值，用户确认的阅读参数可覆盖；不批量放大标题或装饰。

- [向前一格组件预览](../assets/theme-previews/theme-forward-step.html)
- [小步生长组件预览](../assets/theme-previews/theme-little-growth.html)
- [晴空手记组件预览](../assets/theme-previews/theme-moyu-blue.html)
- [鸢尾快讯组件预览](../assets/theme-previews/theme-iris-dispatch.html)
- [铅字刊物组件预览](../assets/theme-previews/theme-lead-journal.html)
- [落日工坊组件预览](../assets/theme-previews/theme-sunset-studio.html)
- [绯莓微刊组件预览](../assets/theme-previews/theme-berry-digest.html)

## 下划线色值的权威性

正文关键词下划线一律用上表"正文下划线 CSS"列的值。组件库里可能有浅色下划线变体，那是可选样式；**正文关键词标记以本表为单一权威来源**，避免双轨。

## 新主题登记流程

1. 把主题组件库写入 `references/theme-{英文标识}.md`（格式要求见 SKILL.md「添加新主题的规范」）。
2. 在上表登记一行；首个/最常用主题放第一行作为默认推荐。
3. 跑 `python3 scripts/component_lint.py .` 确认 0 ERROR。

> 用户想要全新风格时，可走 `references/theme-generator.md` 的自定义主题生成流程：按偏好/参考图生成区块库（预览存 `assets/theme-previews/`），确认后转标准主题库并按上面流程登记。
