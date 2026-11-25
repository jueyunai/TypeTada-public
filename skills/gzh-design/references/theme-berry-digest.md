# 公众号排版组件库 —— 绯莓微刊

基于「摸鱼绿」杂志卡片风融合升级的复古莓红配色模板，保留杂志封面、横滑精选导读、编号章节、三步流程卡、三列对比卡与灰色虚线引用特征，并统一采用手机舒适阅读参数 16px／1.8。

- 标识：`berry-digest`；适合好物种草、产品体验、热点解读与清单盘点（复古莓红轻快卡片风，与严肃编辑风区隔）。
- [完整组件预览](../assets/theme-previews/theme-berry-digest.html)。正式组件以本文件为准，不在生成时再次临时全局换色。
- [阅读参数](reading-typography.md)：正文、列表、步骤说明与内容引用默认 16px／1.8；用户确认的阅读参数优先。不将个人手机试读结果写成微信官方标准。
- 文末保留摸鱼绿原版点赞／眼睛／转发 SVG 路径，仅调整主题主色与浅底底座；不替换为“赞／看／享”字符。文字和卡片背景默认使用纯色，避免触发微信 `darkmode-no-gradient` 检测。

## 设计变量速查表

| 参数 | 值 |
|---|---|
| 主色／辅色 | #BE123C／#E11D48 |
| 浅底／浅标 | #FFF1F2／#FFE4E6 |
| 深字／标题／正文 | #9F1239／#111827／#374151 |
| 关键词下划线 | border-bottom:2px solid #FECDD3;font-weight:600; |
| 否定对比下划线 | border-bottom:2px solid #94A3B8; |
| 装饰渐变 | #BE123C → #FB7185（仅用于无文字细短线） |
| 黄色荧光笔／底部高亮 | #FEF3C7（纯色浅底）／#FDE68A（底部粗线） |
| 分隔／边框 | #D1D5DB／#E5E7EB |
| 正文、列表、内容引用 | 16px；line-height:1.8 |
| 正文段后／字距 | 20px／0.5px |
| 内容左右边距／最大宽度 | 20px／677px |
| 封面／章标题／装饰序号 | 24px／17px／24px |
| 署名／图注／目录短标题 | 保留组件辅助层级，不按正文倍率放大 |

字体栈：`-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif`。正文两端对齐；手机上若出现明显字缝，按用户反馈单独评估左对齐，不随字号变更默认重做。

## 各组件完整 HTML

cover、toc、chapter、author 自带边距，直接放全局容器；plain 等正文组件放前言容器或 chapter 内，不重复加 20px 边距。行内样式只插入段落，不独立撑开一块。

### cover · 复古莓红杂志封面

沿用已确认无图封面的杂志编排。公众号标题栏负责提出问题，封面负责用正文已有的核心判断、变化或阅读价值写一句独立导语；不把文章标题拆两行再放进卡片。例如，外标题《我不想再比价了：AI助理该替我省什么？》可提炼为“把麻烦交给AI／把生活的滋味留给自己”。封面提炼不改正文、原文标题或结尾。

保留“栏目＋细线／月份→两行导语→装饰短线＋关键词→主色来源条＋主题标签”的层次。栏目和主题标签可据文章内容提炼，不视为需要外部核实的事实；来源条优先填原文已说明的活动或系列，缺少时再用已知作者品牌。日期优先使用作者确认的刊期；无指定刊期可用实际时钟取得的排版月份，不能把它当作活动日期或发布日。不确定的字段单独省略，不因缺少显式元数据而删掉整条刊头或所有主题标签。保留已确认的字号、留白及纯色文字背景，不为恢复层次重加有文字的渐变。

