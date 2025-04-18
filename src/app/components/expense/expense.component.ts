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
  selector: 'app-expense',
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
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'actions'];
  transactions: Transaction[] = [];

  currentMonth: string = '';
  currentYear: number = 0;
  currentPeriod: string = '';
  totalExpense: number = 0;
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
      loading => (this.isLoading = loading)
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

      const transactions = await this.transactionService.getExpenseTransactionsByPeriod(this.currentPeriod);

      this.transactions = transactions.map(transaction => ({
        ...transaction,
        date: transaction.date,
        category: this.mapCategoryToIcon(transaction.category),
        categoryName: transaction.category,
        isRecurring: (transaction as any).is_recurring || false
      }));

      this.calculateTotal();
    } catch (error) {
      console.error('Fehler beim Laden der Ausgaben:', error);
      this.snackBar.open('Fehler beim Laden der Ausgaben', 'Schließen', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  mapCategoryToIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      housing: 'home',
      food: 'restaurant',
      transport: 'directions_car',
      shopping: 'shopping_cart',
      entertainment: 'theaters'
    };

    return iconMap[category.toLowerCase()] || 'attach_money';
  }

  calculateTotal(): void {
    this.totalExpense = this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  addExpense(): void {
    const dialogRef = this.dialog.open(TransactionModalComponent, {
      width: '500px',
      data: { 
        type: 'expense'
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
        type: 'expense',
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
      ? `Möchtest du die Ausgabe "${transaction.description}" wirklich löschen?`
      : `Möchtest du diese Ausgabe wirklich löschen?`;

    this.confirmationDialogService.openDeleteDialog('Ausgabe', customMessage)
      .subscribe(async (confirmed) => {
        if (confirmed) {
          try {
            await this.transactionService.deleteTransaction(transaction.id);
            this.snackBar.open('Ausgabe erfolgreich gelöscht', 'Schließen', { duration: 3000 });
            await this.loadTransactions();
          } catch (error) {
            console.error('Fehler beim Löschen der Ausgabe:', error);
            this.snackBar.open('Fehler beim Löschen der Ausgabe', 'Schließen', { duration: 3000 });
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
      housing: 'home',
      food: 'restaurant',
      transport: 'directions_car',
      shopping: 'shopping_cart',
      entertainment: 'theaters'
    };

    return iconMap[category] || 'attach_money';
  }
}