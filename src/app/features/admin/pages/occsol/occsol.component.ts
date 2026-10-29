import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Subscription, timer, switchMap, takeWhile } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OccsolImportJob, OccsolService } from '@/app/core/services/occsol.service';

interface YearRow { year: number; polygons: number; km2: number }

@Component({
  selector: 'app-occsol',
  standalone: false,
  templateUrl: './occsol.component.html',
})
export class OccsolComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  years: YearRow[] = [];
  loadingYears = true;

  file: File | null = null;
  year: number | null = null;
  isDragging = false;
  uploadProgress = 0;
  job: OccsolImportJob | null = null;
  error = '';
  private sub?: Subscription;

  constructor(
    private occsolService: OccsolService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadYears();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get busy(): boolean {
    return (this.uploadProgress > 0 && !this.job) || this.job?.status === 'running';
  }

  loadYears() {
    this.loadingYears = true;
    this.occsolService.getStats().subscribe((stats) => {
      this.years = (stats?.years ?? []).map((year) => ({
        year,
        polygons: stats!.classes.reduce((s, c) => s + (c.counts[year] ?? 0), 0),
        km2: stats!.classes.reduce((s, c) => s + (c.areas[year] ?? 0), 0),
      }));
      this.loadingYears = false;
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectFile(file);
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectFile(file);
  }

  private selectFile(file: File) {
    if (!/\.(geo)?json$/i.test(file.name)) {
      this.messageService.add({ severity: 'error', summary: 'Format refusé', detail: 'Fichier .geojson attendu.' });
      return;
    }
    this.file = file;
    this.job = null;
    this.error = '';
    this.uploadProgress = 0;
    // Année lue dans le nom du fichier (ex. occsol_2020.geojson), modifiable
    const match = /(19|20)\d{2}/.exec(file.name);
    this.year = match ? Number(match[0]) : null;
  }

  reset() {
    this.file = null;
    this.year = null;
    this.job = null;
    this.error = '';
    this.uploadProgress = 0;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  confirmImport() {
    if (!this.file || !this.year) return;
    const replaces = this.years.some((y) => y.year === this.year);
    this.confirmationService.confirm({
      header: "Confirmer l'import",
      message: replaces
        ? `Les données ${this.year} déjà en base seront remplacées par celles de ${this.file.name}, si l'import réussit.`
        : `Importer ${this.file.name} comme occupation du sol ${this.year} ?`,
      acceptLabel: 'Importer',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => this.startImport(),
    });
  }

  private startImport() {
    this.error = '';
    this.uploadProgress = 1;
    this.sub = this.occsolService.importFile(this.file!, this.year!).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.max(1, Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploadProgress = 100;
          this.job = event.body;
          this.follow(event.body.id);
        }
      },
      error: (err) => {
        this.uploadProgress = 0;
        this.error = err?.error?.message || "L'envoi du fichier a échoué.";
      },
    });
  }

  // Le traitement continue côté serveur : on interroge son état chaque seconde
  private follow(id: string) {
    this.sub = timer(1000, 1000)
      .pipe(
        switchMap(() => this.occsolService.getImport(id)),
        takeWhile((job) => job.status === 'running', true)
      )
      .subscribe({
        next: (job) => {
          this.job = job;
          if (job.status === 'done') {
            this.messageService.add({ severity: 'success', summary: 'Import terminé', detail: `${job.year} : ${job.result?.polygons} polygones` });
            this.loadYears();
          }
        },
        error: (err) => (this.error = err?.error?.message || "Impossible de suivre l'import."),
      });
  }

  confirmDelete(row: YearRow) {
    this.confirmationService.confirm({
      header: `Supprimer ${row.year} ?`,
      message: `Les ${row.polygons.toLocaleString('fr-FR')} polygones de ${row.year} seront supprimés de la base et de la carte.`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () =>
        this.occsolService.deleteYear(row.year).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: `Occupation du sol ${row.year}` });
            this.loadYears();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Échec', detail: err?.error?.message }),
        }),
    });
  }
}