```html
<section style="margin:0 0 32px;background:#fff;border:1.5px solid rgba(190,18,60,0.15);border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);width:100%;box-sizing:border-box;">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="width:6px;height:6px;background:#BE123C;border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:#BE123C;"><span leaf="">{{栏目标签}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,rgba(190,18,60,0.12),transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:#D1D5DB;font-weight:600;"><span leaf="">{{日期}}</span></span>
    </section>
    <section>
      <p style="font-size:24px;font-weight:900;color:#111827;margin:0;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{{主标题前半}}</span>
        <span style="color:#BE123C;"><span leaf="">{{主色词}}</span></span>
      </p>
      <p style="font-size:24px;font-weight:900;color:#BE123C;margin:0 0 16px;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{{主标题第二行}}</span>
      </p>
      <section style="width:48px;height:3px;background:linear-gradient(to right,#BE123C,#FB7185);border-radius:2px;margin-bottom:12px;">
        <span leaf=""><br></span>
      </section>
      <p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;letter-spacing:0.5px;">
        <span leaf="">{{副标题关键词}}</span>
      </p>
    </section>
  </section>
  <section style="background:#BE123C;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{主题或品牌}}</span>
    </p>
    <section style="display:flex;gap:4px;">
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{{标签一}}</span></span>
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{{标签二}}</span></span>
    </section>
  </section>
</section>
```

### toc · 横滑精选导读

紧跟封面、位于前言之前；只选三条看点，按实际数量改说明，不补造“写在最后”。

卡片采用inline-block、width:auto、min-width:144px和显式border-box，按短标题与说明的实际内容撑宽；卡片内部nowrap保留三行结构，父容器负责横滑。三张卡片使用相同内边距与1px边框，不再固定110px内容宽度。长说明应移入正文，避免把段落塞进导读。

```html
<section style="margin:0 20px 32px;">
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
    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#BE123C;border:1px solid #BE123C;border-radius:12px;padding:12px;margin-right:8px;">
      <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.75);letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 01</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{看点一标题}}</span>
      </p>
      <p style="font-size:10px;color:rgba(255,255,255,0.75);margin:0;">
        <span leaf="">{{看点一说明}}</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 02</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{看点二标题}}</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">{{看点二说明}}</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 03</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{看点三标题}}</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">{{看点三说明}}</span>
      </p>
    </section>
  </section>
</section>
```

### chapter · 编号章节

首章margin-top改16px，其余48px；编号01／02／03，只有结语章才用///与LAST。装饰序号统一24px，此组件含正文20px边距，章内不再套一层。

```html
<section style="margin-top:48px;margin-bottom:32px;padding:0 20px;">
  <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:24px;font-weight:900;color:#BE123C;line-height:1;letter-spacing:-2px;">
        <span leaf="">{{章节编号}}</span>
      </p>
      <p style="margin:0;font-size:8px;font-weight:700;color:#D1D5DB;letter-spacing:2px;">
        <span leaf="">PART</span>
      </p>
    </section>
    <span style="width:1px;height:36px;background:#E5E7EB;flex-shrink:0;"><span leaf=""><br></span></span>
    <section>
      <p style="margin:0 0 1px;font-size:17px;font-weight:900;color:#111827;letter-spacing:0.3px;">
        <span leaf="">{{中文标题}}</span>
      </p>
      <p style="margin:0;font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1.5px;">
        <span leaf="">{{ENGLISH · 英文副标题}}</span>
      </p>
    </section>
  </section>

  <!-- 本章节正文内容放在这里 -->

</section>
```

### plain · 正文段落

默认16px／1.8；每段关键词用underline，强调继承大小。

```html
<p style="margin:0 0 20px;font-size:16px;line-height:1.8;text-align:justify;color:#374151;"><span leaf="">{{正文内容}}</span></p>
```

### strong · 主色加粗

核心概念、关键结论或产品名；替换占位内容，按语义使用，不新增原文事实。

```html
<strong style="color:#BE123C;"><span leaf="">文字</span></strong>
```

### tint · 主色浅底强调

纯色极浅主色底纹标签；替换占位内容，按语义使用，不新增原文事实。

```html
<strong style="color:#BE123C;background:rgba(190,18,60,0.1);padding:0 4px;border-radius:2px;"><span leaf="">文字</span></strong>
```

### highlight · 黄色荧光笔高亮

