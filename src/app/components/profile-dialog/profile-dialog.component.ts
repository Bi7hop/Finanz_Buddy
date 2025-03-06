import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { UserProfileService } from '../../services/user-profile.service';
import { UserProfile, UserSettings } from '../../services/user-profile.service';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatButtonToggleModule
  ],
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.scss']
})
export class ProfileDialogComponent implements OnInit, OnDestroy {
  private userProfileService = inject(UserProfileService);
  private supabaseService = inject(SupabaseService);
  private dialogRef = inject(MatDialogRef<ProfileDialogComponent>);
  private router = inject(Router);
  private subscriptions = new Subscription();
  
  userProfile: UserProfile = {
    name: '',
    nickname: '',
    email: ''
  };

  userSettings: UserSettings = {
    darkMode: false,
    currency: 'EUR',
    language: 'de'
  };

  loading = true;

  ngOnInit(): void {
    // Lokale Kopie aus dem Cache laden für schnelle erste Anzeige
    this.userProfile = this.userProfileService.getUserProfile();
    this.userSettings = this.userProfileService.getUserSettings();
    console.log('Geladenes Profil:', this.userProfile);
    
    // Aktive Daten aus Supabase laden
    this.loadProfileData();
    
    this.subscriptions.add(
      this.userProfileService.userProfile$.subscribe(profile => {
        this.userProfile = profile;
        this.loading = false;
      })
    );
    
    this.subscriptions.add(
      this.userProfileService.userSettings$.subscribe(settings => {
        this.userSettings = settings;
        this.loading = false;
      })
    );
  }

  async loadProfileData(): Promise<void> {
    try {
      // Parallel laden der Profil- und Einstellungsdaten von Supabase
      const [profileData, settingsData] = await Promise.all([
        this.userProfileService.loadUserProfile(),
        this.userProfileService.loadUserSettings()
      ]);
      
      // Direkt lokale Objekte aktualisieren
      this.userProfile = profileData;
      this.userSettings = settingsData;
    } catch (error) {
      console.error('Fehler beim Laden der Profildaten:', error);
    } finally {
      // Loading-State auf false setzen, unabhängig davon ob erfolgreich oder nicht
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateDarkMode(value: boolean): void {
    this.userSettings.darkMode = value;
  }

  updateCurrency(value: 'EUR' | 'USD'): void {
    this.userSettings.currency = value;
  }

  updateLanguage(value: 'de' | 'en'): void {
    this.userSettings.language = value;
  }

  async saveSettings(): Promise<void> {
    await this.userProfileService.saveUserProfile(this.userProfile);
    await this.userProfileService.saveUserSettings(this.userSettings);
    
    this.dialogRef.close({
      profile: this.userProfile,
      settings: this.userSettings
    });
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseService.supabaseClient.auth.signOut();
      this.dialogRef.close();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  }
}