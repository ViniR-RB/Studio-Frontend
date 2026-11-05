import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap, take, takeWhile, timer } from 'rxjs';
import { GenerationsRepository } from '../../core/repositories/generations.repository';
import { GenerationStatus } from '../../core/schemas/generation.schema';
import { DesignSystemSummary, SkillSummary } from '../../core/schemas/page.schema';
import { ButtonComponent } from '../../ui/atoms/button.component';
import { input, output } from '@angular/core';

@Component({
  selector: 'app-generation-form',
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <form class="grid gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <ol class="grid gap-2 sm:grid-cols-5" aria-label="Etapas da criação">
        @for (step of steps; track step; let index = $index) {
          <li>
            <button class="w-full rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors" [class.border-brand]="currentStep() === index" [class.bg-brand/5]="currentStep() === index" [class.text-brand]="currentStep() === index" type="button" (click)="goTo(index)" [attr.aria-current]="currentStep() === index ? 'step' : null">
              <span class="mr-1">{{ index + 1 }}.</span>{{ step }}
            </button>
          </li>
        }
      </ol>

      @if (currentStep() === 0) {
        <section class="grid gap-5" aria-labelledby="step-product-title">
          <div><p class="text-xs font-black tracking-widest text-brand">ETAPA 1 DE 5</p><h2 id="step-product-title" class="mt-2 text-2xl font-black">Produto e público</h2><p class="mt-1 text-sm text-muted">Defina o que será vendido e para quem.</p></div>
          <div><label for="product-name">Produto</label><input id="product-name" formControlName="product_name" placeholder="Ex.: Garrafa térmica" /></div>
          <div><label for="description">Descrição</label><textarea id="description" formControlName="product_description" rows="4" placeholder="O que torna o produto especial?"></textarea></div>
          <div><label for="audience">Público-alvo</label><input id="audience" formControlName="target_audience" placeholder="Ex.: Pessoas que trabalham em home office" /></div>
        </section>
      }

      @if (currentStep() === 1) {
        <section class="grid gap-5" aria-labelledby="step-offer-title">
          <div><p class="text-xs font-black tracking-widest text-brand">ETAPA 2 DE 5</p><h2 id="step-offer-title" class="mt-2 text-2xl font-black">Oferta e mensagem</h2><p class="mt-1 text-sm text-muted">Dê ao gerador os argumentos comerciais reais.</p></div>
          <div><label for="benefits">Benefícios</label><textarea id="benefits" formControlName="benefits" rows="4" placeholder="Quais resultados o produto entrega?"></textarea></div>
          <div><label for="offer">Oferta e preço</label><textarea id="offer" formControlName="offer" rows="3" placeholder="Ex.: R$ 99, frete grátis"></textarea></div>
          <div><label for="cta">CTA principal</label><input id="cta" formControlName="cta" placeholder="Ex.: Comprar agora" /></div>
          <div><label for="tone">Tom de voz</label><input id="tone" formControlName="tone" /></div>
        </section>
      }

      @if (currentStep() === 2) {
        <section class="grid gap-5" aria-labelledby="step-visual-title">
          <div><p class="text-xs font-black tracking-widest text-brand">ETAPA 3 DE 5</p><h2 id="step-visual-title" class="mt-2 text-2xl font-black">Direção visual</h2><p class="mt-1 text-sm text-muted">Oriente estética, referências e sistema visual.</p></div>
          <div><label for="visual-direction">Direção visual</label><textarea id="visual-direction" formControlName="visual_direction" rows="4" placeholder="Ex.: minimalista, premium, fundo claro, detalhes azuis"></textarea></div>
          <div><label for="reference-urls">Referências visuais (uma URL por linha)</label><textarea id="reference-urls" formControlName="reference_urls" rows="4" placeholder="https://exemplo.com/referencia"></textarea></div>
          <div><label for="design-system">Design system</label><select id="design-system" formControlName="design_system_slug"><option value="">Escolha um sistema visual</option>@for (system of designSystems(); track system.slug) { <option [value]="system.slug">{{ system.name }} — {{ system.description }}</option> }</select></div>
        </section>
      }

      @if (currentStep() === 3) {
        <section class="grid gap-5" aria-labelledby="step-assets-title">
          <div><p class="text-xs font-black tracking-widest text-brand">ETAPA 4 DE 5</p><h2 id="step-assets-title" class="mt-2 text-2xl font-black">Imagens e assets</h2><p class="mt-1 text-sm text-muted">Envie imagens próprias ou referências autorizadas.</p></div>
          <div><label for="product-images">Imagens do produto (PNG, JPEG ou WebP)</label><input id="product-images" type="file" accept="image/png,image/jpeg,image/webp" multiple (change)="uploadImages($event)" /><div class="flex flex-wrap gap-3">@for (image of uploadedImages(); track image) { <div class="group relative"><img class="h-20 w-20 rounded-xl object-cover" [src]="image" alt="Imagem enviada do produto" /><button type="button" class="absolute inset-0 hidden rounded-xl bg-black/60 text-xs font-bold text-white group-hover:block" (click)="removeImage(image)" aria-label="Excluir imagem">Excluir</button></div> }</div><p class="text-xs text-muted">Até 5 MB por imagem. {{ uploadedImages().length }} imagem(ns) adicionada(s).</p>@if (uploadError()) { <p class="error" role="alert">{{ uploadError() }}</p> }</div>
          <div><label for="image-urls">URLs de imagens adicionais</label><textarea id="image-urls" formControlName="image_urls" rows="3" placeholder="https://cdn.exemplo.com/produto.jpg"></textarea></div>
        </section>
      }

      @if (currentStep() === 4) {
        <section class="grid gap-5" aria-labelledby="step-skills-title">
          <div><p class="text-xs font-black tracking-widest text-brand">ETAPA 5 DE 5</p><h2 id="step-skills-title" class="mt-2 text-2xl font-black">Skills de geração</h2><p class="mt-1 text-sm text-muted">Escolha até {{ maxSkills }} orientações para esta página.</p></div>
          <fieldset class="grid gap-3"><legend class="font-bold">Orientações disponíveis</legend><div class="grid gap-3 md:grid-cols-2">@for (skill of skills(); track skill.slug) { <label class="flex cursor-pointer gap-3 rounded-xl border border-line p-3 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/5"><input class="mt-1" type="checkbox" [checked]="selectedSkills().includes(skill.slug)" [disabled]="!selectedSkills().includes(skill.slug) && selectedSkills().length >= maxSkills" (change)="toggleSkill(skill.slug)" /><span><strong>{{ skill.name }}</strong><span class="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-muted">{{ skill.category }}</span><br /><span class="text-sm text-muted">{{ skill.description }}</span></span></label> }</div><p class="text-xs text-muted" aria-live="polite">{{ selectedSkills().length }}/{{ maxSkills }} selecionadas@if (selectedSkills().length === maxSkills) { · limite atingido }</p></fieldset>
        </section>
      }

      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (status(); as current) { <p class="status" role="status">Status: {{ current.status }}</p> }
      <div class="flex justify-between gap-3 border-t border-line pt-5">
        <app-button type="button" [disabled]="currentStep() === 0 || loading()" (click)="previous()">Voltar</app-button>
        @if (currentStep() < steps.length - 1) { <app-button type="button" (click)="next()">Continuar</app-button> } @else { <app-button type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Enviando…' : submitLabel() }}</app-button> }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationFormComponent {
  readonly created = output<string>();
  readonly submitLabel = input('Gerar landing page');
  protected readonly steps = ['Produto', 'Oferta', 'Visual', 'Assets', 'Skills'];
  protected readonly currentStep = signal(0);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly repository = inject(GenerationsRepository);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly uploadedImages = signal<string[]>([]);
  protected readonly skills = signal<SkillSummary[]>([]);
  protected readonly designSystems = signal<DesignSystemSummary[]>([]);
  protected readonly selectedSkills = signal<string[]>([]);
  protected readonly maxSkills = 5;
  protected readonly status = signal<GenerationStatus | null>(null);

  protected readonly form = this.fb.group({
    product_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    product_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    target_audience: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(240)]],
    benefits: [''], offer: [''], cta: [''],
    tone: ['clear and persuasive', [Validators.required, Validators.maxLength(120)]],
    visual_direction: [''], reference_urls: [''], image_urls: [''], design_system_slug: [''],
  });

  constructor() {
    this.repository.skills().subscribe({ next: (skills) => this.skills.set(skills) });
    this.repository.designSystems().subscribe({ next: (systems) => this.designSystems.set(systems) });
  }

  next() {
    if (this.currentStep() === 0 && !this.productStepValid()) {
      (['product_name', 'product_description', 'target_audience'] as const).forEach((field) => this.form.controls[field].markAsTouched());
      return;
    }
    this.currentStep.update((step) => Math.min(step + 1, this.steps.length - 1));
  }

  previous() { this.currentStep.update((step) => Math.max(step - 1, 0)); }
  goTo(step: number) { if (step <= this.currentStep() || (step === this.currentStep() + 1 && this.productStepValid())) this.currentStep.set(step); }
  private productStepValid() { return (['product_name', 'product_description', 'target_audience'] as const).every((field) => this.form.controls[field].valid); }

  toggleSkill(slug: string) { this.selectedSkills.update((selected) => selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug]); }
  removeImage(url: string) { this.repository.deleteImage(url).subscribe({ next: () => this.uploadedImages.update((images) => images.filter((image) => image !== url)), error: () => this.uploadError.set('Não foi possível excluir a imagem.') }); }

  uploadImages(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.uploadError.set(null);
    if (files.some((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      this.uploadError.set('Use apenas PNG, JPEG ou WebP com até 5 MB por imagem.');
      return;
    }
    files.forEach((file) => this.repository.uploadImage(file).subscribe({ next: ({ public_url }) => this.uploadedImages.update((images) => [...images, public_url]), error: () => this.uploadError.set('Não foi possível enviar uma das imagens.') }));
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set(null);
    const values = this.form.getRawValue();
    const request = { ...values, reference_urls: values.reference_urls.split('\n').map((value) => value.trim()).filter(Boolean), image_urls: [...this.uploadedImages(), ...values.image_urls.split('\n').map((value) => value.trim()).filter(Boolean)], skill_slugs: this.selectedSkills() };
    this.repository.create(request).subscribe({
      next: (accepted) => {
        this.status.set({ job_id: accepted.job_id, status: accepted.status, error: null, slug: accepted.slug, version_id: null });
        this.loading.set(false); this.created.emit(accepted.slug);
        timer(0, 2000).pipe(switchMap(() => this.repository.status(accepted.job_id)), takeWhile((current) => !['draft', 'failed', 'published'].includes(current.status), true), take(150), takeUntilDestroyed(this.destroyRef), finalize(() => { if (this.status()?.status === 'generating') this.error.set('A geração demorou mais de 5 minutos. Você pode acompanhar novamente pela lista de páginas.'); })).subscribe({ next: (current) => this.status.set(current), error: (response) => this.error.set(response.error?.detail ?? 'Não foi possível consultar a geração.') });
      },
      error: (response) => { this.loading.set(false); this.error.set(response.error?.detail ?? 'Não foi possível iniciar a geração.'); },
    });
  }
}
