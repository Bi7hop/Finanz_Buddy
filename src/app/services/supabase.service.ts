import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.clearAuthLock();
    
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          autoRefreshToken: false,  
          persistSession: true
        }
      }
    );
  }

  get supabaseClient() {
    return this.supabase;
  }
  
  private clearAuthLock() {
    try {
      const lockKey = `lock:sb-${environment.supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      
      if (navigator.locks && navigator.locks.query) {
        navigator.locks.query().then(locks => {
          const authLocks = locks.held?.filter(lock => lock.name === lockKey);
          console.log('Gefundene Auth-Locks:', authLocks);
        }).catch(err => {
          console.error('Fehler beim Abfragen der Locks:', err);
        });
      }
      
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('supabase.auth.token')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        console.log('Entferne alten Session Storage Key:', key);
        sessionStorage.removeItem(key);
      });
      
      console.log('Auth-Lock-Bereinigung abgeschlossen');
    } catch (error) {
      console.error('Fehler beim Bereinigen des Auth-Locks:', error);
    }
  }
  
  async refreshAuthSession() {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Fehler beim Aktualisieren der Auth-Session:', error);
      } else {
        console.log('Auth-Session erfolgreich aktualisiert');
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Aktualisieren der Auth-Session:', error);
    }
  }
  
  async checkConnection() {
    try {
      const { data, error } = await this.supabase.from('user_settings').select('count()', { count: 'exact' });
      if (error) {
        console.error('Supabase-Verbindungsfehler:', error);
        return false;
      }
      console.log('Supabase-Verbindung erfolgreich');
      return true;
    } catch (err) {
      console.error('Unerwarteter Fehler bei der Supabase-Verbindungsprüfung:', err);
      return false;
    }
  }
  
  getTransactionsForMonth(month: number, year: number): Observable<any[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); 

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return from(this.supabase
      .from('transactions')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        return response.data.map((item: any) => {
          const date = new Date(item.date);
          const displayDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
          
          return {
            id: item.id,
            name: item.category,  
            description: item.description,
            amount: item.amount,
            type: item.type,
            category: item.category,
            displayDate: displayDate,
            isRecurring: item.isRecurring || false
          };
        });
      })
    );
  }
}