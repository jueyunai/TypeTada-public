# 公众号排版组件库 —— 小步生长

白底、绿色芽点、居中命题与浅杏下划线。保留轻修后的细芽、柔和字重、浅色弱边框与轻微不对称引文卡；不添加阴影、大面积纹理或新装饰。

- 标识：`little-growth`；适用：成长记录、深度随笔、个人实践。
- [完整45组件预览](../assets/theme-previews/theme-little-growth.html)。以下为正式装配源，已移除预览标签与id，不从历史文章或预览外壳复制。
- [阅读参数](reading-typography.md)：正文、正文列表、实质内容引用默认16px／1.8；用户明确参数可覆盖。封面、标题、标签、署名及代码保留各自层级。
- 作者／标题／示例文字均为可替换占位，不写死本文作者。无图片或链接素材时省略对应区块，不带占位URL发布。

## 设计变量速查表

| 参数 | 值 |
|---|---|
| 主色 | #087F74 |
| 背景／浅底 | #FFFFFF／#EFF8F3 |
| 正文／标题 | #455A55／#243D39 |
| 分隔线 | #DDECE4 |
| 关键词下划线 | border-bottom:2px solid #C8E9DB;font-weight:600; |
| 高亮 | #F2DFC5；纯色下划线，避免文字渐变底 |
| 正文与内容引用 | 16px；line-height:1.8 |
| 正文段后／字距 | 22px／0.25px |
| 正文额外左右边距／最大宽度 | 8px／677px |
| 刊头、封面外侧、文末额外左右边距 | 8px |
| 封面导语卡内部左右padding | 17px |
| 章节标题／小标题 | 21px／18px，保留原组件行高 |
| 芽点渐变 | #62A18D → #337F6D |
| 导语底／边框 | #F5F9F5／#E5EEE7 |
| 引文底／边框 | #F4F9F5／#E3ECE5 |
| 封面标题 | 24px，700字重，1.72行高 |

字体栈：`'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif`。正文左对齐，不用拉大字距补齐每行。

## 各组件完整 HTML

装配规则：主题开场与作者刊头自带外边距，直接放在全局容器；其余组件放在骨架的左右8px内容容器内，**不要重复套边距**。作者介绍只在末尾出现一次。编号：01／02／03；结语章节可用“终”。不强加英文副标题。

正文、刊头、封面外侧与文末统一追加左右8px，微信页面自身边距不计入此值；封面导语卡内部左右17px、引文卡等组件内部留白保持原设计。文章最大宽度677px，正文16px／1.8、段后22px。生成预览使用最新版公共复制模板，保留完整HTML与开头芽点。

### cover · 主题开场

包含刊头，只在开头使用；不要再叠加作者刊头组件。替换示例标题和作者名，不搬用示例身份。

```html
<section style="margin:0;padding:22px 8px 18px;"><span style="display:inline-block;width:16px;height:9px;border-radius:10px 1px 10px 1px;background:#337F6D;background:linear-gradient(135deg,#62A18D,#337F6D);margin-right:9px;vertical-align:middle;font-size:0;line-height:0;"><span leaf=""><br></span></span><span style="font-size:15px;color:#243D39;font-weight:650;vertical-align:middle;letter-spacing:0.4px;"><span leaf="">{{作者名}}</span></span><span style="font-size:11px;color:#6B877E;margin-left:12px;vertical-align:middle;"><span leaf="">栏目说明占位</span></span></section><section style="margin:0 8px 30px;padding:10px 0 0;text-align:center;"><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;letter-spacing:1px;color:#6B877E;text-align:center;margin:7px 0 14px;"><span leaf="">开场说明占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:24px;font-weight:700;line-height:1.72;letter-spacing:0.4px;color:#243D39;text-align:center;margin:0 0 23px;"><span leaf="">开场主旨占位</span><br><span style="border-bottom:6px solid #F2DFC5;padding:0 2px;border-radius:2px;"><span leaf="">延展判断占位</span></span></p><section style="padding:13px 17px;border-radius:14px;background:#F5F9F5;border:1px solid #E5EEE7;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;line-height:1.8;color:#087F74;text-align:center;margin:0;"><span leaf="">导语与核心看点占位</span></p></section></section>
```

### brief · 短文起笔

