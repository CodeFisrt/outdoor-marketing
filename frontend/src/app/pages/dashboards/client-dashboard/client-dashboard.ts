import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css'
})
export class ClientDashboard implements OnInit {
  userName: string = 'Client';
  role: string = '';

  stats = [
    { label: 'Active Campaigns', value: '12', icon: 'bi-megaphone', color: 'text-primary' },
    { label: 'Total Bookings', value: '48', icon: 'bi-calendar-check', color: 'text-success' },
    { label: 'Wallet Balance', value: '₹1,25,000', icon: 'bi-wallet2', color: 'text-info' },
    { label: 'Reach Estimate', value: '2.5M+', icon: 'bi-people', color: 'text-warning' }
  ];

  recentBookings = [
    { id: 'BK-1001', service: 'Digital Screen', location: 'MG Road, Pune', status: 'Active', price: '₹15,000' },
    { id: 'BK-1002', service: 'Hoarding', location: 'Hinjewadi Ph 1', status: 'Pending', price: '₹45,000' },
    { id: 'BK-1003', service: 'Vehicle Ad', location: 'City Center', status: 'Completed', price: '₹8,000' },
    { id: 'BK-1004', service: 'Digital Screen', location: 'Kothrud Metro', status: 'Active', price: '₹12,000' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        this.userName = userEmail.split('@')[0];
      }
      this.role = localStorage.getItem('role') || 'user';
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('role');
      this.router.navigate(['/signin']).then(() => {
        window.location.reload();
      });
    }
  }
}
