/* AUTO-GENERATED — DO NOT EDIT.
 * Source of truth: shared/contract/. Run `npm run sync:shared` after editing it.
 */
/**
 * Price parsing shared by both apps. Products may store price as a number or a
 * string ("₹1,299", "1299.00"); this normalizes to a safe integer rupee value.
 *
 * Canonical source: shared/contract/ — edit here, run `npm run sync:shared`.
 */

/**
 * Parse a price-like value into a safe integer rupee amount. Decimal inputs are
 * rounded to the nearest rupee. Returns 0 for null/undefined/unparseable input.
 */
export function parsePriceToInt(value) {
  if (value == null) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}
