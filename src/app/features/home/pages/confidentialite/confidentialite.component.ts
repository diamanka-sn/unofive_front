import { Component } from '@angular/core';

@Component({
  selector: 'app-confidentialite',
  standalone: false,
  templateUrl: './confidentialite.component.html',
  styleUrl: './confidentialite.component.scss'
})
export class ConfidentialiteComponent {
  lastUpdate = '28 octobre 2026';

  toc = [
    { id: 'donnees', label: 'Données collectées' },
    { id: 'usage', label: 'Utilisation' },
    { id: 'stockage', label: 'Stockage et sécurité' },
    { id: 'navigateur', label: 'Cookies et stockage local' },
    { id: 'tiers', label: 'Services tiers' },
    { id: 'conservation', label: 'Durée de conservation' },
    { id: 'droits', label: 'Vos droits' },
    { id: 'contact', label: 'Contact' },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
