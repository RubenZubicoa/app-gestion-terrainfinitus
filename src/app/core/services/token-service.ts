import { computed, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly storageKey = 'token';

  private readonly _token = signal<string | null>(null);

  public readonly isAuthenticated = computed(() => this._token() !== null);

  constructor() {
    this._token.set(this.getToken());
  }

  public get token() {
    return this._token.asReadonly();
  }

  public saveToken(token: string) {
    this._token.set(token);
    localStorage.setItem(this.storageKey, token);
  }

  public removeToken() {
    this._token.set(null);
    localStorage.removeItem(this.storageKey);
  }

  public getToken() {
    return localStorage.getItem(this.storageKey);
  }
}
