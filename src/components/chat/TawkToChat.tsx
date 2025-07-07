"use client";

import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

const TawkToChat = () => {
  const { user } = useAuthStore();
  const [isTawkLoaded, setIsTawkLoaded] = useState(false);

  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  // This effect will run when either the widget loads or the user state changes.
  useEffect(() => {
    // We only try to set attributes if the widget has loaded AND the user is available.
    if (isTawkLoaded && user && window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
      window.Tawk_API.setAttributes({
        name: user.name,
        email: `${user.name.replace(/\s+/g, '.').toLowerCase()}@sh-ims.example.com`,
      }, (error: any) => {
        if (error) {
          console.error('Tawk.to setAttributes error:', error);
        }
      });
    }
  }, [isTawkLoaded, user]); // Re-run this effect if the load status or user changes.

  // Don't render the component if the required IDs are missing.
  if (!propertyId || !widgetId) {
    return null;
  }

  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
      onLoad={() => {
        // When the Tawk.to script loads, we set our state variable to true.
        // This will trigger the useEffect above to check if it can set the attributes.
        setIsTawkLoaded(true);
      }}
    />
  );
};

export default TawkToChat;
