import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// listens on any ip
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', 
    port: 80,
    watch: {
      usePolling: true,
      interval: 500,
    },
    allowedHosts: 'all',
  },
})