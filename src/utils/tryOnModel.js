/**
 * Resolve the 3D model (GLB) to use for a product's virtual try-on.
 *
 * Products in Firestore can carry their own model via a `glbUrl` (or
 * `modelUrl` / `model3d` / `tryOnModel`) field — any http(s) or same-origin
 * URL ending in .glb. The SDK auto-fits arbitrary glasses GLBs, so no special
 * authoring is required.
 *
 * Until real per-product models are uploaded, we fall back to bundled demo
 * frames (public/models) picked by category, so every product page has a
 * working try-on.
 */
export function getTryOnGlbUrl(product) {
  const candidate =
    product?.glbUrl || product?.modelUrl || product?.model3d || product?.tryOnModel
  if (typeof candidate === 'string' && /\.glb(\?.*)?$/i.test(candidate)) {
    return candidate
  }
  return product?.category === 'Sunglasses'
    ? '/models/sunglasses.glb'
    : '/models/eyeglasses.glb'
}

/**
 * Resolve the 2D image to overlay for the photo/live try-on.
 *
 * Only the dedicated front-facing transparent-PNG cutout (`tryOnImageUrl`,
 * uploaded in the admin) is ever used — a raw catalog photo composited on a
 * face reads as broken, so products without a cutout get no try-on at all
 * (every entry point is gated on hasTryOnImage).
 */
export function getTryOnFrameImage(product) {
  if (typeof product?.tryOnImageUrl === 'string') {
    const url = product.tryOnImageUrl.trim()
    if (url) return url
  }
  return null
}

/** True only when the admin uploaded a dedicated try-on cutout. */
export function hasTryOnImage(product) {
  return getTryOnFrameImage(product) !== null
}

/** True when the product category makes sense to try on the face. */
export function isTryOnEligible(product) {
  if (!product?.category) return true
  return !/contact|accessor|solution|case/i.test(product.category)
}
