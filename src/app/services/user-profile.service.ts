import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly PROFILE_KEY = 'user_profile';
  private readonly SETTINGS_KEY = 'user_settings';

  private defaultProfile: UserProfile = {
    name: 'Marcel Menke',
    nickname: 'Bi7hop',
    email: 'marcel.menke1981@gmail.com'
  };

  private defaultSettings: UserSettings = {
    darkMode: true,
    currency: 'EUR',
    language: 'de'
  };

  constructor() {
    this.initUserSettings();
  }

  getUserProfile(): UserProfile {
    const storedProfile = localStorage.getItem(this.PROFILE_KEY);
    return storedProfile ? JSON.parse(storedProfile) : this.defaultProfile;
  }

  /**
   * Benutzereinstellungen aus dem LocalStorage laden oder Standard-Einstellungen zurückgeben
   */
  getUserSettings(): UserSettings {
    const storedSettings = localStorage.getItem(this.SETTINGS_KEY);
    return storedSettings ? JSON.parse(storedSettings) : this.defaultSettings;
  }

  /**
   * Benutzerprofil im LocalStorage speichern
   */
  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  /**
   * Benutzereinstellungen im LocalStorage speichern
   */
  saveUserSettings(settings: UserSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    
    // Wende Einstellungen an (Darkmode, Währung, Sprache)
    this.applySettings(settings);
  }

  /**
   * Einstellungen in der App anwenden
   */
  private applySettings(settings: UserSettings): void {
    document.body.classList.toggle('dark-theme', settings.darkMode);
    
    console.log(`Währung auf ${settings.currency} gesetzt`);
    console.log(`Sprache auf ${settings.language} gesetzt`);
    
  }

  /**
   * Initialisiere die Benutzereinstellungen beim App-Start
   */
  initUserSettings(): void {
    const settings = this.getUserSettings();
    this.applySettings(settings);
  }
}