import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
export const _mkcert = mkcert() as PluginOption;


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    //  mkcert() as PluginOption
  ],
})
