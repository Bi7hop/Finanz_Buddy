import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BudgetComponent } from './components/budget/budget.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { NotImplementedComponent } from './components/not-implemented/not-implemented.component';
import { ExpenseComponent } from './components/expense/expense.component';
import { IncomeComponent } from './components/income/income.component';
import { TransactionFormComponent } from './components/transactions/transactions.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },        
      { path: 'einnahmen', component: IncomeComponent },
      { path: 'ausgaben', component: ExpenseComponent },
      { path: 'budget', component: BudgetComponent },
      { path: 'buchungen', component: NotImplementedComponent, data: { featureName: 'Buchungen' } },
      { path: 'dauerauftraege', component: NotImplementedComponent, data: { featureName: 'Daueraufträge' } },
      { path: 'banking', component: NotImplementedComponent, data: { featureName: 'Banking' } },
      { path: 'kredite', component: NotImplementedComponent, data: { featureName: 'Kredite' } },
      { path: 'berichte', component: NotImplementedComponent, data: { featureName: 'Berichte' } },
      { path: 'verteilung', component: NotImplementedComponent, data: { featureName: 'Verteilung' } },
      { path: 'statistiken', component: StatisticsComponent },
      { path: 'einstellungen', component: NotImplementedComponent, data: { featureName: 'Einstellungen' } },
      { path: 'handbuch', component: NotImplementedComponent, data: { featureName: 'Handbuch' } },
      { path: 'transaction/new', component: TransactionFormComponent },
    ]
  },
];