import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiKeyInfo, UserService } from '@/app/core/services/user.service';
import { AuthService } from '@/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent implements OnInit {
  user: any = null;

  apiKey: ApiKeyInfo | null = null;
  newKey: string | null = null;
  apiKeyBusy = false;

  deleteDialogOpen = false;
  deletePassword = '';
  deleteError = '';
  deleting = false;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  openDeleteDialog() {
    this.deletePassword = '';
    this.deleteError = '';
    this.deleteDialogOpen = true;
  }

  deleteAccount() {
    if (!this.deletePassword || this.deleting) return;
    this.deleting = true;
    this.deleteError = '';
    this.userService.deleteMyAccount(this.deletePassword).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteDialogOpen = false;
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = err?.error?.message || 'La suppression a échoué. Réessayez plus tard.';
      }
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getUserInfo();
    this.loadApiKey();
  }

  loadApiKey() {
    this.userService.getApiKey().subscribe({
      next: (info) => this.apiKey = info,
      error: () => this.apiKey = { hasKey: false, prefix: null, createdAt: null }
    });
  }

  generateApiKey() {
    if (!this.apiKey?.hasKey) {
      this.doGenerateApiKey();
      return;
    }
    this.confirmationService.confirm({
      header: 'Remplacer la clé',
      message: 'Une nouvelle clé va être créée. L\'ancienne cessera immédiatement de fonctionner.',
      icon: 'pi pi-refresh',
      acceptLabel: 'Remplacer',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-text text-slate-600',
      accept: () => this.doGenerateApiKey()
    });
  }

  private doGenerateApiKey() {
    this.apiKeyBusy = true;
    this.userService.createApiKey().subscribe({
      next: (res) => {
        this.newKey = res.key;
        this.apiKey = { hasKey: true, prefix: res.prefix, createdAt: res.createdAt };
        this.apiKeyBusy = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer la clé.' });
        this.apiKeyBusy = false;
      }
    });
  }

  revokeApiKey() {
    this.confirmationService.confirm({
      header: 'Révoquer la clé',
      message: 'Les applications qui utilisent cette clé ne pourront plus accéder aux données.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Révoquer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text text-slate-600',
      accept: () => {
        this.userService.revokeApiKey().subscribe({
          next: () => {
            this.apiKey = { hasKey: false, prefix: null, createdAt: null };
            this.newKey = null;
            this.messageService.add({ severity: 'success', summary: 'Clé révoquée', detail: 'La clé ne fonctionne plus.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de révoquer la clé.' })
        });
      }
    });
  }

  copyKey() {
    if (!this.newKey) return;
    navigator.clipboard.writeText(this.newKey).then(
      () => this.messageService.add({ severity: 'success', summary: 'Copiée', detail: 'La clé est dans le presse-papiers.' }),
      () => this.messageService.add({ severity: 'warn', summary: 'Copie impossible', detail: 'Sélectionnez la clé et copiez-la manuellement.' })
    );
  }
}