import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: string;
  categoryName: string;
  description?: string;
  isRecurring: boolean;
}

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent implements OnInit {
  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'actions'];
  transactions: Transaction[] = [];
  
  currentMonth: string = '';
  currentYear: number = 0;
  totalExpenses: number = 0;
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateCurrentMonthDisplay();
    this.loadTransactions();
  }
  
  updateCurrentMonthDisplay(): void {
    const now = new Date();
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = months[now.getMonth()];
    this.currentYear = now.getFullYear();
  }
  
  loadTransactions(): void {
    this.transactions = [
      {
        id: '1',
        date: new Date('2023-04-01'),
        amount: 750.00,
        category: 'housing',
        categoryName: 'Wohnen',
        description: 'Miete April',
        isRecurring: true
      },
      {
        id: '2',
        date: new Date('2023-04-05'),
        amount: 89.50,
        category: 'food',
        categoryName: 'Lebensmittel',
        description: 'Wocheneinkauf',
        isRecurring: false
      },
      {
        id: '3',
        date: new Date('2023-04-15'),
        amount: 45.00,
        category: 'transport',
        categoryName: 'Transport',
        description: 'Tankstelle',
        isRecurring: false
      },
      {
        id: '4',
        date: new Date('2023-04-18'),
        amount: 120.30,
        category: 'shopping',
        categoryName: 'Einkaufen',
        description: 'Neue Kleidung',
        isRecurring: false
      },
      {
        id: '5',
        date: new Date('2023-04-25'),
        amount: 35.99,
        category: 'entertainment',
        categoryName: 'Unterhaltung',
        description: 'Kino',
        isRecurring: false
      }
    ];
    
    this.calculateTotal();
  }
  
  calculateTotal(): void {
    this.totalExpenses = this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }
  
  addExpense(): void {
    this.router.navigate(['/transaction/new'], { queryParams: { type: 'expense' } });
  }
  
  editTransaction(transaction: Transaction): void {
    this.router.navigate(['/transaction/new'], { 
      queryParams: { 
        type: 'expense',
        id: transaction.id
      } 
    });
  }
  
  deleteTransaction(transaction: Transaction): void {
    console.log('Deleting transaction:', transaction);
    
    this.transactions = this.transactions.filter(t => t.id !== transaction.id);
    this.calculateTotal();
  }
  
  previousMonth(): void {

  }
  
  nextMonth(): void {
  
  }
  
  getCategoryIcon(category: string): string {
    const iconMap: {[key: string]: string} = {
      'housing': 'home',
      'food': 'restaurant',
      'transport': 'directions_car',
      'shopping': 'shopping_cart',
      'entertainment': 'movie',
      'health': 'healing',
      'education': 'school',
      'other_expense': 'more_horiz'
    };
    
    return iconMap[category] || 'money_off';
  }
}