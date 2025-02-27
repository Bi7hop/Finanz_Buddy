import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  private dialog = inject(MatDialog);
  private userProfileService = inject(UserProfileService);

  openProfileDialog(): void {
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '450px',
      panelClass: ['custom-dialog', 'dark-theme'],
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog geschlossen mit:', result);
      }
    });
  }
}