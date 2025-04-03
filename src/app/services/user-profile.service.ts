import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
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

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.initUserSettings().catch(error => {
      console.error('Fehler bei der Initialisierung der Benutzereinstellungen:', error);
    });
  }

  async loadUserProfile(): Promise<UserProfile> {
    try {
      const { data: user, error } = await this.authService.getUser();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        return this.defaultProfile;
      }
      
      if (!user || !user.user) {
        console.log('Kein Benutzer gefunden, verwende Standard-Profil');
        return this.defaultProfile;
      }
      
      const authEmail = user.user.email || '';
      
      const { data: profileData, error: profileError } = await this.supabaseService.supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Fehler beim Laden des Profils:', profileError);
        return { ...this.defaultProfile, email: authEmail };
      }
      
      if (!profileData) {
        console.log('Kein Profil gefunden, verwende Standard-Profil');
        return { ...this.defaultProfile, email: authEmail };
      }
      
      console.log('Geladene Profildaten aus der Datenbank:', profileData);
      
      const profile: UserProfile = {
        id: profileData.id,
        name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || this.defaultProfile.name,
        nickname: profileData.nickname || this.defaultProfile.nickname,
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
      const { data: user, error } = await this.authService.getUser();
      
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
        .eq('user_id', user.user.id);
      
      if (settingsError) {
        console.error('Fehler beim Laden der Einstellungen:', settingsError);
        return this.defaultSettings;
      }
      
      if (!settingsData || settingsData.length === 0) {
        console.log('Keine Einstellungen gefunden, erstelle neue Einstellungen');
        
        const newSettings = {
          user_id: user.user.id,
          dark_mode: this.defaultSettings.darkMode,
          currency: this.defaultSettings.currency,
          language: this.defaultSettings.language,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        const { data: insertedData, error: insertError } = await this.supabaseService.supabaseClient
          .from('user_settings')
          .insert(newSettings)
          .select();
          
        if (insertError) {
          console.error('Fehler beim Erstellen der Einstellungen:', insertError);
          return this.defaultSettings;
        }
        
        const insertedSettings = insertedData && insertedData.length > 0 ? insertedData[0] : null;
        
        if (insertedSettings) {
          const settings: UserSettings = {
            id: insertedSettings.id,
            user_id: insertedSettings.user_id,
            darkMode: insertedSettings.dark_mode,
            currency: insertedSettings.currency || this.defaultSettings.currency,
            language: insertedSettings.language || this.defaultSettings.language
          };
          
          this.userSettingsSubject.next(settings);
          localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
          this.applySettings(settings);
          
          return settings;
        }
        
        return this.defaultSettings;
      }
      
      const settingsItem = settingsData[0];
      
      const settings: UserSettings = {
        id: settingsItem.id,
        user_id: settingsItem.user_id,
        darkMode: settingsItem.dark_mode === undefined ? this.defaultSettings.darkMode : settingsItem.dark_mode,
        currency: settingsItem.currency || this.defaultSettings.currency,
        language: settingsItem.language || this.defaultSettings.language
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
    
    setTimeout(() => {
      this.loadUserProfile().catch(err => console.error('Fehler beim asynchronen Laden des Profils:', err));
    }, 300);
    
    return cachedProfile;
  }

  getUserSettings(): UserSettings {
    const storedSettings = localStorage.getItem(this.SETTINGS_KEY);
    const cachedSettings = storedSettings ? JSON.parse(storedSettings) : this.defaultSettings;
    
    setTimeout(() => {
      this.loadUserSettings().catch(err => console.error('Fehler beim asynchronen Laden der Einstellungen:', err));
    }, 600);
    
    return cachedSettings;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const { data: user, error } = await this.authService.getUser();
      
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
      
      const { data: existingProfile } = await this.supabaseService.supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.user.id);
      
      let operation;
      
      if (!existingProfile || existingProfile.length === 0) {
        operation = this.supabaseService.supabaseClient
          .from('profiles')
          .insert({
            user_id: user.user.id,
            first_name: firstName,
            last_name: lastName,
            nickname: profile.nickname,
            email: profile.email,
            currency: profile.currency || 'EUR',
            avatar_url: profile.avatar_url,
            created_at: new Date(),
            updated_at: new Date()
          });
      } else {
        operation = this.supabaseService.supabaseClient
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            nickname: profile.nickname,
            email: profile.email,
            currency: profile.currency || 'EUR',
            avatar_url: profile.avatar_url,
            updated_at: new Date()
          })
          .eq('user_id', user.user.id);
      }
      
      const { error: upsertError } = await operation;
      
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
      const { data: user, error } = await this.authService.getUser();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        return;
      }
      
      if (!user || !user.user) {
        console.error('Kein Benutzer gefunden, Einstellungen können nicht gespeichert werden');
        return;
      }
      
      const { data: existingSettings } = await this.supabaseService.supabaseClient
        .from('user_settings')
        .select('id')
        .eq('user_id', user.user.id);
      
      let operation;
      
      if (!existingSettings || existingSettings.length === 0) {
        operation = this.supabaseService.supabaseClient
          .from('user_settings')
          .insert({
            user_id: user.user.id,
            dark_mode: settings.darkMode,
            currency: settings.currency,
            language: settings.language,
            created_at: new Date(),
            updated_at: new Date()
          });
      } else {
        operation = this.supabaseService.supabaseClient
          .from('user_settings')
          .update({
            dark_mode: settings.darkMode,
            currency: settings.currency,
            language: settings.language,
            updated_at: new Date()
          })
          .eq('user_id', user.user.id);
      }
      
      const { error: updateError } = await operation;
      
      if (updateError) {
        console.error('Fehler beim Speichern der Einstellungen:', updateError);
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

  async initUserSettings(): Promise<void> {
    try {
      const storedSettings = localStorage.getItem(this.SETTINGS_KEY);
      if (storedSettings) {
        const cachedSettings = JSON.parse(storedSettings);
        this.applySettings(cachedSettings);
      } else {
        this.applySettings(this.defaultSettings);
      }
      
      if (!this.supabaseService.supabaseClient.auth.getSession()) {
        return;
      }
      
      setTimeout(async () => {
        try {
          const settings = await this.loadUserSettings();
          this.applySettings(settings);
        } catch (e) {
          console.error('Fehler beim verzögerten Laden der Einstellungen:', e);
        }
      }, 2000); 
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Benutzereinstellungen:', error);
      this.applySettings(this.defaultSettings);
    }
  }
}