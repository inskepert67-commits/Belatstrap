const path = require('path');
const express = require('express');
const helmet = require('helmet');

const app = express();

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"]
        ,
        "base-uri": ["'self'"]
        ,
        "frame-ancestors": ["'none'"]
        ,
        "img-src": ["'self'", "data:", "https:"]
        ,
        "font-src": ["'self'", "https:", "data:"]
        ,
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdn.tailwindcss.com"]
        ,
        "script-src": ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.tailwindcss.com"]
        ,
        "connect-src": ["'self'", "https:"]
        ,
        "media-src": ["'self'", "https:"]
        ,
        "object-src": ["'none'"]
        ,
        "upgrade-insecure-requests": []
      }
    },
    crossOriginEmbedderPolicy: false,
  })
);

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
      }
    },
  })
);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'strapper.html'));
});

app.get('/healthz', (req, res) => {
  res.status(200).type('text/plain').send('ok');
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
