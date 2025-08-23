import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        'index': './src/index.html',
        'floating-ball': './src/floating-ball.html'
      }
    }
  },
  server: {
    port: 3000
  }
})