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
    this.supabase = this.supabaseService.supabaseClient;
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
        this.userCache = null;
        this.lastCacheTime = 0;
      }
      this.processQueue();
    });
  }

  private async loadInitialSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) {
        this.currentSupabaseUserSubject.next(null);
        this.currentUserProfileSubject.next(null);
        this.userCache = null;
        return;
      }
      const supabaseUser = session?.user ?? null;
      this.currentSupabaseUserSubject.next(supabaseUser);
      this.userCache = supabaseUser ? { user: supabaseUser } : null;
      this.lastCacheTime = supabaseUser ? Date.now() : 0;
      if (supabaseUser) {
        await this.loadUserProfile(supabaseUser.id);
      } else {
        this.currentUserProfileSubject.next(null);
      }
    } catch (err) {
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
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
        if (!this.currentUserProfileSubject.getValue() || this.currentUserProfileSubject.getValue()?.user_id !== data.user.id) {
          await this.loadUserProfile(data.user.id);
        }
      } else {
        this.currentSupabaseUserSubject.next(null);
        this.currentUserProfileSubject.next(null);
        this.userCache = null;
        this.lastCacheTime = 0;
      }

      return { data: { user: data?.user ?? null }, error };
    } catch (error) {
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
      this.lastCacheTime = 0;
      return { data: { user: null }, error };
    } finally {
      this.authLock = false;
      this.processQueue();
    }
  }

  async validateSession(): Promise<boolean> {
    try {
      if (!this.userCache && this.lastCacheTime === 0) {
        return false;
      }

      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session) {
        this.currentSupabaseUserSubject.next(null);
        this.currentUserProfileSubject.next(null);
        this.userCache = null;
        this.lastCacheTime = 0;
        return false;
      }
      
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        if (expiresAt < now) {
          await this.signOut();
          return false;
        }
      }

      return true;
    } catch (err) {
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
      this.lastCacheTime = 0;
      return false;
    }
  }

  private processQueue(): void {
    while (this.authQueue.length > 0) {
      const callback = this.authQueue.shift();
      if (callback) {
        try {
          callback();
        } catch (e) {}
      }
    }
  }

  async loadUserProfile(userId: string) {
    if (!userId) {
      this.currentUserProfileSubject.next(null);
      return;
    }
    try {
      const { data, error, status } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && status !== 406) {
        this.currentUserProfileSubject.next(null);
        return;
      }

      if (!data) {
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
      this.currentUserProfileSubject.next(null);
    }
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.currentUserProfileSubject.value;
  }

  getCurrentSupabaseUser(): User | null {
    return this.currentSupabaseUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentSupabaseUserSubject.value;
  }

  isGuestUser(): boolean {
    const currentUser = this.currentSupabaseUserSubject.getValue();
    return !!currentUser && currentUser.email === this.GUEST_EMAIL;
  }

  async loginAsGuest(): Promise<{ success: boolean, error?: any }> {
    try {
      const isValid = await this.validateSession();
      
      if (isValid && this.getCurrentSupabaseUser()) {
        return { success: false, error: 'A user is already logged in.' };
      } else if (!isValid && this.getCurrentSupabaseUser()) {
        await this.signOut();
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.GUEST_EMAIL,
        password: this.GUEST_PASSWORD,
      });

      if (error) throw error;
      if (!data.session || !data.user) throw new Error('Guest login did not return session or user.');

      this.router.navigate(['/dashboard']);
      return { success: true };

    } catch (error) {
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
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
        await this.supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            currency: 'EUR'
          });
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean, error?: any }> {
    if (this.isGuestUser()) {
      return { success: false, error: 'Guest user is currently logged in. Please log out first.' };
    }
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('No user data returned after signin');

      this.router.navigate(['/dashboard']);
      return { success: true };

    } catch (error) {
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
      return { success: false, error };
    }
  }

  async signOut() {
    const currentUser = this.getCurrentSupabaseUser();
    const isCurrentlyGuest = !!currentUser && currentUser.email === this.GUEST_EMAIL;
  
    localStorage.removeItem('user_profile');
    localStorage.removeItem('user_settings');
  
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
  
    keysToRemove.forEach(key => localStorage.removeItem(key));
  
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
  
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
      this.lastCacheTime = 0;
      this.router.navigate(['/login']);
      return { success: true };
  
    } catch (error) {
      this.currentSupabaseUserSubject.next(null);
      this.currentUserProfileSubject.next(null);
      this.userCache = null;
      this.lastCacheTime = 0;
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

    } catch (error) {
      return { success: false, error };
    }
  }
}