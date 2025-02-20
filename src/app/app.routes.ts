import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BudgetComponent } from './components/budget/budget.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { NotImplementedComponent } from './components/not-implemented/not-implemented.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },        
      { path: 'einnahmen', component: NotImplementedComponent, data: { featureName: 'Einnahmen' } }, 
      { path: 'ausgaben', component: NotImplementedComponent, data: { featureName: 'Ausgaben' } },
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
    ]
  },
];