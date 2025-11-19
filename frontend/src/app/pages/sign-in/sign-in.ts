import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.signInForm = this.fb.group({
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.signInForm.invalid) {
      this.errorMessage = 'Please enter valid credentials.';
      return;
    }

    this.loading = true;
    const { emailId, password } = this.signInForm.value;

    this.http.post<{ token: string }>('http://localhost:8080/Users/login', {
      emailId,
      password
    }).subscribe({
      next: (res) => {
        // ✅ store token in localStorage
        localStorage.setItem('token', res.token);
        console.log(res.token);

        // ✅ redirect
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