短文开头的替代方案，与主题开场二选一。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">短文说明占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:24px;line-height:1.6;font-weight:800;color:#243D39;"><span leaf="">主标题占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">导语内容占位，交代文章的讨论范围。</span></p>
```

### brand · 作者刊头

仅当封面未包含刊头时使用，不作为文末签名。

```html
<section style="margin:0;padding:22px 8px 18px;"><span style="display:inline-block;width:16px;height:9px;border-radius:10px 1px 10px 1px;background:#337F6D;background:linear-gradient(135deg,#62A18D,#337F6D);margin-right:9px;vertical-align:middle;font-size:0;line-height:0;"><span leaf=""><br></span></span><span style="font-size:15px;color:#243D39;font-weight:650;vertical-align:middle;letter-spacing:0.4px;"><span leaf="">{{作者名}}</span></span><span style="font-size:11px;color:#6B877E;margin-left:12px;vertical-align:middle;"><span leaf="">栏目说明占位</span></span></section>
```

### plain · 连续正文

连续正文16px／1.8，段后22px。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">正文说明占位，用于观察长段落的行距和阅读密度。内容需要明确，排版只帮助读者理解。</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">第二段说明占位，用于观察段间停顿和上下文衔接。</span></p>
```

### underline · 轻量关键词

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">正文说明占位，</span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">关键词标记占位</span></span><span leaf="">，让读者找到本段的重点。</span></p>
```

### strong · 重点判断

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">正文说明占位，</span><strong style="color:#243D39;font-weight:700;"><span leaf="">核心判断占位</span></strong><span leaf="">，强调不覆盖整段。</span></p>
```

### highlight · 半高亮短语

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">正文说明占位，</span><span style="border-bottom:4px solid #F2DFC5;font-weight:600;"><span leaf="">短语高亮占位</span></span><span leaf="">，用于有意义的转折。</span></p>
```

### caption · 轻量注释

仅图注／来源等辅助信息；重要说明用正文或补充旁注。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;line-height:1.8;color:#6B877E;"><span leaf="">注释与来源说明占位，补充正文之外的阅读信息。</span></p>
```

### chapter · 主题分节

按原文章章节顺序编号，保留原题；重复使用，不自动补造结语。

```html
<section style="margin:40px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.7;color:#087F74;margin:0 0 10px;font-weight:600;letter-spacing:1px;"><span style="color:#087F74;margin-right:7px;"><span leaf="">●</span></span><span leaf="">主题标签</span><span style="color:#6B877E;margin-left:10px;"><span leaf="">01</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:21px;font-weight:800;line-height:1.65;color:#243D39;margin:0;"><span leaf="">章节标题占位</span></p></section>
```

### subheading · 段内小标题

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:18px;font-weight:700;color:#243D39;margin:0 0 14px;"><span leaf="">小节标题占位</span></p>
```

### label · 概念短标

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 12px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">概念标签</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">概念解释与使用范围占位。</span></p>
```

### core · 一句话主张

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">把这句留下</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">关键判断占位，把文章最值得记住的一句话留下。</span></p></section>
```

### voice · 人物引语

只放原文有依据的引语，正文16px／1.8，不补造出处。

```html
<section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">人物原话</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">人物表达占位，保留原始语气与事实归属。</span></p></section>
```

### aside · 补充旁注

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">顺手记一笔</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">补充背景说明占位，不打断主文的推进。</span></p></section>
```

### boundary · 边界提醒

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">注意边界</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">适用边界、风险与不确定性说明占位。</span></p></section>
```

### result · 阶段结论

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">这一轮的收获</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">本阶段已经确认的结果占位。</span></p></section>
```

### author · 作者介绍

文末仅一处；我是{{作者名}}、{{简介}}按用户填写；本组件已带互动句，不重复叠加轻量互动。

```html
<section style="margin:42px 0 0;padding:22px 0 32px;border-top:1px solid #DDECE4;"><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:18px;font-weight:700;color:#243D39;margin:0 0 12px;"><span style="display:inline-block;width:11px;height:6px;border-radius:8px 1px 8px 1px;background:#337F6D;margin-right:9px;vertical-align:middle;font-size:0;line-height:0;"><span leaf=""><br></span></span><span leaf="">我是{{作者名}}</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;color:#6B877E;line-height:1.9;margin:0 0 20px;"><span leaf="">{{简介}}</span></p><section style="padding:11px 15px;background:#F5F9F5;border:1px solid #E5EEE7;border-radius:12px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;line-height:1.8;color:#087F74;margin:0;text-align:center;"><span leaf="">有收获的话，欢迎点赞、在看、转发。</span></p></section></section>
```

### cta · 轻量互动

