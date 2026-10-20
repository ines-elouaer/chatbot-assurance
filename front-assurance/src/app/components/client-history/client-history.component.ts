import { Component, OnInit } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-client-history',
  templateUrl: './client-history.component.html',
  styleUrls: ['./client-history.component.scss'],
   standalone: true,
  imports:[CommonModule, FormsModule,RouterModule]
})
export class ClientHistoryComponent implements OnInit {
  messages: any[] = [];
  clientId: number = 0;
 currentPage = 1;   // ✅ propriété ajoutée
  hasMore = false; 
sortAsc = true;
startDate: string = '';
endDate: string = '';
allMessages: any[] = [];  // contient tout l’historique sans pagination
totalPages: number = 1; // nombre total de pages

groupedMessages: any[] = [];

  constructor(private chatbotService: ChatbotService, private route: ActivatedRoute) {}

  
   ngOnInit() {
  const role = localStorage.getItem('role');

  if (role === 'agent') {
    this.clientId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAgentMessages();
  } else {
    this.loadClientMessages();
  }
}

loadAgentMessages() {
  this.chatbotService.getClientHistoryPaginated(this.clientId, this.currentPage).subscribe((data: any) => {
    this.messages = data.messages;
    this.hasMore = data.hasMore;
  });
}

loadClientMessages() {
  this.chatbotService.getMyHistory(this.currentPage, this.startDate, this.endDate)
    .subscribe((data: any) => {
      this.groupedMessages = data.pairs;
      this.hasMore = data.hasMore;
      this.totalPages = data.totalPages; // ✅ récupère la valeur ici
    });
}





nextPage() {
  if (this.hasMore) {
    this.currentPage++;
    this.loadClientMessages();
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.loadClientMessages();
  }
}
groupMessages() {
  this.groupedMessages = [];
  for (let i = 0; i < this.messages.length; i += 2) {
    const first = this.messages[i];
    const second = this.messages[i + 1];

    if (!second) {
      // si un seul message restant
      if (first.sender === 'user') {
        this.groupedMessages.push({
          user: first,
          bot: { text: '' }
        });
      } else {
        this.groupedMessages.push({
          user: { text: '' },
          bot: first
        });
      }
    } else {
      // deux messages : identifier qui est user et bot
      const userMsg = first.sender === 'user' ? first : second;
      const botMsg = first.sender === 'bot' ? first : second;

      this.groupedMessages.push({
        user: userMsg,
        bot: botMsg
      });
    }
  }
}

parseBotReply(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText);
    return parsed.reply || jsonText;
  } catch (e) {
    return jsonText;
  }
}
  
  applyFilter() {
  if (!this.startDate) {
    alert('Veuillez sélectionner la date de début.');
    return;
  }

  if (!this.endDate) {
    alert('Veuillez sélectionner la date de fin.');
    return;
  }

  // Appelle ta fonction de filtrage ici
  this.loadClientMessages(); // ou la fonction qui récupère tes messages filtrés
}








}