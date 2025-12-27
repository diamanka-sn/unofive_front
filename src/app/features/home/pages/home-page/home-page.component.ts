import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: false,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent  {
 risks = [
    { id: 'Flood', label: 'Inondations', icon: 'water_drop', color: '#3498db' },
    { id: 'Drought', label: 'Sécheresse', icon: 'wb_sunny', color: '#f1c40f' },
    { id: 'Storm', label: 'Tempêtes', icon: 'air', color: '#9b59b6' },
    {
      id: 'Epidemic',
      label: 'Épidémies',
      icon: 'medical_services',
      color: '#e74c3c',
    },
    {
      id: 'Wildfire',
      label: 'Feux de forêt',
      icon: 'local_fire_department',
      color: '#e67e22',
    },
    {
      id: 'Extreme temperature',
      label: 'Températures extrêmes',
      icon: 'thermostat',
      color: '#d35400',
    },
    {
      id: 'Infestation',
      label: 'Infestations',
      icon: 'bug_report',
      color: '#27ae60',
    },
    {
      id: 'Mass movement (wet)',
      label: 'Glissements de terrain (humide)',
      icon: 'terrain',
      color: '#7f8c8d',
    },
    {
      id: 'Animal incident',
      label: 'Incidents animaliers',
      icon: 'pets',
      color: '#8e44ad',
    },
  ];

}