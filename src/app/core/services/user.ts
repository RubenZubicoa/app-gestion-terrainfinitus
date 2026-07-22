import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { checkToken } from '../interceptors/token.interceptor';
import {
  AddUser,
  mapUserDBToUser,
  UpdateUser,
  User as UserModel,
  UserDB,
} from '../models/the-lake/User';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/users';
  private readonly context = checkToken();

  getUsers(): Observable<UserModel[]> {
    return this.http.get<UserDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((usersDB) => usersDB.map(mapUserDBToUser)),
    );
  }

  createUser(user: AddUser): Observable<void> {
    return this.http.post<void>(this.baseUrl, user, { context: this.context });
  }

  updateUser(uuid: string, user: UpdateUser): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${uuid}`, user, { context: this.context });
  }

  changePassword(uuid: string, password: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${uuid}/change-password`, { password }, { context: this.context });
  }

  deleteUser(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
