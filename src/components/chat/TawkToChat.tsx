"use client";

import { useAuthStore } from '@/stores/authStore';
import { useEffect, useRef } from 'react';
import Script from 'next/script';

const TawkToChat = () => {
  const { user } = useAuthStore();
  const propertyId = "686b7f1cf0b576190d54e96c";
  const widgetId = "1ivhuh2a3";

  // Use a ref to ensure we only try to set attributes once per user session
  const attributesSet = useRef(false);

  useEffect(() => {
    if (user && !attributesSet.current) {
      // Tawk_API is created by the script. We need to wait for it.
      // Polling is a reliable way to do this for external scripts.
      const intervalId = setInterval(() => {
        if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
          clearInterval(intervalId);

          // Call setAttributes without the problematic callback.
          // This "fire-and-forget" approach is robust and prevents console errors.
          window.Tawk_API.setAttributes({
            name: user.name,
            email: 'sudheer.kajee@gmail.com',
          });
          
          attributesSet.current = true; // Mark as set
        }
      }, 500);

      return () => clearInterval(intervalId); // Cleanup on component unmount or user change
    } else if (!user) {
      // Reset the ref when the user logs out
      attributesSet.current = false;
    }
  }, [user]);

  if (!propertyId || !widgetId) {
    return null;
  }

  // Using Next.js Script component for optimized script loading
  return (
    <Script
      id="tawk-to-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
};

export default TawkToChat;
