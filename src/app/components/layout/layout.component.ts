import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { UserProfileService } from '../../services/user-profile.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  implemented: boolean;
}

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
export class LayoutComponent implements OnInit {
  private dialog = inject(MatDialog);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);

  showUnimplementedFeatures = false;

  menuItems: MenuItem[] = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', implemented: true },
    { path: '/einnahmen', icon: 'arrow_upward', label: 'Einnahmen', implemented: true },
    { path: '/ausgaben', icon: 'arrow_downward', label: 'Ausgaben', implemented: true },
    { path: '/sparziele', icon: 'savings', label: 'Sparziele', implemented: true },
    { path: '/buchungen', icon: 'account_balance_wallet', label: 'Buchungen', implemented: false },
    { path: '/budget', icon: 'calculate', label: 'Budget', implemented: true },
    { path: '/dauerauftraege', icon: 'schedule', label: 'Daueraufträge', implemented: false },
    { path: '/banking', icon: 'account_balance', label: 'Banking', implemented: false },
    { path: '/kredite', icon: 'person', label: 'Kredite', implemented: false },
    { path: '/berichte', icon: 'description', label: 'Berichte', implemented: false },
    { path: '/verteilung', icon: 'pie_chart', label: 'Verteilung', implemented: false },
    { path: '/statistiken', icon: 'bar_chart', label: 'Statistiken', implemented: true },
    { path: '/einstellungen', icon: 'settings', label: 'Einstellungen', implemented: false },
    { path: '/handbuch', icon: 'help', label: 'Handbuch', implemented: false }
  ];

  ngOnInit(): void {
    
  }

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

  toggleUnimplementedFeatures(): void {
    this.showUnimplementedFeatures = !this.showUnimplementedFeatures;
  }
}