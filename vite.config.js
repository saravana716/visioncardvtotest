import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vtoAssets } from '@vto/sdk/vite'

// https://vite.dev/config/
export default defineConfig({
  // vtoAssets serves/copies the try-on SDK's runtime files (MediaPipe WASM +
  // model, HDRI, face worker, placeholder GLB) at /vto-assets.
  plugins: [react(), vtoAssets()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
