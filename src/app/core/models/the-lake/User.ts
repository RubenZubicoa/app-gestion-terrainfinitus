export type UserDB = {
    _id: string;
    name: string;
    lastName: string;
    phone: string;
    address: string;
    email: string;
    password: string;
    role: string;
    createdAt?: number;
    updatedAt?: number;
    isDeleted?: boolean;
}

export interface User {
    uuid: string;
    name: string;
    lastName: string;
    phone: string;
    address: string;
    email: string;
    role: string;
    password: string;
}

export type AddUser = Omit<User, 'uuid' | 'createdAt' | 'updatedAt' | 'isDeleted'>;
export type UpdateUser = Omit<User, 'uuid' | 'password' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'role'>;

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
    }
}