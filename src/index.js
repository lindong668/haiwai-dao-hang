/**
 * 海外导航站（ss99.ccwu.cc）—— Cloudflare Workers + Assets
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
    if (url.hostname === 'www.ss99.ccwu.cc') {
      return Response.redirect('https://ss99.ccwu.cc' + url.pathname + url.search, 301);
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
        'User-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://ss99.ccwu.cc/sitemap.xml\n',
        {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }
      );
    }

    /* ★ sitemap.xml 硬拦截（本次收录问题的重点）
     * Google 要求 application/xml，且内容必须是合法 XML。
     * 原先静态返回时被判「类型未知、0 个网址」，这里直接由 Worker
     * 读取静态资源后强制改写 Content-Type 再吐出，确保万无一失。 */
    if (pathname === '/sitemap.xml') {
      const src = await env.ASSETS.fetch(new Request(url.origin + '/sitemap.xml', request));
      const body = await src.text();
      return new Response(body, {
        status: 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    // 无扩展名路径补 .html（如 /about → /about.html），301 转移权重
    const noExt = !/\.[a-zA-Z0-9]+$/.test(pathname);
    if (noExt && pathname !== '/' && !pathname.endsWith('/')) {
      const probe = await env.ASSETS.fetch(new Request(url.origin + pathname + '.html', request));
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