仅替换作者介绍中的互动区域，不额外再加一份。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">下次见</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:14px;line-height:1.85;margin:0;"><span leaf="">互动引导文案占位，让读者知道下一步可以做什么。</span></p></section>
```

### summary · 末尾收束

收束既有观点，不新增原文没有的结论。

```html
<section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">最后留一句</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">总结判断占位，明确收束本文的主线。</span></p></section>
```

### faq · 读者问答

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:40px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.7;color:#087F74;margin:0 0 10px;font-weight:600;letter-spacing:1px;"><span style="color:#087F74;margin-right:7px;"><span leaf="">●</span></span><span leaf="">问答</span><span style="color:#6B877E;margin-left:10px;"><span leaf="">Q</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:21px;font-weight:800;line-height:1.65;color:#243D39;margin:0;"><span leaf="">读者问题占位</span></p></section><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">回答说明占位，回应具体问题并给出下一步。</span></p>
```

### contact · 联系说明

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">找到我</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">联系渠道与适用事项说明占位</span></p></section>
```

### resource · 资料提示

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">相关资料</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">资料名称、用途与获取说明占位</span></p></section>
```

### next · 下篇预告

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">下一篇</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">后续主题与阅读期待占位。</span></p>
```

### postscript · 附言

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">附言</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">正文之外的一点补充观察占位</span></p></section>
```

### read · 精选导读

精选三条看点，不冒充完整目录。

```html
<section style="margin:26px 0 30px;padding:17px 18px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">这一篇，接着往后看</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:13px;line-height:1.8;margin:0 0 8px;"><span style="font-size:11px;color:#087F74;font-weight:700;margin-right:9px;"><span leaf="">01</span></span><span leaf="">第一个核心看点占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:13px;line-height:1.8;margin:0 0 8px;"><span style="font-size:11px;color:#087F74;font-weight:700;margin-right:9px;"><span leaf="">02</span></span><span leaf="">第二个核心看点占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:13px;line-height:1.8;margin:0 0 8px;"><span style="font-size:11px;color:#087F74;font-weight:700;margin-right:9px;"><span leaf="">03</span></span><span leaf="">第三个核心看点占位</span></p></section>
```

### related · 延伸阅读

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">接着看</span></p><section style="margin:18px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">•</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">延伸文章标题占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">•</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">相关主题标题占位</span></span></p></section>
```

### bullet · 并列要点

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:18px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">•</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">要点内容占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">•</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">适用条件占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">•</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">注意事项占位</span></span></p></section>
```

### number · 顺序事项

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:18px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">1</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">步骤说明占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">2</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">操作说明占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">3</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">验证说明占位</span></span></p></section>
```

### check · 检查清单

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:18px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">□</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">输入检查占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">□</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">过程检查占位</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;font-size:16px;line-height:1.8;"><span style="font-weight:700;color:#087F74;margin-right:10px;"><span leaf="">□</span></span><span style="border-bottom:2px solid #C8E9DB;font-weight:600;"><span leaf="">输出检查占位</span></span></p></section>
```

### flow · 三步推进

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:22px 0;"><section style="margin:0 0 8px;padding:13px 16px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#F2DFC5;border-radius:20px;padding:3px 10px;"><span leaf="">01</span></span> <span leaf="">输入说明占位</span></p></section><section style="margin:0 0 8px;padding:13px 16px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">02</span></span> <span leaf="">执行说明占位</span></p></section><section style="margin:0 0 8px;padding:13px 16px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">03</span></span> <span leaf="">结果说明占位</span></p></section></section>
```

### step · 单步展开

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:40px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.7;color:#087F74;margin:0 0 10px;font-weight:600;letter-spacing:1px;"><span style="color:#087F74;margin-right:7px;"><span leaf="">●</span></span><span leaf="">步骤</span><span style="color:#6B877E;margin-left:10px;"><span leaf="">01</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:21px;font-weight:800;line-height:1.65;color:#243D39;margin:0;"><span leaf="">本步行动占位</span></p></section><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">完成这一步所需的输入和动作占位。</span></p><section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">验证</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">预期结果与验收方式占位</span></p></section>
```

### compare · 前后对照

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">调整之前</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">旧方案的限制说明占位</span></p></section><section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">调整之后</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">新方案的变化说明占位</span></p></section>
```

### timeline · 过程回看

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:22px 0;"><section style="margin:0 0 8px;padding:13px 16px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#F2DFC5;border-radius:20px;padding:3px 10px;"><span leaf="">01</span></span> <span leaf="">初次尝试记录占位</span></p></section><section style="margin:0 0 8px;padding:13px 16px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">02</span></span> <span leaf="">新反馈记录占位</span></p></section><section style="margin:0 0 8px;padding:13px 16px;background:#EFF8F3;border-radius:16px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">03</span></span> <span leaf="">下一轮取舍占位</span></p></section></section>
```

