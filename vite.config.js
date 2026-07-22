import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vtoAssets } from '@vto/sdk/vite'

// https://vite.dev/config/
export default defineConfig({
  // vtoAssets serves/copies the try-on SDK's runtime files (MediaPipe WASM +
  // model, HDRI, face worker, placeholder GLB) at /vto-assets.
  plugins: [react(), vtoAssets()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-three'
          if (id.includes('@mediapipe')) return 'vendor-mediapipe'
          if (id.includes('firebase')) return 'vendor-firebase'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-icons')) return 'vendor-icons'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
