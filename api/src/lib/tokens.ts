import jwt from 'jsonwebtoken';
import { getCoreConfig } from '../config';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface TokenUser {
  id: number;
  role: UserRole;
}

const ROLES: UserRole[] = ['patient', 'doctor', 'admin'];

export function signToken(user: TokenUser): string {
  return jwt.sign({ sub: String(user.id), role: user.role }, getCoreConfig().JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenUser {
  const payload = jwt.verify(token, getCoreConfig().JWT_SECRET);
  if (typeof payload === 'string') throw new Error('invalid token');
  const id = Number(payload.sub);
  if (!Number.isInteger(id) || !ROLES.includes(payload.role as UserRole)) {
    throw new Error('invalid token');
  }
  return { id, role: payload.role as UserRole };
}
