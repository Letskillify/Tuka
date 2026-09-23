import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const host = req.headers.host || 'localhost:5173';
        const urlObj = new URL(req.url, `http://${host}`);
        req.query = Object.fromEntries(urlObj.searchParams);

        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          let bodyStr = '';
          for await (const chunk of req) {
            bodyStr += chunk;
          }
          try {
            req.body = bodyStr ? JSON.parse(bodyStr) : {};
          } catch (e) {
            req.body = {};
          }
        }

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        const pathname = urlObj.pathname.replace(/\/$/, '');

        try {
          if (pathname === '/api/send-otp') {
            const module = await server.ssrLoadModule('/api/send-otp.js');
            return await module.default(req, res);
          } else if (pathname === '/api/verify-otp') {
            const module = await server.ssrLoadModule('/api/verify-otp.js');
            return await module.default(req, res);
          } else if (pathname === '/api/set-password') {
            const module = await server.ssrLoadModule('/api/set-password.js');
            return await module.default(req, res);
          } else if (pathname === '/api/orders') {
            const module = await server.ssrLoadModule('/api/orders/index.js');
            return await module.default(req, res);
          } else if (pathname === '/api/orders/sync-guest') {
            const module = await server.ssrLoadModule('/api/orders/sync-guest.js');
            return await module.default(req, res);
          } else if (pathname === '/api/razorpay/create-order') {
            const module = await server.ssrLoadModule('/api/razorpay/create-order.js');
            return await module.default(req, res);
          } else if (pathname === '/api/cashfree/create-order') {
            const module = await server.ssrLoadModule('/api/cashfree/create-order.js');
            return await module.default(req, res);
          } else if (pathname === '/api/delhivery/check-pincode') {
            const module = await server.ssrLoadModule('/api/delhivery/check-pincode.js');
            return await module.default(req, res);
          } else if (pathname === '/api/delhivery/track-shipment') {
            const module = await server.ssrLoadModule('/api/delhivery/track-shipment.js');
            return await module.default(req, res);
          }
        } catch (err) {
          console.error('[ViteDevAPI] Error handling', pathname, ':', err);
          return res.status(500).json({ error: err.message || 'Dev server error executing endpoint.' });
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServerPlugin()],
});