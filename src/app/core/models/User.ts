export type UserRole = 'admin' | 'owner' | 'user';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  owner: 'Propietario',
  user: 'Usuario',
};

export const USER_ROLE_OPTIONS: UserRole[] = ['admin', 'user'];

export const BACK_OFFICE_USER_ROLES: UserRole[] = ['admin', 'owner'];

export const BACK_OFFICE_ROLE_OPTIONS: UserRole[] = ['admin', 'owner'];

export const CLIENT_USER_ROLE: UserRole = 'user';

export type UserDB = {
  _id: string;
  name: string;
  lastName: string;
  dni?: string;
  phone: string;
  address: string;
  email: string;
  password?: string;
  role: string;
  isProfessional?: boolean;
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface User {
  uuid: string;
  name: string;
  lastName: string;
  dni?: string;
  phone: string;
  address: string;
  email: string;
  role: string;
  password?: string;
  isProfessional?: boolean;
}

export type AddUser = {
  name: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  role: string;
};

export type UpdateUser = {
  name?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  email?: string;
  role?: string;
};

export function mapUserDBToUser(userDB: UserDB): User {
  return {
    uuid: userDB._id,
    name: userDB.name,
    lastName: userDB.lastName,
    dni: userDB.dni,
    phone: userDB.phone,
    address: userDB.address,
    email: userDB.email,
    role: userDB.role,
    password: userDB.password,
    isProfessional: userDB.isProfessional,
  };
}

export function getUserRoleLabel(role: string): string {
  return USER_ROLE_LABELS[role as UserRole] ?? role;
}
