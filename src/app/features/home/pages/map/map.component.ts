import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet'; // Import Leaflet
import Map from 'ol/Map';     // Import OpenLayers
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import ScaleLine from 'ol/control/ScaleLine';


@Component({
  selector: 'app-map',
  standalone: false,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnDestroy {
  sidebarVisible: boolean = false;
  engine: 'leaflet' | 'openlayers' = 'leaflet';
  currentBasemap: string = 'osm';
  activeSection: string = 'tools';
  // Instances
  leafletMap: L.Map | null = null;
  olMap: Map | null = null;

  basemaps = [
    { id: 'osm', label: 'Rues', img: '/map-osm.png' },
    { id: 'sat', label: 'Satellite', img: '/map-sat.png' }
  ];

  thematicLayers = [
    { id: 'risques', name: 'Zones de Risques', active: true },
    { id: 'Agricultures', name: 'Agriculture', active: false }
  ];

  ngOnInit() {
    this.initMap();
  }
// toggleSection(section: string) {
//     this.activeSection = this.activeSection === section ? '' : section;
//   }
//   toggleMeasure() {
//     // Logique pour activer/désactiver l'outil de mesure
//   }
  initMap() {
    this.cleanup();

    if (this.engine === 'leaflet') {
      this.initLeaflet();
    } else {
      this.initOpenLayers();
    }
  }

  private initLeaflet() {
    this.leafletMap = L.map('map').setView([12.37, -1.53], 5);
    this.updateLeafletBasemap();
    L.control.scale({
    imperial: false,
    metric: true,
    position: 'bottomleft' 
  }).addTo(this.leafletMap);
  }

  private updateLeafletBasemap() {
    if (!this.leafletMap) return;
    this.leafletMap.eachLayer(l => this.leafletMap?.removeLayer(l));
    
    const url = this.currentBasemap === 'osm' 
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    
    L.tileLayer(url).addTo(this.leafletMap);
  }

  // --- LOGIQUE OPENLAYERS ---
  private initOpenLayers() {
    const url = this.currentBasemap === 'osm' 
      ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    this.olMap = new Map({
      target: 'map',
      layers: [ new TileLayer({ source: new XYZ({ url: url }) }) ],
      view: new View({ center: fromLonLat([-14.45, 14.49]), zoom: 5 }),
      controls: [
      new ScaleLine({
        units: 'metric', 
        bar: true,       
        steps: 4,
        text: true,
        minWidth: 140
      })
    ]
    });
  }

  switchEngine(type: 'leaflet' | 'openlayers') {
    this.engine = type;
    this.initMap();
  }

  setBasemap(id: string) {
    this.currentBasemap = id;
    this.initMap(); 
  }

  updateLayers() {
    // Logique pour ajouter/supprimer les GeoJSON de risques
  }

  cleanup() {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
    const mapElement = document.getElementById('map');
    if (mapElement) mapElement.innerHTML = ''; 
    this.olMap = null;
  }

  ngOnDestroy() {
    this.cleanup();
  }

}
