import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'app',
    loadComponent: () => import('@app/home/home.component').then((m) => m.Home),
    children: [
      {
        path: 'settings',
        loadComponent: () => import('@app/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '', redirectTo: '/app', pathMatch: 'full' },
  { path: '**', redirectTo: '/app' },
];
