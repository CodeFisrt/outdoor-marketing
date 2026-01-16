// import { Component } from '@angular/core';
// import { RouterLink ,Router} from '@angular/router';

// @Component({
//   selector: 'app-header',
//   imports: [RouterLink],
//   templateUrl: './header.html',
//   styleUrl: './header.css'
// })
// export class Header {
//   constructor(private router:Router){}
//   logout() {
//     localStorage.clear();
//     this.router.navigateByUrl('/signin');
//   }
// }


import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  isLoggedIn = false;
  adminName = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit(): void {
    // ✅ run only in browser
    if (!isPlatformBrowser(this.platformId)) return;

    this.loadUser();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.loadUser());
  }

  loadUser() {
    // ✅ run only in browser
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;

    this.adminName =
      localStorage.getItem('userName') ||
      localStorage.getItem('userEmail') ||
      'Admin';
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.clear();
    this.isLoggedIn = false;
    this.adminName = '';
    this.router.navigateByUrl('home');
  }
}
