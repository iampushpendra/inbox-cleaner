import { readFileSync, writeFileSync, readdirSync, realpathSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// `docs/` is the Vercel outputDirectory, so anything left in it is served
// publicly. robots.txt disallow does not unpublish an already-served URL, so
// internal documents are kept out of the directory entirely and this check
// fails the build if one reappears. Deny by default: name every publishable
// top-level file, and allow only .html under blog/.
const PUBLISHABLE = new Set([
  'app.js', 'blog', 'favicon.ico', 'google846fa3a21a23b5fc.html', 'index.html',
  'og-image.png', 'privacy.html', 'robots.txt', 'sitemap.xml', 'style.css',
]);

function readTools(root) {
  const file = resolve(root, 'scripts/tool-pages.json');
  if (!existsSync(file)) return [];
  const tools = JSON.parse(readFileSync(file, 'utf8'));
  const seen = new Set();
  if (!Array.isArray(tools)) throw new Error('Invalid tool manifest');
  for (const tool of tools) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug || '') || seen.has(tool.slug) ||
        typeof tool.title !== 'string' || !tool.title.trim() || typeof tool.description !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(tool.modified || '') || !Array.isArray(tool.assets) ||
        tool.assets.some(asset => !/^[a-z0-9-]+\.(js|css)$/.test(asset))) throw new Error('Invalid tool manifest entry');
    seen.add(tool.slug);
    const html = readFileSync(resolve(root, `docs/tools/${tool.slug}/index.html`), 'utf8');
    const base = new URL(JSON.parse(readFileSync(resolve(root, 'scripts/site-config.json'), 'utf8')).baseUrl).origin;
    if (!html.includes(`rel="canonical" href="${base}/tools/${tool.slug}/"`)) throw new Error(`Invalid tool canonical: ${tool.slug}`);
    for (const asset of tool.assets) readFileSync(resolve(root, `docs/tools/${asset}`));
  }
  return tools;
}

export function assertPublishableOutput(root = projectRoot) {
  const tools = readTools(root);
  const permitted = new Set(PUBLISHABLE);
  if (tools.length) permitted.add('tools');
  const leaked = [];
  function inspect(directory, allowed, prefix = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || !allowed.has(entry.name)) leaked.push(prefix + entry.name);
    }
  }
  inspect(resolve(root, 'docs'), permitted);
  // Tools are an exact manifest, never a broad directory publishing exemption.
  if (tools.length) {
    inspect(resolve(root, 'docs/tools'), new Set([...tools.map(tool => tool.slug), ...tools.flatMap(tool => tool.assets)]), 'tools/');
    for (const tool of tools) inspect(resolve(root, `docs/tools/${tool.slug}`), new Set(['index.html']), `tools/${tool.slug}/`);
  }
  if (leaked.length) throw new Error(`These files are inside the published docs/ directory and would be served publicly: ${leaked.join(', ')}. Move them out of docs/ or add them to the manifest deliberately.`);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const text = value => value.replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|mdash|ndash);/gi, (_, entity) => {
  if (entity.startsWith('#')) return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–' }[entity.toLowerCase()];
}).trim();

function replaceRegion(html, name, content, before) {
  const start = `<!-- AUTO:${name}:start -->`;
  const end = `<!-- AUTO:${name}:end -->`;
  const region = `${start}\n${content}\n${end}`;
  if (html.includes(start) && html.includes(end)) {
    const first = html.indexOf(start);
    return html.slice(0, first) + region + html.slice(html.indexOf(end, first) + end.length);
  }
  if (!html.includes(before)) throw new Error(`Missing insertion point for ${name}`);
  return html.replace(before, `${region}\n${before}`);
}

function readPosts(root) {
  return readdirSync(resolve(root, 'docs/blog')).filter(name => name.endsWith('.html') && name !== 'index.html').map(name => {
    const html = readFileSync(resolve(root, 'docs/blog', name), 'utf8');
    const title = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '';
    const schemas = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match => {
      const parsed = JSON.parse(match[1]);
      return parsed['@graph'] || (Array.isArray(parsed) ? parsed : [parsed]);
    });
    const article = schemas.find(schema => schema['@type'] === 'Article');
    const published = article?.datePublished?.slice(0, 10);
    const modified = (article?.dateModified || published)?.slice(0, 10);
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(published || '') || !/^\d{4}-\d{2}-\d{2}$/.test(modified || '')) {
      throw new Error(`Missing article title or dates: ${name}`);
    }
    return { slug: name.slice(0, -5), title: text(title), description: text(description), published, modified, html };
  }).sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
}

function relatedPosts(posts, index) {
  if (posts.length < 2) return [];
  const current = posts[index];
  const tokens = value => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2 && !['gmail', 'how', 'the', 'and', 'from', 'emails', 'email', 'delete', 'all', 'your', 'with'].includes(word)));
  const target = tokens(current.slug);
  const score = post => [...tokens(post.slug)].filter(word => target.has(word)).length;
  const ranked = posts.filter(post => post !== current).sort((a, b) => score(b) - score(a) || b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
  // The chronological ring guarantees every post receives incoming links, even
  // when its topic scores poorly against every other article.
  return [...new Set([posts[(index + 1) % posts.length], posts[(index + posts.length - 1) % posts.length], ...ranked])].slice(0, 5);
}

