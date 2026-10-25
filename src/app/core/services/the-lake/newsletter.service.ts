import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment.development';
import { checkToken } from '../../interceptors/token.interceptor';
import {
  mapNewsLetterDBToNewsLetter,
  NewsLetter,
  NewsLetterCreate,
  NewsLetterDB,
  NewsLetterUpdate,
} from '../../models/the-lake/NewsLetter';

@Injectable({
  providedIn: 'root',
})
export class NewsLetterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/newsletters';
  private readonly context = checkToken();

  getNewsLetters(): Observable<NewsLetter[]> {
    return this.http.get<NewsLetterDB[]>(this.baseUrl, { context: this.context }).pipe(
      map((items) => items.map(mapNewsLetterDBToNewsLetter)),
    );
  }

  getNewsLetter(uuid: string): Observable<NewsLetter> {
    return this.http
      .get<NewsLetterDB>(`${this.baseUrl}/${uuid}`, { context: this.context })
      .pipe(map(mapNewsLetterDBToNewsLetter));
  }

  createNewsLetter(newsLetter: NewsLetterCreate): Observable<NewsLetter> {
    const formData = new FormData();
    formData.append('title', newsLetter.title);
    formData.append('path', newsLetter.path);

    if (newsLetter.pathImage) {
      formData.append('pathImage', newsLetter.pathImage);
    }

    return this.http.post<NewsLetter>(this.baseUrl, formData, { context: this.context });
  }

  updateNewsLetter(uuid: string, newsLetter: NewsLetterUpdate): Observable<NewsLetter> {
    const formData = new FormData();

    if (newsLetter.title !== undefined) {
      formData.append('title', newsLetter.title);
    }

    if (newsLetter.path) {
      formData.append('path', newsLetter.path);
    }

    if (newsLetter.pathImage) {
      formData.append('pathImage', newsLetter.pathImage);
    }

    return this.http.put<NewsLetter>(`${this.baseUrl}/${uuid}`, formData, {
      context: this.context,
    });
  }

  deleteNewsLetter(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }

  publishNewsLetter(uuid: string): Observable<NewsLetter> {
    return this.http
      .post<NewsLetterDB>(`${this.baseUrl}/${uuid}/publish`, {}, { context: this.context })
      .pipe(map(mapNewsLetterDBToNewsLetter));
  }
}
