import { computed, inject, Injectable, signal } from '@angular/core';
import { TokenService } from './token-service';
import { User } from '../models/the-lake/User';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  private readonly tokenService = inject(TokenService);

  private readonly _user = signal<User | null>(null);
  private readonly storageKey = 'user';

  readonly user = this._user.asReadonly();

  readonly displayName = computed(() => {
    const current = this._user();
    if (!current) {
      return '';
    }
    return [current.name, current.lastName].filter(Boolean).join(' ').trim();
  });

  constructor() {
    if (this.tokenService.isAuthenticated()) {
      this.initialize();
    }
  }

  private initialize(): void {
    this._user.set(this.getUser());
  }

  setUser(user: User): void {
    this._user.set(user);
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  removeUser(): void {
    this._user.set(null);
    localStorage.removeItem(this.storageKey);
  }

  getUser(): User | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as User;
  }
}
