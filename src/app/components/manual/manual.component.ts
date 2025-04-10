import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface ManualSection {
  id: string;
  title: string;
  content: string;
  implemented: boolean;
  parentId?: string;
}

interface ManualCategory {
  id: string;
  title: string;
  sections: ManualSection[];
}

@Component({
  selector: 'app-manual',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    ScrollingModule
  ],
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss']
})
export class ManualComponent implements OnInit {
  activeSection: string = '';
  manualCategories: ManualCategory[] = [];
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadManualContent().subscribe(() => {
      this.route.fragment.subscribe(fragment => {
        if (fragment) {
          this.activeSection = fragment;
          this.scrollToSection(fragment);
        } else if (this.manualCategories.length > 0 && this.manualCategories[0].sections.length > 0) {
          this.activeSection = this.manualCategories[0].sections[0].id || 'welcome';
        }
      });
    });
  }

  loadManualContent(): Observable<ManualCategory[]> {
    return this.http.get<ManualCategory[]>('/assets/manual-content.json').pipe(
      tap(data => {
        this.manualCategories = data;
      })
    );
  }

  scrollToSection(sectionId: string): void {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  navigateToSection(sectionId: string): void {
    this.activeSection = sectionId;
    this.router.navigate([], {
      fragment: sectionId,
      queryParamsHandling: 'preserve'
    });
  }
}