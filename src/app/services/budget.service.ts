import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Budget } from '../models/budget.model';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly TABLE_NAME = 'budgets';
  
  private readonly DEV_USER_ID = '00000000-0000-0000-0000-000000000000';
  
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  budgets$ = this.budgetsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    console.log('BudgetService initialisiert');
  }

  async fetchBudgets() {
    try {
      console.log('Lade Budgets...');
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Budgets geladen:', data?.length || 0);
      this.budgetsSubject.next(data || []);
      return data;
    } catch (error) {
      console.error('Fehler beim Laden der Budgets:', error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getBudgetById(id: number) {
    try {
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Fehler beim Laden des Budgets mit ID ${id}:`, error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) {
    try {
      this.loadingSubject.next(true);
      
      const { data: sessionData, error: sessionError } = await this.supabaseService.supabaseClient.auth.getSession();
      
      console.log('Session Data:', sessionData);
      
      if (sessionError) {
        console.error('Fehler beim Abrufen der Session:', sessionError);
      }
      
      let userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        console.warn('Keine aktive Session gefunden, verwende Dummy-UUID');
        userId = this.DEV_USER_ID; 
      }
      
      const newBudget = {
        ...budget,
        user_id: userId
      };
      
      console.log('Erstelle neues Budget:', newBudget);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .insert(newBudget)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase Fehlerdetails:', error);
        console.error('Fehlercode:', error.code);
        console.error('Fehlermeldung:', error.message);
        console.error('Fehler-Details:', error.details);
        throw new Error(error.message || 'Unbekannter Fehler bei der Erstellung des Budgets');
      }
      
      console.log('Budget erstellt:', data);
      
      const currentBudgets = this.budgetsSubject.value;
      this.budgetsSubject.next([data, ...currentBudgets]);
      
      return data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Budgets:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async updateBudget(id: number, updates: Partial<Budget>) {
    try {
      this.loadingSubject.next(true);
      
      console.log(`Aktualisiere Budget mit ID ${id}:`, updates);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Fehler beim Aktualisieren des Budgets:', error);
        throw new Error(error.message);
      }
      
      console.log('Budget aktualisiert:', data);
      
      const currentBudgets = this.budgetsSubject.value;
      const index = currentBudgets.findIndex(b => b.id === id);
      
      if (index !== -1) {
        const updatedBudgets = [...currentBudgets];
        updatedBudgets[index] = data;
        this.budgetsSubject.next(updatedBudgets);
      }
      
      return data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Budgets:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async deleteBudget(id: number) {
    try {
      this.loadingSubject.next(true);
      
      console.log(`Lösche Budget mit ID ${id}`);
      
      const { error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Fehler beim Löschen des Budgets:', error);
        throw new Error(error.message);
      }
      
      console.log('Budget gelöscht');
      
      const currentBudgets = this.budgetsSubject.value;
      this.budgetsSubject.next(
        currentBudgets.filter(b => b.id !== id)
      );
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Budgets:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getBudgetsByCategory(category: string) {
    try {
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Fehler beim Laden der Budgets für Kategorie "${category}":`, error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getBudgetsByPeriod(period: string) {
    try {
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from(this.TABLE_NAME)
        .select('*')
        .eq('period', period)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Fehler beim Laden der Budgets für Periode "${period}":`, error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }
}