"use client";

import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
import { useAuthStore } from '@/stores/authStore';
import { useRef, useEffect, useState } from 'react';

const TawkToChat = () => {
  const { user } = useAuthStore();
  const tawkMessengerRef = useRef<any>();
  const [isLoaded, setIsLoaded] = useState(false);

  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  // Effect to set user attributes once the widget is loaded and user is available
  useEffect(() => {
    // We wait for the widget to be loaded and the user to be available.
    if (isLoaded && user && tawkMessengerRef.current && typeof tawkMessengerRef.current.setAttributes === 'function') {
      tawkMessengerRef.current.setAttributes({
        name: user.name,
        email: `${user.name.replace(/\s+/g, '.').toLowerCase()}@sh-ims.example.com`, // Example email
      }, function (error: any) {
         if (error) {
            console.error('Tawk.to setAttributes error:', error);
         }
      });
    }
  }, [isLoaded, user]); // This effect runs whenever the loaded status or the user changes.

  if (!propertyId || !widgetId) {
    // The component will simply not render if the IDs are missing.
    return null;
  }

  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
      ref={tawkMessengerRef}
      onLoad={() => {
        setIsLoaded(true);
      }}
    />
  );
};

export default TawkToChat;
