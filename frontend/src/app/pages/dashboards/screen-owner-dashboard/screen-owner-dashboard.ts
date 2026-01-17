// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-screen-owner-dashboard',
//   imports: [],
//   templateUrl: './screen-owner-dashboard.html',
//   styleUrl: './screen-owner-dashboard.css'
// })
// export class ScreenOwnerDashboard {

// }

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-screen-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './screen-owner-dashboard.html',
  styleUrl: './screen-owner-dashboard.css'
})
export class ScreenOwnerDashboard implements OnInit {
  userName = 'Screen Owner';
  userEmail = '';

  ownerCompanyName = 'Owner Media Pvt Ltd';
  ownerCity = 'Pune';
  ownerPhone = '88888 88888';
  ownerAddress = 'MG Road, Pune';

  stats = {
    myScreens: 18,
    availableToday: 11,
    activeBookings: 27,
    payoutPending: '₹22K'
  };

  myScreensList = [
    { name: 'LED - Pune Station', city: 'Pune', status: 'Available', slots: '18 slots' },
    { name: 'Hoarding - Highway', city: 'Nashik', status: 'Maintenance', slots: '—' },
    { name: 'LED - Mall', city: 'Mumbai', status: 'Booked', slots: 'Full' },
  ];

  recentBookings = [
    { screen: 'LED - Pune Station', agency: 'Agency A', status: 'Confirmed', amount: '₹18,000' },
    { screen: 'Hoarding - Highway', agency: 'Local Shop', status: 'Pending', amount: '₹9,000' },
    { screen: 'LED - Mall', agency: 'Brand X', status: 'Cancelled', amount: '₹0' },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.userName = localStorage.getItem('userName') || 'Screen Owner';
      this.userEmail = localStorage.getItem('userEmail') || '';

      this.ownerCompanyName = localStorage.getItem('ownerCompanyName') || 'Owner Media Pvt Ltd';
      this.ownerPhone = localStorage.getItem('ownerPhone') || '88888 88888';
      this.ownerCity = localStorage.getItem('ownerCity') || 'Pune';
      this.ownerAddress = localStorage.getItem('ownerAddress') || 'MG Road, Pune';
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
