// parsePriceToInt is defined once in the shared data contract so both apps parse
// prices identically. Imported (for local use below) and re-exported so existing
// import paths stay unchanged.
import { parsePriceToInt } from '../shared/price.js';

export { parsePriceToInt };

/**
 * Format a numeric rupee amount as "₹1,299".
 */
export function formatRupees(amount) {
  const n = Number.isFinite(amount) ? amount : parsePriceToInt(amount);
  return `₹${n.toLocaleString('en-IN')}`;
}
