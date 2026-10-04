import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` — göreli asset yolları.
// GitHub Pages'de site /kyron-web/ altında servis edilir; mutlak yollar
// (/assets/...) 404 verirdi. Hash routing kullandığımız için sayfa yolu
// hiçbir zaman değişmez (sadece #hash değişir), dolayısıyla göreli yollar
// her rotada doğru kalır.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: false,
  },
})
