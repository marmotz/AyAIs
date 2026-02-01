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
      {
        path: 'dev',
        loadComponent: () => import('@app/dev/dev-page.component').then((m) => m.DevPageComponent),
      },
      {
        path: 'dev/test-updater',
        loadComponent: () => import('@app/dev/test-updater/test-updater.component').then((m) => m.TestUpdaterComponent),
      },
    ],
  },
  { path: '', redirectTo: '/app', pathMatch: 'full' },
  { path: '**', redirectTo: '/app' },
];
