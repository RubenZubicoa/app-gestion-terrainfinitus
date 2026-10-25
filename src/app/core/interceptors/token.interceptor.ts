import {
  HttpContext,
  HttpContextToken,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment.development';
import { TokenService } from '../services/token-service';

/** Si es true, exige token; si no hay, la petición falla. */
export const CHECK_TOKEN = new HttpContextToken<boolean>(() => false);

export function checkToken() {
  return new HttpContext().set(CHECK_TOKEN, true);
}

function isApiRequest(url: string): boolean {
  return (
    url.startsWith(environment.apiUrl) || url.startsWith(environment.terrainfinitusApiUrl)
  );
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.token();
  const requiresToken = req.context.get(CHECK_TOKEN);

  if (requiresToken && !token) {
    throw new Error('Ha ocurrido un error, por favor vuelva a iniciar sesión');
  }

  if (!token || !isApiRequest(req.url)) {
    return next(req);
  }

  const requestWithAuth = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(requestWithAuth);
};
