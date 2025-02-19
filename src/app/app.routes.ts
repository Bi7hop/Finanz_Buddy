import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent },        
      { path: 'einnahmen', component: DashboardComponent }, 
      { path: 'ausgaben', component: DashboardComponent },  
      
    ]
  },
  
];
