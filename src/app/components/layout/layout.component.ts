import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { UserProfileService } from '../../services/user-profile.service';
import { filter } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

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
  private titleService = inject(Title);
  private renderer = inject(Renderer2);

  showUnimplementedFeatures = false;
  currentPageTitle = 'Dashboard';

  mainMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', implemented: true },
    { path: '/einnahmen', icon: 'arrow_upward', label: 'Einnahmen', implemented: true },
    { path: '/ausgaben', icon: 'arrow_downward', label: 'Ausgaben', implemented: true },
    { path: '/sparziele', icon: 'savings', label: 'Sparziele', implemented: true },
    { path: '/budget', icon: 'calculate', label: 'Budget', implemented: true },
    { path: '/dauerauftraege', icon: 'schedule', label: 'Daueraufträge', implemented: false },
    { path: '/banking', icon: 'account_balance', label: 'Banking', implemented: false }
  ];

  analyticsMenuItems: MenuItem[] = [
    { path: '/buchungen', icon: 'account_balance_wallet', label: 'Buchungen', implemented: false },
    { path: '/kredite', icon: 'person', label: 'Kredite', implemented: false },
    { path: '/berichte', icon: 'description', label: 'Berichte', implemented: false },
    { path: '/verteilung', icon: 'pie_chart', label: 'Verteilung', implemented: false },
    { path: '/statistiken', icon: 'bar_chart', label: 'Statistiken', implemented: true },
    { path: '/einstellungen', icon: 'settings', label: 'Einstellungen', implemented: false },
    { path: '/handbuch', icon: 'help', label: 'Handbuch', implemented: false }
  ];

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const currentRoute = this.router.url;
      const allMenuItems = [...this.mainMenuItems, ...this.analyticsMenuItems];
      const currentMenuItem = allMenuItems.find(item => item.path === currentRoute);
      
      if (currentMenuItem) {
        this.currentPageTitle = currentMenuItem.label;
        this.titleService.setTitle(`Finanz Buddy - ${currentMenuItem.label}`);
      }
    });
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
    
    if (this.showUnimplementedFeatures) {
      setTimeout(() => {
        const notImplementedItems = document.querySelectorAll('.nav-item.not-implemented');
        notImplementedItems.forEach((item, index) => {
          this.renderer.setStyle(item, 'animation-delay', `${index * 0.15}s`);
          this.renderer.addClass(item, 'animate-in');
        });
      }, 10);
    } else {
      const animatedItems = document.querySelectorAll('.nav-item.animate-in');
      animatedItems.forEach(item => {
        this.renderer.removeClass(item, 'animate-in');
        this.renderer.removeStyle(item, 'animation-delay');
      });
    }
  }
}