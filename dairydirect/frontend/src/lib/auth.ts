import { getAuthUser as getAuthUserFromMiddleware } from '@/lib/api/auth-middleware';

export type AuthUserWithId = {
  id: string;
  userId: string;
  role: 'customer' | 'admin' | 'seller';
  phone: string | null;
  email: string | null;
  isAdmin: boolean;
};

export async function getAuthUser(request: Request): Promise<AuthUserWithId | null> {
  const user = await getAuthUserFromMiddleware(request);
  if (!user) return null;
  return {
    ...user,
    id: user.userId,
  };
}
