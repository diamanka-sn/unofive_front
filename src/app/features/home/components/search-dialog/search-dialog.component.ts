import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CountryService } from '@/app/core/services/country.service';
import { AuthService } from '@/app/core/services/auth.service';
import { countryNameFr } from '@/app/core/constants/country-names';

interface SearchItem {
  kind: 'country' | 'page';
  label: string;
  hint: string;
  icon: string;
  route: string;
  queryParams?: { [key: string]: any };
  // Texte comparé à la saisie (sans accents, minuscules)
  haystack: string;
}

// « Côte d'Ivoire » et « cote d ivoire » doivent correspondre
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

@Component({
  selector: 'app-search-dialog',
  standalone: false,
  templateUrl: './search-dialog.component.html',
})
export class SearchDialogComponent implements OnInit {
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;

  query = '';
  loadingCountries = true;
  activeIndex = 0;

  private pages: SearchItem[] = [];
  private countries: SearchItem[] = [];
  results: { title: string; items: SearchItem[] }[] = [];
  private flat: SearchItem[] = [];

  constructor(
    private dialogRef: MatDialogRef<SearchDialogComponent>,
    private router: Router,
    private countryService: CountryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const page = (label: string, hint: string, icon: string, route: string, extra = ''): SearchItem =>
      ({ kind: 'page', label, hint, icon, route, haystack: normalize(`${label} ${hint} ${extra}`) });

    this.pages = [
      page('Carte interactive', 'Catastrophes par pays et par année', 'map', '/map', 'carte map deces'),
      page('Documentation de l\'API', 'Utiliser nos données dans votre code', 'code', '/api', 'api cle developpeur docs'),
      ...(this.authService.isLoggedIn()
        ? []
        : [page('Connexion', 'Se connecter ou créer un compte', 'login', '/login', 'connexion inscription compte')]),
      page('Accueil', 'Présentation de la plateforme', 'home', '/', 'accueil'),
    ];
    this.refresh();

    this.countryService.listCountries().subscribe((list) => {
      this.countries = list.map((c) => {
        const label = countryNameFr(c.name);
        return {
          kind: 'country' as const,
          label,
          hint: c.adm0Code,
          icon: 'location_on',
          route: '/map',
          queryParams: { pays: c.fid },
          haystack: normalize(`${label} ${c.name} ${c.adm0Code}`),
        };
      }).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
      this.loadingCountries = false;
      this.refresh();
    });
  }

  refresh(): void {
    const q = normalize(this.query);
    // Les résultats qui commencent par la saisie passent devant ceux qui la contiennent
    const match = (items: SearchItem[]) =>
      !q ? items : items
        .filter((i) => i.haystack.includes(q))
        .sort((a, b) => Number(!normalize(a.label).startsWith(q)) - Number(!normalize(b.label).startsWith(q)));

    const countries = q ? match(this.countries).slice(0, 8) : [];
    const pages = match(this.pages);

    this.results = [
      { title: 'Pays', items: countries },
      { title: 'Pages', items: pages },
    ].filter((g) => g.items.length);
    this.flat = this.results.flatMap((g) => g.items);
    this.activeIndex = 0;
  }

  indexOf(item: SearchItem): number {
    return this.flat.indexOf(item);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.flat.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex = (this.activeIndex + step + this.flat.length) % this.flat.length;
      document.getElementById(`search-item-${this.activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.flat[this.activeIndex];
      if (item) this.select(item);
    }
  }

  select(item: SearchItem): void {
    this.dialogRef.close();
    this.router.navigate([item.route], { queryParams: item.queryParams });
  }
}
