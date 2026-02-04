import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  ViewChild, ElementRef,
} from '@angular/core';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import ScaleLine from 'ol/control/ScaleLine';
import { Style, Fill, Stroke } from 'ol/style';
import { CountryService } from '@/app/core/services/country.service';
import Feature from 'ol/Feature';
import { MatDialog } from '@angular/material/dialog';
import { PrintDialogComponent } from '../../components/print-dialog/print-dialog.component';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-carte',
  standalone: false,
  templateUrl: './carte.component.html',
  styleUrl: './carte.component.scss',
})
export class CarteComponent implements OnInit, AfterViewInit, OnDestroy {
  sidebarVisible: boolean = false;
  statsVisible: boolean = false;
  currentBasemap: string = 'osm';
  activeSection: string = 'tools';
  searchTerm: string = '';
  selectedCountry: any = null;
  isPrinting = false;
  reportTitle = '';
  reportDescription = '';
  today = new Date();
  private hoveredFeature: any = null;
  olMap: Map | null = null;
  countryLayer: VectorLayer<VectorSource> | null = null;
  selectedCountryStats: any = null;
  loadingStats: boolean = false;
  basemaps = [
    { id: 'osm', label: 'Rues', img: '/map-osm.png' },
    { id: 'sat', label: 'Satellite', img: '/map-sat.png' },
  ];

  thematicLayers = [
    { id: 'risques', name: 'Zones de Risques', active: true },
    { id: 'countries', name: 'Pays Africains', active: true },
  ];

