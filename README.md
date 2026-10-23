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
