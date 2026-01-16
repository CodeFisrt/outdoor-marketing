import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.css'
})
export class AuthCallback implements OnInit {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const fragment = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = fragment.get('access_token');

    if (accessToken) {

      // ✅ IMPORTANT: guard checks this key
      localStorage.setItem('token', accessToken);

      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => res.json())
        .then(user => {
          localStorage.setItem('userEmail', user.email);

          // ✅ now dashboard will open because token exists
          this.router.navigate(['/dashboard']);
        })
        .catch(() => {
          // if Google call fails, clear and go signin
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          this.router.navigate(['/signin']);
        });
    } else {
      this.router.navigate(['/signin']);
    }
  }
}
