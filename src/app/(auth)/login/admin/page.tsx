
import LoginForm from '@/components/auth/LoginForm';

export default function AdminLoginPage() {
  return <LoginForm role="admin" adminUsernames={["NPS", "SKG"]} />;
}
