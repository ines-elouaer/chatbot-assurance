import { Component, OnInit } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-admin-history',
  templateUrl: './admin-history.component.html',
  styleUrls: ['./admin-history.component.scss']
})
export class AdminHistoryComponent implements OnInit {

  allMessages: any[] = [];
  paginatedMessages: any[] = [];

  uniqueClients: any[] = []; // ✅ objets complets
  uniqueAgents: any[] = [];  // ✅ objets complets
groupedMessages: any[] = [];

  selectedClient: any = null;
  selectedAgent: any = null;
  startDate: string = '';
  endDate: string = '';

  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  constructor(
    private chatbotService: ChatbotService,
    public authService: AuthService,
    private router: Router
  ) {}

 ngOnInit(): void {
  // ❌ Supprime l'appel initial aux messages

  // ✅ Charger tous les agents
  this.chatbotService.getAllAgents().subscribe({
    next: (agents) => {
      this.uniqueAgents = agents;
    },
    error: (err) => {
      console.error('Erreur chargement agents', err);
    }
  });



    // ✅ Charger tous les clients (objets complets)
    this.chatbotService.getAllClients().subscribe({
      next: (clients) => {
        this.uniqueClients = clients;
        console.log('Clients:', clients);
      },
      error: (err) => {
        console.error('Erreur chargement clients', err);
      }
    });

    // ✅ Charger tous les agents (objets complets)
    this.chatbotService.getAllAgents().subscribe({
      next: (agents) => {
        this.uniqueAgents = agents;
        console.log('Agents:', agents);
      },
      error: (err) => {
        console.error('Erreur chargement agents', err);
      }
    });
  }

  applyFilter() {
  if (!this.selectedAgent || !this.selectedClient) {
    alert('Veuillez sélectionner un agent et un client');
    return;
  }
  if (!this.endDate) {
    alert('Veuillez sélectionner la date de fin.');
    return;
  }

  this.chatbotService.getMessagesFiltered(
    this.selectedAgent.id,
    this.selectedClient.id,
    this.startDate,
    this.endDate
  ).subscribe({
    next: (data) => {
      console.log('✅ Messages filtrés:', data.messages);

      // 🔑 NOUVEAU : grouper en paires user/bot
      this.groupMessagesByPairs(data.messages);

      this.currentPage = 1;
      this.paginateMessages();
    },
    error: (err) => {
      console.error('Erreur filtrage messages:', err);
    }
  });
}


  paginateMessages() {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.paginatedMessages = this.groupedMessages.slice(start, end);
  this.totalPages = Math.ceil(this.groupedMessages.length / this.pageSize);
}

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateMessages();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateMessages();
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
  onAgentChange() {
  if (this.selectedAgent) {
    this.chatbotService.getClientsByAgent(this.selectedAgent.id).subscribe({
      next: (clients) => {
        if (clients.length === 0) {
          alert("Cet agent n'a aucun client inscrit.");
        }
        this.uniqueClients = clients;
        this.selectedClient = null; // reset selection client
        console.log('Clients de cet agent:', clients);
      },
      error: (err) => {
        console.error('Erreur chargement clients par agent', err);
        alert("Erreur lors de la récupération des clients de cet agent.");
      }
    });
  } else {
    // si aucun agent sélectionné, recharger tous les clients
    this.chatbotService.getAllClients().subscribe({
      next: (clients) => {
        this.uniqueClients = clients;
      },
      error: (err) => {
        console.error('Erreur chargement clients', err);
        alert("Erreur lors de la récupération des clients.");
      }
    });
  }
}
parseBotReply(text: string): string {
  try {
    const obj = JSON.parse(text);
    return obj.reply || text;
  } catch (e) {
    return text; // si ce n'est pas un JSON
  }
}
groupMessagesByPairs(messages: any[]) {
  this.groupedMessages = [];
  let currentBot = null;

  for (let msg of messages) {
    if (msg.sender === 'bot') {
      if (currentBot) {
        this.groupedMessages.push({ user: { text: '' }, bot: currentBot });
      }
      currentBot = msg;
    } else if (msg.sender === 'user') {
      if (currentBot) {
        this.groupedMessages.push({ user: msg, bot: currentBot });
        currentBot = null;
      } else {
        this.groupedMessages.push({ user: msg, bot: { text: '' } });
      }
    }
  }

  if (currentBot) {
    this.groupedMessages.push({ user: { text: '' }, bot: currentBot });
  }
}

}