import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vtoAssets } from '@vto/sdk/vite'

// https://vite.dev/config/
export default defineConfig({
  // vtoAssets serves/copies the try-on SDK's runtime files (MediaPipe WASM +
  // model, HDRI, face worker, placeholder GLB) at /vto-assets.
  plugins: [react(), vtoAssets()],
  build: {
    // NOTE: do not reintroduce a manualChunks rule that splits React into its
    // own chunk apart from react-router / react-icons. The previous config did
    // (vendor-react vs vendor-router), and in the production build those chunks
    // initialised before React's exports were ready — react-router then read
    // `React.useLayoutEffect` off `undefined` and the entire app white-screened
    // (dev was unaffected because manualChunks only runs in `vite build`).
    // Vite's default chunking keeps the React ecosystem coherent, and the heavy
    // 3D/VTO deps (three, @react-three, @mediapipe, @vto/sdk) are only imported
    // by lazy routes, so they already stay out of the initial bundle.
    chunkSizeWarningLimit: 800,
  },
})
