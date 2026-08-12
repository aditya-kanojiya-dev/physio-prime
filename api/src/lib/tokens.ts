export type UserRole = 'patient' | 'doctor' | 'admin';

export interface TokenUser {
  id: number;
  role: UserRole;
}
