import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AgentGuard } from './guards/agent.guard'; // âž” Ã  crÃ©er si non existant
import { ClientGuard } from './guards/client.guard';

const routes: Routes = [

  { path: '', redirectTo: 'chatbot', pathMatch: 'full' },

{
  path: 'chatbot',
  canActivate: [AuthGuard, ClientGuard],
  loadComponent: () => import('./components/chatbot/chatbot.component').then(m => m.ChatbotComponent)
},

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'history',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/client-history/client-history.component').then(m => m.ClientHistoryComponent)
  },

  {
  path: 'agent-history',
  canActivate: [AuthGuard, AgentGuard],
  loadComponent: () => import('./components/agent-history/agent-history.component').then(m => m.AgentHistoryComponent)
}
,
  {
    path: 'admin-history',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./components/admin-history/admin-history.component').then(m => m.AdminHistoryComponent)
  },

  {
    path: 'admin/intentions',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./components/admin-intentions/admin-intentions.component').then(m => m.AdminIntentionsComponent)
  },

  {
    path: 'admin/dashboard',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },

  {
    path: 'admin/sensibles',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./components/admin-sensibles/admin-sensibles.component').then(m => m.AdminSensiblesComponent)
  },

  {
    path: 'agent/home',
    canActivate: [AuthGuard, AgentGuard],
    loadComponent: () => import('./components/agent-home/agent-home.component').then(m => m.AgentHomeComponent)
  },

  {
    path: 'agent/dashboard',
    canActivate: [AuthGuard, AgentGuard],
    loadComponent: () => import('./components/agent-dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent)
  },

  {
  path: 'history',
  canActivate: [AuthGuard, ClientGuard],
  loadComponent: () => import('./components/client-history/client-history.component').then(m => m.ClientHistoryComponent)
},

 {
  path: 'agent/history/:id',
  canActivate: [AuthGuard, AgentGuard], // âœ… DOIT Ãªtre AgentGuard
  loadComponent: () => import('./components/client-history/client-history.component').then(m => m.ClientHistoryComponent)
}

,

  {
  path: 'client/history/:id',
  canActivate: [AuthGuard, ClientGuard],
  loadComponent: () => import('./components/client-history/client-history.component').then(m => m.ClientHistoryComponent)
},
  { path: '**', redirectTo: 'chatbot' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
