
import { redirect } from 'next/navigation';
import { appSettings } from '@/lib/data';

export default function HomePage() {
  // This is a server component, so we can check the in-memory setting.
  if (!appSettings.isInitialized) {
    redirect('/initialize');
  } else {
    redirect('/login');
  }
  return null; 
}
