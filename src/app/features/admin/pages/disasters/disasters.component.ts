import { Component, ElementRef, ViewChild } from '@angular/core';
import { EtlService } from '@/app/core/services/etl.service';
import { MessageService, ConfirmationService } from 'primeng/api';

interface EtlLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'process';
}

@Component({
  selector: 'app-disasters',
  standalone: false,
  templateUrl: './disasters.component.html',
  styleUrl: './disasters.component.scss',
})
export class DisastersComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('terminalScroll') private terminalContainer!: ElementRef;

  logs: EtlLog[] = [];
  previewData: any[] = [];
  isProcessing = false;
  progress: number = 0;
  fileName: string = '';
  isDragging = false;
  constructor(
    private etlService: EtlService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  private addLog(
    message: string,
    type: 'info' | 'success' | 'error' | 'process' = 'info'
  ) {
    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
    this.logs.push({ time, message, type });

    setTimeout(() => {
      if (this.terminalContainer) {
        this.terminalContainer.nativeElement.scrollTop =
          this.terminalContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

   async onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      await this.handleFile(file);
    }
  }

  uploadToDatabase() {
    if (this.previewData.length === 0) return;

    this.confirmationService.confirm({
      header: 'Confirmer l\'import',
      message: `Importer ${this.previewData.length} lignes dans la base ? Les événements déjà présents seront mis à jour.`,
      icon: 'pi pi-upload',
      acceptLabel: 'Importer',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: async () => {
        await this.startImportProcess();
      },
    });
  }

  private async startImportProcess() {
    this.isProcessing = true;
    this.progress = 0;
    this.addLog('Import démarré.', 'process');

    const chunkSize = 50;
    const totalRecords = this.previewData.length;
    const totalChunks = Math.ceil(totalRecords / chunkSize);

    const skippedIsos = new Set<string>();
    const totals = { inserted: 0, updated: 0, unchanged: 0 };

    try {
      for (let i = 0; i < totalRecords; i += chunkSize) {
        const chunk = this.previewData.slice(i, i + chunkSize);
        const currentBatch = Math.floor(i / chunkSize) + 1;

        this.addLog(`Lot ${currentBatch}/${totalChunks} envoyé.`, 'info');

        const res: any = await this.etlService.saveToDatabase(chunk).toPromise();
        totals.inserted += res?.inserted ?? 0;
        totals.updated += res?.updated ?? 0;
        totals.unchanged += res?.unchanged ?? 0;
        (res?.skipped ?? []).forEach((iso: string) => skippedIsos.add(iso));

        this.progress = Math.round((currentBatch / totalChunks) * 100);
      }

      if (skippedIsos.size > 0) {
        this.addLog(`Lignes ignorées, pays absent de la base : ${[...skippedIsos].join(', ')}`, 'error');
      }
      const summary = `${totals.inserted} ajoutées, ${totals.updated} mises à jour, ${totals.unchanged} déjà à jour (non modifiées)`;
      this.addLog(`Import terminé : ${summary}.`, 'success');
      this.messageService.add({
        severity: 'success',
        summary: 'Import terminé',
        detail: summary,
      });
      this.isProcessing = false;
    } catch (error: any) {
      const serverMsg = error?.error?.message || error?.error?.error || error.message;
      this.addLog(`Erreur serveur (${error?.status ?? '?'}) : ${serverMsg}`, 'error');
      this.messageService.add({
        severity: 'error',
        summary: 'Import interrompu',
        detail: serverMsg,
      });
      this.isProcessing = false;
    }
  }

  resetETL() {
    if (this.previewData.length > 0) {
      this.confirmationService.confirm({
        header: 'Changer de fichier',
        message: 'Le fichier chargé et son aperçu seront retirés.',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Continuer',
        rejectLabel: 'Annuler',
        rejectButtonStyleClass: 'p-button-secondary p-button-text',
        accept: () => this.executeReset(),
      });
    } else {
      this.executeReset();
    }
  }

  private executeReset() {
    this.fileName = '';
    this.previewData = [];
    this.logs = [];
    this.progress = 0;
    this.isProcessing = false;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

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
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private async handleFile(file: File) {
    // Vérification du type de fichier
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Fichier invalide', 
        detail: 'Veuillez choisir un fichier Excel (.xlsx, .xls)' 
      });
      return;
    }

    this.fileName = file.name;
    this.logs = [];
    this.isProcessing = true;

    try {
      this.previewData = await this.etlService.processExcelImport(file);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Fichier illisible',
        detail: String(error)
      });
      this.fileName = '';
    } finally {
      this.isProcessing = false;
    }
  }
}
