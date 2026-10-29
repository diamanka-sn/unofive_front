import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SearchDialogComponent } from '../components/search-dialog/search-dialog.component';
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
  navLinks = [
    { route: '/', label: 'Accueil', icon: 'home' },
    { route: '/map', label: 'Carte', icon: 'map' },
    { route: '/senegal', label: 'Sénégal', icon: 'layers' },
    { route: '/api', label: 'Documentation API', icon: 'code' },
  ];

  constructor(private router: Router, private authService: AuthService, private dialog: MatDialog) {}

  // Lien « Aller au contenu » : déplace le focus sur <main> sans changer d'URL
  // (un simple href="#contenu" renverrait vers l'accueil à cause de <base href="/">)
  skipToContent(event: Event) {
    event.preventDefault();
    const main = document.getElementById('contenu');
    main?.focus();
    main?.scrollIntoView();
  }

  openSearch() {
    if (this.dialog.getDialogById('search')) return;
    this.dialog.open(SearchDialogComponent, {
      id: 'search',
      width: '560px',
      maxWidth: '92vw',
      position: { top: '12vh' },
    });
  }

  // Ctrl+K (ou Cmd+K sur Mac) ouvre la recherche depuis n'importe quelle page
  @HostListener('document:keydown', ['$event'])
  onShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

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
