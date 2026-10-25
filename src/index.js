/**
 * 海外导航站（yok.us.ci）—— Cloudflare Workers + Assets
 *
 * ★ 为什么从「纯静态」改成 Workers：
 *   原域名 wwok.eu.cc 用纯静态部署，Search Console 一直报
 *   「无法抓取 / 类型未知 / 0 个网址」。虽然手动打开 sitemap.xml
 *   是正常的，但 Googlebot 拿到的东西始终不对（疑似 MIME 或中间层问题）。
 *
 *   改为 Workers 后，robots.txt / sitemap.xml / ads.txt 三个关键 SEO 文件
 *   由 Worker 层直接返回，绕过静态资源的 MIME 猜测与任何中间层干扰，
 *   保证 Google 与 AdSense 拿到的永远是正确内容 + 正确 Content-Type。
 *   1/2/3 号站都是这套机制，从未出现过 SEO 文件抓不到的问题。
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 统一走主域名，避免 www 与非 www 双份索引
    if (url.hostname === 'www.yok.us.ci') {
      return Response.redirect('https://yok.us.ci' + url.pathname + url.search, 301);
    }

    const pathname = url.pathname;

    /* ★ ads.txt 硬拦截
     * AdSense 抓取器对 Content-Type 极严格，必须是 text/plain，
     * 一旦被猜成 text/html 就判定「ads.txt 无效」，审核卡住。
     * 这里在 Worker 层直接接管，绕过静态资源的 MIME 猜测。 */
    if (pathname === '/ads.txt') {
      return new Response(
        'google.com, pub-8915931557404979, DIRECT, f08c47fec0942fa0\n',
        {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }
      );
    }

    /* ★ robots.txt 硬拦截
     * 固定返回纯文本，避免被包装成 HTML 导致 Google 无法解析。 */
    if (pathname === '/robots.txt') {
      return new Response(
        'User-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://yok.us.ci/sitemap.xml\n',
        {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }
      );
    }

    /* ★ sitemap.xml 硬拦截（C14 重写 —— 不再依赖静态资源）
     *
     * 【为什么改】
     *   旧写法用 env.ASSETS.fetch() 去读 public/sitemap.xml。
     *   对照本站其他两个 SEO 文件：
     *     ads.txt     → Worker 硬编码字符串 → AdSense 抓到「已授权」
     *     robots.txt  → Worker 硬编码字符串 → Google 正常读取
     *     sitemap.xml → 读静态文件          → GSC「无法抓取」
     *   唯一失败项 = 唯一依赖静态文件的项，相关性 100%。
     *
     * 【失效机制】静态文件若未真正部署（404），src.text() 会拿到
     *   404 错误页的 HTML，再被贴上 application/xml 的 Content-Type
     *   吐给 Google —— 标着 XML 的 HTML —— 解析失败 —— 报「无法抓取」。
     *   站点本身能正常访问，所以「手动能打开、爬虫抓不到」并不矛盾。
     *
     * 【修法】照抄 ads.txt 的成功做法：内容直接内联在 Worker 里，
     *   不读 ASSETS、不依赖上传、不受边缘缓存影响。
     *   内联体积 5162 字符，完全可控。
     */
    const SITEMAP_XML = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n<url>\n<loc>https://yok.us.ci/</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>daily</changefreq>\n<priority>1.0</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/piccalc.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>1.0</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/pricescope.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>1.0</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/photopea.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/remove-bg.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/tinypng.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/convertio.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/favicon-io.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/firefly.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/chatpdf.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/paraphraser.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/jsonlint.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/base64-encode.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/epoch-converter.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/regex101.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/uuid-generator.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/convert-case.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.7</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/smallpdf.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/ilovepdf.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/pdf24.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/tools/cloudconvert.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/guides/best-free-background-removers.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/guides/compress-images-without-losing-quality.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/guides/online-pdf-tools-compared.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.9</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/guides/free-photoshop-alternatives.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/guides/developer-tools-that-save-time.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/guides/ai-tools-for-content-creators.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/about.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>yearly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/contact.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>yearly</changefreq>\n<priority>0.8</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/disclaimer.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>yearly</changefreq>\n<priority>0.6</priority>\n</url>\n<url>\n<loc>https://yok.us.ci/privacy.html</loc>\n<lastmod>2026-10-20</lastmod>\n<changefreq>yearly</changefreq>\n<priority>0.6</priority>\n</url>\n</urlset>\n";

    if (pathname === '/sitemap.xml') {
      return new Response(SITEMAP_XML, {
        status: 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    /* ★ 无扩展名路径补 .html（如 /about → /about.html），301 转移权重
     *
     * ⚠️ 只对 GET/HEAD 做补后缀探测。
     * 原因：new Request(url, request) 会复用原请求的 body 流，
     * 之后再 env.ASSETS.fetch(request) 就会抛
     *   "Cannot reconstruct a Request with a used body."
     * （日志里 POST /wp-json/batch/v1 这类扫描器的 error 就是这么来的。）
     * 用 request.clone() 取一份干净的 body，避免污染后续主请求。
     */
    const noExt = !/\.[a-zA-Z0-9]+$/.test(pathname);
    const isNav = request.method === 'GET' || request.method === 'HEAD';
    if (noExt && isNav && pathname !== '/' && !pathname.endsWith('/')) {
      const probe = await env.ASSETS.fetch(
        new Request(url.origin + pathname + '.html', request.clone())
      );
      if (probe.status === 200) {
        return Response.redirect(url.origin + pathname + '.html' + url.search, 301);
      }
    }

    const res = await env.ASSETS.fetch(request);

    // 404 兜底
    if (res.status === 404) {
      return new Response(
        '<!doctype html><meta charset="utf-8"><title>Page Not Found</title>' +
          '<div style="font-family:system-ui;max-width:560px;margin:15vh auto;text-align:center">' +
          '<h1 style="font-size:22px">Page Not Found</h1>' +
          '<p style="color:#64748b">This page has moved or never existed.</p>' +
          '<a href="/" style="color:#6366f1">Back to homepage</a></div>',
        { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    return res;
  },
};
