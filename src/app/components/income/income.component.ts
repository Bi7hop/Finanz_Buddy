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
  selector: 'app-income',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit {
  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'actions'];
  transactions: Transaction[] = [];
  
  currentMonth: string = '';
  currentYear: number = 0;
  totalIncome: number = 0;
  
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
        amount: 1800.00,
        category: 'salary',
        categoryName: 'Gehalt',
        description: 'Monatsgehalt April',
        isRecurring: true
      },
      {
        id: '2',
        date: new Date('2023-04-15'),
        amount: 35.12,
        category: 'investment',
        categoryName: 'Kapitalerträge',
        description: 'Dividende XYZ Aktie',
        isRecurring: false
      },
      {
        id: '3',
        date: new Date('2023-04-22'),
        amount: 50.00,
        category: 'gifts',
        categoryName: 'Geschenke',
        description: 'Geburtstagsgeschenk',
        isRecurring: false
      },
      {
        id: '4',
        date: new Date('2023-04-28'),
        amount: 20.00,
        category: 'other_income',
        categoryName: 'Sonstiges',
        description: 'Pfandflaschen',
        isRecurring: false
      }
    ];
    
    this.calculateTotal();
  }
  
  calculateTotal(): void {
    this.totalIncome = this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }
  
  addIncome(): void {
    this.router.navigate(['/transaction/new'], { queryParams: { type: 'income' } });
  }
  
  editTransaction(transaction: Transaction): void {
    this.router.navigate(['/transaction/new'], { 
      queryParams: { 
        type: 'income',
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
      'salary': 'work',
      'investment': 'trending_up',
      'gifts': 'card_giftcard',
      'other_income': 'more_horiz'
    };
    
    return iconMap[category] || 'attach_money';
  }
}