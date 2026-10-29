import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import XYZ from 'ol/source/XYZ';
import MVT from 'ol/format/MVT';
import ScaleLine from 'ol/control/ScaleLine';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Fill, Stroke, Style } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { OCCSOL_CLASS_BY_CODE, OCCSOL_THEMES, OccsolTheme } from '@/app/core/constants/occsol-classes';
import { OccsolService, OccsolStats } from '@/app/core/services/occsol.service';

const BASEMAPS = {
  gris: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

interface ClassRow { code: string; label: string; color: string; description: string; km2: number; share: number }
interface ThemeRow { theme: OccsolTheme; km2: number; share: number; classes: ClassRow[] }
interface EvolutionRow { label: string; color: string; areas: number[]; change: number | null }

@Component({
  selector: 'app-senegal',
  standalone: false,
  templateUrl: './senegal.component.html',
  styleUrl: './senegal.component.scss',
})
export class SenegalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip') tooltipEl!: ElementRef<HTMLDivElement>;

  // Années présentes en base (importées depuis l'espace admin)
  years: number[] = [];
  readonly themes = OCCSOL_THEMES;
  year = 0;
  tab: 'legende' | 'evolution' = 'legende';
  basemap: keyof typeof BASEMAPS = 'gris';
  opacity = 85;
  hidden = new Set<string>();

  stats: OccsolStats | null = null;
  statsError = false;
  // Calculés à l'arrivée des données et au changement d'année (pas de getter : évite les boucles de détection)
  themeRows: ThemeRow[] = [];
  themeEvolution: EvolutionRow[] = [];
  classEvolution: EvolutionRow[] = [];
  totalKm2 = 0;
  selected: { label: string; theme: string; color: string; ha: number; description: string } | null = null;

  private olMap?: Map;
  private baseLayer?: TileLayer<XYZ>;
  private occsolLayer?: VectorTileLayer;
  private styleCache: Record<string, Style> = {};

  constructor(private occsolService: OccsolService, private zone: NgZone) {}

  ngOnInit(): void {
    this.occsolService.getStats().subscribe((s) => {
      this.stats = s;
      this.statsError = !s || !s.classes.length;
      this.years = s?.years ?? [];
      // Par défaut : l'année la plus récente
      if (this.years.length && !this.years.includes(this.year)) {
        this.year = this.years[this.years.length - 1];
        this.occsolLayer?.setSource(this.createSource());
      }
      this.computeRows();
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initMap());
  }

  ngOnDestroy(): void {
    this.olMap?.setTarget(undefined);
  }

  private initMap() {
    this.baseLayer = new TileLayer({ source: new XYZ({ url: BASEMAPS[this.basemap], crossOrigin: 'anonymous' }) });
    this.occsolLayer = new VectorTileLayer({
      source: this.year ? this.createSource() : undefined,
      style: (f) => this.styleFor(f),
      opacity: this.opacity / 100,
    });

    this.olMap = new Map({
      target: this.mapEl.nativeElement,
      layers: [this.baseLayer, this.occsolLayer],
      view: new View({
        center: fromLonLat([-14.45, 14.45]),
        zoom: 7,
        minZoom: 6,
        maxZoom: 16,
        // Navigation limitée au Sénégal et à ses abords
        extent: transformExtent([-19.5, 11, -10, 18], 'EPSG:4326', 'EPSG:3857'),
      }),
      controls: [new ScaleLine({ units: 'metric', bar: true, minWidth: 100 })],
      keyboardEventTarget: this.mapEl.nativeElement,
    });
    this.olMap.getView().fit(transformExtent([-17.6, 12.25, -11.3, 16.7], 'EPSG:4326', 'EPSG:3857'), { padding: [20, 20, 20, 20] });

    // Survol : infobulle mise à jour hors d'Angular, directement dans le DOM
    this.olMap.on('pointermove', (evt) => {
      if (evt.dragging) return;
      const feature = this.olMap!.forEachFeatureAtPixel(evt.pixel, (f) => (this.hidden.has(f.get('c')) ? undefined : f), { layerFilter: (l) => l === this.occsolLayer });
      const tip = this.tooltipEl.nativeElement;
      const cls = feature && OCCSOL_CLASS_BY_CODE[feature.get('c')];
      this.mapEl.nativeElement.style.cursor = cls ? 'pointer' : '';
      if (!cls) {
        tip.hidden = true;
        return;
      }
      tip.textContent = cls.label;
      tip.hidden = false;
      tip.style.transform = `translate(${evt.pixel[0] + 14}px, ${evt.pixel[1] + 14}px)`;
    });
    this.olMap.getViewport().addEventListener('mouseleave', () => (this.tooltipEl.nativeElement.hidden = true));

    // Clic : fiche du polygone (Angular n'est sollicité qu'ici)
    this.olMap.on('singleclick', (evt) => {
      const feature = this.olMap!.forEachFeatureAtPixel(evt.pixel, (f) => (this.hidden.has(f.get('c')) ? undefined : f), { layerFilter: (l) => l === this.occsolLayer });
      const cls = feature && OCCSOL_CLASS_BY_CODE[feature.get('c')];
      this.zone.run(() => {
        this.selected = cls
          ? {
              label: cls.label,
              theme: OCCSOL_THEMES.find((t) => t.id === cls.theme)!.label,
              color: cls.color,
              ha: feature!.get('ha'),
              description: cls.description,
            }
          : null;
      });
    });
  }

  private createSource() {
    return new VectorTileSource({
      format: new MVT(),
      url: this.occsolService.tileUrl(this.year),
      maxZoom: 14,
    });
  }

  private styleFor(feature: FeatureLike): Style | undefined {
    const code = feature.get('c');
    if (this.hidden.has(code)) return undefined;
    if (!this.styleCache[code]) {
      const color = OCCSOL_CLASS_BY_CODE[code]?.color ?? '#94a3b8';
      this.styleCache[code] = new Style({ fill: new Fill({ color }), stroke: new Stroke({ color, width: 0.5 }) });
    }
    return this.styleCache[code];
  }

  setYear(year: number) {
    if (year === this.year) return;
    this.year = year;
    this.selected = null;
    this.occsolLayer?.setSource(this.createSource());
    this.computeRows();
  }

  setBasemap(basemap: keyof typeof BASEMAPS) {
    this.basemap = basemap;
    this.baseLayer?.setSource(new XYZ({ url: BASEMAPS[basemap], crossOrigin: 'anonymous' }));
  }

  setOpacity(value: number) {
    this.opacity = value;
    this.occsolLayer?.setOpacity(value / 100);
  }

  toggleClass(code: string) {
    this.hidden.has(code) ? this.hidden.delete(code) : this.hidden.add(code);
    if (this.hidden.has(code)) this.selected = null;
    this.occsolLayer?.changed();
  }

  // Thème entier : tout afficher s'il manque au moins une classe, sinon tout masquer
  toggleTheme(theme: OccsolTheme) {
    const allVisible = theme.classes.every((c) => !this.hidden.has(c.code));
    theme.classes.forEach((c) => (allVisible ? this.hidden.add(c.code) : this.hidden.delete(c.code)));
    this.occsolLayer?.changed();
  }

  themeState(theme: OccsolTheme): 'all' | 'some' | 'none' {
    const visible = theme.classes.filter((c) => !this.hidden.has(c.code)).length;
    return visible === theme.classes.length ? 'all' : visible ? 'some' : 'none';
  }

  showAll() {
    this.hidden.clear();
    this.occsolLayer?.changed();
  }

  private computeRows() {
    const areaOf = (code: string, year: number) => this.stats?.classes.find((c) => c.code === code)?.areas[year] ?? 0;
    this.totalKm2 = this.themes.flatMap((t) => t.classes).reduce((s, c) => s + areaOf(c.code, this.year), 0);
    const share = (km2: number) => (this.totalKm2 ? (km2 / this.totalKm2) * 100 : 0);

    this.themeRows = this.themes.map((theme) => {
      const classes = theme.classes
        .map((c) => ({ ...c, km2: areaOf(c.code, this.year), share: share(areaOf(c.code, this.year)) }))
        .sort((a, b) => b.km2 - a.km2);
      const km2 = classes.reduce((s, c) => s + c.km2, 0);
      return { theme, km2, share: share(km2), classes };
    });

    const change = (areas: number[]) => (areas[0] ? ((areas[areas.length - 1] - areas[0]) / areas[0]) * 100 : null);
    this.themeEvolution = this.themes.map((t) => {
      const areas = this.years.map((y) => t.classes.reduce((s, c) => s + areaOf(c.code, y), 0));
      return { label: t.label, color: t.color, areas, change: change(areas) };
    });
    this.classEvolution = this.themes
      .flatMap((t) => t.classes)
      .map((c) => {
        const areas = this.years.map((y) => areaOf(c.code, y));
        return { label: c.label, color: c.color, areas, change: change(areas) };
      });
  }
}
