// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-guest-dashboard',
//   imports: [],
//   templateUrl: './guest-dashboard.html',
//   styleUrl: './guest-dashboard.css'
// })
// export class GuestDashboard {

// }

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './guest-dashboard.html',
  styleUrl: './guest-dashboard.css'
})
export class GuestDashboard implements OnInit {
  userName = 'Guest';
  userEmail = '';

  guestPhone = '—';
  guestCity = '—';

  stats = {
    totalScreens: 120,
    trendingCity: 'Pune',
    avgPricePerDay: '₹2,499',
    myEnquiries: 3
  };

  browseScreens = [
    { name: 'LED Screen - MG Road', city: 'Pune', size: '10x20', pricePerDay: '₹3,500', status: 'Open' },
    { name: 'Hoarding - Highway', city: 'Nashik', size: '20x10', pricePerDay: '₹2,000', status: 'Open' },
    { name: 'LED Screen - Mall', city: 'Mumbai', size: '12x24', pricePerDay: '₹4,500', status: 'Limited' },
  ];

  myRequests = [
    { screen: 'LED Screen - MG Road', date: '25 Nov 2024', status: 'Approved' },
    { screen: 'LED Van Booking', date: '12 Oct 2024', status: 'Pending' },
    { screen: 'Poster Printing', date: '10 Sep 2024', status: 'Rejected' },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.userName = localStorage.getItem('userName') || 'Guest';
      this.userEmail = localStorage.getItem('userEmail') || '';

      this.guestPhone = localStorage.getItem('guestPhone') || '—';
      this.guestCity = localStorage.getItem('guestCity') || '—';
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
    }
    // window.location.href = '/signin';
  }
}
