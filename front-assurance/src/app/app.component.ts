import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  userMessage = '';
  messages: string[] = [];


  sendMessage() {
    if (this.userMessage.trim()) {
      this.messages.push("Moi : " + this.userMessage);
      this.messages.push("Bot : Ceci est une rÃ©ponse simulÃ©e.");
      this.userMessage = '';
    }
  }




}
