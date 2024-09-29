import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    //  mkcert() as PluginOption
  ],
})
