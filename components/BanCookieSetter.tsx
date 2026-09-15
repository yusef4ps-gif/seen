'use client';

import { useEffect } from 'react';

export default function BanCookieSetter() {
  useEffect(() => {
    // Set a persistent cookie for 10 years to fingerprint this device
    document.cookie = "seen_device_ban=true; max-age=315360000; path=/";
    
    // Also try to use localStorage as a fallback
    try {
      localStorage.setItem('seen_sec_lock', 'true');
    } catch(e) {}
  }, []);

  return null;
}
