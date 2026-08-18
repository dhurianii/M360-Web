// assets/build-legal.js
// -----------------------------------------------------------------------------
// Build-time fetch-and-strip for the Moneylizer legal pages.
//
// The MegaGraphs policy pages (privacy-policy, terms-of-use, data-policy) are
// served as full standalone HTML documents that include their own
// <header> (Moneylizer logo + Login/Help/Documents nav), a "Legal documents"
// tabs row, the <article> body, and a tiny inline <script> for the mobile
// menu toggle. Embedding that full page inside our iframe would create a
// double header / double logo / double nav.
//
// This script downloads each page server-to-server (so cross-origin doesn't
// matter), then extracts only the policy body — the <article> element and
// its required typography — and writes the cleaned output into the local
// assets/ folder. The Moneylizer legal pages iframe in the local files,
// so we get exactly the policy content (no duplicate chrome), pulled
// directly from the MegaGraphs upstream (no hand copying / rewriting).
//
// Run it whenever the upstream docs change:
//     node assets/build-legal.js
//
// We deliberately use ONLY Node's built-in modules (https + fs + path)
// so no extra dependencies are introduced into package.json.
// -----------------------------------------------------------------------------

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// ---- Upstream sources (single source of truth: megagraphs.com). ----
const SOURCES = [
  {
    slug: 'privacy',
    title: 'Money360 Privacy Policy',
    upstream: 'https://megagraphs.com/docs/privacy-policy/',
  },
  {
    slug: 'terms',
    title: 'Money360 Terms of Use',
    upstream: 'https://megagraphs.com/docs/terms-of-use/',
  },
  {
    slug: 'data',
    title: 'Money360 Data Policy',
    upstream: 'https://megagraphs.com/docs/data-policy/',
  },
];

// Output goes here. The Moneylizer legal pages iframe in these files.
const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'content');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36 Moneylizer-BuildLegal/1.0';

// ---- HTTP fetch with redirect handling (the upstream 301s to trailing slash). ----
function fetchUrl(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      },
      (res) => {
        const status = res.statusCode || 0;
        if (
          status >= 300 &&
          status < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          resolve(fetchUrl(next, redirectsLeft - 1));
          return;
        }
        if (status !== 200) {
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Request timed out')));
  });
}

// ---- Extract the policy <article> from the full upstream page. ----
// Strategy: locate the first "<article" tag, then walk forward and find its
// matching closing "</article>". Because the upstream article body contains
// other article-shaped prose but is itself the only outermost <article>, the
// first match is the one we want.
function extractArticle(html) {
  const openMatch = html.match(/<article\b[^>]*>/i);
  if (!openMatch) throw new Error('No <article> found in upstream HTML');

  const startIdx = openMatch.index;
  // Find the matching </article> AFTER the opening tag.
  const closeIdx = html.indexOf('</article>', startIdx + openMatch[0].length);
  if (closeIdx === -1) throw new Error('No </article> found in upstream HTML');

  return html.slice(startIdx, closeIdx + '</article>'.length);
}

// ---- Extract the .markdown-body CSS rules from the upstream <style>. ----
// We need them so the inner document renders with the same typography as the
// upstream site — they're not chrome, they're the body styling.
function extractMarkdownCss(html) {
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  if (!styleMatch) return '';
  // Keep only the rules that target .markdown-body to avoid leaking the
  // upstream's site-wide resets (which we don't need and don't want).
  const css = styleMatch[1];
  const rules = css.split('}');
  const kept = [];
  for (const r of rules) {
    if (/markdown-body/.test(r)) kept.push(r + '}');
  }
  return kept.join('\n');
}

// ---- Strip Tailwind classes from the <article> so it renders cleanly. ----
// The article already ships with Tailwind utility classes that expect a
// slate-50 page background — when embedded in our white legal shell, those
// classes still apply but are harmless. We leave them in place so spacing
// matches the upstream render exactly; only the chrome is removed.
function buildCleanHtml({ title, articleHtml, css, upstreamUrl, fetchedAt }) {
  // Add a thin wrapper so the article sits on white inside our legal-shell.
  // We also include a discreet "Source" line at the top so it's clear the
  // content is being pulled live from megagraphs.com — but we do NOT add a
  // header, logo, or nav. Just a one-line caption with a link to the
  // canonical URL.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
/* Pulled from the upstream MegaGraphs doc — kept so the body renders
   identically. We host it locally so no third-party CSS is fetched. */
${css}

/* Local resets so the body fits cleanly inside the Moneylizer iframe. */
html, body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.mb-source { font-size: 11.5px; color: #94a3b8; letter-spacing: .02em; padding: 0 4px 14px; }
.mb-source a { color: #94a3b8; text-decoration: underline; text-underline-offset: 2px; }
.mb-source a:hover { color: #475569; }

/* The upstream <article> ships with a max-w-5xl and centred mx-auto —
   we override that so it fills the iframe width on desktop too. */
.mb-body article {
  max-width: none !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 4px 4px 24px !important;
  background: transparent !important;
}
</style>
</head>
<body class="mb-body">
<div class="mb-source">Content served from <a href="${escapeHtml(upstreamUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(upstreamUrl)}</a> &middot; fetched ${escapeHtml(fetchedAt)} UTC</div>
${articleHtml}
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- Main. ----
(async function main() {
  console.log('[build-legal] fetching upstream docs …');
  const fetchedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

  for (const src of SOURCES) {
    try {
      console.log(`  → ${src.upstream}`);
      const html = await fetchUrl(src.upstream);
      const articleHtml = extractArticle(html);
      const css = extractMarkdownCss(html);
      const clean = buildCleanHtml({
        title: src.title,
        articleHtml,
        css,
        upstreamUrl: src.upstream,
        fetchedAt,
      });

      const outPath = path.join(OUT_DIR, `legal-${src.slug}.html`);
      fs.writeFileSync(outPath, clean, 'utf8');
      const sizeKb = (clean.length / 1024).toFixed(1);
      console.log(`    wrote ${outPath} (${sizeKb} KB)`);
    } catch (err) {
      console.error(`  ✗ ${src.slug} failed:`, err.message);
      process.exitCode = 1;
    }
  }

  if (process.exitCode) {
    console.error('[build-legal] one or more sources failed.');
  } else {
    console.log('[build-legal] done.');
  }
})();