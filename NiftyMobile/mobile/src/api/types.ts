export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';

export type SessionUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  image: string | null;
  active: boolean;
  registerDate: string | null;
};

export type AuthResponse = {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: SessionUser;
};

export function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Record<string, unknown>;
  const user = data.user;
  if (!user || typeof user !== 'object') {
    return false;
  }

  const sessionUser = user as Record<string, unknown>;
  return (
    typeof data.token === 'string' &&
    data.token.length > 0 &&
    typeof data.tokenType === 'string' &&
    typeof data.expiresIn === 'number' &&
    Number.isFinite(data.expiresIn) &&
    data.expiresIn > 0 &&
    typeof sessionUser.id === 'number' &&
    typeof sessionUser.firstName === 'string' &&
    typeof sessionUser.lastName === 'string' &&
    typeof sessionUser.email === 'string' &&
    (sessionUser.phone === null || typeof sessionUser.phone === 'string') &&
    (sessionUser.role === 'ROLE_CUSTOMER' ||
      sessionUser.role === 'ROLE_ADMIN') &&
    (sessionUser.image === null || typeof sessionUser.image === 'string') &&
    typeof sessionUser.active === 'boolean' &&
    (sessionUser.registerDate === null ||
      typeof sessionUser.registerDate === 'string')
  );
}
