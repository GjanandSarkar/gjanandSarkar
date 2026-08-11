import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export type JwtUserPayload = {
  userId: string;
  role: 'customer' | 'admin' | 'seller';
  phone?: string;
  email?: string;
  name?: string;
};

export function signAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
    issuer: 'gjanandsarkar.com',
    audience: 'gjanandsarkar-app',
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
    issuer: 'gjanandsarkar.com',
    audience: 'gjanandsarkar-app',
  });
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, config.jwtSecret, {
    issuer: 'gjanandsarkar.com',
    audience: 'gjanandsarkar-app',
  }) as JwtUserPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.jwtRefreshSecret, {
    issuer: 'gjanandsarkar.com',
    audience: 'gjanandsarkar-app',
  }) as { userId: string };
}
