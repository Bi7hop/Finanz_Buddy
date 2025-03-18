import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ActivatedRoute, Router } from '@angular/router';

interface ManualSection {
  id: string;
  title: string;
  content: string;
  implemented: boolean;
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
  
  manualCategories: ManualCategory[] = [
    {
      id: 'getting-started',
      title: 'Erste Schritte',
      sections: [
        {
          id: 'welcome',
          title: 'Willkommen zu Finanz Buddy',
          content: 'Willkommen bei Finanz Buddy, deinem persönlichen Finanzassistenten. Diese Anwendung hilft dir, deine Finanzen zu verwalten, zu planen und zu überwachen. In diesem Handbuch findest du ausführliche Informationen zu allen Funktionen und Möglichkeiten der App.',
          implemented: true
        },
        {
          id: 'dashboard-overview',
          title: 'Überblick über das Dashboard',
          content: 'Das Dashboard bietet dir einen schnellen Überblick über deine finanzielle Situation. Hier siehst du deine Einnahmen, Ausgaben, Salden und wichtigsten Finanzkennzahlen auf einen Blick. Nutze die verschiedenen Widgets, um deine Finanzen zu überwachen und Trends zu erkennen.',
          implemented: true
        },
        {
          id: 'initial-setup',
          title: 'Ersteinrichtung',
          content: 'Bei der ersten Nutzung solltest du zunächst deine Konten und Kategorien einrichten. Gehe dazu in die Einstellungen und füge deine Bankkonten hinzu. Definiere anschließend Kategorien für Einnahmen und Ausgaben, um deine Finanzen besser organisieren zu können.',
          implemented: true
        }
      ]
    },
    {
      id: 'main-features',
      title: 'Hauptfunktionen',
      sections: [
        {
          id: 'income-tracking',
          title: 'Einnahmen erfassen',
          content: 'Mit dem Einnahmen-Modul kannst du alle deine Einkünfte erfassen und kategorisieren. Lege wiederkehrende Einnahmen an und behalte den Überblick über deine Einkommensquellen. Du kannst Einnahmen manuell erfassen oder sie automatisch über die Banking-Funktion importieren.',
          implemented: true
        },
        {
          id: 'expense-tracking',
          title: 'Ausgaben verwalten',
          content: 'Das Ausgaben-Modul ermöglicht dir, all deine Ausgaben zu erfassen und zu kategorisieren. Plane deine Ausgaben und verfolge, wie viel du in verschiedenen Kategorien ausgibst. Mit den Analysefunktionen erhältst du wertvolle Einblicke in dein Ausgabenverhalten.',
          implemented: true
        },
        {
          id: 'budget-planning',
          title: 'Budgetplanung',
          content: 'Mit der Budgetplanung kannst du für verschiedene Kategorien monatliche Budgets festlegen. Die App zeigt dir, wie viel du bereits ausgegeben hast und wie viel noch verfügbar ist. So behältst du die Kontrolle über deine Ausgaben und vermeidest Überraschungen.',
          implemented: true
        },
        {
          id: 'transactions',
          title: 'Buchungen und Transaktionen',
          content: 'Im Buchungen-Modul siehst du alle deine Transaktionen in einer übersichtlichen Liste. Du kannst nach verschiedenen Kriterien filtern, suchen und Transaktionen bearbeiten. Die Transaktionshistorie gibt dir einen vollständigen Überblick über deine finanziellen Aktivitäten.',
          implemented: false
        },
        {
          id: 'standing-orders',
          title: 'Daueraufträge verwalten',
          content: 'Mit der Dauerauftrags-Funktion kannst du wiederkehrende Zahlungen erfassen und verwalten. Die App erinnert dich automatisch an anstehende Zahlungen und kann Prognosen für zukünftige Salden basierend auf deinen Daueraufträgen erstellen.',
          implemented: false
        }
      ]
    },
    {
      id: 'advanced-features',
      title: 'Erweiterte Funktionen',
      sections: [
        {
          id: 'banking-integration',
          title: 'Banking-Integration',
          content: 'Die Banking-Funktion ermöglicht es dir, deine Bankkonten direkt mit der App zu verbinden. Transaktionen werden automatisch importiert und kategorisiert, sodass du immer einen aktuellen Überblick über deine Finanzen hast. Die Verbindung erfolgt über sichere API-Schnittstellen.',
          implemented: false
        },
        {
          id: 'credit-management',
          title: 'Kreditverwaltung',
          content: 'Mit dem Kredit-Modul kannst du deine Darlehen und Kredite verwalten. Behalte den Überblick über Zinsen, Tilgungsraten und Restlaufzeiten. Die App erstellt für dich Tilgungspläne und zeigt dir, wann deine Kredite vollständig zurückgezahlt sein werden.',
          implemented: false
        },
        {
          id: 'reports',
          title: 'Berichte und Analysen',
          content: 'Die Berichtsfunktion bietet dir detaillierte Auswertungen deiner Finanzen. Erstelle individuelle Berichte für verschiedene Zeiträume und exportiere diese als PDF oder Excel. Die visuellen Darstellungen helfen dir, Trends und Muster in deinen Finanzen zu erkennen.',
          implemented: false
        },
        {
          id: 'distribution-analysis',
          title: 'Verteilungsanalyse',
          content: 'Die Verteilungsanalyse zeigt dir, wie sich deine Einnahmen und Ausgaben auf verschiedene Kategorien verteilen. Mit anschaulichen Diagrammen erkennst du auf einen Blick, wofür du dein Geld ausgibst und wo Einsparpotenziale bestehen könnten.',
          implemented: false
        },
        {
          id: 'statistics',
          title: 'Finanzstatistiken',
          content: 'Das Statistik-Modul bietet dir fortgeschrittene Analysen deiner finanziellen Daten. Vergleiche Zeiträume, identifiziere Trends und erhalte Prognosen für zukünftige Entwicklungen. Die interaktiven Grafiken ermöglichen tiefgehende Einblicke in deine Finanzsituation.',
          implemented: true
        }
      ]
    },
    {
      id: 'settings',
      title: 'Einstellungen und Anpassungen',
      sections: [
        {
          id: 'user-profile',
          title: 'Benutzerprofil',
          content: 'In den Profileinstellungen kannst du deine persönlichen Daten verwalten, dein Passwort ändern und Benachrichtigungseinstellungen anpassen. Hier kannst du auch dein Profilbild hochladen und weitere Einstellungen für dein Konto vornehmen.',
          implemented: true
        },
        {
          id: 'app-settings',
          title: 'App-Einstellungen',
          content: 'In den App-Einstellungen kannst du das Erscheinungsbild anpassen, die Standardwährung festlegen und weitere Präferenzen definieren. Die App passt sich so optimal an deine Bedürfnisse an und bietet dir ein personalisiertes Nutzungserlebnis.',
          implemented: true
        }
      ]
    }
  ];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.activeSection = fragment;
        this.scrollToSection(fragment);
      } else {
        this.activeSection = 'welcome';
      }
    });
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