### image · 插图与图注

示例图片仅供预览，成文使用用户给定图片；没有说明则删图注，不编造图片。

```html
<section style="margin:24px 0;"><img src="https://placehold.orence.net/600x320/EFF8F3/087F74?text=Image+placeholder" alt="插图占位" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:14px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.6;color:#6B877E;text-align:center;margin:8px 0 0;"><span leaf="">图片说明占位</span></p></section>
```

### pair · 配图对照

上下排列，避免在手机上压缩成两窄列。

```html
<section style="margin:24px 0;"><img src="https://placehold.orence.net/600x320/EFF8F3/087F74?text=Image+placeholder" alt="插图占位" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:14px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.6;color:#6B877E;text-align:center;margin:8px 0 0;"><span leaf="">前图说明占位</span></p></section><section style="margin:24px 0;"><img src="https://placehold.orence.net/600x320/EFF8F3/087F74?text=Image+placeholder" alt="插图占位" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:14px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.6;color:#6B877E;text-align:center;margin:8px 0 0;"><span leaf="">后图说明占位</span></p></section>
```

### pending · 待补素材

明确提示待补，不伪装已经有素材。

```html
<section style="margin:24px 0;background:#EFF8F3;border:1px solid #DDECE4;border-radius:16px;padding:30px 20px;text-align:center;"><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:24px;color:#087F74;text-align:center;margin:0 0 10px;"><span leaf="">＋</span></p><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:13px;text-align:center;margin:0;"><span leaf="">此处补入素材及说明</span></p></section>
```

### video · 视频静态占位

只有静态占位，真实视频在微信编辑器补入，不生成播放器。

```html
<section style="margin:24px 0;background:#EFF8F3;border:1px solid #DDECE4;border-radius:16px;padding:30px 20px;text-align:center;"><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:24px;color:#087F74;text-align:center;margin:0 0 10px;"><span leaf="">▷</span></p><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:13px;text-align:center;margin:0;"><span leaf="">视频主题与观看提示占位</span></p></section>
```

### dark · 深色代码

代码原样保留，每行一个p，不用white-space:pre。

```html
<section style="margin:22px 0;padding:16px 18px;border-radius:12px;background:#243D39;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#FFFFFF;"><span leaf="">// 示例代码占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#FFFFFF;"><span leaf="">const value = 'example';</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#FFFFFF;"><span leaf="">render(value);</span></p></section>
```

### light · 浅色命令

代码半角标点与缩进保持原样。

```html
<section style="margin:22px 0;padding:16px 18px;border-radius:12px;background:#EFF8F3;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#455A55;"><span leaf=""># 示例命令占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#455A55;"><span leaf="">example --option value</span></p></section>
```

### inline · 行内代码

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">参数说明占位，</span><span style="font-family:Consolas,monospace;background:#EFF8F3;color:#087F74;padding:2px 5px;font-size:13px;border-radius:4px;"><span leaf="">example_value</span></span><span leaf="">用于演示等宽样式。</span></p>
```

### prompt · 提示词

提示词使用代码容器，不降成辅助注释。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">提示词示意</span></p><section style="margin:22px 0;padding:16px 18px;border-radius:12px;background:#EFF8F3;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#455A55;"><span leaf="">角色说明占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#455A55;"><span leaf="">任务内容占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-family:Consolas,monospace;font-size:12px;line-height:1.7;margin:0;color:#455A55;"><span leaf="">输出要求占位</span></p></section>
```

### table · 真实表格

仅用于真实数据表，不用于页面布局；过宽时拆表或上下分组。

```html
<section style="margin:22px 0;overflow:hidden;border-radius:12px;"><table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.8;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;"><tr><th style="padding:10px;text-align:left;font-weight:600;border-bottom:1px solid #DDECE4;background:#EFF8F3;"><span leaf="">对照维度</span></th><th style="padding:10px;text-align:left;font-weight:600;border-bottom:1px solid #DDECE4;background:#EFF8F3;"><span leaf="">说明内容</span></th></tr><tr><td style="padding:10px;text-align:left;font-weight:400;border-bottom:1px solid #DDECE4;background:#FFFFFF;"><span leaf="">前一项</span></td><td style="padding:10px;text-align:left;font-weight:400;border-bottom:1px solid #DDECE4;background:#FFFFFF;"><span leaf="">说明内容占位</span></td></tr><tr><td style="padding:10px;text-align:left;font-weight:400;border-bottom:1px solid #DDECE4;background:#FFFFFF;"><span leaf="">后一项</span></td><td style="padding:10px;text-align:left;font-weight:400;border-bottom:1px solid #DDECE4;background:#FFFFFF;"><span leaf="">说明内容占位</span></td></tr></table></section>
```

