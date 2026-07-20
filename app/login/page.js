import { getSessionUser } from '../../lib/auth.js';
import { redirect } from 'next/navigation';
import LoginForm from '../../components/login-form.jsx';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const user = getSessionUser();
  if (user) {
    redirect(user.role === 'admin' ? '/admin' : '/exams');
  }

  return <LoginForm />;
}

