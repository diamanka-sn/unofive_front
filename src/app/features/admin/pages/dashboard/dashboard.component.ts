import { Component, OnInit } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';
import { UserService } from '@/app/core/services/user.service';
import { CountryService } from '@/app/core/services/country.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  userInfo: any = null;
  loading = true;

  stats = { users: 0, countries: 0 };

  modules = [
    {
      label: 'Importer des catastrophes',
      description: 'Charger un export Excel EM-DAT dans la base.',
      icon: 'warning_amber',
      link: '/admin/disasters'
    },
    {
      label: 'Importer les limites des pays',
      description: 'Charger un fichier GeoJSON de contours administratifs.',
      icon: 'public',
      link: '/admin/geo-data'
    },
    {
      label: 'Gérer les utilisateurs',
      description: 'Consulter et supprimer les comptes.',
      icon: 'group',
      link: '/admin/users'
    }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private countryService: CountryService
  ) {}

  ngOnInit(): void {
    this.userInfo = this.authService.getUserInfo();
    this.loadStats();
  }

  private loadStats(): void {
    forkJoin({
      users: this.userService.readAll('users'),
      countries: this.countryService.getCountries()
    }).subscribe({
      next: (res) => {
        this.stats.users = Array.isArray(res.users) ? res.users.length : 0;
        this.stats.countries = res.countries?.features?.length ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
