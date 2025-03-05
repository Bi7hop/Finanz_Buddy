import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  id: string;        
  user_id: string;   
  email?: string;
  first_name?: string;
  last_name?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loadUser();
    
    this.supabaseService.supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
      }
    });
  }

  async loadUser() {
    const { data: { session } } = await this.supabaseService.supabaseClient.auth.getSession();
    if (session?.user) {
      await this.loadUserProfile(session.user.id);
    }
  }

  async loadUserProfile(userId: string) {
    try {
      // Versuche das Benutzerprofil zu laden
      const { data, error } = await this.supabaseService.supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      // Wenn kein Profil gefunden wurde, erstelle ein neues
      if (!data || data.length === 0) {
        console.log('No profile found, creating a new one');
        const { error: insertError } = await this.supabaseService.supabaseClient
          .from('profiles')
          .insert({
            user_id: userId,
            currency: 'EUR'
          });

        if (insertError) {
          console.error('Error creating missing profile:', insertError);
          return;
        }

        // Nach dem Erstellen erneut laden
        const { data: newData, error: newError } = await this.supabaseService.supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', userId);

        if (newError || !newData || newData.length === 0) {
          console.error('Error loading newly created profile:', newError);
          return;
        }

        const { data: { user } } = await this.supabaseService.supabaseClient.auth.getUser();

        const userProfile: UserProfile = {
          id: userId,
          user_id: userId,
          email: user?.email,
          ...newData[0]
        };

        this.currentUserSubject.next(userProfile);
        return;
      }

      // Wenn Profil gefunden wurde
      const { data: { user } } = await this.supabaseService.supabaseClient.auth.getUser();

      const userProfile: UserProfile = {
        id: userId,
        user_id: userId,
        email: user?.email,
        ...data[0] // Wir nehmen das erste Ergebnis
      };

      this.currentUserSubject.next(userProfile);
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  async signUp(email: string, password: string, firstName?: string, lastName?: string): Promise<{ success: boolean, error?: any }> {
    try {
      // Benutzer registrieren ohne automatisches Einloggen
      const { data, error } = await this.supabaseService.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Error in signup:', error);
        return { success: false, error };
      }

      if (!data.user) {
        return { success: false, error: new Error('No user data returned') };
      }

      // Profil mit Vor- und Nachnamen erstellen
      if (firstName || lastName) {
        const { error: profileError } = await this.supabaseService.supabaseClient
          .from('profiles')
          .insert({
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            currency: 'EUR'
          });

        if (profileError) {
          console.error('Error creating profile during signup:', profileError);
          // Wir brechen hier nicht ab, da der Benutzer bereits erstellt wurde
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return { success: false, error: err };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean, error?: any }> {
    const { data, error } = await this.supabaseService.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error };
    }

    if (data.user) {
      await this.loadUserProfile(data.user.id);
      this.router.navigate(['/dashboard']);
    }

    return { success: true };
  }

  async signOut() {
    const { error } = await this.supabaseService.supabaseClient.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<{ success: boolean, error?: any }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await this.supabaseService.supabaseClient
      .from('profiles')
      .update(profile)
      .eq('user_id', currentUser.id); 

    if (error) {
      return { success: false, error };
    }

    this.loadUserProfile(currentUser.id);
    return { success: true };
  }
}