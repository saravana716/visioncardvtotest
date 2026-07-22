/**
 * Product availability — re-exported from the shared data contract
 * (`src/shared/`, generated from the repo-root `shared/contract/`) so the
 * storefront and the admin portal share ONE definition of what's sellable.
 * Existing import paths (`../utils/availability`) are unchanged.
 */
export { resolveStock, getProductAvailability, isProductUnavailable } from '../shared/availability.js';
