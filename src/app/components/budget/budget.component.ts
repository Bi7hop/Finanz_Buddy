import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

interface BudgetCategory {
  id: number;
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  progressPercentage: number;
  status: 'good' | 'warning' | 'danger';
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit {
  currentMonth: string = '';
  currentYear: number = 0;
  totalBudgeted: number = 0;
  totalSpent: number = 0;
  totalRemaining: number = 0;

  budgetCategories: BudgetCategory[] = [];

  constructor() { }

  ngOnInit(): void {
    this.updateCurrentMonthDisplay();
    this.loadBudgetData();
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

  loadBudgetData(): void {
    this.budgetCategories = [
      {
        id: 1,
        name: 'Lebensmittel',
        budgeted: 500,
        spent: 320,
        remaining: 180,
        progressPercentage: 64,
        status: 'good'
      },
      {
        id: 2,
        name: 'Wohnen',
        budgeted: 850,
        spent: 850,
        remaining: 0,
        progressPercentage: 100,
        status: 'warning'
      },
      {
        id: 3,
        name: 'Transport',
        budgeted: 200,
        spent: 140,
        remaining: 60,
        progressPercentage: 70,
        status: 'good'
      },
      {
        id: 4,
        name: 'Freizeit',
        budgeted: 300,
        spent: 275,
        remaining: 25,
        progressPercentage: 92,
        status: 'warning'
      },
      {
        id: 5,
        name: 'Sparen',
        budgeted: 400,
        spent: 400,
        remaining: 0,
        progressPercentage: 100,
        status: 'good'
      }
    ];

    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalBudgeted = this.budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
    this.totalSpent = this.budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
    this.totalRemaining = this.totalBudgeted - this.totalSpent;
  }

  addBudgetCategory(): void {
    console.log('Navigate to add budget category');
  }

  editBudgetCategory(id: number): void {
    console.log(`Edit budget category ${id}`);
  }

  previousMonth(): void {
 
  }

  nextMonth(): void {
   
  }
}