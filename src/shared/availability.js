/* AUTO-GENERATED — DO NOT EDIT.
 * Source of truth: shared/contract/. Run `npm run sync:shared` after editing it.
 */
/**
 * Product availability — the single definition both apps use to decide whether a
 * product is in stock and sellable. Previously duplicated (admin
 * `resolveProductStock`/`getProductAvailability` and storefront `availability.js`)
 * and prone to drift (e.g. missing-stock default 10 vs 0).
 *
 * Canonical source: shared/contract/ — edit here, run `npm run sync:shared`.
 */

import { PRODUCT_STATUS } from './constants.js';

/**
 * Resolve a product's stock to a non-negative integer. Missing/blank/invalid
 * stock resolves to 0 (Out of Stock) — never fabricate inventory.
 */
export function resolveStock(product) {
  const raw = product?.stock;
  if (raw === null || raw === undefined || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Availability label: Discontinued | Out of Stock | In Stock.
 * An explicit Discontinued or Out of Stock `status` is honored as a manual
 * override (kept consistent with isProductUnavailable, even for legacy docs
 * whose status and stock disagree); otherwise the label derives from stock.
 */
export function getProductAvailability(product) {
  const status = String(product?.status || '').trim();
  if (status === PRODUCT_STATUS.DISCONTINUED) return PRODUCT_STATUS.DISCONTINUED;
  if (status === PRODUCT_STATUS.OUT_OF_STOCK) return PRODUCT_STATUS.OUT_OF_STOCK;
  return resolveStock(product) > 0 ? PRODUCT_STATUS.IN_STOCK : PRODUCT_STATUS.OUT_OF_STOCK;
}

/**
 * True when a product must NOT be purchasable: the admin flagged it
 * Discontinued / Out of Stock, or it has no stock.
 */
export function isProductUnavailable(product) {
  const status = String(product?.status || '').trim();
  if (status === PRODUCT_STATUS.DISCONTINUED || status === PRODUCT_STATUS.OUT_OF_STOCK) {
    return true;
  }
  return resolveStock(product) <= 0;
}
