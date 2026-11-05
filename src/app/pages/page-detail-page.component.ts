import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ModalComponent } from '../ui/atoms/modal.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PagesRepository } from '../core/repositories/pages.repository';
import { FeedbackResponse, PageBriefing, PageVersion } from '../core/schemas/page.schema';
import { GenerationsRepository } from '../core/repositories/generations.repository';

@Component({
  selector: 'app-page-detail-page',
  imports: [RouterLink, ReactiveFormsModule, ModalComponent],
  template: `
    <section class="grid gap-6">
      <a routerLink="/pages" class="text-sm font-bold text-brand">← Voltar para páginas</a>
      <header><p class="text-xs font-black tracking-widest text-brand">STUDIO / REVISÃO</p><h1 class="my-3 text-5xl font-black tracking-[-.06em]">{{ slug }}</h1></header>
      @if (loading()) { <div class="grid min-h-40 place-items-center rounded-2xl border border-line bg-white text-muted" role="status">Carregando pedido e versões…</div> }
      @if (error()) { <p class="rounded-xl bg-red-50 p-4 text-red-700" role="alert">{{ error() }}</p> }
      @if (briefing(); as request) { <article class="grid gap-4 rounded-2xl border border-line bg-white p-5"><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-black">Pedido de geração</h2><span class="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">{{ request.status }}</span><button class="rounded-xl border border-line px-3 py-2 font-bold" (click)="openEditBriefing()">Editar briefing</button></div><dl class="grid gap-3 text-sm sm:grid-cols-2"><div><dt class="font-bold text-muted">Produto</dt><dd>{{ request.product_name }}</dd></div><div><dt class="font-bold text-muted">Público-alvo</dt><dd>{{ request.target_audience }}</dd></div><div class="sm:col-span-2"><dt class="font-bold text-muted">Descrição</dt><dd>{{ request.product_description }}</dd></div>@if (request.benefits) { <div class="sm:col-span-2"><dt class="font-bold text-muted">Benefícios</dt><dd>{{ request.benefits }}</dd></div> }@if (request.offer) { <div><dt class="font-bold text-muted">Oferta</dt><dd>{{ request.offer }}</dd></div> }@if (request.cta) { <div><dt class="font-bold text-muted">CTA</dt><dd>{{ request.cta }}</dd></div> }</dl>@if (request.image_urls.length) { <div class="flex gap-3 overflow-x-auto">@for (image of request.image_urls; track image) { <img class="h-24 w-24 rounded-xl object-cover" [src]="image" alt="Imagem do produto" /> }</div> }<p class="text-xs text-muted">Job: {{ request.job_id }}</p></article> }
      <app-modal #editBriefing title="Editar briefing" [showConfirm]="false"><form class="grid gap-3" [formGroup]="briefingForm" (ngSubmit)="saveBriefing()"><label>Produto<input formControlName="product_name" /></label><label>Descrição<textarea formControlName="product_description" rows="3"></textarea></label><label>Público-alvo<input formControlName="target_audience" /></label><label>Benefícios<textarea formControlName="benefits" rows="2"></textarea></label><label>Oferta<textarea formControlName="offer" rows="2"></textarea></label><label>CTA principal<input formControlName="cta" /></label><label>Direção visual<textarea formControlName="visual_direction" rows="2"></textarea></label><label>Referências visuais<textarea formControlName="reference_urls" rows="3"></textarea></label><label>Imagens do produto<textarea formControlName="image_urls" rows="3"></textarea></label><input type="file" accept="image/png,image/jpeg,image/webp" multiple (change)="uploadBriefingImages($event)" /><div class="flex flex-wrap gap-3">@for (image of briefingImages(); track image) { <div class="group relative"><img class="h-20 w-20 rounded-xl object-cover" [src]="image" alt="Imagem enviada do produto" /><button type="button" class="absolute inset-0 hidden rounded-xl bg-black/60 text-xs font-bold text-white group-hover:block" (click)="removeBriefingImage(image)">Excluir</button></div> }</div><button class="rounded-xl bg-brand px-4 py-3 font-bold text-white" [disabled]="briefingForm.invalid || busy()">Salvar briefing</button></form></app-modal>
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div class="grid gap-3">
          @if (previewLoading()) { <div class="grid min-h-96 place-items-center rounded-2xl border border-line bg-white text-muted" role="status">Carregando preview…</div> } @else if (preview()) { <iframe class="h-[70vh] w-full rounded-2xl border border-line bg-white" title="Preview da landing page" [src]="previewUrl()" sandbox="allow-scripts allow-same-origin"></iframe> } @else { <div class="grid min-h-96 place-items-center rounded-2xl border border-dashed border-line text-muted">Selecione uma versão para visualizar.</div> }
          <div class="flex flex-wrap gap-3">
            <button class="rounded-xl bg-brand px-4 py-3 font-bold text-white disabled:opacity-50" [disabled]="!selected() || busy()" (click)="confirmPublish.open()">{{ busyAction() === 'publish' ? 'Publicando…' : 'Publicar versão selecionada' }}</button>
            <button class="rounded-xl border border-line px-4 py-3 font-bold disabled:opacity-50" [disabled]="busy()" (click)="confirmRetry.open()">{{ busyAction() === 'retry' ? 'Gerando…' : 'Gerar novamente' }}</button>
            <button class="rounded-xl border border-line px-4 py-3 font-bold disabled:opacity-50" [disabled]="busy()" (click)="confirmUnpublish.open()">{{ busyAction() === 'unpublish' ? 'Despublicando…' : 'Despublicar' }}</button>
            @if (published()) { <a class="rounded-xl border border-brand px-4 py-3 font-bold text-brand" [href]="publicUrl()" target="_blank" rel="noreferrer">Abrir página publicada ↗</a> }
          </div>
        </div>
        <aside class="grid content-start gap-3">
          <h2 class="font-black">Histórico de versões</h2>
          @for (version of versions(); track version.id) { <button class="grid gap-1 rounded-xl border p-3 text-left" [class.border-brand]="selected()?.id === version.id" (click)="select(version)"><strong>Versão {{ version.version_number }}</strong><span class="text-xs text-muted">{{ version.status }}</span>@if (version.validation_errors?.length) { <span class="text-xs text-red-600">{{ version.validation_errors?.join(', ') }}</span> }</button> } @empty { <p class="text-sm text-muted">Nenhuma versão disponível.</p> }
        </aside>
      </div>
      @if (selected()) { <section class="grid gap-4 rounded-2xl border border-line bg-white p-5"><h2 class="font-black">Feedback da revisão</h2>@if (feedbackLoading()) { <p class="text-sm text-muted" role="status">Carregando feedbacks…</p> } @for (item of feedbacks(); track item.id) { <article class="rounded-xl bg-slate-50 p-4 text-sm"><div class="flex justify-between gap-3"><strong>{{ item.section_id || 'Página inteira' }}</strong>@if (item.rating) { <span>Nota: {{ item.rating }}/5</span> }</div><p class="mt-2">{{ item.comment }}</p></article> } @empty { @if (!feedbackLoading()) { <p class="text-sm text-muted">Nenhum feedback enviado para esta versão.</p> } }<form class="grid gap-3 border-t border-line pt-4" [formGroup]="feedbackForm" (ngSubmit)="sendFeedback()"><select formControlName="rating"><option [ngValue]="null">Sem nota</option><option [ngValue]="1">1 — precisa melhorar</option><option [ngValue]="5">5 — aprovado</option></select><input formControlName="section_id" placeholder="Seção (opcional), ex.: hero" /><textarea formControlName="comment" rows="3" placeholder="O que deve ser melhorado?"></textarea><button class="rounded-xl bg-ink px-4 py-3 font-bold text-white disabled:opacity-50" type="submit" [disabled]="feedbackForm.invalid || busy()">{{ busyAction() === 'feedback' ? 'Enviando…' : 'Enviar feedback e gerar revisão' }}</button></form></section> }
      <app-modal #confirmPublish title="Publicar versão" [showConfirm]="true" confirmLabel="Publicar" [confirmDisabled]="busy()" (confirmed)="publish()"><p>Publicar a versão {{ selected()?.version_number }}? Ela ficará disponível no endereço público.</p></app-modal>
      <app-modal #confirmRetry title="Gerar novamente" [showConfirm]="true" confirmLabel="Gerar" [confirmDisabled]="busy()" (confirmed)="retry()"><p>Gerar novamente usando o mesmo pedido? Uma nova versão será criada para revisão.</p></app-modal>
      <app-modal #confirmUnpublish title="Despublicar página" [showConfirm]="true" confirmLabel="Despublicar" [confirmDisabled]="busy()" (confirmed)="unpublish()"><p>A página deixará de estar disponível publicamente. Continuar?</p></app-modal>
      @if (success()) { <p class="rounded-xl bg-emerald-50 p-4 text-emerald-700" role="status">{{ success() }}</p> }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(PagesRepository);
  private readonly generations = inject(GenerationsRepository);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
  protected readonly briefing = signal<PageBriefing | null>(null);
  protected readonly briefingImages = signal<string[]>([]);
  protected readonly versions = signal<PageVersion[]>([]);
  protected readonly feedbacks = signal<FeedbackResponse[]>([]);
  protected readonly feedbackLoading = signal(false);
  protected readonly selected = signal<PageVersion | null>(null);
  protected readonly published = computed(() => this.versions().some((version) => version.status === 'published'));
  protected readonly publicUrl = computed(() => `/api/v1/pages/${encodeURIComponent(this.slug)}`);
  protected readonly preview = signal<string | null>(null);
  protected readonly previewUrl = signal<SafeResourceUrl | null>(null);
  protected readonly previewLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly loading = signal(true);
  protected readonly busyAction = signal<'publish' | 'retry' | 'unpublish' | 'feedback' | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly confirmPublish = viewChild<ModalComponent>('confirmPublish');
  protected readonly confirmRetry = viewChild<ModalComponent>('confirmRetry');
  protected readonly confirmUnpublish = viewChild<ModalComponent>('confirmUnpublish');
  protected readonly editBriefing = viewChild<ModalComponent>('editBriefing');
  protected readonly briefingForm = this.fb.nonNullable.group({ product_name: ['', Validators.required], product_description: ['', Validators.required], target_audience: ['', Validators.required], benefits: [''], offer: [''], cta: [''], visual_direction: [''], reference_urls: [''], image_urls: [''] });
  protected readonly feedbackForm = this.fb.nonNullable.group({ rating: [null as number | null], section_id: [''], comment: ['', [Validators.required, Validators.maxLength(5000)]] });

  constructor() { this.load(); }
  openEditBriefing() { const briefing = this.briefing(); if (!briefing) return; this.briefingImages.set([...briefing.image_urls]); this.briefingForm.patchValue({ product_name: briefing.product_name, product_description: briefing.product_description, target_audience: briefing.target_audience, benefits: briefing.benefits ?? '', offer: briefing.offer ?? '', cta: briefing.cta ?? '', visual_direction: briefing.visual_direction ?? '', reference_urls: (briefing.reference_urls ?? []).join('\\n'), image_urls: (briefing.image_urls ?? []).join('\\n') }); queueMicrotask(() => this.editBriefing()?.open()); }
  uploadBriefingImages(event: Event) { const input = event.target as HTMLInputElement; for (const file of Array.from(input.files ?? [])) this.generations.uploadImage(file).subscribe({ next: ({ public_url }) => { this.briefingImages.update((images) => [...images, public_url]); this.briefingForm.controls.image_urls.setValue(this.briefingImages().join('\\n')); }, error: () => this.error.set('Não foi possível enviar a imagem.') }); }
  removeBriefingImage(url: string) { this.generations.deleteImage(url).subscribe({ next: () => { this.briefingImages.update((images) => images.filter((image) => image !== url)); this.briefingForm.controls.image_urls.setValue(this.briefingImages().join('\\n')); }, error: () => this.error.set('Não foi possível excluir a imagem.') }); }
  saveBriefing() { if (this.briefingForm.invalid) return; this.busy.set(true); const values = this.briefingForm.getRawValue(); this.repository.updateBriefing(this.slug, { ...this.briefing()!, ...values, reference_urls: values.reference_urls.split('\\n').filter(Boolean), image_urls: values.image_urls.split('\\n').filter(Boolean) }).subscribe({ next: (briefing) => { this.briefing.set(briefing); this.busy.set(false); this.editBriefing()?.close(); this.success.set('Briefing atualizado.'); }, error: () => { this.busy.set(false); this.error.set('Não foi possível atualizar o briefing.'); } }); }
  load() { this.loading.set(true); this.error.set(null); this.repository.briefing(this.slug).subscribe({ next: (briefing) => this.briefing.set(briefing), error: () => this.error.set('Não foi possível carregar o pedido de geração.') }); this.repository.versions(this.slug).subscribe({ next: (versions) => { this.versions.set(versions); if (versions[0]) this.select(versions[0]); }, error: () => this.error.set('Não foi possível carregar as versões.'), complete: () => this.loading.set(false) }); }
  select(version: PageVersion) { this.selected.set(version); this.preview.set(null); this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(`/api/v1/pages/${encodeURIComponent(this.slug)}/versions/${encodeURIComponent(version.id)}/preview?view=${Date.now()}`)); this.previewLoading.set(true); this.feedbackLoading.set(true); this.repository.preview(this.slug, version.id).subscribe({ next: (html) => { this.preview.set(html); this.previewLoading.set(false); }, error: () => { this.previewLoading.set(false); this.error.set('Não foi possível carregar o preview.'); } }); this.repository.feedbackList(this.slug, version.id).subscribe({ next: (items) => this.feedbacks.set(items), error: () => this.error.set('Não foi possível carregar os feedbacks.'), complete: () => this.feedbackLoading.set(false) }); }
  publish() { const version = this.selected(); if (!version) return; this.busy.set(true); this.busyAction.set('publish'); this.repository.publish(this.slug, version.id).subscribe({ next: () => { this.busy.set(false); this.busyAction.set(null); this.confirmPublish()?.close(); this.success.set('Versão publicada com sucesso.'); this.load(); }, error: () => { this.busy.set(false); this.busyAction.set(null); this.error.set('Não foi possível publicar a versão.'); } }); }
  retry() { this.busy.set(true); this.busyAction.set('retry'); this.error.set(null); this.repository.retry(this.slug).subscribe({ next: () => { this.busy.set(false); this.busyAction.set(null); this.confirmRetry()?.close(); this.success.set('Nova geração iniciada.'); this.load(); }, error: (response) => { this.busy.set(false); this.busyAction.set(null); this.error.set(response.error?.detail ?? 'Não foi possível iniciar uma nova geração.'); } }); }
  unpublish() { this.busy.set(true); this.busyAction.set('unpublish'); this.repository.unpublish(this.slug).subscribe({ next: () => { this.busy.set(false); this.busyAction.set(null); this.confirmUnpublish()?.close(); this.success.set('Página despublicada.'); this.load(); }, error: () => { this.busy.set(false); this.busyAction.set(null); this.error.set('Não foi possível despublicar a página.'); } }); }
  sendFeedback() { const version = this.selected(); if (!version || this.feedbackForm.invalid) return; this.busy.set(true); this.busyAction.set('feedback'); this.repository.feedback(this.slug, version.id, { ...this.feedbackForm.getRawValue(), section_id: this.feedbackForm.getRawValue().section_id || null }).subscribe({ next: (item) => { this.feedbacks.update((items) => [item, ...items]); this.feedbackForm.reset(); this.repository.revise(this.slug, version.id).subscribe({ next: () => { this.busy.set(false); this.busyAction.set(null); this.success.set('Feedback enviado. Nova revisão iniciada.'); this.load(); }, error: () => { this.busy.set(false); this.busyAction.set(null); this.error.set('Feedback salvo, mas não foi possível iniciar a revisão.'); } }); }, error: () => { this.busy.set(false); this.busyAction.set(null); this.error.set('Não foi possível enviar o feedback.'); } }); }
}
