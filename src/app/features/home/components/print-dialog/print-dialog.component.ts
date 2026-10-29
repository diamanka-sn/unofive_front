import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PrintData {
  title: string;
  description: string;
  // Rappel de ce qui est affiché sur la carte (non modifiable)
  summary: string;
  framing: 'africa' | 'current';
  orientation: 'landscape' | 'portrait';
}

@Component({
  selector: 'app-print-dialog',
  standalone: false,
  templateUrl: './print-dialog.component.html',
  styleUrl: './print-dialog.component.scss'
})
export class PrintDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintData
  ) {}

  confirm(): void {
    if (!this.data.title.trim()) return;
    this.dialogRef.close({ ...this.data, title: this.data.title.trim(), description: this.data.description.trim() });
  }
}
