const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const store = 'https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inbox-site-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'docs/blog'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.writeFileSync(path.join(root, 'scripts/site-config.json'), JSON.stringify({ baseUrl: 'https://inbox-cleaner.vercel.app', extensionStoreUrl: store }));
  fs.writeFileSync(path.join(root, 'docs/index.html'), '<html><body><!-- AUTO:guides:start --><!-- AUTO:guides:end --></body></html>');
  fs.writeFileSync(path.join(root, 'docs/blog/index.html'), '<html><body><!-- AUTO:blog-index:start --><!-- AUTO:blog-index:end --></body></html>');
  return root;
}

function post(root, slug, title, date) {
  fs.writeFileSync(path.join(root, `docs/blog/${slug}.html`), `<html><head><meta name="description" content="A useful &amp; practical guide."><script type="application/ld+json">${JSON.stringify({ '@type': 'Article', datePublished: date, dateModified: date })}</script></head><body><nav><a class="nav-logo" href="/">Home</a><a class="blog-nav-cta" href="/">Try the free tool</a></nav><main><h1 class="blog-h1">${title}</h1><div class="blog-body"><p>Original article text.</p><div class="blog-cta"><h3>Old call to action</h3><a class="blog-cta-btn" href="/">Open</a></div></div></main><footer></footer></body></html>`);
}

test('rebuild discovers new posts, removes deleted URLs, and preserves truthful dates', async t => {
  const { buildSite } = await import('../scripts/build_site.mjs');
  const root = fixture(t);
  post(root, 'gmail-storage', 'Gmail storage &amp; cleanup', '2026-08-09');
  buildSite(root);
  post(root, 'gmail-storage-full', 'Fix Gmail storage', '2026-10-16');
  buildSite(root);
  let xml = fs.readFileSync(path.join(root, 'docs/sitemap.xml'), 'utf8');
  assert.equal((xml.match(/<loc>/g) || []).length, 5);
  assert.match(xml, /gmail-storage\.html<\/loc>\s*<lastmod>2026-08-09/);
  assert.match(xml, /gmail-storage-full\.html/);
  fs.unlinkSync(path.join(root, 'docs/blog/gmail-storage.html'));
  buildSite(root);
  xml = fs.readFileSync(path.join(root, 'docs/sitemap.xml'), 'utf8');
  assert.doesNotMatch(xml, /gmail-storage\.html/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'docs/blog/index.html'), 'utf8'), /gmail-storage\.html/);
});

test('every post is linked from the hub and other articles, with a direct extension action', async t => {
  const { buildSite } = await import('../scripts/build_site.mjs');
  const root = fixture(t);
  for (let i = 0; i < 10; i++) post(root, `gmail-${i}`, `Gmail guide ${i}`, `2026-10-${String(i + 1).padStart(2, '0')}`);
  buildSite(root);
  const hub = fs.readFileSync(path.join(root, 'docs/blog/index.html'), 'utf8');
  const home = fs.readFileSync(path.join(root, 'docs/index.html'), 'utf8');
  assert.match(home, /href="\/blog\/"/);
  for (let i = 0; i < 10; i++) {
    assert.match(hub, new RegExp(`href="/blog/gmail-${i}\\.html"`));
    const html = fs.readFileSync(path.join(root, `docs/blog/gmail-${i}.html`), 'utf8');
    assert.match(html, /Original article text\./);
    assert.ok(html.includes(`href="${store}"`));
    assert.match(html, /href="\/blog\/"/);
    const related = html.split('<!-- AUTO:related:start -->')[1].split('<!-- AUTO:related:end -->')[0];
    assert.doesNotMatch(related, new RegExp(`href="/blog/gmail-${i}\\.html"`));
    assert.equal((related.match(/href="\/blog\/gmail-\d+\.html"/g) || []).length, 5);
    const others = Array.from({ length: 10 }, (_, j) => j).filter(j => j !== i);
    assert.ok(others.some(j => fs.readFileSync(path.join(root, `docs/blog/gmail-${j}.html`), 'utf8').includes(`href="/blog/gmail-${i}.html"`)));
  }
  assert.deepEqual(buildSite(root), [], 'rebuilding unchanged content must not create duplicate links or changes');
});

test('the publishing command generates discovery links before marking a queued post published', t => {
  const root = fixture(t);
  for (const script of ['build_site.mjs', 'publish_blog.py']) {
    fs.copyFileSync(path.resolve(__dirname, '../scripts', script), path.join(root, 'scripts', script));
  }
  post(root, 'gmail-new', 'A newly queued guide', '2026-10-16');
  post(root, 'gmail-older', 'An older guide', '2026-08-09');
  fs.writeFileSync(path.join(root, 'scripts/blog-topics.json'), JSON.stringify([{ slug: 'gmail-new', status: 'pending' }]));
  const result = spawnSync('python3', [path.join(root, 'scripts/publish_blog.py'), 'gmail-new'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Sitemap updated:/);
  assert.match(result.stdout, /Topic marked published:/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'scripts/blog-topics.json')))[0].status, 'published');
  assert.match(fs.readFileSync(path.join(root, 'docs/blog/index.html'), 'utf8'), /href="\/blog\/gmail-new.html"/);
  assert.match(fs.readFileSync(path.join(root, 'docs/blog/gmail-older.html'), 'utf8'), /href="\/blog\/gmail-new.html"/);
  assert.match(fs.readFileSync(path.join(root, 'docs/sitemap.xml'), 'utf8'), /gmail-new.html/);
});
