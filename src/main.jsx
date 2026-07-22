import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { initVto } from '@vto/sdk'
import '@vto/sdk/styles.css'

// Virtual try-on SDK. The API key is validated against VITE_VTO_LICENSE_URL at
// most once per 24h per browser. Without env config (local dev) validation is
// disabled (licenseUrl: null) — set both variables in production:
//   VITE_VTO_API_KEY=vto_live_…
//   VITE_VTO_LICENSE_URL=https://api.yourservice.com/vto/validate
initVto({
  apiKey: import.meta.env.VITE_VTO_API_KEY ?? 'vto_dev_visionkart',
  licenseUrl: import.meta.env.VITE_VTO_LICENSE_URL ?? null,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WishlistProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </WishlistProvider>
  </StrictMode>,
)
