import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DeleteDialogComponent, DeleteDialogData } from '../../app/components/delete-dialog/delete-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Öffnet einen Bestätigungsdialog zum Löschen
   * @param itemType Art des Elements, das gelöscht wird
   * @param customMessage Optional: Benutzerdefinierte Nachricht
   * @returns Observable<boolean> - true wenn bestätigt, false wenn abgebrochen
   */
  openDeleteDialog(
    itemType: 'Einnahme' | 'Ausgabe' | 'Budget' | 'Eintrag' = 'Eintrag',
    customMessage?: string
  ): Observable<boolean> {
    const messages = {
      Einnahme: 'Möchtest du diese Einnahme wirklich löschen?',
      Ausgabe: 'Möchtest du diese Ausgabe wirklich löschen?',
      Budget: 'Möchtest du dieses Budget wirklich löschen?',
      Eintrag: 'Möchtest du diesen Eintrag wirklich löschen?'
    };

    const data: DeleteDialogData = {
      title: `${itemType} löschen`,
      message: customMessage || messages[itemType],
      confirmButtonText: 'Löschen',
      cancelButtonText: 'Abbrechen',
      itemType
    };

    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data,
      width: '400px',
      disableClose: true // Verhindert das Schließen durch Klicken außerhalb des Dialogs
    });

    return dialogRef.afterClosed();
  }
}