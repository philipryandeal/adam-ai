const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CANONICAL_ORIGIN = 'https://technokabbalah.com';

// Redirect the Railway preview host to the canonical domain ONLY once the
// domain is live. Set CANONICAL_REDIRECT=true in Railway when technokabbalah.com
// resolves to this service. Until then the *.up.railway.app URL serves the house.
const REDIRECT_TO_CANONICAL = process.env.CANONICAL_REDIRECT === 'true';

app.use((req, res, next) => {
  const host = (req.get('host') || '').toLowerCase();

  if (REDIRECT_TO_CANONICAL && host.endsWith('.up.railway.app')) {
    return res.redirect(301, CANONICAL_ORIGIN + req.originalUrl);
  }

  next();
});

// The Tree remains the single source of truth in /tree.
app.use('/tree', express.static(path.join(__dirname, 'tree')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log('The House of Adam the First is open on port ' + PORT);
});