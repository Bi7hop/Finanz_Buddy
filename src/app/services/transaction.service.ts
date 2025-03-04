import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly DEV_USER_ID = '00000000-0000-0000-0000-000000000000';
  
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    console.log('TransactionService initialisiert');
  }

  async fetchTransactions() {
    try {
      console.log('Lade Transaktionen...');
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      console.log('Transaktionen geladen:', data?.length || 0);
      this.transactionsSubject.next(data || []);
      return data;
    } catch (error) {
      console.error('Fehler beim Laden der Transaktionen:', error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getTransactionById(id: number) {
    try {
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Fehler beim Laden der Transaktion mit ID ${id}:`, error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
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
      
      const newTransaction = { ...transaction, user_id: userId };
      console.log('Erstelle neue Transaktion:', newTransaction);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase Fehlerdetails:', error);
        console.error('Fehlercode:', error.code);
        console.error('Fehlermeldung:', error.message);
        console.error('Fehler-Details:', error.details);
        throw new Error(error.message || 'Unbekannter Fehler bei der Erstellung der Transaktion');
      }
      
      console.log('Transaktion erstellt:', data);
      
      const currentTransactions = this.transactionsSubject.value;
      this.transactionsSubject.next([data, ...currentTransactions]);
      
      return data;
    } catch (error) {
      console.error('Fehler beim Erstellen der Transaktion:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async updateTransaction(id: number, updates: Partial<Transaction>) {
    try {
      this.loadingSubject.next(true);
      
      console.log(`Aktualisiere Transaktion mit ID ${id}:`, updates);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Fehler beim Aktualisieren der Transaktion:', error);
        throw new Error(error.message);
      }
      
      console.log('Transaktion aktualisiert:', data);
      
      const currentTransactions = this.transactionsSubject.value;
      const index = currentTransactions.findIndex(t => t.id === id);
      
      if (index !== -1) {
        const updatedTransactions = [...currentTransactions];
        updatedTransactions[index] = data;
        this.transactionsSubject.next(updatedTransactions);
      }
      
      return data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Transaktion:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async deleteTransaction(id: number) {
    try {
      this.loadingSubject.next(true);
      
      console.log(`Lösche Transaktion mit ID ${id}`);
      
      const { error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Fehler beim Löschen der Transaktion:', error);
        throw new Error(error.message);
      }
      
      console.log('Transaktion gelöscht');
      
      const currentTransactions = this.transactionsSubject.value;
      this.transactionsSubject.next(
        currentTransactions.filter(t => t.id !== id)
      );
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Transaktion:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getTransactionsByCategory(category: string) {
    try {
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .eq('category', category)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Fehler beim Laden der Transaktionen für Kategorie "${category}":`, error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getTransactionsByDateRange(startDate: string, endDate: string) {
    try {
      this.loadingSubject.next(true);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Fehler beim Laden der Transaktionen im Zeitraum ${startDate} bis ${endDate}:`, error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getIncomeTransactionsByPeriod(period: string): Promise<Transaction[]> {
    try {
      this.loadingSubject.next(true);
      
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]; 
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; 
      
      console.log(`Lade Einnahmen für Periode ${period} (${startDate} bis ${endDate})`);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('type', 'income') 
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      console.log(`${data?.length || 0} Einnahmen geladen`);
      return data || [];
    } catch (error) {
      console.error(`Fehler beim Laden der Einnahmen für Periode ${period}:`, error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getExpenseTransactionsByPeriod(period: string): Promise<Transaction[]> {
    try {
      this.loadingSubject.next(true);
      
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]; 
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; 
      
      console.log(`Lade Ausgaben für Periode ${period} (${startDate} bis ${endDate})`);
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('type', 'expense') 
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      console.log(`${data?.length || 0} Ausgaben geladen`);
      return data || [];
    } catch (error) {
      console.error(`Fehler beim Laden der Ausgaben für Periode ${period}:`, error);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async getIncomeSumByCategory(category: string, period: string): Promise<number> {
    try {
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; 
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('type', 'income') 
        .eq('category', category);
      
      if (error) throw error;
      
      const sum = data?.reduce((total, transaction) => total + (transaction.amount || 0), 0) || 0;
      return sum;
    } catch (error) {
      console.error(`Fehler beim Berechnen der Einnahmen für Kategorie ${category} und Periode ${period}:`, error);
      return 0;
    }
  }
  
  async getExpenseSumByCategory(category: string, period: string): Promise<number> {
    try {
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; 
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('type', 'expense')
        .eq('category', category);
      
      if (error) throw error;
      
      const sum = data?.reduce((total, transaction) => total + (transaction.amount || 0), 0) || 0;
      return sum;
    } catch (error) {
      console.error(`Fehler beim Berechnen der Ausgaben für Kategorie ${category} und Periode ${period}:`, error);
      return 0;
    }
  }
  
  async getTotalsByPeriod(period: string): Promise<{income: number, expense: number, balance: number}> {
    try {
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; 
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      const result = {
        income: 0,
        expense: 0,
        balance: 0
      };
      
      data?.forEach(transaction => {
        if (transaction.type === 'income') {
          result.income += transaction.amount || 0;
        } else if (transaction.type === 'expense') {
          result.expense += transaction.amount || 0;
        }
      });
      
      result.balance = result.income - result.expense;
      
      return result;
    } catch (error) {
      console.error(`Fehler beim Berechnen der Summen für Periode ${period}:`, error);
      return {income: 0, expense: 0, balance: 0};
    }
  }
}