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

  // onSubmit() {
  //   if (this.signInForm.invalid) {
  //     this.errorMessage = 'Please enter valid credentials.';
  //     return;
  //   }

  //   this.loading = true;
  //   const { emailId, password } = this.signInForm.value;


  //   this.http.get<{ token: string }>(
  //     `http://localhost:8080/Users`,
  //     {
  //       params: {
  //         emailId: emailId,
  //         password: password
  //       }
  //     }
  //   ).subscribe({
  //     next: (res: any) => {

  //       res.forEach((user: any) => {

  //       }




  //       this.router.navigateByUrl('/dashboard');
  //     },
  //     error: (err) => {
  //       this.errorMessage = err.error?.message || 'Login failed. Please try again.';
  //     },
  //     complete: () => {
  //       this.loading = false;
  //     }
  //   });
  // }

  onSubmit(data: any) {
    debugger
    this.signupservice.signIn().subscribe({
      next: (res: any) => {
        const user = res.find((u: any) => u.userEmail === data.value.emailId && u.password === data.value.password);
        if (user) {
          this.toastr.success(`Login Successful!, Welcome Back  "${user.userName}"`);
          localStorage.setItem('role', user.role);
          this.router.navigateByUrl('/dashboard');
        }
      }
    });
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
