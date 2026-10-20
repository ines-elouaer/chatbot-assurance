import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AuthInterceptor } from './modules/auth/auth.interceptor';
import { NgChartsModule } from 'ng2-charts';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

// ❌ SUPPRIMÉS des declarations car ce sont des standalone components
// import { LoginComponent } from './components/login/login.component';
// import { ChatbotComponent } from './components/chatbot/chatbot.component';
// import { DashboardComponent } from './components/dashboard/dashboard.component';
// import { ClientHistoryComponent } from './components/client-history/client-history.component';
// import { RegisterComponent } from './components/register/register.component';
// import { NavbarComponent } from './components/navbar/navbar.component';
// import { AgentHistoryComponent } from './components/agent-history/agent-history.component';
// import { AdminIntentionsComponent } from './components/admin-intentions/admin-intentions.component';
// import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
// import { AdminHistoryComponent } from './components/admin-history/admin-history.component';
// import { AdminSensiblesComponent } from './components/admin-sensibles/admin-sensibles.component';
// import { AgentDashboardComponent, FilterMotsPipe } from './components/agent-dashboard/agent-dashboard.component';

@NgModule({
  declarations: [
    AppComponent // ✅ uniquement AppComponent ici
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    NgChartsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,

    // 🔷 Si tu utilises FilterMotsPipe ou d’autres standalone components dans AppComponent, importe-les ici :
    // FilterMotsPipe,
    // AgentDashboardComponent,
    // etc.
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
