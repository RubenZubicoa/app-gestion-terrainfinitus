import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TokenService } from './token-service';
import { environment } from '../../../environments/environment.development';
import { LoginResponse, LoginResponseDB } from '../models/login-response';
import { mapUserDBToUser } from '../models/the-lake/User';
import { CurrentUserService } from './current-user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly currentUserService = inject(CurrentUserService);

  private readonly baseUrl = environment.apiUrl + '/login';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponseDB>(this.baseUrl, { email, password }).pipe(
      map((response) => ({
        token: response.token,
        user: mapUserDBToUser(response.user),
      })),
      tap((response) => {
        this.tokenService.saveToken(response.token);
        this.currentUserService.setUser(response.user);
      }),
    );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUserService.removeUser();
  }
}
