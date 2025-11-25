import { Component } from '@angular/core';
import { Signupservice } from '../../ApiServices/signupservice';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {

user = {
  userName: '',
  userEmail: '',
  password: ''
};

constructor(private data: Signupservice) {}

register() {
  this.data.post(this.user).subscribe({
    next: (res) => {
      console.log("User registered:", res);
      alert("Signup Successful!");
    },
    error: (err) => {
      console.error("Signup error:", err);
      alert("Signup Failed!");
    }
  });
}


}
