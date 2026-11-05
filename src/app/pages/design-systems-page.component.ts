import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ModalComponent } from '../ui/atoms/modal.component';
import { GenerationsRepository } from '../core/repositories/generations.repository';
import { DesignSystemSummary } from '../core/schemas/page.schema';

@Component({
  selector: 'app-design-systems-page',
  template: `
    <section class="grid gap-6">
      <header><p class="text-xs font-black tracking-widest text-brand">STUDIO / DESIGN SYSTEMS</p><h1 class="my-3 text-5xl font-black tracking-[-.06em]">Sistemas visuais.</h1><p class="text-muted">Visualize cores, tipografia, espaçamento, bordas e os demais tokens disponíveis.</p></header>
      @if (error()) { <p class="rounded-xl bg-red-50 p-4 text-red-700" role="alert">{{ error() }}</p> }
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">@for (system of systems(); track system.id) {
        <article class="grid cursor-pointer gap-4 rounded-2xl border border-line bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg" tabindex="0" role="button" (click)="open(system)" (keydown.enter)="open(system)">
          <div class="flex items-start justify-between gap-3"><div><h2 class="m-0 text-xl font-black">{{ system.name }}</h2><p class="mt-1 line-clamp-2 text-sm text-muted">{{ system.description }}</p></div><span class="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand">{{ system.category }}</span></div>
          <div class="flex gap-2">@for (color of colors(system).slice(0, 5); track color[0]) { <span class="h-8 w-8 rounded-full border border-line" [style.background-color]="color[1]" [title]="color[0] + ' ' + color[1]"></span> }</div><button class="rounded-xl border border-line px-3 py-2 text-sm font-bold hover:border-brand" type="button" (click)="$event.stopPropagation(); open(system)">Ver tokens</button>
        </article>
      }</div>
      <app-modal #detailModal [title]="selected()?.name ?? 'Design system'" [showConfirm]="false">@if (selected(); as system) {
        <div class="grid gap-5">
          <p class="m-0 text-sm text-muted">{{ system.description }}</p>
          <section class="grid gap-3"><h3 class="m-0 text-sm font-black uppercase tracking-widest text-muted">Cores</h3><div class="grid grid-cols-2 gap-3 sm:grid-cols-4">@for (color of colors(system); track color[0]) { <div class="grid gap-2"><div class="h-16 rounded-xl border border-line" [style.background-color]="color[1]"></div><strong class="text-xs">{{ color[0] }}</strong><code class="text-xs text-muted">{{ color[1] }}</code></div> }</div></section>
          <section class="grid gap-3"><h3 class="m-0 text-sm font-black uppercase tracking-widest text-muted">Tipografia</h3><div class="rounded-xl bg-slate-50 p-4" [style.font-family]="token(system, 'typography.fontFamily')"><p class="m-0 text-3xl font-black" [style.font-weight]="token(system, 'typography.headingWeight')">Aa</p><p class="m-0 text-lg">{{ token(system, 'typography.fontFamily') }}</p><p class="m-0 text-sm text-muted">Título {{ token(system, 'typography.headingWeight') }} · corpo {{ token(system, 'typography.bodyWeight') }}</p></div></section>
          <section class="grid gap-3"><h3 class="m-0 text-sm font-black uppercase tracking-widest text-muted">Todos os tokens</h3><div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">@for (group of groups(system); track group[0]) { <div class="rounded-xl bg-slate-50 p-3"><strong class="text-xs uppercase tracking-widest">{{ group[0] }}</strong><pre class="mt-2 overflow-auto text-xs text-muted">{{ group[1] | json }}</pre></div> }</div></section>
        </div>
      }</app-modal>
        </section>
  `,
  imports: [JsonPipe, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSystemsPageComponent {
  private readonly repository = inject(GenerationsRepository);
  protected readonly systems = signal<DesignSystemSummary[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<DesignSystemSummary | null>(null);
  private readonly detailModal = viewChild<ModalComponent>('detailModal');
  constructor() { this.repository.designSystems().subscribe({ next: (systems) => this.systems.set(systems), error: () => this.error.set('Não foi possível carregar os design systems.') }); }
  open(system: DesignSystemSummary) { this.selected.set(system); this.detailModal()?.open(); }
  token(system: DesignSystemSummary, path: string) { return path.split('.').reduce((value: any, key) => value?.[key], system.tokens) ?? '—'; }
  colors(system: DesignSystemSummary) { return Object.entries((system.tokens['colors'] ?? {}) as Record<string, string>); }
  groups(system: DesignSystemSummary) { return Object.entries(system.tokens).filter(([key]) => key !== 'colors' && key !== 'typography'); }
}
