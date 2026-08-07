import { LoginView } from '@/components/auth/LoginView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Gjanand Sarkar',
  description: 'Sign in to your Gjanand Sarkar account to access fresh dairy, groceries, and artisanal products.',
};

export default function AuthLoginPage() {
  return <LoginView />;
}
