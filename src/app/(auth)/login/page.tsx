
import LoginForm from '@/components/auth/LoginForm';
import { appSettings } from '@/lib/data';
import { redirect } from 'next/navigation';

export default function UniversalLoginPage() {
    if (!appSettings.isInitialized) {
        redirect('/initialize');
    }
  return <LoginForm />;
}
