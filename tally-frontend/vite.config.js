import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const TARGET = env.VITE_BACKEND_TARGET || env.VITE_API_TARGET || env.VITE_API_URL || 'https://tallymobile.utkarshmishra.online'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: {
        '/auth': { target: TARGET, changeOrigin: true, secure: false },
        '/company': { target: TARGET, changeOrigin: true, secure: false },
        '/ledger': { target: TARGET, changeOrigin: true, secure: false },
        '/voucher-entry': { target: TARGET, changeOrigin: true, secure: false },
        '/orders': { target: TARGET, changeOrigin: true, secure: false },
        '/bill': { target: TARGET, changeOrigin: true, secure: false },
        '/ageing': { target: TARGET, changeOrigin: true, secure: false },
        '/sales-order': { target: TARGET, changeOrigin: true, secure: false },
        '/sales-order-item': { target: TARGET, changeOrigin: true, secure: false },
        '/stock-item': { target: TARGET, changeOrigin: true, secure: false },
        '/stock-summary': { target: TARGET, changeOrigin: true, secure: false },
        '/invoice': { target: TARGET, changeOrigin: true, secure: false },
        '/invoice-item': { target: TARGET, changeOrigin: true, secure: false },
        '/sync': { target: TARGET, changeOrigin: true, secure: false },
        '/inventory': { target: TARGET, changeOrigin: true, secure: false },
        '/users': { target: TARGET, changeOrigin: true, secure: false },
        '/uploads': { target: TARGET, changeOrigin: true, secure: false },
        '/dashboard': { target: TARGET, changeOrigin: true, secure: false },
        '/api/leave': { target: TARGET, changeOrigin: true, secure: false },
        '/api/attendance': { target: TARGET, changeOrigin: true, secure: false },
        '/api/reminders': { target: TARGET, changeOrigin: true, secure: false },
        '/api/assistant': { target: TARGET, changeOrigin: true, secure: false },
        '/api/financial': { target: TARGET, changeOrigin: true, secure: false },
        '/api/analytics': { target: TARGET, changeOrigin: true, secure: false },
        '/api/cashflow': { target: TARGET, changeOrigin: true, secure: false },
        '/api/tally-reports': { target: TARGET, changeOrigin: true, secure: false },
        '/api/mobile-voucher-command': { target: TARGET, changeOrigin: true, secure: false },
        '/api/feedback': { target: TARGET, changeOrigin: true, secure: false },
        '/api/admin/feedback': { target: TARGET, changeOrigin: true, secure: false },
        '/api': { target: TARGET, changeOrigin: true, secure: false },
        '/send-invite': { target: TARGET, changeOrigin: true, secure: false },
        '/agent': { target: TARGET, changeOrigin: true, secure: false },
        '/agent-status': { target: TARGET, changeOrigin: true, secure: false },
        '/voucher-command': { target: TARGET, changeOrigin: true, secure: false },
        '/sync-queue': { target: TARGET, changeOrigin: true, secure: false },
        '/admin': { target: TARGET, changeOrigin: true, secure: false },
        '/notify-permission-update': { target: TARGET, changeOrigin: true, secure: false },
        '/request-to-admin': { target: TARGET, changeOrigin: true, secure: false },
        '/ledger-items': { target: TARGET, changeOrigin: true, secure: false },
        '/entry-field-settings': { target: TARGET, changeOrigin: true, secure: false },
        '/check-db': { target: TARGET, changeOrigin: true, secure: false },
      },
    },
    preview: {
      port: 5173,
      strictPort: true,
      host: true,
    },
  }
})
