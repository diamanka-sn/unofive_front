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
      header: 'Confirmer l\'importation',
      message: `Voulez-vous synchroniser ces ${this.previewData.length} enregistrements avec la base de données ?`,
      icon: 'pi pi-cloud-upload',
      acceptLabel: 'Importer',
      rejectLabel: 'Vérifier encore',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: async () => {
        await this.startImportProcess();
      },
    });
  }

  private async startImportProcess() {
    this.isProcessing = true;
    this.progress = 0;
    this.addLog('Initialisation de la connexion sécurisée...', 'process');

    const chunkSize = 200;
    const totalRecords = this.previewData.length;
    const totalChunks = Math.ceil(totalRecords / chunkSize);

    try {
      for (let i = 0; i < totalRecords; i += chunkSize) {
        const chunk = this.previewData.slice(i, i + chunkSize);
        const currentBatch = Math.floor(i / chunkSize) + 1;

        this.addLog(`Transfert lot ${currentBatch}/${totalChunks}...`, 'info');

        await this.etlService.saveToDatabase(chunk).toPromise();

        this.progress = Math.round((currentBatch / totalChunks) * 100);
      }

      this.addLog('Félicitations ! Base de donnée à jour.', 'success');
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Données importées !',
      });

      setTimeout(() => this.executeReset(), 2000);
    } catch (error: any) {
      this.addLog(`Erreur réseau : ${error.message}`, 'error');
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur Serveur',
        detail: 'Injection interrompue',
      });
      this.isProcessing = false;
    }
  }

  resetETL() {
    if (this.previewData.length > 0) {
      this.confirmationService.confirm({
        header: 'Réinitialisation',
        message: 'Effacer toutes les données chargées ?',
        icon: 'pi pi-trash',
        acceptLabel: 'Oui, effacer',
        rejectLabel: 'Garder',
        acceptButtonStyleClass: 'p-button-danger p-button-text',
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
    this.messageService.add({
      severity: 'info',
      summary: 'Réinitialisé',
      detail: 'Terminal prêt',
    });
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
    this.addLog(`Fichier détecté : ${file.name}`, 'info');

    try {
      this.previewData = await this.etlService.processExcelImport(file);
      this.addLog(`Transformation réussie : ${this.previewData.length} lignes prêtes.`, 'success');
      this.messageService.add({ 
        severity: 'success', 
        summary: 'UNOFIVE ETL', 
        detail: 'Données transformées avec succès' 
      });
    } catch (error: any) {
      this.addLog(`Erreur : ${error}`, 'error');
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur Format', 
        detail: 'Le fichier Excel est invalide' 
      });
      this.fileName = '';
    } finally {
      this.isProcessing = false;
    }
  }
}
