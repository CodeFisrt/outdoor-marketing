import { Component } from '@angular/core';
import { RouterLink, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/header/header';
import { Footer } from '../../../shared/footer/footer';
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  userEmail: string | null = '';


  constructor(private router: Router) { }

  // logout() {
  //   localStorage.removeItem('token');
  //   this.userEmail = localStorage.getItem('userEmail');
  //   this.router.navigateByUrl('/signin');
  // }


  logout() {
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('role'); // if you have roles

    // Optional: clear everything
    // localStorage.clear();

    // Navigate after clearing storage
    this.router.navigate(['/signin']).then(() => {
      window.location.reload(); // 🔥 IMPORTANT if route guard is blocking
    });
  }

}
