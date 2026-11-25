# 应用配置

TypeTada 没有共享模型 Key 或开发者 Key 回退。每位使用者在浏览器授权自己的 TokenDance 钱包；部署者只配置应用身份和模型。

| 构建参数 | 用途 |
|---|---|
| `VITE_TOKENDANCE_APP_URL` | 平台登记的 HTTPS 应用 URL；同时用于 OAuth 的 `app_url` 与模型请求头 `X-App-URL` |
| `VITE_TOKENDANCE_KEY_NAME` | 平台授权时创建个人 Key 的名称 |
| `VITE_TOKENDANCE_MODEL` | 平台可用且兼容当前请求参数的模型 ID；结果保存实际使用值 |
| `VITE_GITHUB_REPOSITORY_URL` | 可选的 GitHub 公开项目页，格式为 `https://github.com/账号/仓库`；仓库实际发布后填写 |
| `VITE_SITE_ICP_FILING` | 可选的 ICP 备案号，例如 `粤ICP备XXXXXXXX号-1`，显示在页脚并链接到工信部备案查询 |
| `VITE_SITE_PUBLIC_SECURITY_FILING` | 可选的公安联网备案号，例如 `粤公网安备XXXXXXXXXXXXXX号`，页脚链接按其中的数字生成 |

以上参数默认均为空。前三项配置 AI 接入：缺应用 URL/名称或 URL 无效时禁止授权；缺应用信息或模型时禁止 AI 排版，不发出请求或创建排版任务。本地编辑、导入、保存、预览、已有结果复制和导出仍可用。GitHub 参数独立于 AI 接入；留空或格式无效时显示“GitHub 项目页（筹备中）”，不影响编辑、授权或排版。不要填写私有仓库地址或尚未发布的预定地址。备案号属于部署站点的运营者，只填写你自己站点取得的号码；两项都留空时页脚不显示备案信息。

## 开发与构建

从仓库根目录复制 `.env.example` 到 `web/.env.local`，填写值后运行开发或构建命令。Vite 的配置根目录是 `web/`，只在仓库根目录创建 `.env` 不会自动配置本应用。

生产也可使用被忽略的 `web/.env.production.local`，或在构建平台设置这些环境变量。构建进程的环境变量优先于文件；生产专用文件优先于 `.env.local`。参数在构建时写入 JS，部署后修改主机环境变量不会改变已经生成的文件，需重新构建、完整发布。

这些值公开可见，不是凭据。真实钱包 Key 由使用者授权取得，不能放在任何 `VITE_*` 参数中，也不应提交真实 `.env` 文件。只有空值模板纳入 Git。

## 钱包与应用变化

个人 Key 默认只放在页面内存；自愿记住后明文保存在当前浏览器 IndexedDB，同源脚本、扩展或可访问设备的人可能读取。断开仅忘记本地凭据，不撤销平台 Key。

钱包和授权流程绑定应用 URL/名称。应用身份改变，或升级前的凭据没有身份记录时，需重新连接钱包；旧文章、图片与排版结果不会删除。模型变化不要求重新授权，但模型权限和参数兼容性需自行核实。

当前请求使用 `thinking: {type: "enabled"}`、`reasoning_effort: "high"`、总输出上限 65,536 tokens；改变模型 ID 不代表自动适配所有服务商或模型。

## 开源仓库

公开代码、依赖锁、Skill/主题、许可及构建脚本统一通过 `VITE_GITHUB_REPOSITORY_URL` 配置的 GitHub 开源仓库提供，不再随静态站点额外打包分发源码 ZIP。要复现对应配置，只需在本地 `web/.env.local` 中写入上述公开参数后按 README 执行安装与构建命令即可。
