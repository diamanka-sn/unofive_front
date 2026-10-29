import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  ViewChild, ElementRef,
  NgZone,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, get as getProjection, getPointResolution, transformExtent } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import LinearRing from 'ol/geom/LinearRing';
import ScaleLine from 'ol/control/ScaleLine';
import { Style, Fill, Stroke } from 'ol/style';
import { CountryService } from '@/app/core/services/country.service';
import Feature from 'ol/Feature';
import { MatDialog } from '@angular/material/dialog';
import { PrintData, PrintDialogComponent } from '../../components/print-dialog/print-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Chart, registerables } from 'chart.js';
import { ALL_DISASTER_TYPES, DISASTER_TYPE_GROUPS, disasterSubgroupFr, disasterTypeFr } from '@/app/core/constants/disaster-labels';
import { countryNameFr } from '@/app/core/constants/country-names';
Chart.register(...registerables);
Chart.defaults.font.family = '"IBM Plex Sans", Arial, sans-serif';

// Couleurs partagées par la carte, la légende à l'écran et la légende imprimée
const NO_DEATH_COLOR = 'rgba(251, 191, 36, 0.2)';
// Opaque et de la couleur du fond de page : seule l'Afrique est visible
const MASK_COLOR = '#f1f5f9';

@Component({
  selector: 'app-carte',
  standalone: false,
  templateUrl: './carte.component.html',
  styleUrl: './carte.component.scss',
})
export class CarteComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly noDeathColor = NO_DEATH_COLOR;
  sidebarVisible: boolean = false;
  statsVisible: boolean = false;
  currentBasemap: string = 'osm';
  activeSection: string = 'tools';
  searchTerm: string = '';
  selectedCountry: any = null;
  isPrinting = false;
  private hoveredFeature: any = null;
  olMap: Map | null = null;
  countryLayer: VectorLayer<VectorSource> | null = null;
  // Voile gris sur tout ce qui n'est pas un pays de la base (hors Afrique)
  maskLayer: VectorLayer<VectorSource> | null = null;
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
    2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
    2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002,
    2001, 2000,
  ];
  // Tous les types de la base, par famille (liste partagée avec l'accueil)
  disasterTypeGroups = DISASTER_TYPE_GROUPS;
  disasterTypes = ALL_DISASTER_TYPES;
  selectedYear: number = 2024;
  selectedDisaster: string = 'Flood';

  get yearLabel(): string {
    return String(this.selectedYear);
  }

  @ViewChild('statsChart') statsChart!: ElementRef;
  private chartInstance: Chart | null = null;

  // Seuils de classes (décès), partagés par la carte et la légende
  private readonly CLASS_COLORS = ['#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'];
  private readonly classBreaks = [0, 10, 50, 100, 200, 500, 1000];

  // Calculée une seule fois : un getter renvoyant un nouveau tableau à chaque détection de changements
  // faisait reconstruire la légende en boucle et figeait la page
  readonly legendItems: { color: string; label: string }[] = (() => {
    const b = this.classBreaks;
    const fmt = (n: number) => n.toLocaleString('fr-FR');
    return this.CLASS_COLORS.map((color, i) => ({
      color,
      label: i < b.length - 1 ? `${fmt(b[i] + 1)} - ${fmt(b[i + 1])}` : `> ${fmt(b[i])}`,
    })).reverse();
  })();

  constructor(
    private countryService: CountryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Fonctionne aussi quand on est déjà sur la carte et qu'on choisit un autre pays dans la recherche
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const fid = Number(params.get('pays'));
      if (!fid) return;
      this.pendingCountryFid = fid;
      this.focusPendingCountry();
    });
  }

  private destroy$ = new Subject<void>();

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
          this.updateMask(features);

          this.countryLayer.setStyle(this.getCountryStyle);
          this.buildCountryList(features);
          this.focusPendingCountry();
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
    // Hors d'Angular : les événements de la carte (souris, rendu) ne déclenchent plus
    // une détection de changements à chaque mouvement
    this.zone.runOutsideAngular(() => this.initOpenLayers());
  }

  private initOpenLayers() {
    const url =
      this.currentBasemap === 'osm'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    this.countryLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: NO_DEATH_COLOR }),
        stroke: new Stroke({ color: '#fbbf24', width: 2 }),
      }),
    });

    this.maskLayer = new VectorLayer({
      source: new VectorSource(),
      // Redessiné à chaque image pendant zoom et déplacement, sinon OpenLayers étire l'ancien rendu
      // et les bords découverts laissent voir les autres continents le temps de l'animation
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      style: new Style({
        fill: new Fill({ color: MASK_COLOR }),
        stroke: new Stroke({ color: '#94a3b8', width: 1 }),
      }),
    });

    this.olMap = new Map({
      target: 'map',
      layers: [
        // crossOrigin : nécessaire pour copier la carte dans une image à l'impression
        new TileLayer({ source: new XYZ({ url: url, crossOrigin: 'anonymous' }) }),
        this.maskLayer,
        this.countryLayer,
      ],
      view: new View({
        center: fromLonLat([17, 2]),
        zoom: 3,
        // Navigation limitée au continent : impossible de glisser vers l'Europe ou l'Amérique
        extent: transformExtent([-40, -45, 72, 45], 'EPSG:4326', 'EPSG:3857'),
        showFullExtent: true,
      }),
      controls: [new ScaleLine({ units: 'metric', bar: true, minWidth: 100 })],
      // Flèches et +/- actifs quand la zone de carte (tabindex="0") a le focus
      keyboardEventTarget: document.getElementById('map') ?? undefined,
    });
    const highlightStyle = new Style({
      fill: new Fill({ color: 'rgba(251, 191, 36, 0.5)' }),
      stroke: new Stroke({ color: '#fbbf24', width: 3 }),
    });
    // Exécuté hors d'Angular (voir initMap) : Angular n'est sollicité que quand on change de pays
    this.olMap.on('pointermove', (event) => {
      if (event.dragging) {
        this.setTooltip(null);
        return;
      }

      const feature = this.olMap?.forEachFeatureAtPixel(event.pixel, (f) => f, this.countryHitOptions) as
        | Feature
        | undefined;

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

        this.hoveredFeature = feature ?? null;
        this.setTooltip(
          feature
            ? { name: countryNameFr(feature.get('name')), deaths: Number(feature.get('total_deaths')) || 0 }
            : null
        );
      }

      if (feature) this.positionTooltip(event.pixel);
    });

    this.olMap.getViewport().addEventListener('mouseleave', () => this.setTooltip(null));

    setTimeout(() => {
      this.olMap?.updateSize();
      this.fitAfrica();
    }, 200);

    // this.loadCountriesData();
    this.applyFilters();

    this.olMap.on('singleclick', (event) => this.zone.run(() => {
      const feature = this.olMap?.forEachFeatureAtPixel(event.pixel, (f) => f, this.countryHitOptions);
      this.openCountryDetails(feature as Feature | undefined);
    }));
  }

  // Ouvre la fiche d'un pays (clic sur la carte ou choix dans la recherche) ; sans pays, ferme la fiche
  private openCountryDetails(feature: Feature | undefined) {
      if (feature) {
        const properties = feature.getProperties();
        this.selectedCountry = {
          name: countryNameFr(properties['name']),
          fid: properties['fid'],
          iso: properties['iso'],
        };

        const fid = properties?.['fid'];
        if (fid) {
          this.loadingStats = true;
          this.countryService.getCountryDetails(fid).subscribe({
            next: (data) => {
              this.selectedCountryStats = data;
              this.sortedSubgroups = [...(data?.vulnerability?.subgroups ?? [])].sort(
                (a: any, b: any) => Number(b.count) - Number(a.count)
              );
              this.buildChartAlternative(data?.chart_data ?? []);
              this.buildTypeBreakdown(data?.vulnerability?.types ?? []);
              this.statsVisible = true;
              this.loadingStats = false;
              this.cdr.detectChanges();
              setTimeout(() => {
                this.initChart();
                // Le focus entre dans la fiche : utile au clavier et aux lecteurs d'écran
                document.getElementById('fiche-titre')?.focus();
              }, 0);
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
  }

  // Pays demandé par l'adresse (?pays=fid, depuis la recherche), appliqué dès que les pays sont chargés
  private pendingCountryFid: number | null = null;

  // Liste des pays (alternative clavier et textuelle à la carte), recalculée à chaque changement de filtre
  countryListVisible = false;
  countryList: { fid: number; name: string; deaths: number; color: string }[] = [];

  private buildCountryList(features: Feature[]) {
    const seen = new Set<number>();
    const list = features
      .map((f) => ({
        fid: Number(f.get('fid')),
        name: countryNameFr(f.get('name')),
        deaths: Number(f.get('total_deaths')) || 0,
      }))
      .filter((c) => !seen.has(c.fid) && seen.add(c.fid))
      .map((c) => ({ ...c, color: this.getColor(c.deaths) }))
      .sort((a, b) => b.deaths - a.deaths || a.name.localeCompare(b.name, 'fr'));
    // Les données arrivent parfois hors d'Angular (carte initialisée hors zone)
    this.zone.run(() => (this.countryList = list));
  }

  trackByFid = (_: number, c: { fid: number }) => c.fid;

  selectFromList(fid: number) {
    this.countryListVisible = false;
    this.pendingCountryFid = fid;
    this.focusPendingCountry();
  }

  // À l'ouverture de la liste, le focus va sur le premier pays (sinon il reste derrière le panneau)
  focusCountryList() {
    setTimeout(() => (document.querySelector('p-drawer table tbody button') as HTMLElement | null)?.focus(), 0);
  }

  private focusPendingCountry() {
    if (this.pendingCountryFid === null || !this.olMap) return;
    const feature = this.countryLayer?.getSource()?.getFeatures()
      .find((f) => Number(f.get('fid')) === this.pendingCountryFid);
    if (!feature) return;
    this.pendingCountryFid = null;

    const extent = feature.getGeometry()?.getExtent();
    if (extent) {
      // Marge à droite pour que le pays ne soit pas caché sous la fiche
      const drawerWidth = Math.min(600, (this.olMap.getSize()?.[0] ?? 0) * 0.5);
      this.olMap.getView().fit(extent, { padding: [60, drawerWidth + 40, 60, 60], duration: 800, maxZoom: 7 });
    }
    this.zone.run(() => this.openCountryDetails(feature));
  }

  @ViewChild('mapTooltip') private tooltipEl?: ElementRef<HTMLElement>;
  tooltip: { name: string; deaths: number } | null = null;

  // Contenu de l'infobulle : seul passage par Angular, uniquement quand on change de pays
  private setTooltip(content: { name: string; deaths: number } | null) {
    if (content === null && this.tooltip === null) return;
    this.zone.run(() => (this.tooltip = content));
  }

  // Position mise à jour directement dans le DOM à chaque mouvement, sans Angular ;
  // basculée à gauche près du bord droit pour ne pas sortir de l'écran
  private positionTooltip(pixel: number[]) {
    const el = this.tooltipEl?.nativeElement;
    if (!el) return;
    const width = this.olMap?.getSize()?.[0] ?? 0;
    el.style.left = `${pixel[0]}px`;
    el.style.top = `${pixel[1]}px`;
    el.style.transform = pixel[0] > width - 240 ? 'translate(calc(-100% - 14px), 14px)' : 'translate(14px, 14px)';
  }

  // Survol et clic ne concernent que les pays, jamais le masque
  private countryHitOptions = { layerFilter: (layer: any) => layer === this.countryLayer };

  // Rectangle couvrant le monde, percé d'un trou par pays : seule l'Afrique reste nette
  private updateMask(features: Feature[]) {
    const source = this.maskLayer?.getSource();
    if (!source) return;

    const [minX, minY, maxX, maxY] = getProjection('EPSG:3857')!.getExtent();
    const rings: number[][][] = [
      [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]],
    ];

    // Le masque est redessiné à chaque image pendant les zooms : contours simplifiés (300 m, invisible
    // à l'échelle du continent) et un seul trou par pays, sinon un pays en double serait recouvert
    const seen = new Set<string>();
    for (const f of features) {
      const name = f.get('name');
      if (seen.has(name)) continue;
      seen.add(name);
      const geom = f.getGeometry();
      const polygons = geom instanceof MultiPolygon ? geom.getPolygons()
        : geom instanceof Polygon ? [geom] : [];
      for (const p of polygons) {
        const ring = p.getLinearRing(0)!.simplify(300) as LinearRing;
        rings.push(ring.getCoordinates());
      }
    }

    source.clear();
    source.addFeature(new Feature(new Polygon(rings)));
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
    this.fitAfrica(1000);
  }

  // Emprise de tout le continent (îles comprises), ajustée à la taille de l'écran
  private readonly AFRICA_EXTENT = transformExtent([-26, -36, 58, 38], 'EPSG:4326', 'EPSG:3857');

  private fitAfrica(duration = 0) {
    this.olMap?.getView().fit(this.AFRICA_EXTENT, { padding: [40, 40, 40, 40], duration });
  }
  cleanup() {
    const mapElement = document.getElementById('map');
    if (mapElement) mapElement.innerHTML = '';
    this.olMap = null;
  }

  ngOnDestroy() {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Même seuils que la légende (classBreaks), pour que carte et légende restent identiques
  private getColor(d: number): string {
    if (d <= 0) return NO_DEATH_COLOR;
    const b = this.classBreaks;
    let i = b.length - 1;
    while (i > 0 && d <= b[i]) i--;
    return this.CLASS_COLORS[i];
  }

  // Un style par couleur, réutilisé : évite de recréer un objet par pays à chaque rendu
  // globalThis.Map : « Map » désigne ici la carte OpenLayers (import ol/Map)
  private styleCache = new globalThis.Map<string, Style>();

  private getCountryStyle = (feature: any) => {
    const color = this.getColor(feature.get('total_deaths') || 0);
    let style = this.styleCache.get(color);
    if (!style) {
      style = new Style({
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 1 }),
      });
      this.styleCache.set(color, style);
    }
    return style;
  };

  get filterLabel(): string {
    if (this.selectedDisaster === 'all') return 'Toutes catastrophes';
    return this.disasterTypes.find((t) => t.id === this.selectedDisaster)?.label ?? this.typeFr(this.selectedDisaster);
  }

  openPrintDialog() {
    const data: PrintData = {
      title: `${this.filterLabel} en Afrique : décès en ${this.selectedYear}`,
      description: '',
      summary: `Nombre de décès par pays · ${this.filterLabel} · ${this.yearLabel}`,
      framing: 'africa',
      orientation: 'landscape',
    };
    this.dialog
      .open(PrintDialogComponent, { width: '480px', maxWidth: '92vw', data })
      .afterClosed()
      .subscribe((result?: PrintData) => {
        if (result) this.printMap(result);
      });
  }

  // Impression : la carte est copiée en image puis mise en page dans un document A4 dédié
  private async printMap(opts: PrintData) {
    if (!this.olMap) return;
    this.isPrinting = true;
    const view = this.olMap.getView();
    const previous = { center: view.getCenter(), zoom: view.getZoom() };

    if (this.hoveredFeature) {
      this.hoveredFeature.setStyle(this.getCountryStyle(this.hoveredFeature));
      this.hoveredFeature = null;
    }

    try {
      if (opts.framing === 'africa') this.fitAfrica();
      const image = await this.captureMap();
      await this.printDocument(this.buildPrintHtml(opts, image));
    } catch {
      this.snackBar.open("Impossible de préparer l'impression. Réessayez dans un instant.", 'Fermer', { duration: 6000 });
    } finally {
      if (opts.framing === 'africa' && previous.center && previous.zoom !== undefined) {
        view.setCenter(previous.center);
        view.setZoom(previous.zoom);
      }
      this.isPrinting = false;
      this.cdr.detectChanges();
    }
  }

  // Assemble les calques de la carte en une seule image, une fois toutes les tuiles chargées
  private captureMap(): Promise<string> {
    const map = this.olMap!;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Délai dépassé')), 20000);
      map.once('rendercomplete', () => {
        clearTimeout(timer);
        try {
          const [width, height] = map.getSize()!;
          const ratio = window.devicePixelRatio || 1;
          const out = document.createElement('canvas');
          out.width = Math.round(width * ratio);
          out.height = Math.round(height * ratio);
          const ctx = out.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, out.width, out.height);

          map.getViewport().querySelectorAll<HTMLCanvasElement>('.ol-layer canvas, canvas.ol-layer').forEach((canvas) => {
            if (canvas.width === 0) return;
            const opacity = (canvas.parentNode as HTMLElement).style.opacity || canvas.style.opacity;
            ctx.globalAlpha = opacity === '' ? 1 : Number(opacity);
            const match = canvas.style.transform.match(/^matrix\(([^(]*)\)$/);
            const m = match
              ? match[1].split(',').map(Number)
              : [parseFloat(canvas.style.width) / canvas.width || 1 / ratio, 0, 0,
                 parseFloat(canvas.style.height) / canvas.height || 1 / ratio, 0, 0];
            ctx.setTransform(m[0] * ratio, m[1] * ratio, m[2] * ratio, m[3] * ratio, m[4] * ratio, m[5] * ratio);
            ctx.drawImage(canvas, 0, 0);
          });

          ctx.globalAlpha = 1;
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          this.drawScaleBar(ctx, height);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          resolve(out.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      });
      map.renderSync();
    });
  }

  // Barre d'échelle dessinée dans l'image (le contrôle ScaleLine d'OpenLayers est du HTML, absent de la capture).
  // En Web Mercator l'échelle varie avec la latitude : elle est calculée au centre de la carte.
  private drawScaleBar(ctx: CanvasRenderingContext2D, height: number) {
    const view = this.olMap!.getView();
    const center = view.getCenter();
    const resolution = view.getResolution();
    if (!center || !resolution) return;

    const metersPerPixel = getPointResolution(view.getProjection(), resolution, center, 'm');
    const maxMeters = metersPerPixel * 160;
    const pow = Math.pow(10, Math.floor(Math.log10(maxMeters)));
    const meters = [5, 2, 1].map((f) => f * pow).find((v) => v <= maxMeters) ?? pow;
    const barPx = meters / metersPerPixel;
    const label = meters >= 1000 ? `${(meters / 1000).toLocaleString('fr-FR')} km` : `${meters} m`;

    const x = 20;
    const barY = height - 34;
    const segments = 4;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 10, height - 62, barPx + 44, 52);
    ctx.strokeRect(x - 10, height - 62, barPx + 44, 52);

    for (let i = 0; i < segments; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#0f172a' : '#ffffff';
      ctx.fillRect(x + (i * barPx) / segments, barY, barPx / segments, 6);
    }
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(x, barY, barPx, 6);

    ctx.fillStyle = '#0f172a';
    ctx.font = '11px "IBM Plex Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', x, barY - 5);
    ctx.fillText(label, x + barPx, barY - 5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "IBM Plex Sans", Arial, sans-serif';
    ctx.fillText('Échelle au centre de la carte', x, barY + 18);
  }

  private buildPrintHtml(opts: PrintData, image: string): string {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const landscape = opts.orientation === 'landscape';
    const generatedAt = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
    const basemap = this.currentBasemap === 'osm' ? '© OpenStreetMap contributors' : 'Esri World Imagery';
    const legend = this.legendItems
      .map((i) => `<li><span class="swatch" style="background:${i.color}"></span>${i.label}</li>`)
      .join('');

    return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${esc(opts.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  /* Marge de page à 0 : le navigateur n'a plus de place pour ses en-têtes (URL, date, n° de page).
     La marge visible est recréée par le padding du body. */
  @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; padding: 12mm; font-family: "IBM Plex Sans", Arial, sans-serif; color: #1e293b; }
  header { border-bottom: 2px solid #0f172a; padding-bottom: 3mm; margin-bottom: 4mm; }
  h1 { font-size: 18pt; margin: 0; color: #0f172a; }
  .subtitle { font-size: 10pt; color: #475569; margin-top: 1mm; }
  .body { display: flex; gap: 5mm; ${landscape ? '' : 'flex-direction: column;'} }
  .map { flex: 1; border: 0.3mm solid #cbd5e1; display: flex; align-items: center; justify-content: center; }
  .map img { display: block; max-width: 100%; max-height: ${landscape ? '125mm' : '165mm'}; object-fit: contain; }
  aside { ${landscape ? 'width: 42mm;' : ''} font-size: 9pt; }
  aside h2 { font-size: 10pt; margin: 0 0 2mm; }
  aside ul { list-style: none; margin: 0; padding: 0; ${landscape ? '' : 'display: flex; flex-wrap: wrap; gap: 1mm 5mm;'} }
  aside li { display: flex; align-items: center; gap: 2mm; margin-bottom: 1.2mm; }
  .swatch { width: 4mm; height: 3mm; border: 0.2mm solid #94a3b8; display: inline-block; }
  .notes { margin-top: 4mm; font-size: 10pt; line-height: 1.45; white-space: pre-wrap; }
  .notes h2 { font-size: 10pt; margin: 0 0 1mm; }
  footer { margin-top: 4mm; padding-top: 2mm; border-top: 0.3mm solid #cbd5e1; font-size: 8pt; color: #64748b; display: flex; justify-content: space-between; gap: 5mm; }
</style></head>
<body>
  <header>
    <h1>${esc(opts.title)}</h1>
    <div class="subtitle">${esc(opts.summary)}</div>
  </header>
  <div class="body">
    <div class="map"><img id="map-image" src="${image}" alt="Carte"></div>
    <aside>
      <h2>Nombre de décès</h2>
      <ul>${legend}<li><span class="swatch" style="background:${NO_DEATH_COLOR}"></span>Aucun décès enregistré</li></ul>
    </aside>
  </div>
  ${opts.description ? `<section class="notes"><h2>Observations</h2>${esc(opts.description)}</section>` : ''}
  <footer>
    <span>Données : EM-DAT (CRED / UCLouvain) · Fond de carte : ${basemap}</span>
    <span>UnoFive · ${generatedAt}</span>
  </footer>
</body></html>`;
  }

  // Imprime le document dans un cadre invisible, sans toucher à la page de la carte
  private printDocument(html: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(html);
      doc.close();

      const win = iframe.contentWindow!;
      const cleanup = () => iframe.remove();
      const img = doc.getElementById('map-image') as HTMLImageElement;
      const go = () => {
        win.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, 60000);
        // La police du document se charge dans le cadre : on attend qu'elle soit prête (2 s maximum)
        Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 2000))]).then(() => {
          win.focus();
          win.print();
        });
        resolve();
      };
      if (img.complete) go();
      else {
        img.onload = go;
        img.onerror = () => { cleanup(); reject(new Error('Image')); };
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
  typeFr = disasterTypeFr;
  subgroupFr = disasterSubgroupFr;

  // Sous-groupes du plus fréquent au moins fréquent, triés une fois à l'arrivée des données
  sortedSubgroups: { subgroup: string; count: string }[] = [];

  // Répartition par type (naturels et technologiques) avec les icônes de l'accueil, calculée une fois à l'arrivée des données
  typeBreakdown: { label: string; items: { label: string; icon: string; color: string; count: number; deaths: number }[] }[] = [];

  private buildTypeBreakdown(types: { type: string; group: string; count: number; deaths: number }[]) {
    const byId = new globalThis.Map(this.disasterTypes.map((t) => [t.id, t]));
    this.typeBreakdown = this.disasterTypeGroups
      .map((g) => ({
        label: g.id === 'Natural' ? 'Naturelles' : 'Technologiques',
        items: types
          .filter((t) => t.group === g.id)
          .map((t) => {
            const def = byId.get(t.type);
            return {
              label: def?.label ?? this.typeFr(t.type),
              icon: def?.icon ?? 'help_outline',
              color: def?.color ?? '#64748b',
              count: t.count,
              deaths: t.deaths,
            };
          }),
      }))
      .filter((g) => g.items.length);
  }

  // Alternative textuelle du graphique, calculée une fois à l'arrivée des données (pas de getter, cf. boucle de détection)
  chartRows: { year: number; deaths: number; damage: number }[] = [];
  chartSummary = { deaths: '', damage: '' };

  private buildChartAlternative(chartData: any[]) {
    // Dégâts EM-DAT en milliers de dollars, affichés en millions comme sur le graphique
    this.chartRows = chartData.map((d) => ({
      year: Number(d.year),
      deaths: Number(d.annual_deaths) || 0,
      damage: (parseFloat(d.annual_damage) || 0) / 1000,
    }));

    const fmt = (n: number, digits = 0) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
    const rows = this.chartRows;
    if (!rows.length) {
      this.chartSummary = { deaths: 'Graphique vide : aucune donnée pour ce pays.', damage: 'Graphique vide : aucune donnée pour ce pays.' };
      return;
    }
    const period = `de ${rows[0].year} à ${rows[rows.length - 1].year}`;
    const peak = (key: 'deaths' | 'damage') => rows.reduce((a, b) => (b[key] > a[key] ? b : a));
    const total = (key: 'deaths' | 'damage') => rows.reduce((s, r) => s + r[key], 0);

    const pd = peak('deaths');
    this.chartSummary.deaths = `Graphique en barres : décès par année ${period}. ${fmt(total('deaths'))} décès au total, `
      + `maximum de ${fmt(pd.deaths)} en ${pd.year}. Valeurs détaillées dans le tableau sous le graphique.`;

    const pg = peak('damage');
    this.chartSummary.damage = pg.damage > 0
      ? `Graphique en barres : dégâts par année en millions de dollars ${period}. ${fmt(total('damage'), 1)} millions au total, `
        + `maximum de ${fmt(pg.damage, 1)} millions en ${pg.year}. Valeurs détaillées dans le tableau sous le graphique.`
      : `Graphique en barres : dégâts par année ${period}. Aucun montant de dégâts n'est renseigné pour ce pays.`;
  }

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

  chartMetric: 'deaths' | 'damage' = 'deaths';
  chartMetrics: { id: 'deaths' | 'damage'; label: string; unit: string; color: string }[] = [
    { id: 'deaths', label: 'Décès', unit: 'Décès', color: '#dc2626' },
    { id: 'damage', label: 'Dégâts', unit: 'Millions $', color: '#d97706' },
  ];

  setChartMetric(id: 'deaths' | 'damage') {
    if (this.chartMetric === id) return;
    this.chartMetric = id;
    this.initChart();
  }

  initChart() {
    if (!this.statsChart || !this.selectedCountryStats?.chart_data) return;

    const data = this.selectedCountryStats.chart_data;
    const metric = this.chartMetrics.find((m) => m.id === this.chartMetric)!;
    const years = data.map((d: any) => d.year);
    const values = data.map((d: any) =>
      this.chartMetric === 'deaths'
        ? Number(d.annual_deaths) || 0
        // EM-DAT compte les dégâts en milliers de dollars : conversion en millions
        : (parseFloat(d.annual_damage) || 0) / 1000
    );

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Hors d'Angular : les animations et le suivi de taille de Chart.js ne relancent pas l'affichage
    this.chartInstance = this.zone.runOutsideAngular(() => new Chart(this.statsChart.nativeElement, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: metric.unit,
            data: values,
            backgroundColor: metric.color,
            borderRadius: 2,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${(ctx.parsed.y ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${metric.unit.toLowerCase()}`,
            },
          },
        },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: '#64748b' },
            grid: { color: '#f1f5f9' },
            title: { display: true, text: metric.unit, color: '#475569' },
          },
        },
      },
    }));
  }
}
