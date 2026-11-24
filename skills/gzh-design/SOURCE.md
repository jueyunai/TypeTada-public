# 来源与维护

导入日期：2026-11-12。来源为维护者本地维护的 gzh-design-skill 扩展版，原项目 https://github.com/isjiamu/gzh-design-skill ，原作者甲木 × 摸鱼小李，保留 AGPL-3.0-or-later LICENSE。

此包含九套已登记主题、本地增强校验/复制逻辑，不冒充旧上游 commit 750a50d 原版。首次接入使用本机现有组件和 gallery 作为可复用候选；用户已认可现有 Skill 效果，但尚未指认某份原稿/HTML 为特定验收样本。产品示例明确标作上游样例，不作为用户稿件或真实模型新产物。

2026-11-18 更新：同步本机最新 gzh-design-skill 中的 `moyu-blue` 导读自适应宽、原版尾卡 SVG 图标与封面独立导语提炼及杂志信息层次规则（同步更新 `theme-moyu-blue.html` 真实封面样张文案与 `eval-cases.md`），并统一排查补齐多套主题中百分比/自适应容器的 `box-sizing:border-box` 与微信深色模式文字纯色高亮，扩充 `wechat_compat.py` 的 `#1.4 width` 与零宽字符检测。

规则/样式在此目录维护。v0.6 静态构建从登记包生成主题规则文件并计算内容哈希，页面任务冻结所需规则，结果保存HTML和包哈希；不再写入data/skill-snapshots或调用server适配器。历史v0.5方式见Git609e1a9。新增主题同步索引/预览素材并构建回归；运行时不执行包内Python脚本。原脚本/复制模板/许可继续保留。
