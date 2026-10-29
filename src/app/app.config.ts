import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tap } from 'rxjs';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

const sessionInterceptor: HttpInterceptorFn = (request, next) => next(request.clone({ withCredentials: true }));

const logInterceptor: HttpInterceptorFn = (request, next) => {
  const startedAt = performance.now();
  return next(request).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.info('[http]', request.method, request.urlWithParams, event.status, `${Math.round(performance.now() - startedAt)}ms`);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('[http]', request.method, request.urlWithParams, error.status, `${Math.round(performance.now() - startedAt)}ms`, error.message);
      },
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([sessionInterceptor, logInterceptor])),
  ],
};
