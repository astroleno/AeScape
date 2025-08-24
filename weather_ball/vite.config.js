import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/weather-ball.js',
      name: 'WeatherBall',
      fileName: 'weather-ball',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['three', 'suncalc'],
      output: {
        globals: {
          three: 'THREE',
          suncalc: 'SunCalc'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
