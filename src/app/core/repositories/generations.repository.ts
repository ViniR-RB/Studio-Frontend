import { inject, Injectable } from '@angular/core';
import { ApiHttp } from '../http/api-http.service';
import { GenerationAccepted, GenerationRequest, GenerationStatus } from '../schemas/generation.schema';
import { DesignSystemSummary, SkillSummary } from '../schemas/page.schema';

@Injectable({ providedIn: 'root' })
export class GenerationsRepository {
  private readonly api = inject(ApiHttp);

  skills() { return this.api.get<SkillSummary[]>('/skills'); }
  designSystems() { return this.api.get<DesignSystemSummary[]>('/design-systems'); }
  createSkill(request: { slug: string; name: string; description: string; prompt: string; category: string }) { return this.api.post<SkillSummary>('/skills', request); }

  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.api.postForm<{ url: string; public_url: string; internal_url: string }>('/assets/images', form);
  }

  deleteImage(url: string) {
    return this.api.delete<void>(`/assets/images/${encodeURIComponent(url.split('/').pop() ?? '')}`);
  }

  create(request: GenerationRequest) {
    return this.api.post<GenerationAccepted>('/generations', request);
  }

  status(jobId: string) {
    return this.api.get<GenerationStatus>(`/generations/${jobId}`);
  }
}
