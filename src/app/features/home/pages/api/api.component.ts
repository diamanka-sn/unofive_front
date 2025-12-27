import { Component } from '@angular/core';

@Component({
  selector: 'app-api',
  standalone: false,
  templateUrl: './api.component.html',
  styleUrl: './api.component.scss'
})
export class ApiComponent {
menu:any = {
    'Auth': ['POST /users/login', 'POST /users/register'],
    'Disasters': ['GET /disasters/stats', 'POST /disasters/import', 'GET /disasters/details'],
    'Countries': ['GET /countries', 'GET /countries/:id', 'POST /countries/upload']
  };

  jsonExample = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {
        name: "Flood",
        event_count: 12,
        total_deaths: 45,
        total_affected: 1200
      },
      geometry: { type: "Polygon", coordinates: [0, 0] }
    }]
  };
stat = {
  overview: {
    "total_events": 84,
    "total_damage": 1250000,
    "dominant_type": "Flood"
  },
  vulnerability: {
    "total_homeless": 4500,
    "total_affected": 125000
  },
  chart_data: [
    { "year": 2024, "annual_damage": 54000 }
  ]
}
  loginResponse = {
    status: "success",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: "usr_88291",
      isAdmin: "True",
      lastLogin: "2025-12-26T20:15:00Z"
    }
  };

  userProfile = {
    id: "usr_88291",
    preferences: {
      default_country: "Senegal",
      notifications: true,
      map_theme: "dark",
      risk_alerts: ["Flood", "Drought"]
    },
    saved_locations: [
      { name: "Flood", year: 2023},
      { name: "Drought", year: 2024}

    ],
    organization: "UNOFIVE Research"
  };
}
