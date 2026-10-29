import { Component } from '@angular/core';

@Component({
  selector: 'app-accessibilite',
  standalone: false,
  templateUrl: './accessibilite.component.html',
})
export class AccessibiliteComponent {
  declarationDate = '28 octobre 2026';

  // Défauts connus (vérification interne, pas d'audit RGAA externe à ce jour) ; la section n'apparaît que si la liste n'est pas vide
  nonConformities: string[] = [];

  toc = [
    { id: 'etat', label: 'État de conformité' },
    ...(this.nonConformities.length ? [{ id: 'non-conformites', label: 'Contenus non accessibles' }] : []),
    { id: 'exemptions', label: 'Contenus non soumis' },
    { id: 'alternatives', label: 'Alternatives accessibles' },
    { id: 'etablissement', label: 'Établissement de la déclaration' },
    { id: 'pages', label: 'Pages concernées' },
    { id: 'contact', label: 'Retour d\'information' },
  ];

  pages = [
    { label: 'Accueil', route: '/' },
    { label: 'Carte interactive', route: '/map' },
    { label: 'Documentation de l\'API', route: '/api' },
    { label: 'Connexion', route: '/login' },
    { label: 'Création de compte', route: '/register' },
    { label: 'Mon profil', route: '/profil' },
    { label: 'Confidentialité', route: '/confidentialite' },
    { label: 'Accessibilité', route: '/accessibilite' },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
