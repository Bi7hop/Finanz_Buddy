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
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get supabaseClient() {
    return this.supabase;
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