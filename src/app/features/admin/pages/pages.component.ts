import { AuthService } from '@/app/core/services/auth.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pages',
  standalone: false,
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss'
})
export class PagesComponent {
   isLoggedIn!: boolean;
    dropdownOpen = false;
    private unsubscribe$ = new Subject<void>();
    userInfo: any;
    mesinitial: any;
    navItems = [
      { label: 'Tableau de bord', icon: 'dashboard', link: '/admin', exact: true },
      { label: 'Catastrophes', icon: 'warning_amber', link: '/admin/disasters', exact: false },
      { label: 'Limites des pays', icon: 'public', link: '/admin/geo-data', exact: false },
      { label: 'Occupation du sol', icon: 'layers', link: '/admin/occsol', exact: false },
      { label: 'Utilisateurs', icon: 'group', link: '/admin/users', exact: false },
      { label: 'Paramètres', icon: 'settings', link: '/admin/settings', exact: false },
    ];
  constructor(private router: Router, private authService: AuthService) {}
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