一段话中最想让读者注意的短语（纯色浅黄荧光笔底色），每段不超过 1-2 处。

```html
<span style="background:#FEF3C7;padding:1px 4px;border-radius:3px;font-weight:600;color:#111827;"><span leaf="">文字</span></span>
```

### yellow-line · 黄色底部高亮

重点短句底部粗黄线标注；替换占位内容，按语义使用，不新增原文事实。

```html
<span style="color:#111827;font-weight:bold;border-bottom:3px solid #FDE68A;"><span leaf="">文字</span></span>
```

### underline · 正文关键词下划线

次要强调与正文关键词默认标记，色值以 theme-index.md 为单一来源。

```html
<span style="border-bottom:2px solid #FECDD3;font-weight:600;"><span leaf="">文字</span></span>
```

### negative · 对比下划线

用于对比、否定或警示差异点；不用于普通正向强调。

```html
<span style="border-bottom:2px solid #94A3B8;"><span leaf="">文字</span></span>
```

### inline · 行内代码

行内命令、变量或文件名标记；内部半角符号保持原样。

```html
<span style="background:#F3F4F6;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:600;"><span leaf="">code</span></span>
```

### keyword · 获取方式标签

用于文末关键词回复或工具获取入口提示。

```html
<span style="background:#FDE68A;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:700;"><span leaf="">「关键词」</span></span>
```

### strike · 删除线

用于被替代或淘汰的旧做法。

```html
<span style="background:#F3F4F6;color:#6B7280;padding:2px 6px;border-radius:4px;text-decoration:line-through;font-weight:600;"><span leaf="">旧词</span></span>
```

### step · 步骤说明

标签和步骤标题保留原大小，步骤完整说明16px／1.8。

```html
<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">STEP 01</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">{{步骤标题}}</span>
    </h4>
  </section>
  <p style="margin:0 0 16px;color:#4B5563;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">{{步骤内容}}</span>
  </p>
</section>
```

### case · 案例短标

案例分节标题；下方接 plain 正文或卡片。

```html
<section style="margin-bottom:28px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#E5E7EB;color:#6B7280;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">CASE 01</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">{{案例标题}}</span>
    </h4>
  </section>
  <!-- 案例内容 -->
</section>
```

### tool-label · 工具短标

工具或 Skill 盘点短标，可按内容改为 `TOOL 01` 等。

```html
<section style="margin-bottom:28px;">
  <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">SKILL 1</span></span>
    <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
      <span leaf="">{{名称}}</span>
    </h4>
  </section>
</section>
```

### quote · 内容引用

灰色虚线框是本系列保留的视觉特征；引用内容16px／1.8，不缩成注释。

```html
<section style="background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:justify;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{引用内容，可嵌入复古莓红加粗等内联样式}}</span>
  </p>
</section>
```

### oneliner · 一句话亮点

居中金句亮点卡片；不把 font-size 和 border-bottom 直接打在 strong 上。

```html
<section style="background:#FFF;border:1px dashed #FECDD3;border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:#BE123C;font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">{{亮点内容}}</span></span>
  </p>
</section>
```

### oneliner-caption · 亮点附短标签

两段式居中亮点卡：上方引导语 + 下方金句。

```html
<section style="background:#FFF;border:1px dashed #FECDD3;border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="font-size:12px;color:#9CA3AF;margin:0 0 6px;line-height:1.5;">
    <span leaf="">{{引导语}}</span>
  </p>
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:#BE123C;font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">{{亮点内容}}</span></span>
  </p>
</section>
```

### subheading · 黄色下划线小标题

三级小节标题；可按需加 `margin-top:32px`。

```html
<p style="font-size:15px;font-weight:900;color:#111827;margin-bottom:16px;">
  <span style="border-bottom:4px solid #FDE68A;padding:0 4px;"><span leaf="">{{小节标题}}</span></span>
</p>
```

### divider · 居中金句分隔

章节内观点收束或转折分隔。

