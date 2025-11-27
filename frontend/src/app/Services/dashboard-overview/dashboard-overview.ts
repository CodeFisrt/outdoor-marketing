import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-dashboard-overview',
  imports: [CommonModule],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.css'
})
export class DashboardOverview implements OnInit {
  constructor() { }
  role: any;
  ngOnInit(): void {
    this.role = localStorage.getItem('role') ? localStorage.getItem('role') : '';
  }

}


