import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap, take, takeWhile, timer } from 'rxjs';
import { GenerationsRepository } from '../../core/repositories/generations.repository';
import { GenerationStatus } from '../../core/schemas/generation.schema';
import { SkillSummary } from '../../core/schemas/page.schema';
import { ButtonComponent } from '../../ui/atoms/button.component';
import { input, output } from '@angular/core';

@Component({
  selector: 'app-generation-form',
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <form class="grid gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div><label for="product-name">Produto</label><input id="product-name" formControlName="product_name" placeholder="Ex.: Garrafa térmica" /></div>
      <div><label for="description">Descrição</label><textarea id="description" formControlName="product_description" rows="4" placeholder="O que torna o produto especial?"></textarea></div>
      <div><label for="audience">Público-alvo</label><input id="audience" formControlName="target_audience" placeholder="Ex.: Pessoas que trabalham em home office" /></div>
      <div><label for="benefits">Benefícios</label><textarea id="benefits" formControlName="benefits" rows="3" placeholder="Quais resultados o produto entrega?"></textarea></div>
      <div><label for="offer">Oferta e preço</label><textarea id="offer" formControlName="offer" rows="2" placeholder="Ex.: R$ 99, frete grátis"></textarea></div>
      <div><label for="cta">CTA principal</label><input id="cta" formControlName="cta" placeholder="Ex.: Comprar agora" /></div>
      <div><label for="tone">Tom de voz</label><input id="tone" formControlName="tone" /></div>
      <div><label for="visual-direction">Direção visual</label><textarea id="visual-direction" formControlName="visual_direction" rows="3" placeholder="Ex.: minimalista, premium, fundo claro, detalhes azuis"></textarea></div>
      <div><label for="reference-urls">Referências visuais (uma URL por linha)</label><textarea id="reference-urls" formControlName="reference_urls" rows="3" placeholder="https://exemplo.com/referencia"></textarea></div>
      <div><label for="product-images">Imagens do produto (PNG, JPEG ou WebP)</label><input id="product-images" type="file" accept="image/png,image/jpeg,image/webp" multiple (change)="uploadImages($event)" /><div class="flex flex-wrap gap-3">@for (image of uploadedImages(); track image) { <img class="h-20 w-20 rounded-xl object-cover" [src]="image" alt="Imagem enviada do produto" /> }</div><p class="text-xs text-muted">Até 5 MB por imagem. {{ uploadedImages().length }} imagem(ns) adicionada(s).</p>@if (uploadError()) { <p class="error" role="alert">{{ uploadError() }}</p> }</div>
      <div><label for="image-urls">URLs de imagens adicionais</label><textarea id="image-urls" formControlName="image_urls" rows="2" placeholder="https://cdn.exemplo.com/produto.jpg"></textarea></div>
      <fieldset><legend>Skills de geração</legend><div class="grid gap-2">@for (skill of skills(); track skill.slug) { <label class="flex gap-2"><input type="checkbox" [checked]="selectedSkills().includes(skill.slug)" (change)="toggleSkill(skill.slug)" /> <span><strong>{{ skill.name }}</strong> — {{ skill.description }}</span></label> }</div></fieldset>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (status(); as current) { <p class="status" role="status">Status: {{ current.status }}</p> }
      <app-button type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Enviando…' : submitLabel() }}</app-button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationFormComponent {
  readonly created = output<string>();
  readonly submitLabel = input('Gerar landing page');
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly repository = inject(GenerationsRepository);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly uploadedImages = signal<string[]>([]);
  protected readonly skills = signal<SkillSummary[]>([]);
  protected readonly selectedSkills = signal<string[]>([]);
  protected readonly status = signal<GenerationStatus | null>(null);
  constructor() { this.repository.skills().subscribe({ next: (skills) => this.skills.set(skills) }); }

  toggleSkill(slug: string) { this.selectedSkills.update((selected) => selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug]); }

  protected readonly form = this.fb.group({
    product_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    product_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    target_audience: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(240)]],
    benefits: [''],
    offer: [''],
    cta: [''],
    tone: ['clear and persuasive', [Validators.required, Validators.maxLength(120)]],
    visual_direction: [''],
    reference_urls: [''],
    image_urls: [''],
  });

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
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.loading.set(true);
    this.error.set(null);
    const values = this.form.getRawValue();
    const request = { ...values, reference_urls: values.reference_urls.split('\\n').map((value) => value.trim()).filter(Boolean), image_urls: [...this.uploadedImages(), ...values.image_urls.split('\\n').map((value) => value.trim()).filter(Boolean)], skill_slugs: this.selectedSkills() };
    this.repository.create(request).subscribe({
      next: (accepted) => {
        this.status.set({ job_id: accepted.job_id, status: accepted.status, error: null, slug: accepted.slug, version_id: null });
        this.loading.set(false);
        this.created.emit(accepted.slug);
        timer(0, 2000).pipe(
          switchMap(() => this.repository.status(accepted.job_id)),
          takeWhile((current) => !['draft', 'failed', 'published'].includes(current.status), true),
          take(150),
          takeUntilDestroyed(this.destroyRef),
          finalize(() => { if (this.status()?.status === 'generating') this.error.set('A geração demorou mais de 5 minutos. Você pode acompanhar novamente pela lista de páginas.'); }),
        ).subscribe({
          next: (current) => { this.status.set(current); },
          error: (response) => this.error.set(response.error?.detail ?? 'Não foi possível consultar a geração.'),
        });
      },
      error: (response) => { this.loading.set(false); this.error.set(response.error?.detail ?? 'Não foi possível iniciar a geração.'); },
    });
  }
}
