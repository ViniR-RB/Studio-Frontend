import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PagesRepository } from '../core/repositories/pages.repository';
import { PageSummary } from '../core/schemas/page.schema';
import { GenerationFormComponent } from '../features/generations/generation-form.component';
import { ModalComponent } from '../ui/atoms/modal.component';
import { LucideFilePlus2 } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pages-page',
  imports: [ModalComponent, GenerationFormComponent, LucideFilePlus2, RouterLink],
  template: `
    <section>
      <div class="mb-8 flex items-end justify-between gap-4">
        <div><p class="text-xs font-black tracking-widest text-brand">STUDIO / PÁGINAS</p><h1 class="my-4 text-6xl font-black tracking-[-.07em] max-[780px]:text-4xl">Minhas páginas.</h1></div>
        <button class="flex items-center gap-2 rounded-xl bg-brand px-4 py-3 font-extrabold text-white hover:opacity-90" type="button" (click)="create()"><svg lucideFilePlus2 [size]="17"></svg><span>Nova página</span></button>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        @for (page of pages(); track page.id) { <a class="grid cursor-pointer gap-2 rounded-2xl border border-line bg-white p-5 text-left text-ink hover:border-brand" [routerLink]="['/pages', page.slug]"><strong>{{ page.slug }}</strong><span class="text-sm text-muted">{{ page.status }}</span></a> } @empty { <p>Nenhuma página publicada ainda.</p> }
      </div>
      <app-modal #createModal title="Nova página" [showConfirm]="false"><app-generation-form (created)="refreshAndClose($event)" /></app-modal>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagesPageComponent {
  private readonly repository = inject(PagesRepository);
  private readonly router = inject(Router);
  protected readonly pages = signal<PageSummary[]>([]);
  private readonly createModal = viewChild<ModalComponent>('createModal');

  constructor() { this.refresh(); }
  create() { this.createModal()?.open(); }
  refreshAndClose(slug: string) { this.refresh(); this.createModal()?.close(); this.router.navigate(['/pages', slug]); }
  private refresh() { this.repository.list().subscribe({ next: (pages) => this.pages.set(pages) }); }
}
