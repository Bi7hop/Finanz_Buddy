import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  target_amount: number;
  current_amount: number;
  transactions?: SavingsTransaction[];
  notes?: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface SavingsTransaction {
  id: string;
  goal_id: string;
  amount: number;
  date: Date;
  note?: string;
  user_id: string;
  created_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SavingsGoalsService {
  private goalsSubject = new BehaviorSubject<SavingsGoal[]>([]);
  private loading = false;

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {}

  get goals$(): Observable<SavingsGoal[]> {
    return this.goalsSubject.asObservable();
  }

  async getCurrentUser() {
    const result = await this.authService.getUser();
    if (result.error || !result.data) {
      console.error('Fehler beim Abrufen des Benutzers:', result.error);
      return null;
    }
    return result.data.user;
  }

  async loadGoals(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('Kein authentifizierter Benutzer gefunden');
        this.goalsSubject.next([]);
        this.loading = false;
        return;
      }

      const { data: goals, error } = await this.supabaseService.supabaseClient
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goalsWithTransactions = await Promise.all(
        goals.map(async (goal) => {
          const { data: transactions, error: transactionError } = await this.supabaseService.supabaseClient
            .from('savings_transactions')
            .select('*')
            .eq('goal_id', goal.id)
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (transactionError) throw transactionError;

          return {
            ...goal,
            transactions: transactions || []
          };
        })
      );

      this.goalsSubject.next(goalsWithTransactions);
    } catch (error) {
      console.error('Fehler beim Laden der Sparziele:', error);
      this.goalsSubject.next([]);
    } finally {
      this.loading = false;
    }
  }

  async createGoal(goal: Partial<SavingsGoal>, startAmount?: number): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('savings_goals')
        .insert([{
          title: goal.title,
          category: goal.category,
          target_amount: goal.target_amount,
          current_amount: startAmount || 0,
          notes: goal.notes,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (startAmount && startAmount > 0) {
        await this.createTransaction({
          goal_id: data.id,
          amount: startAmount,
          date: new Date(),
          note: 'Startbetrag',
          user_id: user.id
        });
      }

      await this.loadGoals(); 
      return data.id;
    } catch (error) {
      console.error('Fehler beim Erstellen des Sparziels:', error);
      return null;
    }
  }

  async updateGoal(id: string, updates: Partial<SavingsGoal>): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;
      
      const { error } = await this.supabaseService.supabaseClient
        .from('savings_goals')
        .update({
          title: updates.title,
          category: updates.category,
          target_amount: updates.target_amount,
          notes: updates.notes,
          updated_at: new Date()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await this.loadGoals();
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Sparziels:', error);
      return false;
    }
  }

  async createTransaction(transaction: Partial<SavingsTransaction>): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      const { data, error } = await this.supabaseService.supabaseClient
        .from('savings_transactions')
        .insert([{
          goal_id: transaction.goal_id,
          amount: transaction.amount,
          date: transaction.date,
          note: transaction.note,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const { data: goalData, error: goalError } = await this.supabaseService.supabaseClient
        .from('savings_goals')
        .select('current_amount')
        .eq('id', transaction.goal_id)
        .eq('user_id', user.id)
        .single();

      if (goalError) throw goalError;

      const newAmount = goalData.current_amount + Number(transaction.amount);

      const { error: updateError } = await this.supabaseService.supabaseClient
        .from('savings_goals')
        .update({ current_amount: newAmount, updated_at: new Date() })
        .eq('id', transaction.goal_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await this.loadGoals();
      return data.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Transaktion:', error);
      return null;
    }
  }

  async deleteGoal(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;
      
      const { error: transactionError } = await this.supabaseService.supabaseClient
        .from('savings_transactions')
        .delete()
        .eq('goal_id', id)
        .eq('user_id', user.id);

      if (transactionError) throw transactionError;

      const { error } = await this.supabaseService.supabaseClient
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await this.loadGoals(); 
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Sparziels:', error);
      return false;
    }
  }
}