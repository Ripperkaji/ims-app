
"use client";

import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
import { useAuthStore } from '@/stores/authStore';
import { useRef } from 'react';

const TawkToChat = () => {
  const { user } = useAuthStore();
  const tawkMessengerRef = useRef<any>();

  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  if (!propertyId || !widgetId) {
    // console.warn is used here as this is an expected state during setup.
    // The component will simply not render if the IDs are missing.
    return null;
  }

  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
      ref={tawkMessengerRef}
      onLoad={() => {
        if (user && tawkMessengerRef.current) {
          // Pre-fill user data for a better support experience
          tawkMessengerRef.current.setAttributes({
            name: user.name,
            email: `${user.name.replace(/\s+/g, '.').toLowerCase()}@sh-ims.example.com`, // Example email
          }, function (error: any) {
             if (error) {
                console.error('Tawk.to setAttributes error:', error);
             }
          });
        }
      }}
    />
  );
};

export default TawkToChat;
