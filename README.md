# VisionKart

An online eyewear store — frames, sunglasses, contact lenses, and reading glasses — with a virtual try-on, lens-power configurator, and Firebase-backed cart, wishlist, orders, and auth.

Built with React 19 + Vite, React Router 7, Firebase (Auth, Firestore, Storage), Three.js / react-three-fiber + MediaPipe for the try-on, and a small external backend on Render for CCAvenue payments and invoice email.

## Quick start

Requires Node.js 20+ (react-router-dom 7.17+ declares `engines.node >=20`).

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # production build → dist/
npm run preview      # serve the production build locally
npm run lint         # ESLint
```

## Project layout

```
src/
  App.jsx                       # root, maintenance-mode switch, Toaster, ErrorBoundary
  main.jsx                      # React mount + context providers
  config.js                     # runtime config (maintenance, launch date, backend URL)
  firebase.config.js            # Firebase init (auth, firestore, storage)
  Routing/Routing.jsx           # lazy-loaded route table + scroll reset
  Pages/                        # one folder/file per route
  Components/                   # reusable UI (Navbar, Footer, modals, VTO, etc.)
    ErrorBoundary/              # top-level error boundary around <Routing/>
  context/                      # CartContext, WishlistContext
  services/                     # firestoreService, fulfillmentService (invoice/PDF)
  utils/                        # price (parsePriceToInt, formatRupees),
                                # firebaseErrors (friendlyAuthError),
                                # toast (TOAST_PRIMARY)
  assets/                       # logos, banners, category/role/lens imagery
```

## Configuration

App-level toggles live in `src/config.js`:

| Field | Purpose |
| --- | --- |
| `isMaintenanceMode` | When `true`, only `ComingSoon` renders. |
| `launchDate` | Used by the ComingSoon countdown. |
| `socialLinks` | Footer / ComingSoon social links. |
| `contactEmail` | Support email on the ComingSoon page. |
| `paymentBackendUrl` | Base URL for the CCAvenue payment / invoice backend (Render). Every call into that backend should be derived from this — don't hardcode the URL. |

Firebase config is currently inlined in `src/firebase.config.js`. Firebase client keys are not secrets, but the project still needs **Firestore security rules** and **Storage security rules** to be locked down for production — those rules live in the Firebase console, not in this repo. See [Firebase docs on security rules](https://firebase.google.com/docs/rules) before going live.

Passwords go through Firebase Auth only; they are never written into Firestore. The SignUp flow writes the user's profile fields (name, email, phone) to `users/{uid}` but the password stays inside Auth.

Payments flow through the backend at `paymentBackendUrl`. Vercel rewrites in `vercel.json` proxy `/payment-response` and `/payment-cancel` to that backend so CCAvenue can redirect users back through the same origin.

## Deployment

The repo is configured for Vercel:

- `vercel.json` rewrites SPA routes to `/index.html` and proxies payment callbacks.
- Connect the repo to Vercel and every PR gets a preview deployment.

Build command: `npm run build`. Output: `dist/`.

## Architecture notes

- **Routing.** Every route except `/` is `React.lazy`-loaded with a Suspense fallback (`src/Routing/Routing.jsx`). `/` stays eager so the landing paint isn't behind a chunk fetch.
- **Error boundary.** `src/Components/ErrorBoundary` wraps `<Routing/>` so a render-time exception shows a recoverable "Reload page / Go home" screen instead of a blank white page.
- **Bundle splitting.** `vite.config.js` defines `manualChunks` that split Three.js, MediaPipe, Firebase, jsPDF + html2canvas, react-router, and react-icons into their own vendor chunks. The Three.js + MediaPipe vendor chunks (~960 KB / 126 KB) only load when the user opens `/virtual-try-on`.
- **Image loading.** Below-the-fold product cards, carousels, drawer thumbnails, and order-line images use `loading="lazy"` + `decoding="async"` so the browser defers their network and decode work until they're in view. Hero / nav imagery stays eager.
- **State.** Cart and wishlist live in React Context (`src/context/`), backed by Firestore per signed-in user. `clearCart()` removes the documents on the server first and only clears local state on success, so a failed delete won't leave the UI in a stale "empty" state.
- **Products.** Fetched from Firestore via `src/services/firestoreService.js`. The `SearchOverlay` fetches the catalogue once when it first opens and filters in memory for each keystroke — it does not re-fetch per character.
- **Try-on.** `Components/VTO` uses react-three-fiber + MediaPipe face landmarker and is rendered only inside `/virtual-try-on`. The camera `MediaStream` is stopped on unmount and on every stream toggle. `Components/Product360Viewer` and `Components/MobileTryOn` are lighter image-based viewers.
- **Invoices.** Generated client-side with html2canvas + jsPDF, then synced to the backend in `src/services/fulfillmentService.js`.

## Shared conventions

- **Prices.** Parse and format through `src/utils/price.js` (`parsePriceToInt`, `formatRupees`). The parser handles `"₹1,299"`, `"1299"`, `1299`, and `"1299.99"` (rounded). Don't re-implement the regex inline.
- **Auth errors.** Catch blocks for Firebase Auth calls should `console.error` the original error and toast the result of `friendlyAuthError(err, fallbackMessage)` from `src/utils/firebaseErrors.js`. Never surface raw `err.message` to users — it leaks Firebase internals.
- **Form labels.** Inputs are styled via `.forminput h4` but `<h4>` can't sit inside `<label>` (invalid HTML). Use `<h4><label htmlFor="...">Caption</label></h4>` with a matching `id` on the input. Login, SignUp, and Checkout all follow this pattern.
- **Modals.** Dialog wrappers should set `role="dialog"`, `aria-modal="true"`, and an `aria-label`. Listen for `Escape` at the document level (the input's `onKeyDown` only fires when the input has focus). Close buttons and icon-only triggers need an `aria-label`.

## Known limitations / follow-ups

- `src/data/products.js` is no longer referenced anywhere — kept around as legacy seed data and a candidate for deletion in a later sweep.
- Some asset images in `src/assets/` are 0.5–2.2 MB PNGs; converting to WebP and serving responsive sizes is the highest-impact remaining performance win.
- No automated tests yet — there is no vitest/jest setup at all.
- `react-refresh/only-export-components` warnings in `CartContext.jsx` and `WishlistContext.jsx` break HMR for those files. Moving non-component exports to sibling files would clear them.
- Vite 8 upgrade is still pending for the remaining `esbuild` audit advisory.
