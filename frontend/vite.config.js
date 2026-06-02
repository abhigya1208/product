import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["anemic-upper-joystick.ngrok-free.dev"],
    // ysimple: "all"
    port: 5173
  }
})