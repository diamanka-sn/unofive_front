import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-pages',
  standalone: false,
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss',
})
export class PagesComponent {
  isLoggedIn!: boolean;
  dropdownOpen = false;
  private unsubscribe$ = new Subject<void>();
  userInfo: any;
  mesinitial: any;
  constructor(private router: Router, private authService: AuthService) {}
  register() {
    this.router.navigate(['login']);
  }

  ngOnInit(): void {
    this.authService.authState$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((loggedIn: boolean) => {
        this.isLoggedIn = loggedIn;
      });

    this.authService.userInfo$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((userInfo: { isAdmin: any }) => {
        this.userInfo = userInfo;
        this.mesinitial = this.userInfo?.nom
          .split(' ') 
          .map((n: string) => n[0]) 
          .join('') 
          .toUpperCase();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
