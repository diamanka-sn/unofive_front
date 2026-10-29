import { Component, ElementRef, ViewChild } from '@angular/core';
import { EtlService } from '@/app/core/services/etl.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AFRICA_FID_MAPPING } from '@/app/core/constants/geo.constants';
import * as L from 'leaflet';
interface EtlLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'process';
}

@Component({
  selector: 'app-geo-data',
  standalone: false,
  templateUrl: './geo-data.component.html',
  styleUrl: './geo-data.component.scss',
})
export class GeoDataComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('terminalScroll') private terminalContainer!: ElementRef;
private map!: L.Map;
  private geoJsonLayer!: L.GeoJSON;
  logs: EtlLog[] = [];
  previewData: any[] = [];
  isProcessing = false;
  isDragging = false;
  progress: number = 0;
  fileName: string = '';

  constructor(
    private etlService: EtlService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  // private addLog(message: string, type: 'info' | 'success' | 'error' | 'process' = 'info') {
  //   const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
  //   this.logs.push({ time, message, type });
    
  //   setTimeout(() => {
  //     if (this.terminalContainer) {
  //       this.terminalContainer.nativeElement.scrollTop = this.terminalContainer.nativeElement.scrollHeight;
  //     }
  //   }, 50);
  // }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.handleFile(files[0]);
  }

  async onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) await this.handleFile(file);
  }

  // private async handleFile(file: File) {
  //   if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
  //     this.messageService.add({ severity: 'error', summary: 'Format Refusé', detail: 'GeoJSON uniquement' });
  //     return;
  //   }

  //   this.fileName = file.name;
  //   this.logs = [];
  //   this.isProcessing = true;
  //   this.addLog(`Lecture du fichier spatial : ${file.name}`, 'info');

  //   try {
  //     const content = await file.text();
  //     const geoData = JSON.parse(content);

  //     if (geoData.type !== 'FeatureCollection') {
  //       throw new Error("Le fichier n'est pas une FeatureCollection GeoJSON valide.");
  //     }

  //     this.previewData = geoData.features;
  //     console.log(this.previewData)
  //     this.addLog(`Analyse terminée : ${this.previewData.length} polygones/points détectés.`, 'success');
  //     this.messageService.add({ severity: 'success', summary: 'GEO Engine', detail: 'Géométries extraites' });
      
  //   } catch (error: any) {
  //     this.addLog(`Erreur de lecture : ${error.message}`, 'error');
  //     this.messageService.add({ severity: 'error', summary: 'Erreur JSON', detail: 'Structure invalide' });
  //     this.fileName = '';
  //   } finally {
  //     this.isProcessing = false;
  //   }
  // }

  uploadToDatabase() {
    
    this.confirmationService.confirm({
      header: 'Confirmer l\'import',
      message: `Importer ${this.previewData.length} entités dans la table des pays ?`,
      icon: 'pi pi-upload',
      acceptLabel: 'Importer',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: async () => {
        await this.startImportProcess();
      }
    });
  }

  private async startImportProcess() {
    this.isProcessing = true;
    this.progress = 0;
    this.addLog('Import démarré.', 'process');

    const chunkSize = 50;
    const totalRecords = this.previewData.length;
    const totalChunks = Math.ceil(totalRecords / chunkSize);
    const totals = { inserted: 0, updated: 0 };
    try {
      for (let i = 0; i < totalRecords; i += chunkSize) {
        const chunk = this.previewData.slice(i, i + chunkSize);
        const currentBatch = Math.floor(i / chunkSize) + 1;

        this.addLog(`Lot ${currentBatch}/${totalChunks} envoyé.`, 'info');

        const res: any = await this.etlService.saveGeoJsonToDatabase(chunk).toPromise();
        totals.inserted += res?.inserted ?? 0;
        totals.updated += res?.updated ?? 0;

        this.progress = Math.round((currentBatch / totalChunks) * 100);
      }

      const summary = `${totals.inserted} pays ajoutés, ${totals.updated} déjà présents mis à jour`;
      this.addLog(`Import terminé : ${summary}.`, 'success');
      this.messageService.add({ severity: 'success', summary: 'Import terminé', detail: summary });
      this.isProcessing = false;
    } catch (error: any) {
      const serverMsg = error?.error?.message || error.message;
      this.addLog(`Erreur serveur (${error?.status ?? '?'}) : ${serverMsg}`, 'error');
      this.messageService.add({ severity: 'error', summary: 'Import interrompu', detail: serverMsg });
      this.isProcessing = false;
    }
  }

  resetETL() {
    this.executeReset();
  }

  // private executeReset() {
  //   this.fileName = '';
  //   this.previewData = [];
  //   this.logs = [];
  //   this.progress = 0;
  //   this.isProcessing = false;
  //   if (this.fileInput) this.fileInput.nativeElement.value = '';
  //   this.addLog('Moteur réinitialisé.', 'info');
  // }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  // --- Initialisation de la carte ---
  private initMap() {
    // Si la carte existe déjà, on la supprime pour la recréer proprement
    if (this.map) {
      this.map.remove();
    }

    // Centrage initial sur l'Afrique
    this.map = L.map('map', { zoomControl: false }).setView([12.238, -1.561], 5);

    // Fond gris clair Esri (sans clé d'API, contrairement à CartoDB)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private displayOnMap(geoData: any) {
    const geoStyle = {
      fillColor: '#64748b',
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: 0.35
    };

    this.geoJsonLayer = L.geoJSON(geoData, {
      style: geoStyle,
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.NAME || feature.properties?.ADM0_A3_MA || 'Zone';
        layer.bindTooltip(`<strong>${name}</strong>`, { sticky: true, className: 'unofive-tooltip' });
        
        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.6, fillColor: '#d97706' });
          },
          mouseout: (e) => {
            this.geoJsonLayer.resetStyle(e.target);
          }
        });
      }
    }).addTo(this.map);

    const bounds = this.geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  private async handleFile(file: File) {
    if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
      this.messageService.add({ severity: 'error', summary: 'Format Refusé', detail: 'GeoJSON uniquement' });
      return;
    }

    this.fileName = file.name;
    this.logs = [];
    this.isProcessing = true;

    try {
      const content = await file.text();
      const geoData = JSON.parse(content);

      if (geoData.type !== 'FeatureCollection') {
        throw new Error("Le fichier n'est pas une FeatureCollection GeoJSON valide.");
      }

      
      this.previewData = geoData.features.map((feature: any) => {
      const properties = feature.properties;
      const isoCode = (properties.ADM0_A3_MA || properties.ADM0_A3 || "").toUpperCase();

      const assignedFid = AFRICA_FID_MAPPING[isoCode] || 999; 

      return {
        ...feature,
        properties: {
          ...properties,
          fid: assignedFid 
        }
      };
    });
       this.previewData = geoData.features;

      setTimeout(() => {
        this.initMap();
        this.displayOnMap(geoData);
      }, 50);

    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'Fichier invalide', detail: error.message });
      this.fileName = '';
    } finally {
      this.isProcessing = false;
    }
  }

  private executeReset() {
    this.fileName = '';
    this.previewData = [];
    this.logs = [];
    this.progress = 0;
    this.isProcessing = false;
    
    if (this.map) {
      this.map.remove();
    }

    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private addLog(message: string, type: 'info' | 'success' | 'error' | 'process' = 'info') {
    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
    this.logs.push({ time, message, type });
    setTimeout(() => {
      if (this.terminalContainer) {
        this.terminalContainer.nativeElement.scrollTop = this.terminalContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}