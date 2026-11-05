import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login-page.component').then((m) => m.LoginPageComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/app-shell.component').then((m) => m.AppShellComponent), children: [
    { path: '', pathMatch: 'full', redirectTo: 'pages' },
    { path: 'pages', loadComponent: () => import('./pages/pages-page.component').then((m) => m.PagesPageComponent) },
    { path: 'pages/:slug', loadComponent: () => import('./pages/page-detail-page.component').then((m) => m.PageDetailPageComponent) },
    { path: 'skills', loadComponent: () => import('./pages/skills-page.component').then((m) => m.SkillsPageComponent) },
    { path: 'design-systems', loadComponent: () => import('./pages/design-systems-page.component').then((m) => m.DesignSystemsPageComponent) },
  ] },
  { path: '**', redirectTo: 'login' },
];
