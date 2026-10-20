import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StatsService } from '../../services/stats.service';
import { Router } from '@angular/router';
import { ChartOptions } from 'chart.js';
import { Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
@Pipe({
  name: 'filterMots',
  standalone: true
})
export class FilterMotsPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    searchText = searchText.toLowerCase();
    return items.filter(it => it.word.toLowerCase().includes(searchText));
  }
}


@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.scss'],
   standalone: true,
  imports:[CommonModule, FormsModule,NgChartsModule]
})
export class AgentDashboardComponent implements OnInit {
  stats: any = {};
  periode = 'jour';
topQuestionsLabels: string[] = [];
topQuestionsData: number[] = [];
questionsByDayLabels: string[] = [];
questionsByDayData: number[] = [];
filterMot: string = '';

chartOptions: any = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    title: {
      display: true,
      text: 'Évolution des questions',
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: '', // ➔ sera mis à jour dynamiquement
        color: '#333',
        font: {
          size: 14
        }
      }
    },
    y: {
      title: {
        display: true,
        text: 'Nombre de questions',
        color: '#333',
        font: {
          size: 14
        }
      },
      beginAtZero: true
    }
  }
};


  constructor(private router: Router,private http: HttpClient,private statsService: StatsService) {}

  ngOnInit() {
    this.loadStats();
  }
  

loadStats() {
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };

  this.http.get<any>(`http://localhost:3000/api/agent/stats?periode=${this.periode}`, { headers })
    .subscribe({
      next: (data) => {
        console.log('✅ Stats reçues :', data);
        this.stats = data;

        // ✅ Fonction de normalisation
        const normalize = (str: string) => str.toLowerCase().replace(/[?.!]/g, '').trim();

        const aggregated: { [key: string]: number } = {};

        // 🔄 Agréger en normalisant, tout en excluant "bonjour"
        data.topQuestions.forEach((q: any) => {
          const original = q.text.trim();
          const normalized = normalize(original);

          if (normalized !== 'bonjour') { // ➡️ Ignore bonjour
            if (aggregated[normalized]) {
              aggregated[normalized] += Number(q.count);
            } else {
              aggregated[normalized] = Number(q.count);
            }
          }
        });

        // 🔢 Générer labels et data à partir de l'agrégation
        this.topQuestionsLabels = Object.keys(aggregated);
        this.topQuestionsData = Object.values(aggregated);

        console.log('✅ Labels topQuestions normalisés :', this.topQuestionsLabels);
        console.log('✅ Data topQuestions agrégés :', this.topQuestionsData);

        // ⚠️ Si tu utilises questionsByDay plus tard
        if (data.questionsByDay) {
          this.questionsByDayLabels = data.questionsByDay.labels;
          this.questionsByDayData = data.questionsByDay.data.map((d: any) => Number(d));
        }

        // ➡️ Mise à jour du titre x
        if (this.periode === 'jour') {
          this.chartOptions.scales.x.title.text = 'Heure';
        } else if (this.periode === 'semaine' || this.periode === 'mois') {
          this.chartOptions.scales.x.title.text = 'Jour';
        }

      },
      error: (err) => console.error('Erreur de chargement stats', err)
    });
}

  voirTousMotsSensibles() {
    alert('Fonction Voir tous les mots sensibles (à implémenter)');
  }

  contacterClient(client: any) {
    alert(`Fonction Contacter ${client.username} (à implémenter)`);
    // ➡️ Plus tard : redirige vers chat ou ouvre modal de contact
    // Exemple navigation vers chat : this.router.navigate(['/agent/contact', client.id]);
  }

  voirHistorique(client: any) {
  this.router.navigate(['/agent/history', client.id]);
  
}

   goBack() {
  this.router.navigate(['/agent/home']);
}

   
}
