import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Sign } from 'node:crypto';
import { Signupservice } from '../../ApiServices/signupservice';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, HttpClientModule],
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
    private signupservice: Signupservice
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
          alert("Login Successful!");
          localStorage.setItem('role', user.role);
          this.router.navigateByUrl('/dashboard');
        }
      }
    });
  }
}