```html
<p style="margin-bottom:20px;text-align:center;color:#BE123C;font-weight:700;letter-spacing:1px;border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;padding:12px 0;font-size:16px;line-height:1.8;">
  <span leaf="">{{居中金句}}</span>
</p>
```

### warn · 风险提示

踩坑与限制提示；正文部分维持16px／1.8。

```html
<section style="padding:6px 0 4px;margin-bottom:16px;">
  <p style="margin-bottom:6px;font-size:12px;font-weight:700;color:#9CA3AF;letter-spacing:1px;">
    <span style="color:rgb(255,76,0);"><span leaf="">！踩坑提示 🕳</span></span>
  </p>
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span style="color:rgb(136,136,136);font-weight:bold;"><span leaf="">{{提示内容}}</span></span>
  </p>
</section>
```

### tip · 莓红提示

轻量正向经验提示；正文部分维持16px／1.8。

```html
<section style="padding:6px 0 4px;margin-bottom:16px;">
  <p style="margin-bottom:6px;font-size:12px;font-weight:700;color:#9CA3AF;letter-spacing:1px;">
    <span style="color:#BE123C;"><span leaf="">✦ {{提示标题}}</span></span>
  </p>
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{提示内容}}</span>
  </p>
</section>
```

### warning · 黄色警告

高优先级注意事项或重要前提提示。

```html
<section style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
  <p style="color:#92400E;margin:0;font-weight:700;font-size:16px;line-height:1.8;">
    <span leaf="">{{警告内容}}</span>
  </p>
</section>
```

### info · 莓红信息

主色浅底说明框；正文部分维持16px／1.8。

```html
<section style="background:#FFF1F2;padding:12px 16px;border-radius:8px;border:1px solid #FECDD3;margin-bottom:20px;">
  <p style="color:#374151;margin:0;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">{{信息内容}}</span>
  </p>
</section>
```

### pill · 概念胶囊

仅用作短概念标签，完整列表项用 ordered 或 bullet。

```html
<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:#BE123C;background:rgba(190,18,60,0.08);padding:3px 10px;border-radius:999px;"><span style="display:inline-block;width:6px;height:6px;background:#BE123C;border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span><span leaf="">{{列表项文字}}</span></span>
  </p>
</section>
```

### pill-description · 概念及正文解释

胶囊短标 + 16px／1.8 正文解释。

```html
<section style="margin-bottom:14px;">
  <p style="margin:0 0 6px;">
    <span style="display:inline-block;font-size:13px;font-weight:700;color:#BE123C;background:rgba(190,18,60,0.08);padding:3px 10px;border-radius:999px;"><span style="display:inline-block;width:6px;height:6px;background:#BE123C;border-radius:50%;margin-right:5px;vertical-align:middle;"><span leaf=""><br></span></span><span leaf="">{{标题}}</span></span>
  </p>
  <p style="color:#4B5563;margin:0;text-align:justify;font-size:16px;line-height:1.8;">
    <span leaf="">{{描述内容}}</span>
  </p>
</section>
```

### flow-cards · 三步横排流程卡

三步逻辑串联或流程拆解；每张卡片文字保持精炼短语，箭头 `→` 可按语义改为 `×` 做对比。

```html
<section style="background:#F9FAFB;padding:16px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:24px;">
  <section style="display:flex;align-items:stretch;justify-content:center;gap:6px;">
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#BE123C;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{步骤1标题}}</span>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">
        <span leaf="">{{步骤1描述}}</span>
      </p>
    </section>
    <section style="display:flex;align-items:center;color:#D1D5DB;font-size:14px;padding:0 4px;flex-shrink:0;">
      <span leaf="">→</span>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{步骤2标题}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{步骤2描述}}</span>
      </p>
    </section>
    <section style="display:flex;align-items:center;color:#D1D5DB;font-size:14px;padding:0 4px;flex-shrink:0;">
      <span leaf="">→</span>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #FECDD3;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#BE123C;margin:0 0 3px;">
        <span leaf="">{{步骤3标题}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{步骤3描述}}</span>
      </p>
    </section>
  </section>
  <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:12px 0 0;letter-spacing:0.5px;">
    <span leaf="">{{底部说明文字}}</span>
  </p>
</section>
```

