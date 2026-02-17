// // import { Component } from '@angular/core';
// // import { RouterLink ,Router} from '@angular/router';

// // @Component({
// //   selector: 'app-header',
// //   imports: [RouterLink],
// //   templateUrl: './header.html',
// //   styleUrl: './header.css'
// // })
// // export class Header {
// //   constructor(private router:Router){}
// //   logout() {
// //     localStorage.clear();
// //     this.router.navigateByUrl('/signin');
// //   }
// // }


// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
// import { Router, RouterLink, NavigationEnd } from '@angular/router';
// import { filter } from 'rxjs/operators';

// @Component({
//   selector: 'app-header',
//   imports: [RouterLink, CommonModule],
//   templateUrl: './header.html',
//   styleUrl: './header.css'
// })
// export class Header implements OnInit {

//   isLoggedIn = false;
//   adminName = '';

//   constructor(
//     private router: Router,
//     @Inject(PLATFORM_ID) private platformId: any
//   ) {}

//   ngOnInit(): void {
//     // ✅ run only in browser
//     if (!isPlatformBrowser(this.platformId)) return;

//     this.loadUser();

//     this.router.events
//       .pipe(filter(event => event instanceof NavigationEnd))
//       .subscribe(() => this.loadUser());
//   }

// loadUser() {
//   if (!isPlatformBrowser(this.platformId)) return;

//   const token = localStorage.getItem('token');
//   const role = localStorage.getItem('role');

//   this.isLoggedIn = !!token;

//   if (!this.isLoggedIn) {
//     this.adminName = '';
//     return;
//   }

//   // ✅ show name based on role
//   if (role === 'admin') {
//     this.adminName =
//       localStorage.getItem('adminName') ||
//       localStorage.getItem('adminEmail') ||
//       'Admin';
//   } else {
//     this.adminName =
//       localStorage.getItem('userName') ||
//       localStorage.getItem('userEmail') ||
//       'User';
//   }
// }


//   logout() {
//     if (!isPlatformBrowser(this.platformId)) return;

//     localStorage.clear();
//     this.isLoggedIn = false;
//     this.adminName = '';
//     this.router.navigateByUrl('/home');
//   }
// }


import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, HostListener } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  isLoggedIn = false;
  adminName = '';
  showProfileMenu = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loadUser();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.loadUser());
  }

  loadUser() {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    this.isLoggedIn = !!token;

    if (!this.isLoggedIn) {
      this.adminName = '';
      return;
    }

    if (role === 'admin') {
      this.adminName =
        localStorage.getItem('adminName') ||
        localStorage.getItem('adminEmail') ||
        'Admin';
    } else {
      this.adminName =
        localStorage.getItem('userName') ||
        localStorage.getItem('userEmail') ||
        'User';
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  // close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const clickedInside = (event.target as HTMLElement)
      .closest('.profile-wrapper');

    if (!clickedInside) {
      this.showProfileMenu = false;
    }
  }

  goToDashboard() {
    if (!isPlatformBrowser(this.platformId)) return;

    const role = (localStorage.getItem('role') || 'guest').toLowerCase();

    if (role === 'admin') {
      this.router.navigateByUrl('/dashboard/overview');
    } else if (role === 'agency') {
      this.router.navigateByUrl('/agency-dashboard');
    } else if (role === 'screenowner') {
      this.router.navigateByUrl('/screen-owner-dashboard');
    } else {
      this.router.navigateByUrl('/guest-dashboard');
    }

    this.showProfileMenu = false;
  }

  goToWishlist() {
    this.router.navigateByUrl('/wishlist');
    this.showProfileMenu = false;
  }

  goToSettings() {
    this.router.navigateByUrl('/settings');
    this.showProfileMenu = false;
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.clear();
    this.isLoggedIn = false;
    this.adminName = '';
    this.showProfileMenu = false;
    this.router.navigateByUrl('/home');
  }
}
