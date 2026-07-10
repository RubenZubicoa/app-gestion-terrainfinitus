import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { mapProductDBToProduct, Product, ProductCreate, ProductDB, ProductUpdate } from '../models/Product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl + '/products';

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductDB[]>(this.baseUrl).pipe(
      map(products => products.map(product => mapProductDBToProduct(product)))
    );
  }

  getProduct(uuid: string): Observable<Product> {
    return this.http.get<ProductDB>(`${this.baseUrl}/${uuid}`).pipe(
      map(product => mapProductDBToProduct(product))
    );
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return this.http.get<ProductDB[]>(`${this.baseUrl}/category/${categoryId}`).pipe(
      map(products => products.map(product => mapProductDBToProduct(product)))
    );
  }

  createProduct(product: ProductCreate): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  updateProduct(uuid: string, product: ProductUpdate): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${uuid}`, product);
  }

  deleteProduct(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`);
  }
}
