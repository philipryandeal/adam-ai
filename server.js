const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;
const CANONICAL_ROOT = 'https://technokabbalah.com/';

// Build the redirect target on the canonical host only. The request path and
// query are re-parsed and appended after the fixed host and slash, so a crafted
// request line can never send a visitor to another site.
function canonicalUrl(req) {
  try {
    const u = new URL(req.originalUrl, CANONICAL_ROOT);
    return CANONICAL_ROOT + (u.pathname + u.search).replace(/^\/+/, '');
  } catch {
    return CANONICAL_ROOT;
  }
}
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join('; ');

// Redirect the Railway preview host to the canonical domain ONLY once the
// domain is live. Set CANONICAL_REDIRECT=true in Railway when technokabbalah.com
// resolves to this service. Until then the *.up.railway.app URL serves the house.
const REDIRECT_TO_CANONICAL = process.env.CANONICAL_REDIRECT === 'true';

// Security headers go on every response: pages, static files, redirects, 404s.
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');

  const host = (req.get('host') || '').toLowerCase();

  if (REDIRECT_TO_CANONICAL && host.endsWith('.up.railway.app')) {
    return res.redirect(301, canonicalUrl(req));
  }

  // One front door: www.technokabbalah.com forwards to technokabbalah.com.
  if (host === 'www.technokabbalah.com') {
    return res.redirect(301, canonicalUrl(req));
  }

  next();
});

// /tree has no page of its own (only tree.json lives there); send visitors to
// the Tree on the homepage instead of a 404.
app.get(['/tree', '/tree/'], (req, res) => res.redirect(302, '/#tree'));

// /sefirot has no index of its own; the ten chambers live at /sefirot/<id>/.
app.get(['/sefirot', '/sefirot/'], (req, res) => res.redirect(302, '/#sefirot'));

// The Tree remains the single source of truth in /tree.
app.use('/tree', express.static(path.join(__dirname, 'tree')));
app.use(express.static(path.join(__dirname, 'public')));

// Unknown paths get the house's 404 page. It is read once at startup and
// served from memory, so a flood of unknown paths never touches the disk.
const NOT_FOUND_PAGE = fs.readFileSync(path.join(__dirname, 'public', '404.html'));
app.use((req, res) => {
  res.status(404)
    .set('Content-Type', 'text/html; charset=UTF-8')
    .set('Cache-Control', 'public, max-age=0')
    .send(NOT_FOUND_PAGE);
});

app.listen(PORT, () => {
  console.log('The House of Adam the First is open on port ' + PORT);
});
