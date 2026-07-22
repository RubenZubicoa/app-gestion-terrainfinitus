import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  USER_ROLE_LABELS,
  USER_ROLE_OPTIONS,
  User,
  UserRole,
} from '../../../core/models/the-lake/User';

export type UserFormValues = {
  name: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  password?: string;
  role: string;
};

export type UserFormSubmit = {
  uuid?: string;
  values: UserFormValues;
};

@Component({
  selector: 'app-user-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './user-form-dialog.html',
})
export class UserFormDialog {
  readonly user = input<User | null>(null);

  readonly submitted = output<UserFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly roleOptions = USER_ROLE_OPTIONS;
  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly showValidationSummary = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true }),
    role: new FormControl<UserRole>('user', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      const user = this.user();

      untracked(() => {
        const passwordControl = this.form.controls.password;
        this.showValidationSummary.set(false);

        if (user) {
          passwordControl.clearValidators();
          passwordControl.disable({ emitEvent: false });
          this.form.patchValue({
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            password: '',
            role: this.resolveRole(user.role),
          });
        } else {
          passwordControl.enable({ emitEvent: false });
          passwordControl.setValidators([Validators.required, Validators.minLength(6)]);
          this.form.reset({
            name: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            password: '',
            role: 'user',
          });
        }

        passwordControl.updateValueAndValidity({ emitEvent: false });
      });
    });
  }

  protected get isEditing(): boolean {
    return this.user() !== null;
  }

  protected fieldError(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];

    if (!control || !this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (controlName === 'email' && control.hasError('email')) {
      return 'Introduce un correo electrónico válido.';
    }

    if (controlName === 'password' && control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return 'Revisa este campo.';
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    const { name, lastName, email, phone, address, password, role } = this.form.getRawValue();
    const user = this.user();

    this.submitted.emit({
      uuid: user?.uuid,
      values: {
        name,
        lastName,
        email,
        phone,
        address,
        role,
        password: password || undefined,
      },
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
  }

  private resolveRole(role: string): UserRole {
    return USER_ROLE_OPTIONS.includes(role as UserRole) ? (role as UserRole) : 'user';
  }
}
