import {
  HttpContext,
  HttpContextToken,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenService } from '../services/token-service';

export const CHECK_TOKEN = new HttpContextToken<boolean>(() => false);

export function checkToken() {
  return new HttpContext().set(CHECK_TOKEN, true);
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(CHECK_TOKEN)) {
    return next(req);
  }

  const tokenService = inject(TokenService);
  const token = tokenService.token();

  if (!token) {
    throw new Error('Ha ocurrido un error, por favor vuelva a iniciar sesión');
  }

  const requestWithAuth = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(requestWithAuth);
};