### three-col-cards · 三列对比卡

轻量三项并列对比或核心指标概览；数据列数多时用 table。

```html
<section style="background:#F9FAFB;padding:16px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:28px;">
  <section style="display:flex;align-items:stretch;justify-content:center;gap:6px;">
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#BE123C;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{卡片1标题}}</span>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">
        <span leaf="">{{卡片1描述}}</span>
      </p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{卡片2标题}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{卡片2描述}}</span>
      </p>
    </section>
    <section style="flex:1;min-width:0;box-sizing:border-box;text-align:center;padding:10px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;">
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{卡片3标题}}</span>
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">
        <span leaf="">{{卡片3描述}}</span>
      </p>
    </section>
  </section>
</section>
```

### timeline · 纵向过程

时间线或案例脉络；最后一个节点可省略竖线。

```html
<section style="display:flex;margin-bottom:28px;">
  <section style="display:flex;flex-direction:column;align-items:center;margin-right:16px;flex-shrink:0;">
    <section style="width:14px;height:14px;border-radius:50%;border:3px solid #BE123C;background:#fff;margin-top:4px;box-shadow:0 0 0 2px #fff;">
      <span leaf=""><br></span>
    </section>
    <section style="width:2px;background:#E5E7EB;flex:1;margin-top:4px;min-height:48px;">
      <span leaf=""><br></span>
    </section>
  </section>
  <section style="flex:1;padding-bottom:12px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <span style="display:inline-block;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;"><span leaf="">{{CASE 01}}</span></span>
      <h4 style="font-size:15px;font-weight:800;color:#111827;margin:0;">
        <span leaf="">{{标题}}</span>
      </h4>
    </section>
    <p style="font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1px;margin:0 0 12px;">
      <span leaf="">{{英文副标题}}</span>
    </p>
    <p style="margin:0 0 16px;color:#4B5563;text-align:justify;font-size:16px;line-height:1.8;">
      <span leaf="">{{内容}}</span>
    </p>
  </section>
</section>
```

### tool · 工具说明卡

工具或产品特性白底悬浮卡片。

```html
<section style="background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 4px 16px rgba(190,18,60,0.12);margin-bottom:24px;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{说明内容}}</span>
  </p>
</section>
```

### table · 真实数据表

仅数据表，不做布局；表中长说明拆到正文，不靠继续缩字塞下。

```html
<section style="margin-bottom:24px;overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr>
        <th style="background:#BE123C;color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{列标题1}}</span></th>
        <th style="background:#BE123C;color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{列标题2}}</span></th>
        <th style="background:#BE123C;color:#fff;font-weight:700;padding:8px 12px;text-align:left;"><span leaf="">{{列标题3}}</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">{{内容}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">{{内容}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;"><span leaf="">{{内容}}</span></td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">{{内容}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">{{内容}}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:#374151;background:#F9FAFB;"><span leaf="">{{内容}}</span></td>
      </tr>
    </tbody>
  </table>
</section>
```

### ordered · 有序列表

数字编号列表；项内正文16px／1.8。

```html
<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#BE123C;color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">1</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{列表项内容}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#BE123C;color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">2</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{列表项内容}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#BE123C;color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">3</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{列表项内容}}</span>
    </p>
  </section>
</section>
```

### bullet · 无序列表

圆点无序列表；项内正文16px／1.8。

```html
<section style="margin-bottom:24px;">
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#BE123C;color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{列表项内容}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#BE123C;color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{列表项内容}}</span>
    </p>
  </section>
  <section style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#BE123C;color:#fff;font-size:11px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;"><span leaf="">•</span></span>
    <p style="color:#374151;margin:0;flex:1;font-size:16px;line-height:1.8;">
      <span leaf="">{{列表项内容}}</span>
    </p>
  </section>
</section>
```

### dark · 深色代码

