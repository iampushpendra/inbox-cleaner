const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

test('deployment build cannot discover an unreviewed pending article', async t => {
 const {buildSite}=await import('../scripts/build_site.mjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'seo-readiness-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'docs/blog'),{recursive:true});fs.mkdirSync(path.join(root,'scripts'));
 fs.writeFileSync(path.join(root,'scripts/site-config.json'),JSON.stringify({baseUrl:'https://inbox-cleaner.vercel.app',extensionStoreUrl:'https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep'}));
 fs.writeFileSync(path.join(root,'docs/index.html'),'<main></main><footer></footer>');
 fs.writeFileSync(path.join(root,'docs/blog/index.html'),'<main></main>');
 fs.writeFileSync(path.join(root,'docs/blog/unreviewed.html'),'<html><head><meta name="description" content="Draft"><link rel="canonical" href="https://inbox-cleaner.vercel.app/blog/unreviewed.html"><script type="application/ld+json">{"@type":"Article","datePublished":"2026-10-17","dateModified":"2026-10-17"}</script></head><body><main><h1>Unreviewed draft</h1></main></body></html>');
 fs.writeFileSync(path.join(root,'scripts/blog-topics.json'),'[{"slug":"unreviewed","status":"pending"}]');
 fs.copyFileSync(path.resolve(__dirname,'../scripts/content_gate.py'),path.join(root,'scripts/content_gate.py'));
 assert.throws(()=>buildSite(root),/Unreviewed article|readiness|evidence/);
 assert.equal(fs.existsSync(path.join(root,'docs/sitemap.xml')),false,'the discovery surfaces must not be written before readiness passes');
});
