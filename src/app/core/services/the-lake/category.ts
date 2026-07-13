import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Category, CategoryCreate, CategoryDB, CategoryUpdate, mapCategoryDBToCategory } from '../../models/the-lake/Category';
import { checkToken } from '../../interceptors/token.interceptor';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/categories';
  private readonly context = checkToken();

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoryDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((categories) => categories.map((category) => mapCategoryDBToCategory(category))),
    );
  }

  getCategory(uuid: string): Observable<Category> {
    return this.http.get<CategoryDB>(`${this.baseUrl}/${uuid}`, { context: this.context }).pipe(
      map((category) => mapCategoryDBToCategory(category)),
    );
  }

  createCategory(category: CategoryCreate): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category, { context: this.context });
  }

  updateCategory(uuid: string, category: CategoryUpdate): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${uuid}`, category, { context: this.context });
  }

  deleteCategory(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
