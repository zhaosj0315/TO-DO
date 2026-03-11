import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将 jeep-sqlite 视为自定义元素
          isCustomElement: (tag) => tag === 'jeep-sqlite'
        }
      }
    })
  ],
  base: './', // 使用相对路径，适配Electron
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['marked', 'dompurify']
  },
  build: {
    commonjsOptions: {
      include: [/marked/, /dompurify/, /node_modules/]
    }
  }
})