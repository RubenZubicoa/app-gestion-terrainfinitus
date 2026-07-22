import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { User } from '../../../core/models/the-lake/User';

export type ChangePasswordSubmit = {
  uuid: string;
  password: string;
};

@Component({
  selector: 'app-change-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password-dialog.html',
})
export class ChangePasswordDialog {
  readonly user = input.required<User>();

  readonly submitted = output<ChangePasswordSubmit>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      this.user();

      untracked(() => {
        this.form.reset({ password: '', confirmPassword: '' });
      });
    });
  }

  protected get userFullName(): string {
    const user = this.user();
    return `${user.name} ${user.lastName}`.trim();
  }

  protected get passwordsMismatch(): boolean {
    const { password, confirmPassword } = this.form.getRawValue();
    return (
      confirmPassword.length > 0 &&
      password !== confirmPassword &&
      this.form.controls.confirmPassword.touched
    );
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.form.controls.confirmPassword.markAsTouched();
      return;
    }

    this.submitted.emit({
      uuid: this.user().uuid,
      password,
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
