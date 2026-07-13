import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Product, ProductDB, mapProductDBToProduct, ProductCreate, ProductUpdate } from '../../models/the-lake/Product';
import { checkToken } from '../../interceptors/token.interceptor';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/products';
  private readonly context = checkToken();

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((products) => products.map((product) => mapProductDBToProduct(product))),
    );
  }

  getProduct(uuid: string): Observable<Product> {
    return this.http.get<ProductDB>(`${this.baseUrl}/${uuid}`, { context: this.context }).pipe(
      map((product) => mapProductDBToProduct(product)),
    );
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return this.http
      .get<ProductDB[]>(`${this.baseUrl}/category/${categoryId}`, { context: this.context })
      .pipe(map((products) => products.map((product) => mapProductDBToProduct(product))));
  }

  createProduct(product: ProductCreate): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product, { context: this.context });
  }

  updateProduct(uuid: string, product: ProductUpdate): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${uuid}`, product, { context: this.context });
  }

  deleteProduct(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
