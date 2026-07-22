// Validate an Indian delivery PIN against India Post's public pincode API
// (no API key, CORS-enabled). A serviceable PIN resolves to a real post
// office / district / state; anything else is reported as not serviceable.
export const lookupPincode = async (pin) => {
    const p = String(pin || '').trim();
    if (!/^\d{6}$/.test(p)) {
        return { ok: false, message: 'Enter a valid 6-digit PIN code.' };
    }
    // Abort if India Post is slow/unresponsive so the caller's spinner can't
    // hang forever (their API is not always reliable).
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${p}`, { signal: controller.signal });
        const data = await res.json();
        const entry = Array.isArray(data) ? data[0] : null;
        if (entry && entry.Status === 'Success' && entry.PostOffice && entry.PostOffice.length > 0) {
            const po = entry.PostOffice[0];
            return { ok: true, pincode: p, city: po.District, state: po.State };
        }
        return { ok: false, message: 'Sorry, we could not verify delivery to this PIN code.' };
    } catch (err) {
        console.error('Pincode lookup failed:', err);
        const message = err?.name === 'AbortError'
            ? 'Delivery check timed out. Please try again.'
            : 'Could not check availability right now. Please try again.';
        return { ok: false, message };
    } finally {
        clearTimeout(timer);
    }
};

const LOCATION_KEY = 'vk_delivery_location';

// The customer's chosen delivery location, shared across the app (navbar picker
// pre-fills the product page's availability check and vice-versa).
export const getSavedLocation = () => {
    try {
        return JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
    } catch {
        return null;
    }
};

export const saveLocation = (loc) => {
    try {
        localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } catch (err) {
        console.error('Could not persist delivery location:', err);
    }
    // Let other mounted components (product page, etc.) react immediately.
    window.dispatchEvent(new CustomEvent('vk-location-changed', { detail: loc }));
};
