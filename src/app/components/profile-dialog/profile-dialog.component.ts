import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { UserProfileService } from '../../services/user-profile.service';

export interface UserProfile {
  name: string;
  nickname: string;
  email: string;
}

export interface UserSettings {
  darkMode: boolean;
  currency: 'EUR' | 'USD';
  language: 'de' | 'en';
}

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
export class ProfileDialogComponent implements OnInit {
  private userProfileService = inject(UserProfileService);
  private dialogRef = inject(MatDialogRef<ProfileDialogComponent>);
  
  userProfile: UserProfile = {
    name: 'Marcel Menke',
    nickname: 'Bi7hop',
    email: 'marcel.menke1981@gmail.com'
  };

  userSettings: UserSettings = {
    darkMode: true,
    currency: 'EUR',
    language: 'de'
  };

  ngOnInit(): void {
    this.userProfile = this.userProfileService.getUserProfile();
    this.userSettings = this.userProfileService.getUserSettings();
    console.log('Geladenes Profil:', this.userProfile);
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

  saveSettings(): void {
    this.userProfileService.saveUserProfile(this.userProfile);
    this.userProfileService.saveUserSettings(this.userSettings);
    
    this.dialogRef.close({
      profile: this.userProfile,
      settings: this.userSettings
    });
  }
}