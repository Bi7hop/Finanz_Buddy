import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id?: string;
  name: string;
  nickname: string;
  email: string;
  avatar_url?: string;
  currency?: 'EUR' | 'USD';
}

export interface UserSettings {
  id?: string;
  user_id?: string;
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
    name: 'Benutzer',
    nickname: 'Benutzer',
    email: '',
    currency: 'EUR'
  };

  private defaultSettings: UserSettings = {
    darkMode: false,
    currency: 'EUR',
    language: 'de'
  };

  private userProfileSubject = new BehaviorSubject<UserProfile>(this.defaultProfile);
  private userSettingsSubject = new BehaviorSubject<UserSettings>(this.defaultSettings);

  userProfile$ = this.userProfileSubject.asObservable();
  userSettings$ = this.userSettingsSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.initUserSettings();
  }

  async loadUserProfile(): Promise<UserProfile> {
    try {
      const { data: user, error } = await this.supabaseService.supabaseClient.auth.getUser();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        return this.defaultProfile;
      }
      
      if (!user || !user.user) {
        console.log('Kein Benutzer gefunden, verwende Standard-Profil');
        return this.defaultProfile;
      }
      
      // Benutze die E-Mail aus der Authentifizierung als Backup
      const authEmail = user.user.email || '';
      
      const { data: profileData, error: profileError } = await this.supabaseService.supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();
      
      if (profileError) {
        console.error('Fehler beim Laden des Profils:', profileError);
        // Verwende die E-Mail aus der Authentifizierung, wenn das Profil nicht geladen werden kann
        return { ...this.defaultProfile, email: authEmail };
      }
      
      if (!profileData) {
        console.log('Kein Profil gefunden, verwende Standard-Profil');
        // Verwende die E-Mail aus der Authentifizierung, wenn kein Profil gefunden wurde
        return { ...this.defaultProfile, email: authEmail };
      }
      
      // Debug: Log das gesamte Profil aus der Datenbank
      console.log('Geladene Profildaten aus der Datenbank:', profileData);
      
      const profile: UserProfile = {
        id: profileData.id,
        name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || this.defaultProfile.name,
        nickname: profileData.nickname || this.defaultProfile.nickname,
        // Verwende die E-Mail aus dem Profil ODER aus der Auth ODER den Standardwert
        email: profileData.email || authEmail || this.defaultProfile.email,
        avatar_url: profileData.avatar_url,
        currency: profileData.currency || this.defaultProfile.currency
      };
      
      console.log('Konstruiertes Profil-Objekt:', profile);
      
      this.userProfileSubject.next(profile);
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
      
      return profile;
    } catch (error) {
      console.error('Unerwarteter Fehler beim Laden des Profils:', error);
      return this.defaultProfile;
    }
  }

  async loadUserSettings(): Promise<UserSettings> {
    try {
      const { data: user, error } = await this.supabaseService.supabaseClient.auth.getUser();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        return this.defaultSettings;
      }
      
      if (!user || !user.user) {
        console.log('Kein Benutzer gefunden, verwende Standard-Einstellungen');
        return this.defaultSettings;
      }
      
      const { data: settingsData, error: settingsError } = await this.supabaseService.supabaseClient
        .from('user_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .single();
      
      if (settingsError) {
        console.error('Fehler beim Laden der Einstellungen:', settingsError);
        return this.defaultSettings;
      }
      
      if (!settingsData) {
        console.log('Keine Einstellungen gefunden, verwende Standard-Einstellungen');
        return this.defaultSettings;
      }
      
      const settings: UserSettings = {
        id: settingsData.id,
        user_id: settingsData.user_id,
        darkMode: settingsData.dark_mode === undefined ? this.defaultSettings.darkMode : settingsData.dark_mode,
        currency: settingsData.currency || this.defaultSettings.currency,
        language: settingsData.language || this.defaultSettings.language
      };
      
      this.userSettingsSubject.next(settings);
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      this.applySettings(settings);
      
      return settings;
    } catch (error) {
      console.error('Unerwarteter Fehler beim Laden der Einstellungen:', error);
      return this.defaultSettings;
    }
  }

  getUserProfile(): UserProfile {
    const storedProfile = localStorage.getItem(this.PROFILE_KEY);
    const cachedProfile = storedProfile ? JSON.parse(storedProfile) : this.defaultProfile;
    
    this.loadUserProfile();
    
    return cachedProfile;
  }

  getUserSettings(): UserSettings {
    const storedSettings = localStorage.getItem(this.SETTINGS_KEY);
    const cachedSettings = storedSettings ? JSON.parse(storedSettings) : this.defaultSettings;
    
    this.loadUserSettings();
    
    return cachedSettings;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const { data: user, error } = await this.supabaseService.supabaseClient.auth.getUser();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        return;
      }
      
      if (!user || !user.user) {
        console.error('Kein Benutzer gefunden, Profil kann nicht gespeichert werden');
        return;
      }
      
      const nameParts = profile.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      const { error: upsertError } = await this.supabaseService.supabaseClient
        .from('profiles')
        .upsert({
          user_id: user.user.id,
          first_name: firstName,
          last_name: lastName,
          nickname: profile.nickname,
          email: profile.email,
          currency: profile.currency || 'EUR',
          avatar_url: profile.avatar_url,
          updated_at: new Date()
        });
      
      if (upsertError) {
        console.error('Fehler beim Speichern des Profils:', upsertError);
        return;
      }
      
      this.userProfileSubject.next(profile);
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
      
    } catch (error) {
      console.error('Unerwarteter Fehler beim Speichern des Profils:', error);
    }
  }


  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      const { data: user, error } = await this.supabaseService.supabaseClient.auth.getUser();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        return;
      }
      
      if (!user || !user.user) {
        console.error('Kein Benutzer gefunden, Einstellungen können nicht gespeichert werden');
        return;
      }
      
      const { error: upsertError } = await this.supabaseService.supabaseClient
        .from('user_settings')
        .upsert({
          user_id: user.user.id,
          dark_mode: settings.darkMode,
          currency: settings.currency,
          language: settings.language,
          updated_at: new Date()
        });
      
      if (upsertError) {
        console.error('Fehler beim Speichern der Einstellungen:', upsertError);
        return;
      }
      
      this.userSettingsSubject.next(settings);
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      
      this.applySettings(settings);
      
    } catch (error) {
      console.error('Unerwarteter Fehler beim Speichern der Einstellungen:', error);
    }
  }

  private applySettings(settings: UserSettings): void {
    document.body.classList.toggle('dark-theme', settings.darkMode);
    
    console.log(`Währung auf ${settings.currency} gesetzt`);
    console.log(`Sprache auf ${settings.language} gesetzt`);
  }

  initUserSettings(): void {
    const settings = this.getUserSettings();
    this.applySettings(settings);
  }
}