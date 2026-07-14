import { Pipe, PipeTransform } from '@angular/core';

import { formatEuro } from '../utils/currency';

@Pipe({
  name: 'euro',
})
export class EuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '—';
    }

    return formatEuro(value);
  }
}
