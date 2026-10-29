import { inject, Injectable } from '@angular/core';
import { ApiHttp } from '../http/api-http.service';
import { FeedbackRequest, FeedbackResponse, PageBriefing, PageSummary, PageVersion, PublishResponse } from '../schemas/page.schema';

@Injectable({ providedIn: 'root' })
export class PagesRepository {
  private readonly api = inject(ApiHttp);

  list() { return this.api.get<PageSummary[]>('/pages'); }
  briefing(slug: string) { return this.api.get<PageBriefing>(`/pages/${encodeURIComponent(slug)}/briefing`); }
  status(jobId: string) { return this.api.get<{ job_id: string; status: string; error: string | null; slug: string | null; version_id?: string | null }>(`/generations/${encodeURIComponent(jobId)}`); }
  updateBriefing(slug: string, request: PageBriefing) { return this.api.put<PageBriefing>(`/pages/${encodeURIComponent(slug)}/briefing`, request); }
  retry(slug: string) { return this.api.post<{ job_id: string; status: string; slug: string }>(`/pages/${encodeURIComponent(slug)}/retry`, {}); }
  versions(slug: string) { return this.api.get<PageVersion[]>(`/pages/${encodeURIComponent(slug)}/versions`); }
  preview(slug: string, versionId: string) { return this.api.getText(`/pages/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/preview`); }
  publish(slug: string, versionId: string) { return this.api.post<PublishResponse>(`/pages/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/publish`, {}); }
  unpublish(slug: string) { return this.api.post<PublishResponse>(`/pages/${encodeURIComponent(slug)}/unpublish`, {}); }
  feedbackList(slug: string, versionId: string) { return this.api.get<FeedbackResponse[]>(`/pages/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/feedback`); }
  feedback(slug: string, versionId: string, request: FeedbackRequest) { return this.api.post<FeedbackResponse>(`/pages/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/feedback`, request); }
  revise(slug: string, versionId: string, feedbackIds: string[] = []) { return this.api.post<{ job_id: string; status: string }>(`/pages/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/revise`, { feedback_ids: feedbackIds }); }
}
