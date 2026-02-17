import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    const role = (localStorage.getItem('role') || '').toLowerCase();
    const expectedRoles = route.data['expectedRoles'] as Array<string>;

    if (role && expectedRoles && expectedRoles.map(r => r.toLowerCase()).includes(role)) {
        return true;
    }

    // If not authorized, redirect to appropriate dashboard or sign-in
    if (!role) {
        router.navigate(['/signin']);
    } else {
        // Redirect based on current role if trying to access unauthorized route
        switch (role) {
            case 'admin':
                router.navigate(['/dashboard/overview']);
                break;
            case 'agency':
                router.navigate(['/agency-dashboard']);
                break;
            case 'mbu':
                router.navigate(['/screen-owner-dashboard']);
                break;
            case 'client':
                router.navigate(['/client-dashboard']);
                break;
            default:
                router.navigate(['/guest-dashboard']);
        }
    }

    return false;
};
