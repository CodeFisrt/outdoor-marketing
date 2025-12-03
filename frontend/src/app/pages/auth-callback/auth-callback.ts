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
    // 🛑 This ensures code runs ONLY in browser, NOT in SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Safe to use window here
    const fragment = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = fragment.get('access_token');

    if (accessToken) {
       // 2. Get user email from Google API
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => res.json())
        .then(user => {
            
           // user.email → contains Google account email
          localStorage.setItem('userEmail', user.email);

          // redirect to dashboard
          this.router.navigate(['/dashboard']);
        });
    }
  }

}