代码每行一个p，原半角标点与缩进不改；不使用white-space:pre。

```html
<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#1E293B;box-shadow:0 4px 16px -8px rgba(15,23,42,0.4);">
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
</section>
```

### light · 浅色代码

代码每行一个p，原半角标点与缩进不改；不使用white-space:pre。

```html
<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#F6F8FA;border:1px solid #E5E7EB;border-left:3px solid #BE123C;">
  <section style="padding:7px 14px;border-bottom:1px solid #E5E7EB;">
    <span style="font-size:12px;color:#9CA3AF;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">bash</span></span>
  </section>
  <section style="padding:11px 14px;">
    <p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#24292F;"><span leaf="">npx skills add gzh-design</span></p>
  </section>
</section>
```

### image · 插图与图注

保留用户给定URL；有说明才加图注，不带占位图发布。

```html
<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="图片URL" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
<p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0 0 24px;">
  <span leaf="">— 图片说明文字</span>
</p>
```

### gif · 动图与图注

保留用户给定URL；有说明才加图注，不带占位图发布。

```html
<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid #E5E7EB;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="动图URL.gif" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
<p style="text-align:center;margin:0 0 24px;">
  <span style="display:inline-block;background:#FFE4E6;color:#9F1239;font-size:11px;font-weight:700;padding:1px 8px;border-radius:4px;margin-right:6px;"><span leaf="">GIF 动图</span></span>
  <span style="font-size:12px;color:#9CA3AF;"><span leaf="">动图说明文字</span></span>
</p>
```

### pending · 居中待补素材

居中静态待补区，不伪装已有图片或视频。

```html
<section style="margin:0 0 24px;padding:30px 20px;border:1.5px dashed #DAD7D2;border-radius:14px;background:#FAFAF8;text-align:center;">
  <p style="margin:0 0 10px;font-size:24px;line-height:1;"><span leaf="">🎬</span></p>
  <p style="margin:0;font-size:14px;font-weight:700;color:#9CA3AF;letter-spacing:1px;"><span leaf="">待补素材</span></p>
  <p style="margin:8px 0 0;font-size:13px;color:#B8B5B0;line-height:1.7;"><span leaf="">此处插入：创建 skill 的录屏演示</span></p>
</section>
```

### author · 作者与互动

文末只用一次；默认作者占位，按用户资料填写。点赞、眼睛、转发采用摸鱼绿原版20pxSVG、1.8描边和原始路径，仅将转发底座与高亮调为复古莓红配色；保留原40px图标底座。

```html
<section style="margin:48px 20px 24px;">
<p style="margin:0 0 20px;font-size:14px;line-height:1.9;text-align:justify;">
  <span leaf="">我是{{作者名}}，{{简介}}</span>
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
    <section style="text-align:center;color:#BE123C;">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:#FFF1F2;border-radius:12px;box-shadow:0 2px 4px rgba(190,18,60,0.15);border:1px solid #FECDD3;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-4a8 8 0 0 1 8-8h8"></path><polyline points="16 2 20 6 16 10"></polyline></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">转发</span></span>
    </section>
  </section>
  <p style="font-size:10px;color:#9CA3AF;letter-spacing:1px;margin:0;">
    <span leaf="">THANKS FOR READING</span>
  </p>
</section>
</section>
```

## 完整文章模板骨架

封面 → 三条精选导读 → 可选开头金句／前言 → 按序章节 → 唯一作者与互动。导读在前言之前，不为了凑目录编造章节。

