# 资产管家

给两个人的家庭资产管理小应用：记录每件资产的**类别、图标/照片、购买日期、金额**，首页一眼看到每件资产**平均一天花多少钱**。

- 纯前端 SPA + Netlify Functions 代理，**无需自建服务器**
- 数据存在主人 GitHub 账号的**私有仓库**里，每位使用者一个独立文件夹，互不可见
- 主人用 GitHub 登录；女朋友用「访客名 + 访客码」登录，无需 GitHub 账号
- 主人可在 App「设置 → 访客管理」直接添加/删除访客（存于数据仓库 `users.json`，无需改环境变量、无需重新部署）
- 支持拍照（前端压缩后入库）、图标选择、分类管理、退役/恢复、统计图表（花费趋势 / 分类占比 / 日均 TOP5 / 退役总结）、JSON 导出备份、PWA 添加到主屏幕、多套主题（普通/玻璃拟态/瑞士极简/亲自然）与「普通」主题自定义配色

## 技术栈

React 19 · Vite · TypeScript · Tailwind CSS v4 · zustand · recharts · lucide-react · Netlify Functions (TypeScript)

数据格式为仓库中 `data/<用户名>/assets.json` + `data/<用户名>/images/*`，可直接用 Git 查看/回滚历史。

## 部署步骤（一次性，约 15 分钟）

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "feat: 资产管家"
# 在 GitHub 上新建一个空仓库（可私有）后：
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

> 注意：这个代码仓库只是 App 本身；用户资产数据存在另一个独立仓库（下一步会自动创建）。

### 2. 创建 GitHub OAuth App（主人登录用）

打开 https://github.com/settings/developers → **New OAuth App**：

| 字段 | 填写 |
|---|---|
| Application name | 资产管家 |
| Homepage URL | `https://<你的站点>.netlify.app` |
| Authorization callback URL | `https://<你的站点>.netlify.app/auth/callback` |

记下 **Client ID**，并生成一个 **Client Secret**。

### 3. 创建 fine-grained PAT（访客模式用）

打开 https://github.com/settings/personal-access-tokens → **Generate new token (fine-grained)**：

- Repository access：**Only select repositories**（先随便选一个，或等第 4 步建好仓库后再回来选中它）
- Permissions → Repository permissions → **Contents: Read and write**

记下 token（`github_pat_` 开头）。

### 4. 部署到 Netlify

在 Netlify 上 **Add new site → Import an existing project**，选择上一步的 GitHub 仓库（构建设置会自动读取 `netlify.toml`），然后在 **Site settings → Environment variables** 添加：

| 变量名 | 值 | 说明 |
|---|---|---|
| `DATA_REPO` | `<你的用户名>/asset-data` | 数据仓库名（建议就叫 asset-data） |
| `GITHUB_CLIENT_ID` | 第 2 步的 Client ID | |
| `GITHUB_CLIENT_SECRET` | 第 2 步的 Client Secret | |
| `GITHUB_TOKEN` | 第 3 步的 PAT | 访客模式使用；建好仓库后记得回来把它指向 asset-data |
| `USER_CODES` | `girlfriend:abc123` | 访客码表，逗号分隔多个：`girlfriend:abc123,mom:xyz789`（可选；访客也可由主人在 App 内添加） |

前端变量（Vite 构建时读取）再添加：

| 变量名 | 值 |
|---|---|
| `VITE_GITHUB_CLIENT_ID` | 第 2 步的 Client ID |

部署完成后，回到 GitHub OAuth App 设置，确认回调 URL 与实际站点域名一致（Netlify 分配的 `*.netlify.app` 或你绑定的自定义域名）。

### 5. 首次使用

1. 用你的 GitHub 账号登录站点 → App 会提示「初始化数据仓库」→ 点击后**自动在你的账号下创建私有仓库 `asset-data`** 并写入你的数据文件夹
2. 把第 3 步的 PAT 重新编辑，勾选 `asset-data` 仓库（如果之前没选）
3. 把站点地址和访客码发给女朋友，她选「访客登录」即可使用
4. 手机浏览器打开 → 「添加到主屏幕」，当原生 App 用

### 6. 本地开发

```bash
npm install
npm run dev          # 仅前端（API 不可用）
npx netlify-cli dev  # 前端 + Functions 完整联调（需先在 .env 里配好环境变量）
```

`.env` 示例见 `.env.example`（仅本地用，不要提交到 Git）。

## 数据与安全

- 所有数据写入**你自己的私有仓库**，图片经 API 带鉴权读取，未登录无法访问
- 访客只能读写 `data/<TA的名字>/` 一个文件夹，由服务端强制限制
- 访客码可随时在 Netlify 环境变量里修改（改完需重新部署一次）
- 保险起见可定期在设置页导出 JSON 备份，或在 GitHub 上给 asset-data 开分支保护

## 环境变量速查（Netlify 后台）

```
DATA_REPO=<你的用户名>/asset-data
GITHUB_CLIENT_ID=xxxx
GITHUB_CLIENT_SECRET=xxxx
GITHUB_TOKEN=github_pat_xxxx   ← fine-grained，仅需 asset-data 的 Contents 读写
USER_CODES=girlfriend:abc123
VITE_GITHUB_CLIENT_ID=xxxx     ← 与 CLIENT_ID 相同，给前端用
```
