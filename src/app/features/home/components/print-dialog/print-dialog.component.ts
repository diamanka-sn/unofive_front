import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface PrintData {
  title: string;
  description: string;
}
@Component({
  selector: 'app-print-dialog',
  standalone: false,
  templateUrl: './print-dialog.component.html',
  styleUrl: './print-dialog.component.scss'
})
export class PrintDialogComponent {
  isPrinting = false;
constructor(
    public dialogRef: MatDialogRef<PrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintData
  ) {}

 
  onNoClick(): void {
    this.dialogRef.close();
  }

  handlePrint() {
    this.isPrinting = true;
    
    setTimeout(() => {
      this.dialogRef.close(this.data);
      this.isPrinting = false;
    }, 1000); 
  }
}
