import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Brand, BrandCreate, BrandDB, BrandUpdate, mapBrandDBToBrand } from '../../models/the-lake/Brand';
import { checkToken } from '../../interceptors/token.interceptor';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/brands';
  private readonly context = checkToken();

  getBrands(): Observable<Brand[]> {
    return this.http.get<BrandDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((brands) => brands.map((brand) => mapBrandDBToBrand(brand))),
    );
  }

  getBrand(uuid: string): Observable<Brand> {
    return this.http.get<BrandDB>(`${this.baseUrl}/${uuid}`, { context: this.context }).pipe(
      map((brand) => mapBrandDBToBrand(brand)),
    );
  }

  createBrand(brand: BrandCreate): Observable<Brand> {
    return this.http.post<Brand>(this.baseUrl, brand, { context: this.context });
  }

  updateBrand(uuid: string, brand: BrandUpdate): Observable<Brand> {
    return this.http.put<Brand>(`${this.baseUrl}/${uuid}`, brand, { context: this.context });
  }

  deleteBrand(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
