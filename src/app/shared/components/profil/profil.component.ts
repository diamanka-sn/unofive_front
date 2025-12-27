import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent implements OnInit {
  settingsForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      nom: ['Mouhamadou Diamanka', Validators.required],
      email: ['m.diamanka@unofive.sn', [Validators.required, Validators.email]]
    });
  }

  saveInfo() {
    if (this.settingsForm.valid) {
      // Logique de sauvegarde
      this.messageService.add({severity:'success', summary: 'Succès', detail: 'Informations mises à jour'});
    }
  }

  confirmDelete() {
    this.confirmationService.confirm({
      message: 'Êtes-vous absolument sûr de vouloir supprimer votre compte ? Toutes vos données de chercheur seront définitivement effacées des serveurs de UnoFive.',
      header: 'Confirmation de suppression critique',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer mon compte',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text text-slate-600',
      accept: () => {
        this.executeDelete();
      }
    });
  }

  executeDelete() {
    console.log('Action de suppression irréversible exécutée.');
    // Appel vers votre API de suppression
  }
}