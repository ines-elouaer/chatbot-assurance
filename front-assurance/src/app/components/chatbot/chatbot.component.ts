import { Component } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
   standalone: true,
  imports:[CommonModule, FormsModule,RouterModule]
})
export class ChatbotComponent {
  showWelcome = true; 
  userMessage: string = '';
  messages: { from: string, text: string }[] = [];
  groupedMessages: { [key: string]: any[] } = {};
  recognition: any;
  isListening = false;
  fromSpeech = false;
  // ✅ AJOUTER ICI pour corriger l'erreur
  isSidebarCollapsed = false;
  newMessage: string = '';
isCollapsed = true;

toggleSidebar() {
  this.isCollapsed = !this.isCollapsed;
}
  constructor(
    private chatbotService: ChatbotService,
    public authService: AuthService,
    private router: Router,
    private http: HttpClient,
     private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    
    // Initialisation SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[STT] Texte reconnu :', transcript);
        this.userMessage = transcript;
        this.fromSpeech = true;

        setTimeout(() => {
          this.sendMessage();
          this.recognition.stop();
        }, 100);
      };

      this.recognition.onerror = (err: any) => {
        console.error('Erreur STT :', err);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        console.log('[STT] Fin de l’écoute');
        this.isListening = false;
      };
    }

    // Chargement des messages pour l'agent
    this.chatbotService.getAgentMessages().subscribe({
      next: (data) => {
        this.groupedMessages = {};
        data.forEach((msg: any) => {
          const userKey = `${msg.user_id}-${msg.username}`;
          if (!this.groupedMessages[userKey]) {
            this.groupedMessages[userKey] = [];
          }
          this.groupedMessages[userKey].push(msg);
        });
      },
      error: (err) => {
        console.error('Erreur de récupération des messages', err);
      }
    });
  }

  sendMessage(): void {
    if (!this.userMessage.trim()) {
      console.log('[DEBUG] Message vide');
      return;
    }
    this.showWelcome = false; 

    const messageToSend = this.userMessage;
    console.log('[DEBUG] Message envoyé :', messageToSend);
    this.messages.push({ from: 'user', text: messageToSend });
    this.userMessage = '';

    this.chatbotService.sendMessage(messageToSend).subscribe({
      next: (response) => {
    this.ngZone.run(() => {
      console.log('[DEBUG] Réponse du bot :', response.reply);
      this.messages.push({ from: 'bot', text: response.reply });

      if (this.fromSpeech) {
        const synth = window.speechSynthesis;
        const utter = new SpeechSynthesisUtterance(response.reply);
        utter.lang = 'fr-FR';
        synth.speak(utter);
      }

      this.fromSpeech = false;
      this.isListening = false;
    });
  },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du message :', error);
        this.messages.push({ from: 'bot', text: "Erreur : impossible de contacter le serveur." });
        this.fromSpeech = false;
        this.isListening = false;
      }
    });
  }

  startListening(): void {
    if (this.recognition) {
      this.isListening = true;
      this.fromSpeech = true;
      this.recognition.start();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showDashboardLink(): boolean {
    const role = this.authService.getUserRole();
    return role === 'admin' || role === 'agent';
  }

  loadHistory(): void {
    this.chatbotService.getMyMessages().subscribe({
      next: (data) => {
        console.log("Historique récupéré ✅", data);
        this.messages = data.map(msg => ({
          from: msg.sender,
          text: msg.text
        }));
      },
      error: (err) => {
        console.error('Erreur de récupération historique :', err);
      }
    });
  }

  getAllMessages(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/messages');
    }
formatBotMessage(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Retire tout caractère parasite avant regex
  const cleanText = text.replace(/<|>|Lien\s*:/gi, '').trim();

  if (urlRegex.test(cleanText)) {
    return cleanText.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${url}</a>`;
    });
  } else {
    return cleanText.replace(/\blink\b/gi, '').trim();
  }
}


}