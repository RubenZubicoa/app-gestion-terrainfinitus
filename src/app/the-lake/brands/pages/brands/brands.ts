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

import { Brand } from '../../../../core/models/the-lake/Brand';
import { BrandService } from '../../../../core/services/the-lake/brand';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  BrandFormDialog,
  BrandFormSubmit,
} from '../../components/brand-form-dialog/brand-form-dialog';

@Component({
  selector: 'app-brands',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BrandFormDialog],
  templateUrl: './brands.html',
  styleUrl: './brands.css',
})
export class Brands implements OnInit {
  private readonly brandService = inject(BrandService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly brands = signal<Brand[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingBrand = signal<Brand | null>(null);

  protected readonly tableColumns = computed<DataTableColumn<Brand>[]>(() => [
    {
      key: 'name',
      label: 'Nombre',
      cellClass: 'font-medium text-slate-900',
      format: (brand) => brand.name,
    },
    {
      key: 'description',
      label: 'Descripción',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (brand) => brand.description || '—',
    },
    {
      key: 'logo',
      label: 'Logo',
      cellClass: 'text-slate-600',
      format: (brand) => (brand.logo ? 'Sí' : 'No'),
    },
  ]);

  ngOnInit(): void {
    this.loadBrands();
  }

  protected openAddForm(): void {
    this.editingBrand.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(brand: Brand): void {
    this.editingBrand.set(brand);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingBrand.set(null);
  }

  protected onBrandSubmitted(payload: BrandFormSubmit): void {
    if (payload.uuid) {
      this.brandService
        .updateBrand(payload.uuid, {
          name: payload.values.name,
          description: payload.values.description,
          logo: payload.logoFile ?? undefined,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadBrands();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar la marca.'),
        });
      return;
    }

    if (!payload.logoFile) {
      this.error.set('Debes seleccionar un logo para crear la marca.');
      return;
    }

    this.brandService
      .createBrand({
        name: payload.values.name,
        description: payload.values.description,
        logo: payload.logoFile,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadBrands();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear la marca.'),
      });
  }

  protected deleteBrand(brand: Brand): void {
    const confirmed = confirm(`¿Eliminar la marca "${brand.name}"?`);

    if (!confirmed) {
      return;
    }

    this.brandService
      .deleteBrand(brand.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadBrands(),
        error: () => this.error.set('No se pudo eliminar la marca.'),
      });
  }

  protected trackBrand(brand: Brand): string {
    return brand.uuid;
  }

  private loadBrands(): void {
    this.loading.set(true);
    this.error.set(null);

    this.brandService
      .getBrands()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (brands) => {
          this.brands.set(brands);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las marcas.');
        },
      });
  }
}
