import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ModalComponent } from '../ui/atoms/modal.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GenerationsRepository } from '../core/repositories/generations.repository';
import { SkillSummary } from '../core/schemas/page.schema';

@Component({
  selector: 'app-skills-page',
  imports: [ReactiveFormsModule, ModalComponent],
  template: `
    <section class="grid gap-6">
      <header><p class="text-xs font-black tracking-widest text-brand">STUDIO / SKILLS</p><h1 class="my-3 text-5xl font-black tracking-[-.06em]">Skills de geração.</h1><p class="text-muted">Instruções reutilizáveis para orientar o design das suas páginas.</p></header>
      @if (error()) { <p class="rounded-xl bg-red-50 p-4 text-red-700" role="alert">{{ error() }}</p> }
      <div class="overflow-x-auto rounded-2xl border border-line bg-white"><table class="w-full text-left text-sm"><thead class="border-b border-line text-muted"><tr><th class="p-4">Nome</th><th class="p-4">Slug</th><th class="p-4">Categoria</th><th class="p-4">Descrição</th></tr></thead><tbody>@for (skill of skills(); track skill.id) { <tr class="border-b border-line last:border-0"><td class="p-4 font-bold">{{ skill.name }}</td><td class="p-4 font-mono text-xs">{{ skill.slug }}</td><td class="p-4">{{ skill.category }}</td><td class="p-4 text-muted">{{ skill.description }}</td></tr> } @empty { <tr><td class="p-4 text-muted" colspan="4">Nenhuma skill cadastrada.</td></tr> }</tbody></table></div>
      <button class="rounded-xl bg-brand px-4 py-3 font-bold text-white" type="button" (click)="openCreateModal()">Nova skill</button><app-modal #createModal title="Criar skill" [showConfirm]="false"><form class="grid gap-4" [formGroup]="form" (ngSubmit)="create()"><input formControlName="name" placeholder="Nome" /><input formControlName="slug" placeholder="slug-da-skill" /><input formControlName="category" placeholder="design" /><textarea formControlName="description" rows="2" placeholder="Descrição"></textarea><textarea formControlName="prompt" rows="4" placeholder="Instruções que serão usadas na geração"></textarea><button class="rounded-xl bg-brand px-4 py-3 font-bold text-white disabled:opacity-50" [disabled]="form.invalid || saving()">{{ saving() ? 'Salvando…' : 'Criar skill' }}</button></form></app-modal>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsPageComponent {
  private readonly repository = inject(GenerationsRepository);
  private readonly fb = inject(FormBuilder);
  protected readonly skills = signal<SkillSummary[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  private readonly createModalRef = viewChild<ModalComponent>('createModal');
  protected readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.minLength(2)]], slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]], category: ['design', Validators.required], description: ['', Validators.required], prompt: ['', Validators.required] });
  constructor() { this.load(); }
  openCreateModal() { this.createModalRef()?.open(); }
  load() { this.repository.skills().subscribe({ next: (skills) => this.skills.set(skills), error: () => this.error.set('Não foi possível carregar as skills.') }); }
  create() { if (this.form.invalid) return; this.saving.set(true); this.repository.createSkill(this.form.getRawValue()).subscribe({ next: (skill) => { this.skills.update((items) => [...items, skill]); this.form.reset({ category: 'design' }); this.saving.set(false); this.createModalRef()?.close(); }, error: (response) => { this.error.set(response.error?.detail ?? 'Não foi possível criar a skill.'); this.saving.set(false); } }); }
}
