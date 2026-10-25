import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment.development';
import { checkToken } from '../../interceptors/token.interceptor';
import {
  mapNewsLetterSubscriptionDBToNewsLetterSubscription,
  NewsLetterSubscription,
  NewsLetterSubscriptionCreate,
  NewsLetterSubscriptionDB,
  NewsLetterSubscriptionUpdate,
} from '../../models/the-lake/NewsLetterSubscription';

@Injectable({
  providedIn: 'root',
})
export class NewsLetterSubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/newsletter-subscriptions';
  private readonly context = checkToken();

  getSubscriptions(): Observable<NewsLetterSubscription[]> {
    return this.http
      .get<NewsLetterSubscriptionDB[]>(this.baseUrl, { context: this.context })
      .pipe(map((items) => items.map(mapNewsLetterSubscriptionDBToNewsLetterSubscription)));
  }

  getSubscription(uuid: string): Observable<NewsLetterSubscription> {
    return this.http
      .get<NewsLetterSubscriptionDB>(`${this.baseUrl}/${uuid}`, { context: this.context })
      .pipe(map(mapNewsLetterSubscriptionDBToNewsLetterSubscription));
  }

  createSubscription(
    subscription: NewsLetterSubscriptionCreate,
  ): Observable<NewsLetterSubscription> {
    return this.http.post<NewsLetterSubscription>(this.baseUrl, subscription, {
      context: this.context,
    });
  }

  updateSubscription(
    uuid: string,
    subscription: NewsLetterSubscriptionUpdate,
  ): Observable<NewsLetterSubscription> {
    return this.http.put<NewsLetterSubscription>(`${this.baseUrl}/${uuid}`, subscription, {
      context: this.context,
    });
  }

  deleteSubscription(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uuid}`, { context: this.context });
  }
}
