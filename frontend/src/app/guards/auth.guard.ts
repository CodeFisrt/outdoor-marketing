import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // ✅ SSR: no localStorage on server
  if (!isPlatformBrowser(platformId)) {
    return true; // allow server render, browser guard will run after hydration
  }

  const token = localStorage.getItem('token');

  if (token) return true;

  router.navigate(['/signin']);
  return false;
};
