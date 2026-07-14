import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import {
  AddOrder,
  mapOrderDBToOrder,
  Order,
  OrderDB,
  UpdateOrder,
} from '../../models/the-lake/Order';
import { checkToken } from '../../interceptors/token.interceptor';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/orders';
  private readonly context = checkToken();

  createOrder(order: AddOrder): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order, { context: this.context });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<OrderDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((orders) => orders.map((order) => mapOrderDBToOrder(order))),
    );
  }

  getOrder(uuid: string): Observable<Order> {
    return this.http.get<OrderDB>(`${this.baseUrl}/${uuid}`, { context: this.context }).pipe(
      map((order) => mapOrderDBToOrder(order)),
    );
  }

  updateOrder(uuid: string, order: UpdateOrder): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${uuid}`, order, { context: this.context });
  }

  deleteOrder(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
