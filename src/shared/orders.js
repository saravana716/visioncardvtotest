/* AUTO-GENERATED — DO NOT EDIT.
 * Source of truth: shared/contract/. Run `npm run sync:shared` after editing it.
 */
/**
 * Order-status classification shared by both apps. The admin buckets orders for
 * filters/metrics; the storefront can use the same mapping for tracking, so the
 * two never disagree about whether an order is shipped/delivered/cancelled.
 *
 * Canonical source: shared/contract/ — edit here, run `npm run sync:shared`.
 */

/**
 * Normalized lifecycle bucket: 'pending' | 'shipped' | 'delivered' | 'cancelled'.
 * Combines `status` and `fulfillmentStatus` (e.g. an 'Ordered' order with a
 * 'Delhivery shipment created' fulfillment status counts as shipped).
 */
export function getOrderLifecycleBucket(order) {
  if (!order || typeof order !== 'object') return 'pending';
  const s = (order.status || '').toLowerCase().trim();
  const f = (order.fulfillmentStatus || '').toLowerCase().trim();
  const blob = `${s} ${f}`.trim();

  if (/cancel|cancell|return|refund/.test(blob)) return 'cancelled';
  if (/\bdelivered\b|^completed$/.test(blob) || s === 'delivered' || s === 'completed') return 'delivered';
  if (
    s === 'shipping' ||
    s === 'shipped' ||
    /shipped|dispatch|in transit|out for delivery|packed|shipment created/.test(blob)
  ) {
    return 'shipped';
  }
  return 'pending';
}

/**
 * Statuses where payment hasn't actually been collected. Kept lowercase for
 * case-insensitive comparison.
 */
const NON_REVENUE_STATUSES = new Set([
  'awaiting payment',
  'awaiting verification',
  'payment failed',
]);

/**
 * Whether an order should count toward money metrics (revenue, order counts,
 * customer spend): not cancelled/returned/refunded, and past the awaiting- or
 * failed-payment stage. Use this instead of only excluding the 'cancelled'
 * bucket, so unpaid/abandoned checkouts don't inflate totals.
 */
export function isRevenueOrder(order) {
  if (!order || typeof order !== 'object') return false;
  if (getOrderLifecycleBucket(order) === 'cancelled') return false;
  const s = (order.status || '').toLowerCase().trim();
  if (NON_REVENUE_STATUSES.has(s)) return false;
  return true;
}
