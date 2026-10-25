import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment.development';
import { checkToken } from '../../interceptors/token.interceptor';
import {
  mapShippingCostDBToShippingCost,
  ShippingCost,
  ShippingCostCreate,
  ShippingCostDB,
  ShippingCostUpdate,
} from '../../models/the-lake/ShippingCost';

@Injectable({
  providedIn: 'root',
})
export class ShippingCostService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/shipping-costs';
  private readonly context = checkToken();

  getShippingCosts(): Observable<ShippingCost[]> {
    return this.http.get<ShippingCostDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((items) => items.map(mapShippingCostDBToShippingCost)),
    );
  }

  getShippingCost(uuid: string): Observable<ShippingCost> {
    return this.http
      .get<ShippingCostDB>(`${this.baseUrl}/${uuid}`, { context: this.context })
      .pipe(map(mapShippingCostDBToShippingCost));
  }

  createShippingCost(shippingCost: ShippingCostCreate): Observable<ShippingCost> {
    return this.http.post<ShippingCost>(this.baseUrl, shippingCost, {
      context: this.context,
    });
  }

  updateShippingCost(uuid: string, shippingCost: ShippingCostUpdate): Observable<ShippingCost> {
    return this.http.put<ShippingCost>(`${this.baseUrl}/${uuid}`, shippingCost, {
      context: this.context,
    });
  }

  deleteShippingCost(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
