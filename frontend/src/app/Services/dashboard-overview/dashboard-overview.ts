// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';


// @Component({
//   selector: 'app-dashboard-overview',
//   imports: [CommonModule],
//   templateUrl: './dashboard-overview.html',
//   styleUrl: './dashboard-overview.css'
// })
// export class DashboardOverview implements OnInit {
//   constructor() { }
//   role: any;
//   ngOnInit(): void {
//     this.role = localStorage.getItem('role') ? localStorage.getItem('role') : '';
//   }

// }


// dashboard-overview.ts ✅ FIXED for SSR (localStorage safe)

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.css'
})
export class DashboardOverview implements OnInit {
  role: any = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('role') || '';
    } else {
      this.role = '';
    }
  }
}