### metric · 数值与口径

不编造数据，数值口径不足时保留待补说明。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">指标标签</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:24px;font-weight:800;line-height:1.5;color:#087F74;margin:0 0 8px;"><span leaf="">示意数值</span></p><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;"><span leaf="">数值口径与来源说明占位</span></p>
```

### progress · 进展说明

进度条比例按已知数据修改，未知则不展示百分比。

```html
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#6B877E;margin:0 0 12px;line-height:1.6;"><span leaf="">进展说明</span></p><section style="height:7px;border-radius:7px;background:#EFF8F3;margin:10px 0 12px;"><section style="width:60%;height:7px;border-radius:7px;background:#087F74;"><span leaf=""><br></span></section></section><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;"><span leaf="">已完成范围与剩余事项占位</span></p>
```

### fact · 事实与判断

按内容语义选用，示例文案须替换，不新增原文没有的事实。

```html
<section style="margin:24px 0;padding:16px 18px;border:1px solid #DDECE4;border-radius:14px;background:#FFFFFF;"><p style="margin:0 0 22px;font-size:15px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0 0 10px;"><span style="display:inline-block;font-size:11px;line-height:1.8;font-weight:600;color:#087F74;background:#EFF8F3;border-radius:20px;padding:3px 10px;"><span leaf="">已知事实</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;margin:0;font-size:16px;line-height:1.8;"><span leaf="">可核实事实占位</span></p></section><section style="margin:26px 0;padding:19px;background:#F4F9F5;border:1px solid #E3ECE5;border-radius:16px 16px 16px 5px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;color:#087F74;font-weight:600;margin:0 0 9px;line-height:1.8;"><span leaf="">我的理解</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;color:#243D39;font-weight:600;margin:0;font-size:16px;line-height:1.8;"><span leaf="">基于事实的个人判断占位</span></p></section>
```

## 完整文章模板骨架

芽点刊头与居中封面 → 连续前言 → 芽点章节 → 正文与柔和引文 → 唯一作者介绍。随笔默认不加目录；信息密集时可在封面后、前言前插入精选导读，仍保留正文为主的节奏。

下方是可装配的示例骨架；按原文替换示例段落和标题，展开组件，不把示例内容直接发出。

```html
<section style="max-width:677px;margin:0 auto;background:#FFFFFF;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;box-sizing:border-box;overflow-x:hidden;text-align:left;">
<!-- 开场组件包含自己的外边距；不放入正文边距容器 -->
<section style="margin:0;padding:22px 8px 18px;"><span style="display:inline-block;width:16px;height:9px;border-radius:10px 1px 10px 1px;background:#337F6D;background:linear-gradient(135deg,#62A18D,#337F6D);margin-right:9px;vertical-align:middle;font-size:0;line-height:0;"><span leaf=""><br></span></span><span style="font-size:15px;color:#243D39;font-weight:650;vertical-align:middle;letter-spacing:0.4px;"><span leaf="">{{作者名}}</span></span><span style="font-size:11px;color:#6B877E;margin-left:12px;vertical-align:middle;"><span leaf="">栏目说明占位</span></span></section><section style="margin:0 8px 30px;padding:10px 0 0;text-align:center;"><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;letter-spacing:1px;color:#6B877E;text-align:center;margin:7px 0 14px;"><span leaf="">开场说明占位</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:24px;font-weight:700;line-height:1.72;letter-spacing:0.4px;color:#243D39;text-align:center;margin:0 0 23px;"><span leaf="">开场主旨占位</span><br><span style="border-bottom:6px solid #F2DFC5;padding:0 2px;border-radius:2px;"><span leaf="">延展判断占位</span></span></p><section style="padding:13px 17px;border-radius:14px;background:#F5F9F5;border:1px solid #E5EEE7;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;line-height:1.8;color:#087F74;text-align:center;margin:0;"><span leaf="">导语与核心看点占位</span></p></section></section>
<section style="margin:0 8px;">
<!-- 可选精选导读，位于前言之前 -->
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">正文说明占位，用于观察长段落的行距和阅读密度。内容需要明确，排版只帮助读者理解。</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">第二段说明占位，用于观察段间停顿和上下文衔接。</span></p>
<section style="margin:40px 0 24px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:11px;line-height:1.7;color:#087F74;margin:0 0 10px;font-weight:600;letter-spacing:1px;"><span style="color:#087F74;margin-right:7px;"><span leaf="">●</span></span><span leaf="">主题标签</span><span style="color:#6B877E;margin-left:10px;"><span leaf="">01</span></span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:21px;font-weight:800;line-height:1.65;color:#243D39;margin:0;"><span leaf="">章节标题占位</span></p></section>
<p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">正文说明占位，用于观察长段落的行距和阅读密度。内容需要明确，排版只帮助读者理解。</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:16px;line-height:1.8;"><span leaf="">第二段说明占位，用于观察段间停顿和上下文衔接。</span></p>
<!-- 后续章节按原文顺序重复；媒体、列表、引用按需插入 -->
<section style="margin:42px 0 0;padding:22px 0 32px;border-top:1px solid #DDECE4;"><p style="margin:0 0 22px;line-height:1.9;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:18px;font-weight:700;color:#243D39;margin:0 0 12px;"><span style="display:inline-block;width:11px;height:6px;border-radius:8px 1px 8px 1px;background:#337F6D;margin-right:9px;vertical-align:middle;font-size:0;line-height:0;"><span leaf=""><br></span></span><span leaf="">我是{{作者名}}</span></p><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;color:#6B877E;line-height:1.9;margin:0 0 20px;"><span leaf="">{{简介}}</span></p><section style="padding:11px 15px;background:#F5F9F5;border:1px solid #E5EEE7;border-radius:12px;"><p style="margin:0 0 22px;color:#455A55;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;letter-spacing:0.25px;text-align:left;overflow-wrap:break-word;font-size:12px;line-height:1.8;color:#087F74;margin:0;text-align:center;"><span leaf="">有收获的话，欢迎点赞、在看、转发。</span></p></section></section>
</section>
</section>
```

## 文章类型 → 组件组合配方

所有类型先选cover或brief之一，再用plain／chapter展开；author仅在末尾。点缀组件种类每篇不超过3种，所需媒体／代码不因该上限被省略。

| 类型 | 核心组件 | 点缀 |
|---|---|---|
| 观点／深度分析 | plain、chapter、core | voice、aside、fact |
| 成长／生活随笔 | brief或cover、plain、chapter | voice、summary |
| 产品／案例复盘 | plain、chapter、step、result | compare、timeline |
| 教程／操作指南 | step、number、dark或light | boundary、check、image |
| 工具／清单 | bullet、subheading、plain | compare、table |
| 访谈／人物 | plain、voice、chapter | timeline、image |
| 数据／报告 | table、metric、plain | fact、progress |

## Markdown → 组件映射规则

| 原文元素 | 对应组件／处理 |
|---|---|
| 文章标题 | 微信标题栏填写；cover或brief承接主题，不强行复述完整长标题 |
| 开头引言 | plain或core；如封面已提炼同一段，不重复展示 |
| 二级标题 | chapter，依出现顺序编号 |
| 三级标题 | subheading |
| 普通段落 | plain，按需加入underline关键词 |
| 加粗 | strong中的行内样式，继承正文大小 |
| 高亮 | highlight中的行内样式，不整段涂色 |
| 下划线 | underline，值与theme-index一致 |
| 删除线 | 在正文span使用text-decoration:line-through，不改原意 |
| 正文引用 | voice；补充背景用aside，实质文字16px／1.8 |
| 无序／有序／任务清单 | bullet／number／check |
| 图片／GIF | image；原URL与alt保留；无说明时不造图注；GIF角标可取通用库2b并换色 |
| 待补图片／视频 | pending／video，仅静态占位 |
| 代码／命令／Prompt | dark／light／prompt，每行一个p |
| 行内代码 | inline中的等宽span |
| Markdown数据表 | table；不是布局容器 |
| 链接 | 保留原文链接与文字；不要制造可点击功能，微信受限时保留可读引用 |
| 分隔线 | 章节间距或主题分隔线，不连续堆卡 |
| 作者／互动 | author唯一签名；cta只作替代互动，不重复署名 |

## 维护验证

修改组件时同步完整预览，保留标识与封面的已确认设计；运行component_lint.py与validate_gzh_html.py，再检查320px／390px的长正文、引用和封面。浏览器预览不代表微信粘贴验收。
