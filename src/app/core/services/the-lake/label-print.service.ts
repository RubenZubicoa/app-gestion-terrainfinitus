import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment.development';
import { Product } from '../../models/the-lake/Product';
import { formatEuro } from '../../../shared/utils/currency';

@Injectable({
  providedIn: 'root',
})
export class LabelPrintService {
  private readonly http = inject(HttpClient);

  /**
   * URL del endpoint de impresión Zebra.
   * Cámbiala en `environment.zebraPrinterUrl` cuando esté disponible.
   */
  private readonly printerUrl = environment.zebraPrinterUrl;

  /**
   * Genera ZPL de ejemplo a partir del producto y lo envía a la impresora Zebra.
   */
  printProductLabel(product: Product): Observable<unknown> {
    if (!this.printerUrl.trim()) {
      return throwError(
        () => new Error('No hay URL de impresora Zebra configurada (zebraPrinterUrl).'),
      );
    }

    const zpl = this.buildSampleLabelZpl(product);

    return this.http.post(this.printerUrl, zpl, {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain; charset=utf-8',
      }),
      responseType: 'text',
    });
  }

  /**
   * Etiqueta ZPL de ejemplo (aprox. 50×30 mm / 203 dpi).
   * Sustituye este layout cuando tengas el diseño definitivo.
   */
  buildSampleLabelZpl(product: Product): string {
    const name = this.sanitizeZplText(this.truncate(product.name, 28));
    const price = this.sanitizeZplText(formatEuro(product.price));
    const barcodeData = this.sanitizeZplText(product.uuid.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20) || 'SAMPLE');

    return [
      '^XA',
      '^CI28',
      '^PW406',
      '^LL203',
      '^LH0,0',
      `^FO20,20^A0N,28,28^FD${name}^FS`,
      `^FO20,60^A0N,24,24^FD${price}^FS`,
      `^FO20,100^BY2^BCN,60,Y,N,N^FD${barcodeData}^FS`,
      '^XZ',
    ].join('\n');
  }

  private sanitizeZplText(value: string): string {
    return value.replace(/[\^~\\]/g, ' ').trim();
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
  }
}
