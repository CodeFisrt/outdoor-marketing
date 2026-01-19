import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) return true;

    // ✅ 1) Token must exist (otherwise block direct URL access)
    const token = localStorage.getItem('token');
    if (!token) {
      router.navigate(['/signin']);
      return false;
    }

    // ✅ 2) Role check (default guest)
    const role = (localStorage.getItem('role') || 'guest').toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());

    // ✅ allowed role => allow route
    if (allowed.includes(role)) return true;

    // ✅ 3) Not allowed => redirect user to their own dashboard
    if (role === 'admin') {
      router.navigate(['/dashboard/overview']);
      return false;
    }

    if (role === 'agency') {
      router.navigate(['/agency-dashboard']);
      return false;
    }

    if (role === 'screenowner') {
      router.navigate(['/screen-owner-dashboard']);
      return false;
    }

    // guest or unknown role
    router.navigate(['/guest-dashboard']);
    return false;
  };
};
