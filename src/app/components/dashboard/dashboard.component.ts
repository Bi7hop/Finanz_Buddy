import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule, Router } from '@angular/router';

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
    MatDividerModule
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
  
  constructor(private router: Router) { }

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

    this.mockDataForMonth();
    this.calculateSummary();
  }
  
  mockDataForMonth(): void {
    if (this.currentMonth === 'Juli' && this.currentYear === 2015) {
      this.categories = [
        {
          id: 1,
          name: 'Einnahmen',
          description: 'Gehalt, Kindergeld',
          amount: 1835.12,
          type: 'income',
          category: 'salary',
          displayDate: '01.07.2015'
        },
        {
          id: 2,
          name: 'Auto',
          description: 'Tanken',
          amount: 76.50,
          type: 'expense',
          category: 'transport',
          displayDate: '05.07.2015'
        },
        {
          id: 3,
          name: 'Freizeit',
          description: 'Ausgehen',
          amount: 46.00,
          type: 'expense',
          category: 'entertainment',
          displayDate: '12.07.2015'
        },
        {
          id: 4,
          name: 'Kredite und Bank',
          description: 'Kredite',
          amount: 310.00,
          type: 'expense',
          category: 'housing',
          displayDate: '15.07.2015'
        },
        {
          id: 5,
          name: 'Wohnen',
          description: 'Strom, Miete',
          amount: 788.00,
          type: 'expense',
          category: 'housing',
          displayDate: '20.07.2015'
        }
      ];
    } else {
      this.categories = [
        {
          id: 1,
          name: 'Einnahmen',
          description: 'Gehalt, Sonstiges',
          amount: 1750 + Math.random() * 300,
          type: 'income',
          category: 'salary',
          displayDate: '01.' + (this.currentDate.getMonth() + 1) + '.' + this.currentYear
        },
        {
          id: 2,
          name: 'Lebensmittel',
          description: 'Supermarkt, Restaurants',
          amount: 350 + Math.random() * 100,
          type: 'expense',
          category: 'food',
          displayDate: '05.' + (this.currentDate.getMonth() + 1) + '.' + this.currentYear
        },
        {
          id: 3,
          name: 'Wohnen',
          description: 'Miete, Nebenkosten',
          amount: 750 + Math.random() * 50,
          type: 'expense',
          category: 'housing',
          displayDate: '10.' + (this.currentDate.getMonth() + 1) + '.' + this.currentYear
        },
        {
          id: 4,
          name: 'Transport',
          description: 'Tanken, ÖPNV',
          amount: 90 + Math.random() * 40,
          type: 'expense',
          category: 'transport',
          displayDate: '15.' + (this.currentDate.getMonth() + 1) + '.' + this.currentYear
        }
      ];
    }
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
  
  transfer(): void {
    this.router.navigate(['/transaction/transfer']);
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