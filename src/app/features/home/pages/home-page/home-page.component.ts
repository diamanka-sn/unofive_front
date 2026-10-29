import { Component, OnInit } from '@angular/core';
import { CountryService } from '@/app/core/services/country.service';
import { ALL_DISASTER_TYPES } from '@/app/core/constants/disaster-labels';

@Component({
  selector: 'app-home-page',
  standalone: false,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  // Chiffres clés lus dans la base, pour rester justes après chaque import
  summary: { events: number; deaths: number; countries: number; firstYear: number; lastYear: number } | null = null;

  constructor(private countryService: CountryService) {}

  ngOnInit(): void {
    this.countryService.getSummary().subscribe((s) => (this.summary = s));
  }

  get yearsCount(): number {
    return this.summary ? this.summary.lastYear - this.summary.firstYear + 1 : 0;
  }

  // Les 9 risques mis en avant sur l'accueil (libellés et icônes de la liste partagée ; la carte propose tous les types)
  private readonly HOME_RISKS = [
    'Flood', 'Drought', 'Storm', 'Epidemic', 'Wildfire',
    'Extreme temperature', 'Infestation', 'Mass movement (wet)', 'Animal incident',
  ];
  riskTypes = this.HOME_RISKS
    .map((id) => ALL_DISASTER_TYPES.find((t) => t.id === id))
    .filter((t) => !!t);

}