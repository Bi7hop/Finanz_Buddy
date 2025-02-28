import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  currency?: string;
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
    const { data, error } = await this.supabaseService.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user profile:', error);
      return;
    }

    const { data: { user } } = await this.supabaseService.supabaseClient.auth.getUser();

    const userProfile: UserProfile = {
      id: userId,
      email: user?.email,
      ...data
    };

    this.currentUserSubject.next(userProfile);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  async signUp(email: string, password: string): Promise<{ success: boolean, error?: any }> {
    const { data, error } = await this.supabaseService.supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      return { success: false, error };
    }

    if (data.user) {
      const { error: profileError } = await this.supabaseService.supabaseClient
        .from('profiles')
        .insert({
          id: data.user.id,
          currency: 'EUR'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    return { success: true };
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
      .eq('id', currentUser.id);

    if (error) {
      return { success: false, error };
    }

    this.loadUserProfile(currentUser.id);
    return { success: true };
  }
}