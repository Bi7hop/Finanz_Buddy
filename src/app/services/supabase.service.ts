import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Observable, from, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private guestStorage: {[table: string]: any[]} = {};

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

    this.loadGuestData();
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
    if (this.isGuestMode()) {
      return true;
    }

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

  isGuestMode(): boolean {
    const guestSessionStr = localStorage.getItem('guestSession');
    return !!guestSessionStr;
  }

  private loadGuestData() {
    const storageData = localStorage.getItem('guestStorageData');
    if (storageData) {
      try {
        this.guestStorage = JSON.parse(storageData);
      } catch (e) {
        console.error('Fehler beim Laden der Guest-Daten:', e);
        this.guestStorage = {};
      }
    }
  }

  private saveGuestData() {
    localStorage.setItem('guestStorageData', JSON.stringify(this.guestStorage));
  }

  clearGuestData() {
    this.guestStorage = {};
    localStorage.removeItem('guestStorageData');
  }

  loadInitialGuestData() {
    if (Object.keys(this.guestStorage).length === 0) {
      this.guestStorage['budgets'] = [
        {
          id: crypto.randomUUID(),
          name: 'Haushalt',
          amount: 800,
          spent: 200,
          category: 'Wohnen',
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Freizeit',
          amount: 300,
          spent: 150,
          category: 'Entertainment',
          created_at: new Date().toISOString()
        }
      ];

      const currentDate = new Date();
      this.guestStorage['transactions'] = [
        {
          id: crypto.randomUUID(),
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).toISOString().split('T')[0],
          category: 'Lebensmittel',
          amount: 85.40,
          type: 'expense',
          description: 'Wocheneinkauf',
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10).toISOString().split('T')[0],
          category: 'Restaurant',
          amount: 45.80,
          type: 'expense',
          description: 'Dinner mit Freunden',
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
          category: 'Gehalt',
          amount: 2800,
          type: 'income',
          description: 'Monatsgehalt',
          created_at: new Date().toISOString()
        }
      ];

      this.guestStorage['savings_goals'] = [
        {
          id: crypto.randomUUID(),
          name: 'Urlaub',
          target_amount: 1000,
          current_amount: 500,
          notes: 'Sommerurlaub',
          created_at: new Date().toISOString()
        }
      ];

      this.guestStorage['user_settings'] = [
        {
          id: crypto.randomUUID(),
          user_id: 'guest-user',
          dark_mode: false,
          currency: 'EUR',
          language: 'de',
          created_at: new Date().toISOString()
        }
      ];

      this.guestStorage['profiles'] = [
        {
          id: crypto.randomUUID(),
          user_id: 'guest-user',
          first_name: 'Gast',
          last_name: 'Benutzer',
          nickname: 'Gast',
          email: 'guest@example.com',
          currency: 'EUR',
          created_at: new Date().toISOString()
        }
      ];

      this.saveGuestData();
    }
  }

  from(table: string) {
    if (this.isGuestMode()) {
      return this.createGuestQueryBuilder(table);
    } else {
      return this.supabase.from(table);
    }
  }

  private createGuestQueryBuilder(table: string) {
    if (!this.guestStorage[table]) {
      this.guestStorage[table] = [];
    }

    const self = this;
    return {
      select: function(columns: string) {
        return {
          eq: function(column: string, value: any) {
            return {
              order: function(column: string, options: any) {
                const filteredData = self.guestStorage[table]
                  .filter(item => item[column] === value)
                  .sort((a, b) => {
                    return options?.ascending ?
                      (a[column] > b[column] ? 1 : -1) :
                      (a[column] < b[column] ? 1 : -1);
                  });

                return Promise.resolve({ data: filteredData, error: null });
              },
              single: function() {
                const result = self.guestStorage[table]
                  .find(item => item[column] === value);
                return Promise.resolve({ data: result || null, error: null });
              },
              maybeSingle: function() {
                const result = self.guestStorage[table]
                  .find(item => item[column] === value);
                return Promise.resolve({ data: result || null, error: null });
              },
              execute: function() {
                const filteredData = self.guestStorage[table]
                  .filter(item => item[column] === value);
                return Promise.resolve({ data: filteredData, error: null });
              }
            };
          },
          gte: function(column: string, value: any) {
            return {
              lte: function(otherColumn: string, otherValue: any) {
                return {
                  order: function(orderColumn: string, options: any) {
                    const filteredData = self.guestStorage[table]
                      .filter(item => {
                        const itemDate = new Date(item[column]);
                        const startDate = new Date(value);
                        const endDate = new Date(otherValue);
                        return itemDate >= startDate && itemDate <= endDate;
                      })
                      .sort((a, b) => {
                        return options?.ascending ?
                          (a[orderColumn] > b[orderColumn] ? 1 : -1) :
                          (a[orderColumn] < b[orderColumn] ? 1 : -1);
                      });

                    return Promise.resolve({ data: filteredData, error: null });
                  }
                };
              }
            };
          },
          execute: function() {
            return Promise.resolve({ data: self.guestStorage[table], error: null });
          }
        };
      },
      insert: function(records: any | any[]) {
        const items = Array.isArray(records) ? records : [records];
        const newItems = items.map(item => ({
          ...item,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        }));

        self.guestStorage[table] = [...self.guestStorage[table], ...newItems];
        self.saveGuestData();

        return {
          select: function() {
            return Promise.resolve({ data: newItems, error: null });
          }
        };
      },
      update: function(updates: any) {
        return {
          eq: function(column: string, value: any) {
            const index = self.guestStorage[table]
              .findIndex(item => item[column] === value);

            if (index !== -1) {
              self.guestStorage[table][index] = {
                ...self.guestStorage[table][index],
                ...updates,
                updated_at: new Date().toISOString()
              };
              self.saveGuestData();
              return Promise.resolve({
                data: self.guestStorage[table][index],
                error: null
              });
            }

            return Promise.resolve({
              data: null,
              error: { message: 'Item not found' }
            });
          }
        };
      },
      delete: function() {
        return {
          eq: function(column: string, value: any) {
            const initialLength = self.guestStorage[table].length;
            self.guestStorage[table] = self.guestStorage[table]
              .filter(item => item[column] !== value);

            self.saveGuestData();

            const deleted = initialLength - self.guestStorage[table].length;
            return Promise.resolve({
              data: { deleted },
              error: null
            });
          }
        };
      }
    };
  }

  getTransactionsForMonth(month: number, year: number): Observable<any[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    if (this.isGuestMode()) {
      return of(this.getGuestTransactionsForMonth(startDate, endDate));
    }

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

  private getGuestTransactionsForMonth(startDate: Date, endDate: Date): any[] {
    if (!this.guestStorage['transactions']) {
      this.guestStorage['transactions'] = [];
    }

    return this.guestStorage['transactions']
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .map(item => {
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
  }
}