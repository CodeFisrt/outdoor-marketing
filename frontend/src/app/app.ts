import { Component, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, NgIf],

  // imports: [RouterOutlet],
  templateUrl: './app.html',

})
export class App {
  protected readonly title = signal('frontend');

  // // 👇 signal to control layout visibility
  // showLayout = signal(true);

  // constructor(private router: Router) {
  //   this.router.events
  //     .pipe(filter((event) => event instanceof NavigationEnd))
  //     .subscribe((event: any) => {
  //       // Hide header/footer for signin & signup
  //       this.showLayout.set(!(event.url === '/signin' || event.url === '/signup'));
  //     });
  // }



  showLayout = signal(true);   // controls header
  showFooter = signal(true);   // controls footer

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {

        const url = event.urlAfterRedirects;

        // Hide full layout for signin & signup
        const hideLayout = url === '/signin' || url === '/signup';
        this.showLayout.set(!hideLayout);

        // Hide ONLY footer for inventory-map
        if (url === '/inventory-map') {
          this.showFooter.set(false);
        } else {
          this.showFooter.set(!hideLayout);
        }
      });
  }
}
