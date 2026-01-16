import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) return true;

    const role = (localStorage.getItem('role') || '').toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());

    if (allowed.includes(role)) return true;

    router.navigate(['/dashboard/overview']); // redirect to overview
    return false;
  };
};
