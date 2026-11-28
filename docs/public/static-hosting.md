# 静态托管

## 构建与发布

在项目根目录配置好公开构建参数后执行：

```sh
pnpm --dir web install --frozen-lockfile
pnpm --dir web test
pnpm --dir web build
```

将整个 `web/dist/` 发布到 HTTPS 站点根路径。它包含一个 HTML 入口、JS/CSS、主题图片与静态规则；只上传 HTML 会缺失运行资源。应用使用根路径资源 URL，当前未实现子目录部署。没有业务服务进程、业务数据库或容器依赖；Node/pnpm 只负责构建。

本机可执行 `pnpm --dir web preview` 检查构建，默认端口 4173。此命令不是生产服务器。

## EdgeOne 发布

将 EdgeOne 项目关联生产仓库的 `main` 分支后，推送该分支会触发 EdgeOne 按 `edgeone.json` 自动构建和部署 `web/dist/`。生产改动推送前，先递增产品版本并在本地完成测试与构建。部署完成后，在正式站的「使用指南」核对当前版本。

### 产品版本

`web/package.json` 的 `version` 是产品版本的唯一来源，构建时写入「使用指南」。按 `主版本.次版本.修订号` 三段整数递增，每批生产变更按其中最高的变更级别更新一次。

| 变更 | 版本规则 | 示例 |
|---|---|---|
| 修复和小优化，如粘贴、提示与诊断改进 | 修订号加一 | `0.7.1 → 0.7.2` |
| 新增重要功能或明显调整工作流 | 次版本加一，修订号归零 | `0.7.1 → 0.8.0` |
| 正式产品里程碑或重大兼容变更 | 主版本加一，后两段归零 | `0.8.0 → 1.0.0` |

修订号和次版本都可以超过 9，例如 `0.7.9 → 0.7.10`、`0.9.0 → 0.10.0`。发布 `1.0.0` 需明确确认。仅改内部文档或仅在开发分支验证时，可以沿用原版本。

错误报告的 `appVersion` 取自任务发起时的应用版本。旧任务若无该字段，导出时保留缺省。报告的 `schemaVersion` 独立记录 JSON 格式版本。

### EdgeOne 直接上传项目

以下 CLI 流程适用于配置为直接上传的 EdgeOne 项目。使用 EdgeOne CLI 1.7.0+，在根目录确认登录和项目归属后，先本机构建，再直接上传已准备的产物：

```sh
pnpm --dir web build
pnpm --dir web prepare:edgeone
PAGES_SOURCE=skills edgeone makers deploy .edgeone --skip-ai-gateway-sync --json
```

首次绑定项目需另行确认云端空间与项目名称；后续使用 `.edgeone/project.json` 中的原项目，不另建同名项目。`.edgeone/` 为本地生成状态，不进入 Git 或公开仓库。准备脚本只替换其生成的 `assets/` 与 `routes.json`，保留 CLI 管理的项目关联。

显式上传目录用于避免 CLI 自动构建时拉取并覆盖本机环境变量；`--skip-ai-gateway-sync` 单独使用并不等于禁止环境变量同步。不上传仓库根目录、真实环境文件、钱包数据或内部记录。

使用平台返回的完整临时预览链接检查页面；临时链接的访问参数不可省略。自定义域名由站点所有者在 EdgeOne 控制台绑定并配置 DNS/HTTPS。构建中的 TokenDance App URL 仍使用平台登记的应用身份，不改成临时域名；正式授权与归因待自定义域名就绪后验证。换域名不会自动迁移浏览器中的文章，需先导出备份。

## 路由

- `/`、`/editor` 提供工作台。OAuth 回调使用同源的 `/`，其查询参数原样交给浏览器处理。EdgeOne 的 `/editor` 重写在携带查询参数时曾返回 404。
- `assets/`、`library/` 和 `theme-previews/` 必须按真实文件提供正确 MIME；不存在的资源返回 404，不返回 HTML 伪装成功。
- 旧 `/api`、`/api/*`、`/media`、`/media/*` 返回 404。
- 仅对需要的前端页面路径设置 SPA 回退，避免全站无条件回退掩盖缺失资源。

## 响应头

在托管平台或现有 Web 服务器设置：

```text
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://tokendance.space; frame-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

需通过HTTP响应头发送，特别是 `frame-ancestors` 不能仅靠 HTML meta 设置。授权页通过浏览器顶层导航打开；模型、余额与换Key请求只连接固定 TokenDance 端点。部署平台若强制注入脚本，应核对与此 CSP 的兼容性，不直接关闭 CSP。

## 缓存与版本

| 路径 | Cache-Control |
|---|---|
| `/`、`/editor`、`/index.html` | `no-cache` |
| `/library/*`、`/theme-previews/*` | `no-cache` |
| `/assets/*` | `no-cache` |

直接上传时，EdgeOne 准备脚本随当前构建附带最近两套不同构建的哈希资源，首次运行从本机现有的 `.edgeone/assets/assets/` 接续。后续直接上传使用同一工作区，保留被 Git 忽略的 `artifacts/edgeone-asset-history/`，或在更换发布机器时一并迁移这份目录。该目录本身不上传。旧标签页可继续按原地址加载这些资源。资源统一重新验证，避免缺失文件的 404 被缓存一年。

验收时保留一个更新前打开的工作台标签页，更新后在该页首次粘贴带格式和图片的内容；再确认新版入口及不存在的资源仍返回各自预期的状态。

## 数据与上线核对

文章、图片、结果在浏览器 IndexedDB，按浏览器 profile 与 origin 隔离。保持同一正式域名；换域名、端口或协议不能自动读取原站点的数据。现有浏览器数据不属于静态构建或Git历史清理对象。

上线时检查 HTTPS、`/editor` 直接刷新、资源 MIME/404、安全头与缓存，并用合成 `flow`、`code` 参数访问回调入口 `/?flow=diagnostic&code=diagnostic`，确认返回工作台。随后核实真实 OAuth 回调、平台 CORS/恢复头、应用归因与模型权限。微信公众号粘贴、保存重开和手机图文分别验收。
