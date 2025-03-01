import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding: 16px;">
      <h2>Transaktionen Test</h2>
      
      <div style="margin-bottom: 16px;">
        <button (click)="createTestTransaction()" style="margin-right: 8px;">Test-Transaktion erstellen</button>
        <button (click)="loadTransactions()" style="margin-right: 8px;">Transaktionen neu laden</button>
      </div>
      
      <div *ngIf="selectedTransaction" style="margin-bottom: 16px; padding: 16px; border: 1px solid #ccc; border-radius: 4px;">
        <h3>Transaktion bearbeiten</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <label for="description">Beschreibung: </label>
            <input id="description" [(ngModel)]="selectedTransaction.description" type="text">
          </div>
          <div>
            <label for="amount">Betrag: </label>
            <input id="amount" [(ngModel)]="selectedTransaction.amount" type="number">
          </div>
          <div>
            <label for="category">Kategorie: </label>
            <input id="category" [(ngModel)]="selectedTransaction.category" type="text">
          </div>
          <div>
            <label for="date">Datum: </label>
            <input id="date" [(ngModel)]="selectedTransaction.date" type="date">
          </div>
        </div>
        <div style="margin-top: 16px;">
          <button (click)="updateTransaction()" style="margin-right: 8px;">Aktualisieren</button>
          <button (click)="cancelEdit()">Abbrechen</button>
        </div>
      </div>
      
      <div *ngIf="loading" style="margin-bottom: 16px;">Lade Transaktionen...</div>
      
      <div *ngIf="error" style="color: red; margin-top: 10px; margin-bottom: 16px; padding: 10px; background-color: #ffeeee; border-radius: 4px;">
        <strong>Fehler:</strong> {{ error }}
      </div>
      
      <div *ngIf="!loading && !error">
        <div *ngIf="transactions.length === 0">
          <p>Keine Transaktionen gefunden.</p>
        </div>
        
        <table *ngIf="transactions.length > 0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Datum</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Beschreibung</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Kategorie</th>
              <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Betrag</th>
              <th style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let transaction of transactions" style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">{{ transaction.date | date:'dd.MM.yyyy' }}</td>
              <td style="padding: 8px;">{{ transaction.description }}</td>
              <td style="padding: 8px;">{{ transaction.category }}</td>
              <td style="padding: 8px; text-align: right;" [ngStyle]="{'color': transaction.amount < 0 ? 'red' : 'green'}">
                {{ transaction.amount.toFixed(2) }} €
              </td>
              <td style="padding: 8px; text-align: center;">
                <button (click)="editTransaction(transaction)" style="margin-right: 8px;">Bearbeiten</button>
                <button (click)="confirmDelete(transaction.id)">Löschen</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class TransactionsTestComponent implements OnInit {
  transactions: Transaction[] = [];
  selectedTransaction: Transaction | null = null;
  loading = false;
  error: string | null = null;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  async loadTransactions() {
    try {
      this.loading = true;
      this.error = null;
      
      await this.transactionService.fetchTransactions();
      
      this.transactionService.transactions$.subscribe(transactions => {
        this.transactions = transactions;
        console.log('Komponente hat Transaktionen erhalten:', this.transactions.length);
      });
      
    } catch (err) {
      this.error = 'Fehler beim Laden der Transaktionen';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async createTestTransaction() {
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      
      const testTransaction = {
        user_id: testUserId,
        amount: Math.random() > 0.5 ? 1000 : -500, 
        date: new Date().toISOString(),
        description: 'Testüberweisung ' + new Date().toLocaleTimeString(),
        category: 'Test',
        type: Math.random() > 0.5 ? 'Einnahme' : 'Ausgabe'
      };

      await this.transactionService.createTransaction(testTransaction);
      console.log('Test-Transaktion erstellt');
      
      this.error = null;
    } catch (err: any) {
      this.error = `Fehler beim Erstellen der Test-Transaktion: ${err.message || JSON.stringify(err)}`;
      console.error('Fehler Details:', err);
    }
  }

  editTransaction(transaction: Transaction) {
    this.selectedTransaction = { ...transaction };
    
    if (this.selectedTransaction.date) {
      const date = new Date(this.selectedTransaction.date);
      this.selectedTransaction.date = date.toISOString().split('T')[0];
    }
  }

  cancelEdit() {
    this.selectedTransaction = null;
  }

  async updateTransaction() {
    if (!this.selectedTransaction) return;
    
    try {
      this.loading = true;
      this.error = null;
      
      await this.transactionService.updateTransaction(
        this.selectedTransaction.id,
        {
          description: this.selectedTransaction.description,
          amount: this.selectedTransaction.amount,
          category: this.selectedTransaction.category,
          date: this.selectedTransaction.date
        }
      );
      
      this.selectedTransaction = null;
    } catch (err: any) {
      this.error = `Fehler beim Aktualisieren der Transaktion: ${err.message || JSON.stringify(err)}`;
      console.error('Fehler Details:', err);
    } finally {
      this.loading = false;
    }
  }

  async confirmDelete(id: number) {
    if (confirm('Möchtest du diese Transaktion wirklich löschen?')) {
      await this.deleteTransaction(id);
    }
  }

  async deleteTransaction(id: number) {
    try {
      this.loading = true;
      this.error = null;
      
      await this.transactionService.deleteTransaction(id);
    } catch (err: any) {
      this.error = `Fehler beim Löschen der Transaktion: ${err.message || JSON.stringify(err)}`;
      console.error('Fehler Details:', err);
    } finally {
      this.loading = false;
    }
  }
}