  years = [
    2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
    2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002,
    2001, 2000,
  ];
  disasterTypes = [
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

  @ViewChild('statsChart') statsChart!: ElementRef;
  private chartInstance: Chart | null = null;
  public legendItems = [
    { color: '#800026', label: '> 1000' },
    { color: '#BD0026', label: '501 - 1000' },
    { color: '#E31A1C', label: '201 - 500' },
    { color: '#FC4E2A', label: '101 - 200' },
    { color: '#FD8D3C', label: '51 - 100' },
    { color: '#FEB24C', label: '11 - 50' },
    { color: '#FED976', label: '1 - 10' },
  ];
  selectedYear: number = 2024;
  selectedDisaster: string = 'Flood';

  constructor(
    private countryService: CountryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  applyFilters() {
    this.countryService
      .getStats(this.selectedYear, this.selectedDisaster)
      .subscribe((geoJsonData) => {
        if (geoJsonData && this.countryLayer) {
          const source = this.countryLayer.getSource();
          if (!source) return;

          source.clear();

          const features = new GeoJSON().readFeatures(geoJsonData, {
            featureProjection: 'EPSG:3857',
          });

          source.addFeatures(features);

          this.countryLayer.setStyle(this.getCountryStyle);
          console.log(
            `Données chargées pour ${this.selectedYear}:`,
            features.length,
            'pays.'
          );
        }
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 50);
  }

  initMap() {
    this.cleanup();
    this.initOpenLayers();
  }

  private initOpenLayers() {
    const url =
      this.currentBasemap === 'osm'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    this.countryLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: 'rgba(251, 191, 36, 0.2)' }),
        stroke: new Stroke({ color: '#fbbf24', width: 2 }),
      }),
    });

    this.olMap = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new XYZ({ url: url }) }),
        this.countryLayer,
      ],
      view: new View({
        center: fromLonLat([-14.45, 14.49]),
        zoom: 4,
      }),
      controls: [new ScaleLine({ units: 'metric', bar: true, minWidth: 100 })],
    });
    const highlightStyle = new Style({
      fill: new Fill({ color: 'rgba(251, 191, 36, 0.5)' }),
      stroke: new Stroke({ color: '#fbbf24', width: 3 }),
    });
    this.olMap.on('pointermove', (event) => {
      if (event.dragging) return;

      const pixel = this.olMap?.getEventPixel(event.originalEvent);

      const feature = pixel
        ? (this.olMap?.forEachFeatureAtPixel(pixel, (f) => f) as Feature)
        : null;

      if (feature !== this.hoveredFeature) {
        if (this.hoveredFeature) {
          this.hoveredFeature.setStyle(
            this.getCountryStyle(this.hoveredFeature)
          );
        }

        if (feature) {
          feature.setStyle(highlightStyle);
          this.olMap!.getTargetElement().style.cursor = 'pointer';
        } else {
          this.olMap!.getTargetElement().style.cursor = '';
        }

        this.hoveredFeature = feature;
      }
    });

    setTimeout(() => {
      this.olMap?.updateSize();
    }, 200);

    // this.loadCountriesData();
    this.applyFilters();

    this.olMap.on('singleclick', (event) => {
      const feature = this.olMap?.forEachFeatureAtPixel(event.pixel, (f) => f);

      if (feature) {
        const properties = feature.getProperties();
        this.selectedCountry = {
          name: properties['name'],
          fid: properties['fid'],
          iso: properties['iso'],
        };

        const fid = properties?.['fid'];
        if (fid) {
          this.loadingStats = true;
          this.countryService.getCountryDetails(fid).subscribe({
            next: (data) => {
              this.selectedCountryStats = data;
            
              this.statsVisible = true;
              this.loadingStats = false;
              this.cdr.detectChanges();
              setTimeout(() => this.initChart(), 0);
            },
            error: () => {
              this.loadingStats = false;
              this.statsVisible = true;
            },
          });
        } else {
          this.selectedCountryStats = null;
          this.statsVisible = true;
        }
      } else {
        this.statsVisible = false;
        this.selectedCountryStats = null;
      }
    });
  }

  loadCountriesData() {
    this.countryService.readAll('countries').subscribe((data: any) => {
      if (data && this.countryLayer) {
        const features = new GeoJSON().readFeatures(data, {
          featureProjection: 'EPSG:3857',
        });
        this.countryLayer.getSource()?.clear();
        this.countryLayer.getSource()?.addFeatures(features);
      }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) return;

    this.countryService
      .read(`countries/search/name?name=${this.searchTerm}`)
      .subscribe((data: any) => {
        if (data && data.features && data.features.length > 0) {
          const features = new GeoJSON().readFeatures(data, {
            featureProjection: 'EPSG:3857',
          });

          const feature = features[0];
          const extent = feature.getGeometry()?.getExtent();

          if (extent && this.olMap) {
            this.olMap.getView().fit(extent, {
              duration: 1000,
              padding: [100, 100, 100, 100],
            });
            this.selectedCountry = feature.getProperties();
            this.statsVisible = true;
          }
        }
      });
  }

  setBasemap(id: string) {
    this.currentBasemap = id;
    this.initMap();
  }

  updateLayers() {
    const countryLayerConfig = this.thematicLayers.find(
      (l) => l.id === 'countries'
    );
    if (this.countryLayer) {
      this.countryLayer.setVisible(countryLayerConfig?.active ?? true);
    }
  }

  zoomIn() {
    const view = this.olMap?.getView();
    if (view) {
      const currentZoom = view.getZoom();
      if (currentZoom !== undefined) {
        view.animate({
          zoom: currentZoom + 1,
          duration: 250,
        });
      }
    }
  }

  zoomOut() {
    const view = this.olMap?.getView();
    if (view) {
      const currentZoom = view.getZoom();
      if (currentZoom !== undefined) {
        view.animate({
          zoom: currentZoom - 1,
          duration: 250,
        });
      }
    }
  }

  resetView() {
    this.olMap?.getView().animate({
      center: fromLonLat([-14.45, 14.49]),
      zoom: 4,
      duration: 1000,
    });
  }
  cleanup() {
    const mapElement = document.getElementById('map');
    if (mapElement) mapElement.innerHTML = '';
    this.olMap = null;
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private getColor(d: number): string {
    return d > 1000
      ? '#800026'
      : d > 500
      ? '#BD0026'
      : d > 200
      ? '#E31A1C'
      : d > 100
      ? '#FC4E2A'
      : d > 50
      ? '#FD8D3C'
      : d > 10
      ? '#FEB24C'
      : d > 0
      ? '#FED976'
      : 'rgba(251, 191, 36, 0.2)'; // Neutre si 0
  }

  private getCountryStyle = (feature: any) => {
    const deaths = feature.get('total_deaths') || 0;

    return new Style({
      fill: new Fill({
        color: this.getColor(deaths),
      }),
      stroke: new Stroke({
        color: '#ffffff',
        width: 1,
      }),
    });
  };

  openPrintDialog() {
    const dialogRef = this.dialog.open(PrintDialogComponent, {
      width: '600px',
      data: {
        title: `Carte Afrique de l'Ouest ${this.selectedDisaster} - ${this.selectedYear}`,
        description: '',
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.reportTitle = result.title;
        this.reportDescription = result.description;

        this.olMap?.getView().setCenter(fromLonLat([2.5, 13.5]));
        this.olMap?.getView().setZoom(4.7);

        this.isPrinting = true;

        this.cdr.detectChanges();

        setTimeout(() => {
          window.print();
          this.isPrinting = false;
          this.cdr.detectChanges();
        }, 1000);
      }
    });
  }

  // focusWestAfrica() {
  //   this.olMap?.getView().animate({
  //     center: fromLonLat([-3.5, 14.5]), // Centre Sénégal / Mali
  //     zoom: 5.5,
  //     duration: 1000
  //   });
  // }
  private getNormalizedColor(d: number): string {
    const d_max = 1000;
    const intensity = Math.min(d / d_max, 1);

    const r = Math.floor(255 - (255 - 128) * intensity);
    const g = Math.floor(217 - (217 - 0) * intensity);
    const b = Math.floor(118 - (118 - 38) * intensity);

    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  }
  isFullscreen = false;

  toggleFullscreen() {
    const elem = document.documentElement;

    if (!this.isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      this.isFullscreen = false;
    }
  }

  @HostListener('document:fullscreenchange', [])
  onFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
  }

  readonly WEST_AFRICA_COUNTRIES = [
    { id: 1, iso: 'sl', name: 'Sierra Leone' },
    { id: 2, iso: 'gn', name: 'Guinée' },
    { id: 3, iso: 'lr', name: 'Libéria' },
    { id: 4, iso: 'ci', name: "Côte d'Ivoire" },
    { id: 5, iso: 'ml', name: 'Mali' },
    { id: 6, iso: 'sn', name: 'Sénégal' },
    { id: 7, iso: 'ng', name: 'Nigéria' },
    { id: 8, iso: 'bj', name: 'Bénin' },
    { id: 9, iso: 'ne', name: 'Niger' },
    { id: 10, iso: 'bf', name: 'Burkina Faso' },
    { id: 11, iso: 'tg', name: 'Togo' },
    { id: 12, iso: 'gh', name: 'Ghana' },
    { id: 13, iso: 'gw', name: 'Guinée-Bissau' },
    { id: 14, iso: 'mr', name: 'Mauritanie' },
  ];
  getRiskLevel(frequency: number) {
    if (frequency >= 5)
      return { label: 'Critique', class: 'bg-red-500', icon: 'report' };
    if (frequency >= 2)
      return { label: 'Élevé', class: 'bg-orange-500', icon: 'priority_high' };
    return { label: 'Modéré', class: 'bg-amber-500', icon: 'info' };
  }

  getTrendColor(current: number, average: number) {
    return current > average ? 'text-red-500' : 'text-emerald-500';
  }

  initChart() {
  if (!this.statsChart || !this.selectedCountryStats?.chart_data) return;

  const data = this.selectedCountryStats.chart_data;
  const years = data.map((d: any) => d.year);
  const deaths = data.map((d: any) => d.annual_deaths);
  const damages = data.map((d: any) => parseFloat(d.annual_damage));

  if (this.chartInstance) {
    this.chartInstance.destroy();
  }

  this.chartInstance = new Chart(this.statsChart.nativeElement, {
    type: 'bar', 
    data: {
      labels: years,
      datasets: [
        {
          
          label: 'Décès',
          data: deaths,
          backgroundColor: '#ef4444', 
          borderColor: '#b91c1c',
          borderWidth: 1,
          yAxisID: 'y',
          barPercentage: 0.6, 
        },
        {
          label: 'Dommages (USD)',
          data: damages,
          backgroundColor: '#f59e0b', 
          borderColor: '#d97706',
          borderWidth: 1,
          yAxisID: 'y1',
          barPercentage: 0.6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cbd5e1' } }
      },
      scales: {
        x: { 
          stacked: false, 
          ticks: { color: '#94a3b8' }, 
          grid: { display: false } 
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: { color: '#ef4444' },
          title: { display: true, text: 'Décès', color: '#ef4444' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#f59e0b' },
          title: { display: true, text: 'Dommages USD', color: '#f59e0b' }
        }
      }
    }
  });
}
}
