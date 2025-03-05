import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Category {
  id: number;
  name: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  displayDate?: string;
  isRecurring?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;
  
  totalIncome: number = 0;
  totalExpenses: number = 0;
  netBalance: number = 0;
  
  categories: Category[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    this.updateCurrentMonthDisplay();
    this.loadMonthData();
  }
  
  updateCurrentMonthDisplay(): void {
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = months[this.currentDate.getMonth()];
    this.currentYear = this.currentDate.getFullYear();
  }
  
  loadMonthData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Aktueller Monat ist 0-based (0 = Januar, 11 = Dezember)
    this.supabaseService.getTransactionsForMonth(this.currentDate.getMonth(), this.currentYear)
      .pipe(
        catchError(error => {
          this.errorMessage = `Fehler beim Laden der Daten: ${error.message}`;
          this.categories = [];
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.calculateSummary();
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }
  
  calculateSummary(): void {
    this.totalIncome = this.categories
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.amount, 0);
      
    this.totalExpenses = this.categories
      .filter(cat => cat.type === 'expense')
      .reduce((sum, cat) => sum + cat.amount, 0);
      
    this.netBalance = this.totalIncome - this.totalExpenses;
  }
  
  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCurrentMonthDisplay();
    this.loadMonthData();
  }
  
  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCurrentMonthDisplay();
    this.loadMonthData();
  }
  
  addIncome(): void {
    this.router.navigate(['/transaction/new'], { 
      queryParams: { type: 'income' }
    });
  }
  
  addExpense(): void {
    this.router.navigate(['/transaction/new'], { 
      queryParams: { type: 'expense' }
    });
  }

  getCategoryIcon(category: Category): string {
    if (category.type === 'income') {
      return 'attach_money';
    }
    
    const iconMap: {[key: string]: string} = {
      'housing': 'home',
      'food': 'restaurant',
      'transport': 'directions_car',
      'entertainment': 'movie',
      'shopping': 'shopping_cart',
      'health': 'healing',
      'education': 'school',
      'salary': 'work'
    };
    
    return iconMap[category.category || ''] || 'category';
  }
}