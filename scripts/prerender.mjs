import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const outputDirectory = resolve(root, 'dist');
const template = await readFile(join(outputDirectory, 'index.html'), 'utf8');
const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom'
});

const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

try {
  const [{ render }, { pageMetadata, canonicalBase }] = await Promise.all([
    server.ssrLoadModule('/src/entry-server.tsx'),
    server.ssrLoadModule('/src/seo.ts')
  ]);

  for (const metadata of pageMetadata) {
    const canonical = `${canonicalBase}${metadata.path}`;
    const noIndex = metadata.path === '/account/' || metadata.path === '/admin/';
    const structuredData = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'RecoverX',
      url: canonicalBase,
      description: metadata.description,
      publisher: { '@type': 'Organization', name: 'RecoverX', url: canonicalBase }
    }).replace(/</g, '\\u003c');
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(metadata.description)}" />`)
      .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`)
      .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${noIndex ? 'noindex, nofollow' : 'index, follow'}" />`)
      .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`)
      .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`)
      .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`);

    html = html.replace('</head>', `<script id="recoverx-structured-data" type="application/ld+json">${structuredData}</script>\n  </head>`);
    html = html.replace('<div id="root"></div>', `<div id="root">${render(metadata.path)}</div>`);

    const relativePath = metadata.path === '/' ? 'index.html' : join(metadata.path.replace(/^\/|\/$/g, ''), 'index.html');
    const outputPath = join(outputDirectory, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, 'utf8');
  }

  const publicPages = pageMetadata.filter((metadata) => metadata.path !== '/account/' && metadata.path !== '/admin/');
  const sitemapEntries = publicPages.map((metadata) => `  <url><loc>${canonicalBase}${metadata.path}</loc></url>`).join('\n');
  await writeFile(
    join(outputDirectory, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
    'utf8'
  );
  const basePath = new URL(canonicalBase).pathname.replace(/\/+$/, '');
  await writeFile(
    join(outputDirectory, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: ${basePath}/account/\nDisallow: ${basePath}/admin/\nSitemap: ${canonicalBase}/sitemap.xml\n`,
    'utf8'
  );
  await writeFile(join(outputDirectory, '404.html'), template.replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found — RecoverX</title>'), 'utf8');
} finally {
  await server.close();
}