```html
<section style="max-width:677px;margin:0 auto;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#374151;line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;text-align:left;">
<section style="margin:0 0 32px;background:#fff;border:1.5px solid rgba(190,18,60,0.15);border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);width:100%;box-sizing:border-box;">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="width:6px;height:6px;background:#BE123C;border-radius:50%;"><span leaf=""><br></span></span>
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:#BE123C;"><span leaf="">{{栏目标签}}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,rgba(190,18,60,0.12),transparent);"><span leaf=""><br></span></section>
      <span style="font-size:10px;color:#D1D5DB;font-weight:600;"><span leaf="">{{日期}}</span></span>
    </section>
    <section>
      <p style="font-size:24px;font-weight:900;color:#111827;margin:0;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{{主标题前半}}</span>
        <span style="color:#BE123C;"><span leaf="">{{主色词}}</span></span>
      </p>
      <p style="font-size:24px;font-weight:900;color:#BE123C;margin:0 0 16px;line-height:1.05;letter-spacing:-2px;">
        <span leaf="">{{主标题第二行}}</span>
      </p>
      <section style="width:48px;height:3px;background:linear-gradient(to right,#BE123C,#FB7185);border-radius:2px;margin-bottom:12px;">
        <span leaf=""><br></span>
      </section>
      <p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;letter-spacing:0.5px;">
        <span leaf="">{{副标题关键词}}</span>
      </p>
    </section>
  </section>
  <section style="background:#BE123C;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;">
      <span leaf="">{{主题或品牌}}</span>
    </p>
    <section style="display:flex;gap:4px;">
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{{标签一}}</span></span>
      <span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#fff;font-weight:600;"><span leaf="">{{标签二}}</span></span>
    </section>
  </section>
</section>
<section style="margin:0 20px 32px;">
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
    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#BE123C;border:1px solid #BE123C;border-radius:12px;padding:12px;margin-right:8px;">
      <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.75);letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 01</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#fff;margin:0 0 3px;">
        <span leaf="">{{看点一标题}}</span>
      </p>
      <p style="font-size:10px;color:rgba(255,255,255,0.75);margin:0;">
        <span leaf="">{{看点一说明}}</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 02</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{看点二标题}}</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">{{看点二说明}}</span>
      </p>
    </section>

    <section style="display:inline-block;white-space:nowrap;vertical-align:top;width:auto;min-width:144px;box-sizing:border-box;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-right:8px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <p style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;margin:0 0 5px;">
        <span leaf="">PART 03</span>
      </p>
      <p style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;">
        <span leaf="">{{看点三标题}}</span>
      </p>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">
        <span leaf="">{{看点三说明}}</span>
      </p>
    </section>
  </section>
</section>
<section style="margin:0 20px 32px;">
<p style="margin:0 0 20px;font-size:16px;line-height:1.8;text-align:justify;color:#374151;"><span leaf="">{{正文内容}}</span></p>
<section style="background:#FFF;border:1px dashed #FECDD3;border-radius:8px;padding:14px 16px;margin-bottom:24px;text-align:center;">
  <p style="margin:0;font-size:16px;line-height:1.8;">
    <span style="color:#BE123C;font-weight:bold;border-bottom:3px solid #FDE68A;padding-bottom:2px;"><span leaf="">{{亮点内容}}</span></span>
  </p>
</section>
</section>
<section style="margin-top:16px;margin-bottom:32px;padding:0 20px;">
  <section style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
    <section style="text-align:center;flex-shrink:0;">
      <p style="margin:0;font-size:24px;font-weight:900;color:#BE123C;line-height:1;letter-spacing:-2px;">
        <span leaf="">{{章节编号}}</span>
      </p>
      <p style="margin:0;font-size:8px;font-weight:700;color:#D1D5DB;letter-spacing:2px;">
        <span leaf="">PART</span>
      </p>
    </section>
    <span style="width:1px;height:36px;background:#E5E7EB;flex-shrink:0;"><span leaf=""><br></span></span>
    <section>
      <p style="margin:0 0 1px;font-size:17px;font-weight:900;color:#111827;letter-spacing:0.3px;">
        <span leaf="">{{中文标题}}</span>
      </p>
      <p style="margin:0;font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1.5px;">
        <span leaf="">{{ENGLISH · 英文副标题}}</span>
      </p>
    </section>
  </section>
<p style="margin:0 0 20px;font-size:16px;line-height:1.8;text-align:justify;color:#374151;"><span leaf="">{{正文内容}}</span></p>
<section style="background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:justify;">
  <p style="color:#374151;margin:0;font-size:16px;line-height:1.8;">
    <span leaf="">{{引用内容，可嵌入复古莓红加粗等内联样式}}</span>
  </p>
</section>
<p style="margin:0 0 20px;font-size:16px;line-height:1.8;text-align:justify;color:#374151;"><span leaf="">{{正文内容}}</span></p>
</section>
<!-- 后续章节按原文顺序重复（margin-top 改为 48px） -->
<section style="margin:48px 20px 24px;">
<p style="margin:0 0 20px;font-size:14px;line-height:1.9;text-align:justify;">
  <span leaf="">我是{{作者名}}，{{简介}}</span>
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
    <section style="text-align:center;color:#BE123C;">
      <section style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;background:#FFF1F2;border-radius:12px;box-shadow:0 2px 4px rgba(190,18,60,0.15);border:1px solid #FECDD3;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-4a8 8 0 0 1 8-8h8"></path><polyline points="16 2 20 6 16 10"></polyline></svg>
      </section>
      <span style="font-size:10px;font-weight:600;"><span leaf="">转发</span></span>
    </section>
  </section>
  <p style="font-size:10px;color:#9CA3AF;letter-spacing:1px;margin:0;">
    <span leaf="">THANKS FOR READING</span>
  </p>
</section>
</section>
</section>
```

