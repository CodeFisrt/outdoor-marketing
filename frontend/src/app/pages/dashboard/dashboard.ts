import { Component } from '@angular/core';
import { RouterLink, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, CommonModule,RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
 constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/signin');
  }
  
}
