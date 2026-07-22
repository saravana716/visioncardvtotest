import { useState, useEffect } from 'react';
import { getSiteSettings } from '../services/firestoreService';

/**
 * Shared in-flight promise so multiple consumers (Navbar + Footer) reuse a
 * single Firestore read per page load instead of each triggering their own.
 */
let sharedPromise = null;
function loadSiteSettings() {
  if (!sharedPromise) {
    sharedPromise = getSiteSettings().catch((err) => {
      // Reset so a later mount can retry after a transient failure.
      sharedPromise = null;
      console.error('useSiteSettings load failed:', err);
      return {};
    });
  }
  return sharedPromise;
}

/**
 * Reads the admin-managed `siteSettings/general` doc so customer-facing
 * components (logo, contact, social links) reflect what's set in the admin.
 * Returns {} until loaded / on error.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    let mounted = true;
    loadSiteSettings().then((s) => {
      if (mounted) setSettings(s || {});
    });
    return () => {
      mounted = false;
    };
  }, []);

  return settings;
}
