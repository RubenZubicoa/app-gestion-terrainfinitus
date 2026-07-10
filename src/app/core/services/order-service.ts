import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AddOrder, mapOrderDBToOrder, Order, OrderDB } from '../models/Order';
import { checkToken } from '../interceptors/token.interceptor';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/orders';
  private readonly context = checkToken();

  createOrder(order: AddOrder): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/`, order, { context: this.context });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<OrderDB[]>(`${this.baseUrl}/`, { context: this.context }).pipe(map(orders => orders.map(order => mapOrderDBToOrder(order))));
  }
}
