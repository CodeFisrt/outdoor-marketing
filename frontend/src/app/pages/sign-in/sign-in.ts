import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Sign } from 'node:crypto';
import { Signupservice } from '../../ApiServices/signupservice';
import { ToastrModule, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, HttpClientModule, ToastrModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {

  signInForm: FormGroup;
  errorMessage: string = '';
  loading = false;
  role: any
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private signupservice: Signupservice,
    private toastr: ToastrService
  ) {
    this.signInForm = this.fb.group({
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(data: any) {
    if (data.invalid) {
      this.toastr.error("Please enter valid email & password");
      return;
    }
    
    const email = data.value.emailId;
    const password = data.value.password;

    // ✅ 1) try admin login first
    this.http.post<any>('http://localhost:8080/admin/login', {
      adminEmail: email,
      password: password
    }).subscribe({
      next: (res) => {
        // ✅ admin login success
        localStorage.setItem('adminToken', res.token);
        localStorage.setItem('token', res.token);

        localStorage.setItem('role', 'admin');
        localStorage.setItem('userName', res.admin.adminName);
        localStorage.setItem('userEmail', res.admin.adminEmail);

        this.toastr.success(`Admin Login Successful ✅ Welcome "${res.admin.adminName}"`);
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        // ✅ 2) if not admin, try user login
        this.http.post<any>('http://localhost:8080/Users/login', {
          emailId: email,
          password: password
        }).subscribe({
          next: (res2) => {
            // ✅ add your code here (only added)
            const user = res2.user;

            if (user) {
              this.toastr.success(`Login Successful!, Welcome Back "${user.userName}"`);

              // store auth info
              localStorage.setItem('token', 'loggedin'); // later replace with real token
              localStorage.setItem('userEmail', user.userEmail);
              localStorage.setItem('userName', user.userName);

              const role = (user.role || 'guest').toLowerCase();
              localStorage.setItem('role', role);

              // ✅ role wise redirect
              if (role === 'admin') {
                this.router.navigateByUrl('/dashboard/overview');
              } else if (role === 'agency') {
                this.router.navigateByUrl('/agency-dashboard');
              } else if (role === 'screenowner') {
                this.router.navigateByUrl('/screen-owner-dashboard');
              } else {
                this.router.navigateByUrl('/guest-dashboard');
              }

            } else {
              this.toastr.error("Invalid Email or Password");
            }
            // ✅ end your code

          },
          error: (err2) => {
            this.toastr.error(err2?.error?.message || "Invalid Email or Password");
          }
        });
      }
    });
  }

  togglePassword() {
  this.showPassword = !this.showPassword;
}

  openGmailLogin() {
    const googleAuthUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      "?client_id=544963429516-l4eaq3j4snbj6tbsbolhm2pncr3qdqu8.apps.googleusercontent.com" +
      "&redirect_uri=http://localhost:4200/auth/callback" +
      "&response_type=token" +
      "&scope=email%20profile";

    window.open(
      googleAuthUrl,
      "googleLogin",
      "width=500,height=600,left=200,top=100"
    );
  }

  loginWithFacebook() {
    const fbAuthUrl =
      'https://www.facebook.com/v18.0/dialog/oauth?' +
      'client_id=YOUR_FACEBOOK_APP_ID' +
      '&redirect_uri=http://localhost:4200/auth/callback' +
      '&scope=email,public_profile';

    window.open(fbAuthUrl, 'facebookLogin', 'width=500,height=600,left=200,top=100');
  };

  loginWithTwitter() {
    const twitterAuthUrl =
      'https://twitter.com/i/oauth2/authorize?' +
      'response_type=code' +
      '&client_id=YOUR_TWITTER_CLIENT_ID' +
      '&redirect_uri=http://localhost:4200/auth/callback' +
      '&scope=tweet.read users.read offline.access' +
      '&state=twitter-login' +
      '&code_challenge=challenge' +
      '&code_challenge_method=plain';

    window.open(twitterAuthUrl, 'twitterLogin', 'width=500,height=600');
  }
}
