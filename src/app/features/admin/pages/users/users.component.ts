import { Component, OnInit } from '@angular/core';
import { UserService } from '@/app/core/services/user.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  loading = true;
  search = '';

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.readAll('users').subscribe({
      next: (data) => {
        this.users = data ?? [];
        this.filtered = [...this.users];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(value: string): void {
    const q = value.toLowerCase();
    this.filtered = this.users.filter(u =>
      u.nom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }

  confirmDelete(user: any): void {
    this.confirmationService.confirm({
      header: 'Supprimer l\'utilisateur',
      message: `Supprimer définitivement le compte de <strong>${user.nom}</strong> ?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      accept: () => {
        this.userService.delete(`users/${user.id}`).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.filtered = this.filtered.filter(u => u.id !== user.id);
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: `${user.nom} a été supprimé.` });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression impossible.' });
          }
        });
      }
    });
  }

  getInitials(nom: string): string {
    return nom?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??';
  }
}
