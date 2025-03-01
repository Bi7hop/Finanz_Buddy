import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TransactionsTestComponent } from './components/transactions-test/transactions-test.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TransactionsTestComponent], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Finanz_Buddy';
}