export function buildSite(root = projectRoot) {
  assertPublishableOutput(root);
  const config = JSON.parse(readFileSync(resolve(root, 'scripts/site-config.json'), 'utf8'));
  const base = new URL(config.baseUrl).origin;
  const store = config.extensionStoreUrl;
  if (!/^https:\/\/chromewebstore\.google\.com\/detail\/[^/]+\/[a-p]{32}$/.test(store)) throw new Error('A verified Chrome Web Store URL is required');
  const posts = readPosts(root);
  const queueFile = resolve(root, 'scripts/blog-topics.json');
  if (existsSync(queueFile)) {
    const topics = JSON.parse(readFileSync(queueFile, 'utf8'));
    const published = new Set(topics.filter(topic => topic.status === 'published').map(topic => topic.slug));
    for (const post of posts) {
      if (published.has(post.slug)) continue;
      const check = spawnSync('python3', [resolve(root, 'scripts/content_gate.py'), '--ready', post.slug], { encoding: 'utf8' });
      if (check.status !== 0) throw new Error(`Unreviewed article cannot enter deployment: ${post.slug}. ${check.stdout || check.stderr || 'Evidence readiness check unavailable.'}`);
    }
  }
  const tools = readTools(root);
  const changed = [];
  function write(path, value) {
    let previous;
    try { previous = readFileSync(resolve(root, path), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (previous !== value) { writeFileSync(resolve(root, path), value); changed.push(path); }
  }
  const install = `<a class="blog-cta-btn" href="${escape(store)}">Add Inbox Cleaner to Chrome →</a>`;
  const cta = `<div class="blog-cta">\n<h3>Clean up Gmail with the Chrome extension</h3>\n<p>Rank senders, select the ones you want to clear, and move their emails to Trash. You have 30 days to recover trashed emails.</p>\n${install}\n</div>`;
  function navigation(html) {
    html = html.replace(/href="https:\/\/chromewebstore\.google\.com\/detail\/[^"]+"/g, `href="${escape(store)}"`);
    html = html.replace(/<a\b[^>]*class="blog-nav-cta"[^>]*>[\s\S]*?<\/a>/g, `<a class="blog-nav-cta" href="${escape(store)}">Add to Chrome →</a>`);
    if (!html.includes('class="nav-blog-link"')) html = html.replace(/(<a class="blog-nav-cta")/, '<a class="nav-blog-link" href="/blog/">All guides</a>\n$1');
    return html;
  }
  const link = post => `<a href="/blog/${escape(post.slug)}.html">${escape(post.title)}</a>`;
  for (const [index, post] of posts.entries()) {
    let html = navigation(post.html).replace(/<div\b[^>]*class="blog-cta"[^>]*>[\s\S]*?<\/div>/g, cta);
    const related = `<section class="blog-wrap related-guides" aria-labelledby="related-heading">\n<h2 id="related-heading">More Gmail cleanup guides</h2>\n<ul>${relatedPosts(posts, index).map(other => `<li>${link(other)}</li>`).join('\n')}</ul>\n<p><a href="/blog/">Browse all ${posts.length} guides</a> · <a href="/">About Inbox Cleaner</a></p>\n${cta}\n</section>`;
    html = replaceRegion(html, 'related', related, '</main>');
    write(`docs/blog/${post.slug}.html`, html);
  }
  const toolLinks = tools.length ? `<section aria-labelledby="tools-heading"><h2 id="tools-heading">Plan your Gmail cleanup</h2><p>Local tools to help you review a search or diagnose storage. No mailbox access or automatic deletion.</p><ul>${tools.map(tool => `<li><a href="/tools/${escape(tool.slug)}/">${escape(tool.title)}</a> — ${escape(tool.description)}</li>`).join('')}</ul></section>` : '';
  const list = `<div class="blog-index-list">\n${posts.map(post => `<article class="blog-index-item">\n<time class="blog-index-date" datetime="${post.published}">${post.published}</time>\n<a class="blog-index-title" href="/blog/${escape(post.slug)}.html">${escape(post.title)}</a>\n<p class="blog-index-desc">${escape(post.description)}</p>\n</article>`).join('\n')}\n</div>`;
  let hub = navigation(readFileSync(resolve(root, 'docs/blog/index.html'), 'utf8'));
  hub = replaceRegion(hub, 'blog-index', `${cta}\n${toolLinks}\n<p>${posts.length} practical guides. Start with a topic below, then use the extension when you are ready to clean up.</p>\n${list}`, '</main>');
  write('docs/blog/index.html', hub);
  const guides = `<section class="site-guides" aria-labelledby="guides-heading">\n<div class="guides-inner">\n<h2 id="guides-heading">Practical ways to clear your Gmail inbox</h2>\n<p>Start with a guide, then put it into practice with Inbox Cleaner for Chrome.</p>\n<ul>${posts.slice(0, 6).map(post => `<li>${link(post)}</li>`).join('\n')}</ul>\n${toolLinks}\n<p><a href="/blog/">Browse all ${posts.length} Gmail guides →</a></p>\n<a class="blog-nav-cta" href="${escape(store)}">Add Inbox Cleaner to Chrome →</a>\n</div>\n</section>`;
  const home = navigation(replaceRegion(readFileSync(resolve(root, 'docs/index.html'), 'utf8'), 'guides', guides, '<footer>'));
  write('docs/index.html', home);
  const urls = [{ url: '/' }, { url: '/blog/', date: posts[0]?.published }, { url: '/privacy.html' }, ...tools.map(tool => ({ url: `/tools/${tool.slug}/`, date: tool.modified })), ...posts.map(post => ({ url: `/blog/${post.slug}.html`, date: post.modified }))];
  write('docs/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(entry => `  <url><loc>${escape(base + entry.url)}</loc>${entry.date ? `<lastmod>${entry.date}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
  return changed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const changed = buildSite();
  console.log(`Site generated: ${changed.length} files updated (sitemap, blog index, homepage, related guides, extension links).`);
}
