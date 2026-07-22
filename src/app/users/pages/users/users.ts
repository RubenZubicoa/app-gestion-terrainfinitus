import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { getUserRoleLabel, User } from '../../../core/models/the-lake/User';
import { UserService } from '../../../core/services/user';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../shared/components/data-table/data-table';
import {
  UserFormDialog,
  UserFormSubmit,
} from '../../components/user-form-dialog/user-form-dialog';
import {
  ChangePasswordDialog,
  ChangePasswordSubmit,
} from '../../components/change-password-dialog/change-password-dialog';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, UserFormDialog, ChangePasswordDialog],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingUser = signal<User | null>(null);
  protected readonly showPasswordForm = signal(false);
  protected readonly passwordUser = signal<User | null>(null);

  protected readonly tableColumns = computed<DataTableColumn<User>[]>(() => [
    {
      key: 'name',
      label: 'Nombre',
      cellClass: 'font-medium text-slate-900',
      format: (user) => `${user.name} ${user.lastName}`.trim(),
    },
    {
      key: 'email',
      label: 'Email',
      cellClass: 'text-slate-600',
      format: (user) => user.email,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      cellClass: 'text-slate-600',
      format: (user) => user.phone || '—',
    },
    {
      key: 'role',
      label: 'Rol',
      cellClass: 'text-slate-600',
      format: (user) => getUserRoleLabel(user.role),
    },
    {
      key: 'address',
      label: 'Dirección',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (user) => user.address || '—',
    },
  ]);

  ngOnInit(): void {
    this.loadUsers();
  }

  protected openAddForm(): void {
    this.editingUser.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(user: User): void {
    this.editingUser.set(user);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
  }

  protected openChangePasswordForm(user: User): void {
    this.passwordUser.set(user);
    this.showPasswordForm.set(true);
  }

  protected closePasswordForm(): void {
    this.showPasswordForm.set(false);
    this.passwordUser.set(null);
  }

  protected onPasswordSubmitted(payload: ChangePasswordSubmit): void {
    this.userService
      .changePassword(payload.uuid, payload.password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closePasswordForm();
          this.error.set(null);
        },
        error: () => this.error.set('No se pudo cambiar la contraseña.'),
      });
  }

  protected onUserSubmitted(payload: UserFormSubmit): void {
    if (payload.uuid) {
      this.userService
        .updateUser(payload.uuid, {
          name: payload.values.name,
          lastName: payload.values.lastName,
          phone: payload.values.phone,
          address: payload.values.address,
          email: payload.values.email,
          role: payload.values.role,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadUsers();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el usuario.'),
        });
      return;
    }

    if (!payload.values.password) {
      this.error.set('Debes indicar una contraseña para crear el usuario.');
      return;
    }

    this.userService
      .createUser({
        name: payload.values.name,
        lastName: payload.values.lastName,
        phone: payload.values.phone,
        address: payload.values.address,
        email: payload.values.email,
        password: payload.values.password,
        role: payload.values.role,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el usuario.'),
      });
  }

  protected deleteUser(user: User): void {
    const fullName = `${user.name} ${user.lastName}`.trim();
    const confirmed = confirm(`¿Eliminar el usuario "${fullName}"?`);

    if (!confirmed) {
      return;
    }

    this.userService
      .deleteUser(user.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadUsers(),
        error: () => this.error.set('No se pudo eliminar el usuario.'),
      });
  }

  protected trackUser(user: User): string {
    return user.uuid;
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los usuarios.');
        },
      });
  }
}
