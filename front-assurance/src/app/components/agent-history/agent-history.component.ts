import { Component, OnInit } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-agent-history',
  templateUrl: './agent-history.component.html',
  styleUrls: ['./agent-history.component.scss'],
   standalone: true,
  imports:[CommonModule, FormsModule,RouterModule]
})
export class AgentHistoryComponent implements OnInit {
  clients: any[] = [];
  selectedClientId: number | null = null;

  startDate: string = '';
  endDate: string = '';

  groupedMessages: any[] = [];
  paginatedMessages: any[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.chatbotService.getAgentClients().subscribe((data: any) => {
      this.clients = data.clients;
    });
  }

  applyFilter() {
    if (!this.selectedClientId || !this.startDate || !this.endDate) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    this.chatbotService
      .getClientHistoryByDateRange(this.selectedClientId, this.startDate, this.endDate)
      .subscribe((data: any) => {
        this.groupMessagesByPairs(data.messages);
        this.currentPage = 1;
        this.paginateMessages();
      });
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

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateMessages();
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
}