## 文章类型 → 组件组合配方

所有类型共用 cover、toc、chapter、author；点缀组件种类每篇不超过 3 种，文章本有的代码和媒体仍完整保留。

| 类型 | 核心 | 点缀 |
|---|---|---|
| 教程／操作 | step、ordered、dark 或 light | warn、info、flow-cards |
| 工具／清单 | tool-label、tool、bullet | table、oneliner、three-col-cards |
| 观点／深度分析 | plain、quote、oneliner | divider、subheading、highlight |
| 访谈／人物 | plain、quote、timeline | image、oneliner |
| 数据／报告 | three-col-cards、table、ordered | info、highlight |
| 生活／随笔 | plain、oneliner | quote、divider |
| 案例实战 | case、step、timeline | warning、flow-cards、image |

## Markdown → 组件映射规则

| 元素 | 组件／处理 |
|---|---|
| 文章标题 | 微信标题栏；cover 提炼另一个视角，不照搬长外标题 |
| 开头引言 | oneliner 或 plain |
| 二级标题 | chapter，01／02／03，只有结语才用 /// 和 LAST |
| 三级标题 | subheading |
| 普通段落 | plain＋underline 关键词，按需 strong |
| 加粗／高亮／下划线／删除线 | strong／highlight／underline／strike，行内强调继承正文 |
| 引用／补充说明 | quote 或 info，完整句子 16px／1.8 |
| 有序／无序列表 | ordered／bullet |
| 步骤／案例 | step／case＋plain |
| 流程串联／三项对比 | flow-cards／three-col-cards |
| 代码、命令、Prompt | dark 或 light；每行一个 `<p style="margin:0">`，禁用 `white-space:pre` |
| 行内代码 | inline |
| Markdown 数据表 | table |
| 图片／GIF | image／gif；没有说明就删图注 |
| 待补素材／视频 | pending，静态提示；真实视频到微信编辑器补入 |
| 链接 | 保留原文 URL 与文字，成文检查微信外链限制，不制造新链接 |
| 分隔线 | 章节留白或细线，不连续堆叠分隔卡 |
| 作者与互动 | author，一处署名一处互动，不加默认账号括号 |

## 维护验证

本文件与预览 HTML 均由 `scripts/generate_magazine_themes.py` 统一生成，改动请修改脚本后重新生成，不要手工单改一端。
先跑 `component_lint.py`，再跑 `validate_gzh_html.py`。quote 的灰色虚线框属于明确保留的主题特征，源头检查可能提示风格 WARN，不能为清除该提示改掉已确认的引用外观。产物需无 ERROR、无文字包裹／标点 WARNING；再检查手机正文 16px／1.8、标题层级和卡片换行。
