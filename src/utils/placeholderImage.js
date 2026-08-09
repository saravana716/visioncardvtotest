/**
 * Local fallback image for products with no photo. Inlined as a data URI so it
 * can never 404 — the previous fallback (via.placeholder.com) is a third-party
 * service that has been unreliable since 2024, which turned every missing
 * product photo into a broken image.
 */
export const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
        '<rect width="400" height="400" fill="#eef1f5"/>' +
        '<g stroke="#b6bfc9" stroke-width="10" fill="none">' +
        '<rect x="80" y="170" width="100" height="70" rx="24"/>' +
        '<rect x="220" y="170" width="100" height="70" rx="24"/>' +
        '<path d="M180 195 q20 -14 40 0"/>' +
        '</g>' +
        '<text x="200" y="290" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#8a94a0">No image</text>' +
        '</svg>'
    );
