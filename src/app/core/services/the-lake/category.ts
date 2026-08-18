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
    return this.http
      .post<CategoryDB>(this.baseUrl, this.toFormData(category), { context: this.context })
      .pipe(map((categoryDB) => mapCategoryDBToCategory(categoryDB)));
  }

  createSubCategory(parentUuid: string, category: CategoryCreate): Observable<Category> {
    return this.http
      .post<CategoryDB>(
        `${this.baseUrl}/${parentUuid}/subcategories`,
        this.toFormData(category),
        { context: this.context },
      )
      .pipe(map((categoryDB) => mapCategoryDBToCategory(categoryDB)));
  }

  updateCategory(uuid: string, category: CategoryUpdate): Observable<Category> {
    return this.http
      .put<CategoryDB>(`${this.baseUrl}/${uuid}`, this.toFormData(category), {
        context: this.context,
      })
      .pipe(map((categoryDB) => mapCategoryDBToCategory(categoryDB)));
  }

  updateSubCategory(
    uuid: string,
    parentUuid: string,
    category: CategoryUpdate,
  ): Observable<Category> {
    return this.http
      .put<CategoryDB>(
        `${this.baseUrl}/${parentUuid}/subcategories/${uuid}`,
        this.toFormData(category),
        { context: this.context },
      )
      .pipe(map((categoryDB) => mapCategoryDBToCategory(categoryDB)));
  }

  deleteCategory(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }

  private toFormData(category: CategoryCreate | CategoryUpdate): FormData {
    const formData = new FormData();

    if (category.label) {
      formData.append('label', category.label);
    }

    if (category.description !== undefined) {
      formData.append('description', category.description);
    }

    if (category.image) {
      formData.append('image', category.image);
    }

    if (category.children !== undefined) {
      const childrenPayload = category.children.map((child) => ({
        uuid: child.uuid,
        label: child.label,
        description: child.description,
        image: typeof child.image === 'string' ? child.image : undefined,
      }));

      formData.append('children', JSON.stringify(childrenPayload));

      category.children.forEach((child, index) => {
        if (child.image instanceof File) {
          formData.append(`children[${index}][image]`, child.image);
        }
      });
    }

    return formData;
  }
}
