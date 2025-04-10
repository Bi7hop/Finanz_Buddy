import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';

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
  private currentUserProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUserProfile$: Observable<UserProfile | null> = this.currentUserProfileSubject.asObservable();
  
  private currentSupabaseUserSubject = new BehaviorSubject<User | null>(null);
  public currentSupabaseUser$: Observable<User | null> = this.currentSupabaseUserSubject.asObservable();
  public isLoggedIn$: Observable<boolean> = this.currentSupabaseUserSubject.pipe(map(user => !!user));

  private supabase: SupabaseClient;
  private userCache: { user: User } | null = null;
  private lastCacheTime: number = 0;
  private authLock = false;
  private authQueue: (() => void)[] = [];

  private readonly GUEST_EMAIL = environment.guestMode.guestEmail; 
  private readonly GUEST_PASSWORD = environment.guestMode.guestPassword; 
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.supabase = this.supabaseService.supabaseClient; // Korrigiert
    this.loadInitialSession();
    
    this.supabase.auth.onAuthStateChange((event, session) => {
      const supabaseUser = session?.user ?? null;
      this.currentSupabaseUserSubject.next(supabaseUser);
      this.userCache = supabaseUser ? { user: supabaseUser } : null;
      this.lastCacheTime = supabaseUser ? Date.now() : 0;

      if (event === 'SIGNED_IN' && supabaseUser) {
        this.loadUserProfile(supabaseUser.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUserProfileSubject.next(null);
      }
    });
  }

  private async loadInitialSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    const supabaseUser = session?.user ?? null;
    this.currentSupabaseUserSubject.next(supabaseUser);
    this.userCache = supabaseUser ? { user: supabaseUser } : null;
    this.lastCacheTime = supabaseUser ? Date.now() : 0;
    if (supabaseUser) {
      await this.loadUserProfile(supabaseUser.id);
    }
  }

  async getUser(): Promise<{ data: { user: User | null }, error: any }> {
    const CACHE_TTL = 5 * 60 * 1000; 
    const now = Date.now();
    
    if (this.userCache && (now - this.lastCacheTime < CACHE_TTL)) {
      return { data: this.userCache, error: null };
    }
    
    if (this.authLock) {
      return new Promise((resolve) => {
        this.authQueue.push(() => {
          resolve({ 
            data: this.userCache || { user: null }, 
            error: null 
          });
        });
      });
    }
    
    try {
      this.authLock = true;
      const { data, error } = await this.supabase.auth.getUser();
      
      if (!error && data.user) {
        this.userCache = { user: data.user };
        this.lastCacheTime = now;
        this.currentSupabaseUserSubject.next(data.user); 
      } else if (error) {
         this.currentSupabaseUserSubject.next(null); 
         this.userCache = null;
      }
      
      return { data: { user: data?.user ?? null }, error };
    } catch (error) {
      console.error('Fehler beim Abrufen des Benutzers:', error);
      this.currentSupabaseUserSubject.next(null);
      this.userCache = null;
      return { data: { user: null }, error };
    } finally {
      this.authLock = false;
      this.processQueue();
    }
  }
  
  private processQueue(): void {
    while (this.authQueue.length > 0) {
      const callback = this.authQueue.shift();
      if (callback) callback();
    }
  }

  async loadUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); 

      if (error) {
        console.error('Error loading user profile:', error);
        this.currentUserProfileSubject.next(null); 
        return;
      }

      if (!data) {
        console.log('No profile found for user:', userId);
        this.currentUserProfileSubject.next(null); 
        return;
      }

      const supabaseUser = this.currentSupabaseUserSubject.getValue();
      const userProfile: UserProfile = {
        ...data,
        id: data.id, 
        user_id: data.user_id,
        email: supabaseUser?.email ?? data.email 
      };

      this.currentUserProfileSubject.next(userProfile);
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
      this.currentUserProfileSubject.next(null);
    }
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.currentUserProfileSubject.value;
  }

  getCurrentSupabaseUser(): User | null {
      return this.currentSupabaseUserSubject.value;
  }

  isGuestUser(): boolean {
    const currentUser = this.currentSupabaseUserSubject.getValue();
    return currentUser?.email === this.GUEST_EMAIL;
  }

  async loginAsGuest(): Promise<{ success: boolean, error?: any }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.GUEST_EMAIL,
        password: this.GUEST_PASSWORD,
      });

      if (error) throw error;
      if (!data.session || !data.user) throw new Error('Guest login did not return session or user.');
      
      this.router.navigate(['/dashboard']);
      return { success: true };

    } catch (error) {
      console.error('Error during guest login:', error);
      return { success: false, error };
    }
  }

  async signUp(email: string, password: string, firstName?: string, lastName?: string): Promise<{ success: boolean, error?: any }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned after signup');

      if (firstName || lastName) {
         const { error: profileError } = await this.supabase
           .from('profiles')
           .insert({
             user_id: data.user.id,
             first_name: firstName,
             last_name: lastName,
             currency: 'EUR' 
           });

         if (profileError) {
           console.warn('Profile creation during signup failed:', profileError);
         }
      }
      return { success: true };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return { success: false, error: err };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean, error?: any }> {
     if (this.isGuestUser()) {
         console.warn("Attempted normal sign in while guest is logged in.");
         return { success: false, error: 'Guest user already logged in.' };
     }
    try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user data returned after signin');

        this.router.navigate(['/dashboard']);
        return { success: true };

    } catch (error) {
         console.error('Error during sign in:', error);
         return { success: false, error };
    }
  }

  async signOut() {
    const currentUser = this.getCurrentSupabaseUser();
    const isCurrentlyGuest = currentUser?.email === this.GUEST_EMAIL;

    if (isCurrentlyGuest && currentUser) {
      console.log('Guest is logging out. Resetting data...');
      try {
        const { data: funcData, error: funcError } = await this.supabase.functions.invoke('reset-guest-data');
        if (funcError) throw funcError; 
        console.log('Guest data reset successful:', funcData);
      } catch (functionError) {
           console.error('Error calling reset-guest-data function:', functionError);
           alert('Fehler beim Zurücksetzen der Gastdaten. Logout wird trotzdem versucht.');
      }
    }
    
    try {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;

        this.router.navigate(['/login']); 
        return { success: true };

    } catch (error) {
        console.error('Error signing out:', error);
        this.currentSupabaseUserSubject.next(null);
        this.currentUserProfileSubject.next(null);
        this.userCache = null;
        this.router.navigate(['/login']); 
        return { success: false, error };
    }
  }

  async updateProfile(profileUpdateData: Partial<UserProfile>): Promise<{ success: boolean, error?: any }> {
    const currentUser = this.getCurrentSupabaseUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const { id, user_id, email, created_at, updated_at, ...updateData } = profileUpdateData;

    if (Object.keys(updateData).length === 0) {
        console.warn("UpdateProfile called with no updatable data.");
        return { success: true }; 
    }

    try {
        const { error } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', currentUser.id); 

        if (error) throw error;

        await this.loadUserProfile(currentUser.id); 
        return { success: true };

    } catch(error) {
        console.error('Error updating profile:', error);
        return { success: false, error };
    }
  }
}
