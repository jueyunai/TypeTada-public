# 文有样 · TypeTada

让好内容，一眼出彩。公众号排版工作台：输入文章 → 选主题 → 授权个人 TokenDance 钱包 → AI 排版 → 预览 → 复制到公众号。

React / TypeScript / Vite 单页应用。浏览器直接调用 TokenDance，文章、结果、图片与设置保存在当前浏览器的 IndexedDB 中；没有自有业务后端、账号系统、数据库服务或图床。

## 功能与数据边界

- 支持 Markdown/TXT、基础 DOCX 导入和富文本粘贴，保留原稿，提供图片/标题/强调的原稿预览。
- 独立维护 gzh-design Skill、九套主题及真实样图；保留金句、首尾卡片、原文检查、结果历史、HTML/纯文本复制和下载。
- 文章保存在当前浏览器和站点下；清除浏览器数据、换设备或换域名不会同步。可导出/导入最大 40 MiB 的 JSON 备份，完整备份含未插入文章的本机配图，不含钱包 Key。
- 钱包 Key 默认只在页面内存；自愿记住后明文存入 IndexedDB。断开只清除本地凭据，远端撤销需到 TokenDance 管理。
- 手选主题最多生成与修复各一次，自动主题最多加一次分析；失败、取消、断网或关闭页面仍可能计费，不自动重发。
- 原 HTTPS 图片沿用原地址：原稿直接显示原图，“成稿预览加载外链图片”开关只控制右侧成稿。本地图在浏览器保存并随结果导出。复制成功不等于微信公众号保存成功，图片与格式需在公众号保存重开、手机预览后确认。

## 本机运行

需要 Node.js 22+、pnpm 10.15.1。

```sh
pnpm --dir web install --frozen-lockfile
cp .env.example web/.env.local
```

编辑 `web/.env.local`，填写自己的 TokenDance 应用配置：

```ini
VITE_TOKENDANCE_APP_URL=https://your-app.example
VITE_TOKENDANCE_KEY_NAME=Your application
VITE_TOKENDANCE_MODEL=your-supported-model-id
```

这三项会公开出现在浏览器构建中，不能填写 API Key 或服务器凭据。App URL 应与平台登记身份一致，模型需支持当前请求参数。详见[配置说明](docs/public/configuration.md)。

可选参数 `VITE_GITHUB_REPOSITORY_URL` 配置帮助中的 GitHub 公开项目页，仅在仓库实际发布后填写。留空时显示“筹备中”，不影响应用功能；fork 时填写自己的公开仓库地址。

```sh
pnpm --dir web dev
```

打开 [本地工作台](http://localhost:5173/editor)。没有配置时仍可编辑、导入、保存、查看主题和使用已有结果；钱包授权与 AI 请求会按缺失配置停用。修改配置后重启开发服务。

## 验证与静态发布

```sh
pnpm --dir web test
pnpm --dir web build
pnpm --dir web preview
```

构建会生成 Skill 静态规则和样张。预览地址为 [构建预览](http://localhost:4173/editor)，与开发端口的数据相互独立。

发布 **整个 `web/dist/`** 到 HTTPS 静态托管，包括 `index.html`、`assets/`、`library/` 和 `theme-previews/`。线上无需运行 Node、Python 或容器。托管环境需正确处理 `/editor` 回调、安全响应头与缓存，见[静态部署说明](docs/public/static-hosting.md)。

## 许可

AGPL-3.0-or-later，见 [LICENSE](LICENSE)、[NOTICE](NOTICE.md) 和 [Skill 来源说明](skills/gzh-design/SOURCE.md)。应用内及开源仓库已提供公开源码、依赖锁与构建脚本，不包含用户数据、钱包 Key 或内部工作记录。
