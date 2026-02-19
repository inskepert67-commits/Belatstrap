const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');

const app = express();

app.enable('trust proxy');

app.disable('x-powered-by');

const isProd = process.env.NODE_ENV === 'production';

app.use(compression());

app.use(
  morgan(isProd ? 'combined' : 'dev', {
    skip: (req) => req.path === '/healthz',
  })
);

app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "https:", "data:"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdn.tailwindcss.com"],
        "script-src": ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.tailwindcss.com"],
        "connect-src": ["'self'", "https:"],
        "media-src": ["'self'", "https:"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

if (process.env.SITE_USER && process.env.SITE_PASS) {
  app.use(
    basicAuth({
      users: { [process.env.SITE_USER]: process.env.SITE_PASS },
      challenge: true,
    })
  );
}

app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()'
  );
  next();
});

const publicDir = __dirname;

app.use(
  express.static(publicDir, {
    index: false,
    etag: true,
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
      }
    },
  })
);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'strapper.html'));
});

app.get('/fflags.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'fflags.html'));
});

app.get('/dumped.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'dumped.html'));
});

app.get('/offsets.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'offsets.html'));
});

app.get(['/about', '/about/'], (req, res) => {
  res.sendFile(path.join(publicDir, 'about.html'));
});

app.get(['/note', '/note/'], (req, res) => {
  res.sendFile(path.join(publicDir, 'note.html'));
});

app.get('/healthz', (req, res) => {
  res.status(200).type('text/plain').send('ok');
});

app.use((req, res) => {
  res.status(404).type('text/plain').send('Not found');
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  const _next = next;
  console.error(err);
  res.status(500).type('text/plain').send('Internal server error');
});

module.exports = app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}
