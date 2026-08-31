import { UserDB, User } from "./User";

export interface LoginResponseDB {
    token: string;
    user: UserDB;
}

export interface LoginResponse {
    token: string;
    user: User;
}