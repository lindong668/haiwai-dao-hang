# 海外导航站（ss99.ccwu.cc）部署说明

## 站点信息

| 项 | 值 |
|---|---|
| 域名 | https://ss99.ccwu.cc |
| Worker 名称 | `haiwai-dao-hang` |
| 部署形态 | Cloudflare Workers + Assets |
| 入口 | `src/index.js` |
| 静态资源 | `public/`（站点实际生效内容） |

## 文件结构

```
README.md          本说明
wrangler.toml      部署配置（name / assets / 日志）
src/index.js       Worker 入口
public/            静态页面（实际生效）
  ├ index.html              首页（工具目录）
  ├ about.html              关于本站
  ├ contact.html            联系方式
  ├ privacy.html            隐私政策
  ├ disclaimer.html         免责声明
  ├ robots.txt              Sitemap 指向 ss99.ccwu.cc
  ├ sitemap.xml             31 条 URL，全部为 ss99.ccwu.cc
  ├ ads.txt                 AdSense 授权文件
  ├ google6474e28bb6098302.html   Google 站点验证文件
  ├ guides/                 6 篇指南文章
  └ tools/                  20 个工具介绍页
```

## 部署方式

### 方式一：命令行

```bash
npx wrangler deploy
```

### 方式二：Cloudflare 控制台（网页上传）

1. CF 控制台 → Workers 和 Pages → 创建 → Workers
2. 上传 `public/`、`src/`、`wrangler.toml`（或用 GitHub 连接本仓库）
3. **设置 → 域和路由** → 添加自定义域 `ss99.ccwu.cc/*`

> ⚠️ `wrangler.toml` 里 `[assets] directory = "./public"` 已写死，
> 只有 `public/` 下的文件会生效。**不要往仓库根目录放 HTML 文件**，
> 否则不会部署，还会造成版本混乱。

## 域名变更记录

- **2026-10-23**：由 `zook.cc.cd` 更换为 `ss99.ccwu.cc`（原后缀不可用）
- 全站 586 处域名引用已同步替换（含 sitemap、robots、canonical、内链）
- localStorage 键名 `zooklang` → `ss99lang`（27 个文件）
- 根目录 8 个混入的旧房贷站文件已删除

## Google / AdSense 提交

```
Search Console  提交 https://ss99.ccwu.cc/sitemap.xml
AdSense         添加站点 https://ss99.ccwu.cc
                ads.txt 已就位：pub-8915931557404979
```

三个关键文件（robots.txt / sitemap.xml / ads.txt）由 Worker 层直接返回，
Content-Type 写死，避免 Assets 的 MIME 猜测导致抓取失败。

## C12 变更（2026-10-24）
1. 修复 index.html 头部残留的旧内联 SVG 图标碎片（导致页面左上角显示 🧰 及乱码字符）
2. 修复 26 个子页面 </head> 与 <body> 之间游离的旧版面包屑（导致页面顶部出现重复面包屑）
   - 涉及 tools/*.html（20 个）、guides/*.html（6 个）
3. 未改动 src/index.js、图标文件、样式与内容

全站复检（31 页）：死链 0、资源缺失 0、调试残留 0、真实广告位 0、页脚声明 31/31、标签配对 0 异常

## C13 变更（2026-10-24）— 修复 Workers Builds 预览构建红叉

**根因**：CF 的 Workers Builds 对同一次提交跑两套构建——
生产 `wrangler deploy` 成功（绿），预览 `wrangler preview` 要求
配置中存在 `[previews]` 块，缺失即失败（GitHub 上红叉）。
与 2号 A17、5号 D16 同源。

**本站情况**：wrangler.toml 无 vars，按 CF 官方说明
（`The block can be empty`）补空 `[previews]` 块即可。

**部署**：无增删 → 覆盖上传，实际只需替换 wrangler.toml。
