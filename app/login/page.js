import { getSessionUser } from '../../lib/auth.js';
import { redirect } from 'next/navigation';
import LoginForm from '../../components/login-form.jsx';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === 'admin' ? '/admin' : '/exams');
  }

  return <LoginForm />;
}

