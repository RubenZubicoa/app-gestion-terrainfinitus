import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddGourmetOrder,
  GourmetOrder,
  GourmetOrderDB,
  mapGourmetOrderDBToGourmetOrder,
  UpdateGourmetOrder,
} from '../../models/terrainfinitus/GourmetOrder';

@Injectable({
  providedIn: 'root',
})
export class GourmetOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.terrainfinitusApiUrl + '/api/gourmet-orders';

  createGourmetOrder(gourmetOrder: AddGourmetOrder): Observable<GourmetOrder> {
    return this.http
      .post<GourmetOrderDB>(this.apiUrl, gourmetOrder)
      .pipe(map(mapGourmetOrderDBToGourmetOrder));
  }

  getGourmetOrderById(id: string): Observable<GourmetOrder> {
    return this.http
      .get<GourmetOrderDB>(`${this.apiUrl}/${id}`)
      .pipe(map(mapGourmetOrderDBToGourmetOrder));
  }

  getGourmetOrdersByUserId(userId: string): Observable<GourmetOrder[]> {
    return this.http
      .get<GourmetOrderDB[]>(`${this.apiUrl}/user/${userId}`)
      .pipe(map(gourmetOrdersDB => gourmetOrdersDB.map(mapGourmetOrderDBToGourmetOrder)));
  }

  updateGourmetOrder(id: string, gourmetOrder: UpdateGourmetOrder): Observable<GourmetOrder> {
    return this.http
      .put<GourmetOrderDB>(`${this.apiUrl}/${id}`, gourmetOrder)
      .pipe(map(mapGourmetOrderDBToGourmetOrder));
  }

  deleteGourmetOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
