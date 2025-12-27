import { Component, OnInit } from '@angular/core';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
// On importe transformExtent pour définir les limites de la zone
import { fromLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
 map!: OlMap;

  ngOnInit(): void {
    this.initMap();
  }

  initMap(): void {
    // 1. Définition de l'emprise (La zone rectangulaire de l'Afrique de l'Ouest)
    // Format: [MinLongitude, MinLatitude, MaxLongitude, MaxLatitude]
    // Ici : De l'Atlantique (Ouest) au Tchad (Est), du Golfe de Guinée (Sud) au Sahara (Nord)
    const westAfricaExtent = transformExtent(
      [-25, 4, 15, 27], // Coordonnées géographiques limites
      'EPSG:4326',      // Source (GPS)
      'EPSG:3857'       // Destination (Web Mercator de la carte)
    );

    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    this.map = new OlMap({
      target: 'map-container',
      layers: [
        osmLayer
      ],
      view: new View({
        // On centre approximativement sur le Burkina Faso (cœur de la région)
        center: fromLonLat([-4, 12]), 
        
        // Zoom adapté pour voir toute la région d'un coup
        zoom: 5, 
        
     
        
        
      }),
     controls: defaultControls()
    });
  }

}
