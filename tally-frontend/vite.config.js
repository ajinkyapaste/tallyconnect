import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const TARGET = env.VITE_BACKEND_TARGET || env.VITE_API_TARGET || env.VITE_API_URL || 'https://tallymobile.utkarshmishra.online'

  const proxyRoutes = [
    '/auth', '/company', '/ledger', '/voucher-entry', '/orders', '/bill', '/ageing',
    '/sales-order', '/sales-order-item', '/stock-item', '/stock-summary', '/invoice',
    '/invoice-item', '/sync', '/inventory', '/users', '/uploads', '/dashboard',
    '/api/leave', '/api/attendance', '/api/reminders', '/api/assistant',
    '/api/financial', '/api/analytics', '/api/cashflow', '/api/tally-reports',
    '/api/mobile-voucher-command', '/api/feedback', '/api/admin/feedback', '/api',
    '/send-invite', '/agent', '/agent-status', '/voucher-command', '/sync-queue',
    '/admin', '/notify-permission-update', '/request-to-admin', '/ledger-items',
    '/entry-field-settings', '/check-db'
  ];

  const proxy = {};
  for (const route of proxyRoutes) {
    proxy[route] = {
      target: TARGET,
      changeOrigin: true,
      secure: false,
      timeout: 12000,
      proxyTimeout: 12000,
      configure: (proxyServer) => {
        proxyServer.on('error', (err, req, res) => {
          if (res && !res.headersSent && typeof res.writeHead === 'function') {
            try {
              res.writeHead(504, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Gateway Timeout', message: err?.message || 'Backend timeout' }));
            } catch {}
          }
        });
      }
    };
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy
    },
    preview: {
      port: 5173,
      strictPort: true,
      host: true
    }
  }
})
