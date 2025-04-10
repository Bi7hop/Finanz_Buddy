// imprint.component.ts
import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
