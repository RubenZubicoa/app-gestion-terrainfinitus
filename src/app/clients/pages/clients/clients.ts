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

import { CLIENT_USER_ROLE, User } from '../../../core/models/User';
import { UserService } from '../../../core/services/user';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../shared/components/data-table/data-table';
import {
  ChangePasswordDialog,
  ChangePasswordSubmit,
} from '../../../users/components/change-password-dialog/change-password-dialog';
import {
  UserFormDialog,
  UserFormSubmit,
} from '../../../users/components/user-form-dialog/user-form-dialog';

@Component({
  selector: 'app-clients',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, UserFormDialog, ChangePasswordDialog],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clientRole = CLIENT_USER_ROLE;
  protected readonly clients = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingClient = signal<User | null>(null);
  protected readonly showPasswordForm = signal(false);
  protected readonly passwordClient = signal<User | null>(null);

  protected readonly tableColumns = computed<DataTableColumn<User>[]>(() => [
    {
      key: 'name',
      label: 'Nombre',
      cellClass: 'font-medium text-slate-900',
      format: (client) => `${client.name} ${client.lastName}`.trim(),
    },
    {
      key: 'dni',
      label: 'DNI',
      cellClass: 'text-slate-600',
      format: (client) => client.dni || '—',
    },
    {
      key: 'email',
      label: 'Email',
      cellClass: 'text-slate-600',
      format: (client) => client.email,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      cellClass: 'text-slate-600',
      format: (client) => client.phone || '—',
    },
    {
      key: 'address',
      label: 'Dirección',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (client) => client.address || '—',
    },
  ]);

  ngOnInit(): void {
    this.loadClients();
  }

  protected openAddForm(): void {
    this.editingClient.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(client: User): void {
    this.editingClient.set(client);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingClient.set(null);
  }

  protected openChangePasswordForm(client: User): void {
    this.passwordClient.set(client);
    this.showPasswordForm.set(true);
  }

  protected closePasswordForm(): void {
    this.showPasswordForm.set(false);
    this.passwordClient.set(null);
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

  protected onClientSubmitted(payload: UserFormSubmit): void {
    if (payload.uuid) {
      this.userService
        .updateUser(payload.uuid, {
          name: payload.values.name,
          lastName: payload.values.lastName,
          phone: payload.values.phone,
          address: payload.values.address,
          email: payload.values.email,
          role: CLIENT_USER_ROLE,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadClients();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el cliente.'),
        });
      return;
    }

    if (!payload.values.password) {
      this.error.set('Debes indicar una contraseña para crear el cliente.');
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
        role: CLIENT_USER_ROLE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadClients();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el cliente.'),
      });
  }

  protected deleteClient(client: User): void {
    const fullName = `${client.name} ${client.lastName}`.trim();
    const confirmed = confirm(`¿Eliminar el cliente "${fullName}"?`);

    if (!confirmed) {
      return;
    }

    this.userService
      .deleteUser(client.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadClients(),
        error: () => this.error.set('No se pudo eliminar el cliente.'),
      });
  }

  protected trackClient(client: User): string {
    return client.uuid;
  }

  private loadClients(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.clients.set(users.filter((user) => user.role === CLIENT_USER_ROLE));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los clientes.');
        },
      });
  }
}
