// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-agency-dashboard',
//   imports: [],
//   templateUrl: './agency-dashboard.html',
//   styleUrl: './agency-dashboard.css'
// })
// export class AgencyDashboard {

// }
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-agency-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agency-dashboard.html',
  styleUrl: './agency-dashboard.css'
})
export class AgencyDashboard implements OnInit {
  userName = 'Agency';
  userEmail = '';
  agencyName = 'Adon Agency';
  agencyCity = 'Pune';
  agencyPhone = '99999 99999';

  // demo stats
  stats = {
    totalScreens: 120,
    availableScreens: 45,
    activeBookings: 9,
    pendingPayments: '₹75K'
  };

  // demo tables
  availableScreens = [
    { name: 'LED Screen - MG Road', city: 'Pune', size: '10x20', pricePerDay: '₹3,500', status: 'Available' },
    { name: 'Hoarding - Highway', city: 'Nashik', size: '20x10', pricePerDay: '₹2,000', status: 'Available' },
    { name: 'LED Screen - Phoenix Mall', city: 'Mumbai', size: '12x24', pricePerDay: '₹4,500', status: 'Limited' },
  ];

  myBookings = [
    { campaign: 'Ganesh Festival Ads', screen: 'MG Road LED', status: 'Running', budget: '₹50,000' },
    { campaign: 'Diwali Hoardings', screen: 'Highway Board', status: 'Pending', budget: '₹80,000' },
    { campaign: 'LED Van Branding', screen: 'City Route', status: 'Closed', budget: '₹30,000' },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.userName = localStorage.getItem('userName') || 'Agency';
      this.userEmail = localStorage.getItem('userEmail') || '';
      // if you store these in user table later, load them from API; for now demo:
      this.agencyName = localStorage.getItem('agencyName') || 'Adon Agency';
      this.agencyCity = localStorage.getItem('agencyCity') || 'Pune';
      this.agencyPhone = localStorage.getItem('agencyPhone') || '99999 99999';
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
    }
    // navigate as per your app
    // window.location.href = '/signin';
  }
}
