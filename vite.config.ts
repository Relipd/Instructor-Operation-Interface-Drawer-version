import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@lark-base-open/js-sdk'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5176,
  },
  build: {
    rollupOptions: {
      output: {
        // 分包：把稳定的第三方依赖拆出主 chunk，利于缓存与并行加载
        manualChunks: {
          // Radix UI 基础组件
          'radix-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
    // 主 chunk 阈值上调：飞书 SDK 体积大，分包后仍可能超 500kB，警告无实际影响
    chunkSizeWarningLimit: 1000,
  },
})
