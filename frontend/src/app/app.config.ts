import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  importProvidersFrom
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import {
  provideClientHydration,
  withEventReplay
} from '@angular/platform-browser';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ToastrModule } from 'ngx-toastr';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

import { authInterceptor } from './Interceptor/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(routes),

    provideClientHydration(withEventReplay()),

    // ✅ SINGLE HttpClient provider (FIX)
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    importProvidersFrom(
      ReactiveFormsModule,

      BrowserAnimationsModule,

      NgxSkeletonLoaderModule.forRoot({
        theme: {
          extendsFromRoot: true,
          color: '#f2f8ff',
          backgroundColor: '#e6f0ff',
          height: '18px',
          borderRadius: '6px',
          animation: 'progress',
          animationDuration: '1.1s',
        },
      }),

      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        progressBar: true,
        closeButton: true
      })
    )
  ]
};
