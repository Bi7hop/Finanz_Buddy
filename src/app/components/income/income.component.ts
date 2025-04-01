import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { Subscription } from 'rxjs';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { TransactionModalComponent } from '../../components/transaction-modal/transaction-modal';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'actions'];
  transactions: Transaction[] = [];
  
  currentMonth: string = '';
  currentYear: number = 0;
  currentPeriod: string = '';
  totalIncome: number = 0;
  isLoading: boolean = false;
  
  private loadingSubscription: Subscription | null = null;
  
  constructor(
    private router: Router,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar,
    private confirmationDialogService: ConfirmationDialogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.updateCurrentMonthDisplay();
    this.loadingSubscription = this.transactionService.loading$.subscribe(
      loading => this.isLoading = loading
    );
    this.loadTransactions();
  }
  
  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
  
  updateCurrentMonthDisplay(): void {
    const now = new Date();
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = months[now.getMonth()];
    this.currentYear = now.getFullYear();
    this.currentPeriod = `${this.currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  async loadTransactions(): Promise<void> {
    try {
      this.isLoading = true;
      
      const [year, month] = this.currentPeriod.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const transactions = await this.transactionService.getIncomeTransactionsByPeriod(this.currentPeriod);
      
      this.transactions = transactions.map(transaction => ({
        ...transaction,
        date: transaction.date, 
        category: (transaction as any).category_icon || this.mapCategoryToIcon(transaction.category),
        categoryName: transaction.category,
        isRecurring: (transaction as any).isRecurring || false
      }));
      
      this.calculateTotal();
    } catch (error) {
      console.error('Fehler beim Laden der Einnahmen:', error);
      this.snackBar.open('Fehler beim Laden der Einnahmen', 'Schließen', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }
  
  mapCategoryToIcon(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'Gehalt': 'salary',
      'Lohn': 'salary',
      'Einkommen': 'salary',
      'Dividende': 'investment',
      'Kapitalerträge': 'investment',
      'Investitionen': 'investment',
      'Geschenke': 'gifts',
      'Sonstiges': 'other_income'
    };
    
    if (categoryMap[category]) {
      return categoryMap[category];
    }
    
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('gehalt') || lowerCategory.includes('lohn') || lowerCategory.includes('einkommen')) {
      return 'salary';
    } else if (lowerCategory.includes('divid') || lowerCategory.includes('kapital') || lowerCategory.includes('zins') || lowerCategory.includes('invest')) {
      return 'investment';
    } else if (lowerCategory.includes('geschenk')) {
      return 'gifts';
    }
    
    return 'other_income';
  }
  
  calculateTotal(): void {
    this.totalIncome = this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }
  
  addIncome(): void {
    const dialogRef = this.dialog.open(TransactionModalComponent, {
      width: '500px',
      data: { 
        type: 'income'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransactions();
      }
    });
  }
  
  editTransaction(transaction: Transaction): void {
    const dialogRef = this.dialog.open(TransactionModalComponent, {
      width: '500px',
      data: { 
        type: 'income',
        transaction: transaction
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        this.loadTransactions();
      }
    });
  }
  
  async deleteTransaction(transaction: Transaction): Promise<void> {
    const customMessage = transaction.description 
      ? `Möchtest du die Einnahme "${transaction.description}" wirklich löschen?`
      : `Möchtest du diese Einnahme wirklich löschen?`;

    this.confirmationDialogService.openDeleteDialog('Einnahme', customMessage)
      .subscribe(async (confirmed) => {
        if (confirmed) {
          try {
            await this.transactionService.deleteTransaction(transaction.id);
            this.snackBar.open('Einnahme erfolgreich gelöscht', 'Schließen', { duration: 3000 });
            await this.loadTransactions();
          } catch (error) {
            console.error('Fehler beim Löschen der Einnahme:', error);
            this.snackBar.open('Fehler beim Löschen der Einnahme', 'Schließen', { duration: 3000 });
          }
        }
      });
  }
  
  async previousMonth(): Promise<void> {
    const [year, month] = this.currentPeriod.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    this.currentPeriod = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = monthNames[newMonth - 1];
    this.currentYear = newYear;
    await this.loadTransactions();
  }
  
  async nextMonth(): Promise<void> {
    const [year, month] = this.currentPeriod.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    this.currentPeriod = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = monthNames[newMonth - 1];
    this.currentYear = newYear;
    await this.loadTransactions();
  }
  
  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'salary': 'work',
      'investment': 'trending_up',
      'gifts': 'card_giftcard',
      'other_income': 'more_horiz'
    };
    
    return iconMap[category] || 'attach_money';
  }
}