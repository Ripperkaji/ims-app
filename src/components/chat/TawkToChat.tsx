
"use client";

import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useRef } from 'react';

const TawkToChat = () => {
  const { user } = useAuthStore();
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;
  const tawkApiSet = useRef(false);

  useEffect(() => {
    // This effect handles setting user attributes in Tawk.to.
    // It runs when the user logs in or out.
    if (user && !tawkApiSet.current) {
      // Tawk_API is loaded asynchronously by the TawkMessengerReact component.
      // We need to poll for it to ensure it's available before we use it.
      const interval = setInterval(() => {
        if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
          clearInterval(interval); // Stop polling once the API is ready.
          
          // Sanitize user name to create a valid email local part
          const sanitizedEmailLocalPart = user.name
            .toLowerCase()
            .replace(/\s+/g, '.') // Replace spaces with dots
            .replace(/[^a-z0-9._-]/g, ''); // Remove invalid email characters

          window.Tawk_API.setAttributes({
            name: user.name,
            email: `${sanitizedEmailLocalPart}@sh-ims.example.com`,
          }, (error: any) => {
            if (error) {
              console.error('Tawk.to setAttributes error:', error);
            } else {
              // Mark that we've successfully set the attributes for this session.
              tawkApiSet.current = true;
            }
          });
        }
      }, 500); // Check every 500ms.

      // Cleanup function to clear the interval if the component unmounts
      // or the user logs out before the API is ready.
      return () => clearInterval(interval);
    } else if (!user && tawkApiSet.current) {
      // If user logs out, reset the ref so attributes can be set for the next user.
      tawkApiSet.current = false;
       if (window.Tawk_API && typeof window.Tawk_API.endChat === 'function') {
          // Optional: end the chat session on logout.
          // window.Tawk_API.endChat(); 
       }
    }
  }, [user]);

  // Don't render the component if the required IDs are missing.
  if (!propertyId || !widgetId) {
    return null;
  }
  
  // Render the component without any event handlers to avoid previous errors.
  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
    />
  );
};

export default TawkToChat;
