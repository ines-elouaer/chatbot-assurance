import { Component, OnInit,ViewEncapsulation  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface MotSensible {
  id: number;
  word: string;
}

@Component({
  selector: 'app-admin-sensibles',
  templateUrl: './admin-sensibles.component.html',
  styleUrls: ['./admin-sensibles.component.scss'],
  imports:[CommonModule, FormsModule,RouterModule],
   standalone: true
})
export class AdminSensiblesComponent implements OnInit {
  sensibles: MotSensible[] = [];
  newWord = '';
  editing = false;
  motAEditerId: number | null = null;
successMessage = '';
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.charger();
  }

  charger() {
    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<MotSensible[]>('http://localhost:3000/api/sensibles', { headers })
      .subscribe({
        next: data => this.sensibles = data,
        error: error => console.error('Erreur de chargement', error)
      });
  }

  ajouter() {
    const mot = this.newWord.trim();
    if (!mot) return;

    // ✅ confirmation avant ajout
    if (!confirm(`🔥 Nouvelle intention reçue :  "${mot}" ?`)) return;

    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post('http://localhost:3000/api/sensibles', { word: mot }, { headers })
      .subscribe({
        next: () => {
              this.successMessage = '✅ Mot ajouté avec succès';
          console.log('✅ Mot ajouté avec succès');
          this.newWord = '';
          this.charger();
          
        },
        error: err => console.error('❌ Erreur lors de l\'ajout', err)
      });
  }

  modifier(mot: MotSensible) {
    this.newWord = mot.word;
    this.editing = true;
    this.motAEditerId = mot.id;
  }
 modifierMot() {
    if (!this.motAEditerId) return;

    const nouveauMot = this.newWord.trim();
    if (!nouveauMot) return;

    // ✅ confirmation avant modification
    if (!confirm(`⚠️ Confirmez-vous la modification de cette intention ? "${nouveauMot}" ?`)) return;

    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.put(`http://localhost:3000/api/sensibles/${this.motAEditerId}`, { word: nouveauMot }, { headers })
      .subscribe({
        next: () => {
            this.successMessage = '✅ Mot modifié avec succès';

          console.log('✅ Mot modifié avec succès');

          const index = this.sensibles.findIndex(m => m.id === this.motAEditerId);
          if (index !== -1) {
            this.sensibles[index].word = nouveauMot;
          }

          this.sensibles.sort((a, b) => a.word.localeCompare(b.word));

          this.newWord = '';
          this.editing = false;
          this.motAEditerId = null;
          
        },
        error: err => console.error('❌ Erreur lors de la modification', err)
      });
  }

  supprimer(id: number) {
    // ✅ confirmation avant suppression
    if (!confirm('❌ Es-tu sûr de vouloir supprimer cette intention ?')) return;

    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.delete(`http://localhost:3000/api/sensibles/${id}`, { headers })
      .subscribe({
        next: () => {
           this.successMessage = '✅ Mot supprimé avec succès';
          this.charger();
          console.log('✅ Mot supprimé avec succès');
          this.charger();
        },
        error: err => console.error('❌ Erreur lors de la suppression', err)
      });
  }


}
