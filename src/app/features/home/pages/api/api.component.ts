import { Component } from '@angular/core';

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  id: string;
  path: string;
  title: string;
  description: string;
  params?: Param[];
  example: string;
  response: string;
}

interface DocSection {
  id: string;
  title: string;
  intro: string;
  endpoints: Endpoint[];
}

type Lang = 'curl' | 'js' | 'python';

@Component({
  selector: 'app-api',
  standalone: false,
  templateUrl: './api.component.html',
  styleUrl: './api.component.scss'
})
export class ApiComponent {
  baseUrl = 'http://localhost:3000/api/v1';

  lang: Lang = 'curl';
  langs: { id: Lang; label: string }[] = [
    { id: 'curl', label: 'curl' },
    { id: 'js', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
  ];

  firstCall: Record<Lang, string> = {
    curl: `curl "${this.baseUrl}/disasters?iso=SEN&year=2020" \\
  -H "X-API-Key: VOTRE_CLE"`,
    js: `const res = await fetch("${this.baseUrl}/disasters?iso=SEN&year=2020", {
  headers: { "X-API-Key": "VOTRE_CLE" }
});
const { data, total } = await res.json();
console.log(total, "catastrophes trouvées");`,
    python: `import requests

res = requests.get(
    "${this.baseUrl}/disasters",
    params={"iso": "SEN", "year": 2020},
    headers={"X-API-Key": "VOTRE_CLE"},
)
res.raise_for_status()
print(res.json()["total"], "catastrophes trouvées")`,
  };

  sections: DocSection[] = [
    {
      id: 'catastrophes',
      title: 'Catastrophes',
      intro: 'Données issues de la base EM-DAT (2000-2026) : catastrophes naturelles (inondations, sécheresses, épidémies…) et technologiques (accidents industriels, de transport…). Chaque catastrophe est rattachée à un pays.',
      endpoints: [
        {
          id: 'liste',
          path: '/disasters',
          title: 'Liste des catastrophes',
          description: 'Renvoie les catastrophes une par une, avec tous leurs chiffres. Les résultats sont découpés en pages : utilisez page pour avancer. Le champ total indique le nombre de résultats au total.',
          params: [
            { name: 'year', type: 'nombre', required: false, description: 'Année de début (ex. 2020)' },
            { name: 'iso', type: 'texte', required: false, description: 'Code pays à 3 lettres (ex. SEN, NGA)' },
            { name: 'type', type: 'texte', required: false, description: 'Type de catastrophe en anglais (ex. Flood, Drought, Epidemic, Road)' },
            { name: 'page', type: 'nombre', required: false, description: 'Numéro de page. Par défaut : 1' },
            { name: 'limit', type: 'nombre', required: false, description: 'Résultats par page, de 1 à 500. Par défaut : 100' },
          ],
          example: `GET /api/v1/disasters?iso=SEN&type=Flood&page=1&limit=1`,
          response: `{
  "data": [
    {
      "disno": "2002-0026-SEN",
      "year": 2002,
      "iso": "SEN",
      "country": "Senegal",
      "fid": 6,
      "group": "Natural",
      "subgroup": "Hydrological",
      "disaster_type": "Flood",
      "disaster_subtype": "Riverine flood",
      "start_date": "2002-01-09",
      "end_date": "2002-01-12",
      "deaths": 28,
      "injured": 0,
      "affected": 179000,
      "homeless": 0,
      "total_affected": 179000,
      "damage_usd": "40979.00",
      "cpi": "57.3418402"
    }
  ],
  "total": 16,
  "page": 1,
  "limit": 1
}`,
        },
        {
          id: 'stats',
          path: '/disasters/stats',
          title: 'Bilan par pays pour une année',
          description: 'Renvoie tous les pays avec leur contour et le bilan de l\'année choisie : nombre d\'événements, de décès et de personnes touchées. Le résultat est au format GeoJSON : vous pouvez l\'ouvrir dans QGIS ou l\'afficher sur une carte Leaflet ou OpenLayers.',
          params: [
            { name: 'year', type: 'nombre', required: false, description: 'Année voulue. Par défaut : 2024' },
            { name: 'type', type: 'texte', required: false, description: 'Type de catastrophe (ex. Flood). Sans ce paramètre : tous les types' },
          ],
          example: `GET /api/v1/disasters/stats?year=2020&type=Flood`,
          response: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 6,
      "geometry": { "type": "MultiPolygon", "coordinates": [ … ] },
      "properties": {
        "fid": 6,
        "name": "Senegal",
        "iso": "SEN",
        "event_count": 2,
        "total_deaths": 14,
        "total_affected": 31500
      }
    }
  ]
}`,
        },
        {
          id: 'details',
          path: '/disasters/details',
          title: 'Fiche détaillée d\'un pays',
          description: 'Renvoie le bilan complet d\'un pays sur toute la période : chiffres clés, personnes touchées par sous-groupe de catastrophe, et évolution année par année.',
          params: [
            { name: 'fid', type: 'nombre', required: true, description: 'Identifiant du pays (voir la liste des pays)' },
          ],
          example: `GET /api/v1/disasters/details?fid=6`,
          response: `{
  "overview": {
    "total_events": 84,
    "total_deaths": 312,
    "total_damage": 1250000,
    "avg_cpi": 78.4,
    "max_intensity": 260000,
    "dominant_type": "Flood",
    "annual_frequency": "3.36",
    "avg_duration": "12.5"
  },
  "vulnerability": {
    "total_injured": 950,
    "total_homeless": 4500,
    "total_affected": 125000,
    "subgroups": [ { "subgroup": "Hydrological", "count": "51" } ]
  },
  "chart_data": [
    { "year": 2024, "annual_damage": "54000", "annual_cpi": "100", "annual_deaths": "12" }
  ]
}`,
        },
      ],
    },
    {
      id: 'pays',
      title: 'Pays',
      intro: 'Contours des pays (système de coordonnées WGS 84, EPSG:4326).',
      endpoints: [
        {
          id: 'countries',
          path: '/countries',
          title: 'Liste des pays',
          description: 'Renvoie tous les pays avec leur contour, au format GeoJSON. C\'est ici que vous trouvez le fid de chaque pays.',
          example: `GET /api/v1/countries`,
          response: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Senegal", "adm0Code": "SEN", "fid": 6 },
      "geometry": { "type": "MultiPolygon", "coordinates": [ … ] }
    }
  ]
}`,
        },
        {
          id: 'country',
          path: '/countries/:fid',
          title: 'Un pays',
          description: 'Renvoie le nom et le code d\'un pays à partir de son fid.',
          example: `GET /api/v1/countries/6`,
          response: `{
  "type": "Feature",
  "properties": { "name": "Senegal", "adm0Code": "SEN", "fid": 6 }
}`,
        },
      ],
    },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
