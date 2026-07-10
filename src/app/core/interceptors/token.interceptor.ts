import { HttpContext, HttpContextToken, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token-service';

export const CHECK_TOKEN = new HttpContextToken<boolean>(() => false);

export function checkToken() {
  return new HttpContext().set(CHECK_TOKEN, true);
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if(req.context.get(CHECK_TOKEN)) {
    const tokenService = inject(TokenService);
    addToken(req, tokenService, next);
  }
  return next(req);
};

const addToken = (req: HttpRequest<unknown>, tokenService: TokenService, next: HttpHandlerFn) => {
  const AUTH_TOKEN = tokenService.token();
  if(AUTH_TOKEN) {
    const requestWithAuth = req.clone({
      headers: req.headers.set('authorization', `Bearer ${AUTH_TOKEN}`),
      withCredentials: true
    });
    return next(requestWithAuth);
  }
  throw new Error('Ha ocurrido un error, por favor vuelva a iniciar sesión');
}