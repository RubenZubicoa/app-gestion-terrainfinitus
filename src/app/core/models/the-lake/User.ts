export type UserRole = 'admin' | 'user';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  user: 'Usuario',
};

export const USER_ROLE_OPTIONS: UserRole[] = ['admin', 'user'];

export type UserDB = {
  _id: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  password?: string;
  role: string;
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface User {
  uuid: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  role: string;
  password?: string;
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
    phone: userDB.phone,
    address: userDB.address,
    email: userDB.email,
    role: userDB.role,
    password: userDB.password,
  };
}

export function getUserRoleLabel(role: string): string {
  return USER_ROLE_LABELS[role as UserRole] ?? role;
}
