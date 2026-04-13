import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {routes} from './app.routes';
import {routesNoAuth} from './app.routes.no-auth';

const useAuth = true; // Postavka koja određuje da li se koristi AuthGuard (true) ili ne (false)

const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(useAuth ? routes : routesNoAuth),
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};

export default appConfig;
