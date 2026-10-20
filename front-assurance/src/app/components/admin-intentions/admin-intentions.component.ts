import { Component, OnInit } from '@angular/core';
import { IntentionService } from '../../services/intention.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-admin-intentions',
  templateUrl: './admin-intentions.component.html',
  styleUrls: ['./admin-intentions.component.scss'],
  imports:[CommonModule, FormsModule],
   standalone: true
})
export class AdminIntentionsComponent implements OnInit {
  intentions: any[] = [];
  newKeyword = '';
  newResponse = '';
  editingId: number | null = null;
  newLink = '';

  constructor(private intentionService: IntentionService,private router: Router) {}

  ngOnInit(): void {
    this.loadIntentions();
  }

  loadIntentions() {
    this.intentionService.getIntentions().subscribe(data => this.intentions = data);
  }

successMessage = '';

addIntention() {

  this.intentionService.addIntention(this.newKeyword, this.newResponse,this.newLink ).subscribe({
    next: (newIntent) => {
      console.log("ðŸ”¥ Nouvelle intention reÃ§ue :", newIntent);


      // VÃ©rifie si newIntent a les clÃ©s attendues
      if (newIntent && newIntent.id && newIntent.keyword && newIntent.response) {
        this.intentions.unshift(newIntent);
      } else {
        console.warn("âš ï¸ RÃ©ponse inattendue, rechargement forcÃ©");
        this.loadIntentions();
      }

      this.newKeyword = '';
      this.newResponse = '';
      this.newLink = '';
      this.successMessage = 'âœ… Intention ajoutÃ©e avec succÃ¨s';

      setTimeout(() => this.successMessage = '', 3000);
    },
    error: (err) => {
      console.error("âŒ Erreur ajout intention :", err);
    }
  });
}




  deleteIntention(id: number) {
  const confirmation = window.confirm('âŒ Es-tu sÃ»r de vouloir supprimer cette intention ?');

  if (confirmation) {
    this.intentionService.deleteIntention(id).subscribe(() => {
      this.loadIntentions();
      // Optionnel : message de succÃ¨s
      this.successMessage = 'Intention supprimÃ©e avec succÃ¨s âœ…';
      setTimeout(() => this.successMessage = '', 3000);
    }, error => {
      console.error('âŒ Erreur lors de la suppression :', error);
    });
  }
}


  startEdit(intent: any) {
    this.editingId = intent.id;
    this.newKeyword = intent.keyword;
    this.newResponse = intent.response;
     this.newLink = intent.link || '';
  }

 saveEdit() {
  if (this.editingId) {
    const confirmed = confirm("âš ï¸ Confirmez-vous la modification de cette intention ?");
    if (!confirmed) return;

    this.intentionService.updateIntention(this.editingId, this.newKeyword, this.newResponse, this.newLink)
      .subscribe(() => {
        this.editingId = null;
        this.newKeyword = '';
        this.newResponse = '';
        this.newLink = '';
        this.loadIntentions();
        this.successMessage = 'Intention modifiÃ©e avec succÃ¨s âœ…';
        setTimeout(() => this.successMessage = '', 3000);
      });
  }
}


goBack() {
  this.router.navigate(['/admin/dashboard']);
}

}
