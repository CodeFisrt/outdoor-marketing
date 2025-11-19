import { Component } from '@angular/core';
import { RouterLink ,Router} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  constructor(private router:Router){}
  logout() {
    localStorage.clear();
    this.router.navigateByUrl('/signin');
  }
}
