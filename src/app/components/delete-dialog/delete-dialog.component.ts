import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

export interface DeleteDialogData {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
  itemType: 'Einnahme' | 'Ausgabe' | 'Budget' | 'Eintrag' | 'Sparziel' | 'Transaktion';
}

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    MatDividerModule
  ]
})
export class DeleteDialogComponent {
  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogData
  ) {
  
    this.dialogRef.disableClose = false;
    
    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape' && this.isDeleting()) {
        event.preventDefault();
      }
    });
  }

  onCancelClick(): void {
    if (!this.isDeleting()) {
      this.dialogRef.close(false);
    }
  }

  onConfirmClick(): void {
    if (this.isDeleting()) return;
    
    this.isDeleting.set(true);
    this.errorMessage.set(null);
    
    setTimeout(() => {
      this.dialogRef.close(true);
      
    
    }, 1000);
  }

  dismissError(): void {
    this.errorMessage.set(null);
  }
}