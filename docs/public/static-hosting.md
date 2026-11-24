# 静态托管

## 构建与发布

在项目根目录配置好公开构建参数后执行：

```sh
pnpm --dir web install --frozen-lockfile
pnpm --dir web test
pnpm --dir web build
```

将整个 `web/dist/` 发布到 HTTPS 站点根路径。它包含一个 HTML 入口、JS/CSS、主题图片、静态规则和源码 ZIP；只上传 HTML 会缺失运行资源。应用使用根路径资源 URL，当前未实现子目录部署。没有业务服务进程、业务数据库或容器依赖；Node/pnpm 只负责构建。

本机可执行 `pnpm --dir web preview` 检查构建，默认端口 4173。此命令不是生产服务器。

## EdgeOne 发布

仓库根目录的 `edgeone.json` 落实下述响应头、缓存及 `/editor` 路由。使用 EdgeOne CLI 1.7.0+，在根目录确认登录和项目归属后，先本机构建，再直接上传已准备的产物：

```sh
pnpm --dir web build
pnpm --dir web prepare:edgeone
PAGES_SOURCE=skills edgeone makers deploy .edgeone --skip-ai-gateway-sync --json
```

首次绑定项目需另行确认云端空间与项目名称；后续使用 `.edgeone/project.json` 中的原项目，不另建同名项目。`.edgeone/` 为本地生成状态，不进入 Git 或对应源码包。准备脚本只替换其生成的 `assets/` 与 `routes.json`，保留 CLI 管理的项目关联。

显式上传目录用于避免 CLI 自动构建时拉取并覆盖本机环境变量；`--skip-ai-gateway-sync` 单独使用并不等于禁止环境变量同步。不上传仓库根目录、真实环境文件、钱包数据或内部记录。公开源码包包含本次发布配置和脚本。

使用平台返回的完整临时预览链接检查页面；临时链接的访问参数不可省略。自定义域名由站点所有者在 EdgeOne 控制台绑定并配置 DNS/HTTPS。构建中的 TokenDance App URL 仍使用平台登记的应用身份，不改成临时域名；正式授权与归因待自定义域名就绪后验证。换域名不会自动迁移浏览器中的文章，需先导出备份。

## 路由

- `/`、`/editor` 提供工作台。OAuth 回调使用同源的 `/`，其查询参数原样交给浏览器处理。EdgeOne 的 `/editor` 重写在携带查询参数时曾返回 404。
- `assets/`、`library/`、`theme-previews/` 和 `/typetada-source.zip` 必须按真实文件提供正确 MIME；不存在的资源返回 404，不返回 HTML 伪装成功。
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
| `/library/*`、`/theme-previews/*`、`/typetada-source.zip` | `no-cache` |
| 带哈希文件名的 `/assets/*` | `public, max-age=31536000, immutable` |

发布采用完整目录的版本切换或平台原子发布。旧页面可能仍需加载旧的动态 JS 文件，短期保留旧哈希资源或由托管平台保留历史部署，不在用户操作期间逐文件覆盖并删除资源。

## 数据与上线核对

文章、图片、结果在浏览器 IndexedDB，按浏览器 profile 与 origin 隔离。保持同一正式域名；换域名、端口或协议不能自动读取原站点的数据。现有浏览器数据不属于静态构建或Git历史清理对象。

上线时检查 HTTPS、`/editor` 直接刷新、资源 MIME/404、安全头与缓存、源码 ZIP，并用合成 `flow`、`code` 参数访问回调入口 `/?flow=diagnostic&code=diagnostic`，确认返回工作台。随后核实真实 OAuth 回调、平台 CORS/恢复头、应用归因与模型权限。微信公众号粘贴、保存重开和手机图文分别验收。
