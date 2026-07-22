/* AUTO-GENERATED — DO NOT EDIT.
 * Source of truth: shared/contract/. Run `npm run sync:shared` after editing it.
 */
/**
 * VisionKart shared data contract — the single source of truth for the field
 * names, values, and derived logic that both apps (`visionkart-web` and
 * `admin-portal`) must agree on when reading/writing the shared Firestore
 * collections.
 *
 * Canonical source: shared/contract/. Each app consumes a generated copy under
 * its own `src/shared/` (kept in sync by `npm run sync:shared`, enforced in CI)
 * so the per-directory Vercel builds stay self-contained.
 */

export * from './constants.js';
export * from './availability.js';
export * from './orders.js';
export * from './price.js';
