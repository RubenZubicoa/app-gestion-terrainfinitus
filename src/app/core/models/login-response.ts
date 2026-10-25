import { User, UserDB } from './User';

/** Respuesta del back en POST /login: { user, token } */
export interface LoginResponseDB {
  user: UserDB;
  token: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}