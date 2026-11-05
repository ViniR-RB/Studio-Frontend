export interface SkillSummary { id: string; slug: string; name: string; description: string; category: string; }
export interface DesignSystemSummary { id: string; slug: string; name: string; description: string; category: string; tokens: Record<string, any>; }

export type PageLifecycleStatus = 'draft' | 'generating' | 'failed' | 'published' | 'unpublished' | string;

export interface PageSummary {
  id: string;
  slug: string;
  status: PageLifecycleStatus;
  created_at: string | null;
  published_version_id?: string | null;
}

export interface PageBriefing {
  job_id: string;
  status: string;
  product_name: string;
  product_description: string;
  target_audience: string;
  benefits?: string | null;
  offer?: string | null;
  cta?: string | null;
  language?: string | null;
  market?: string | null;
  tone: string;
  brand_identity?: string | null;
  visual_direction?: string | null;
  reference_urls: string[];
  image_urls: string[];
  skill_slugs: string[];
}

export interface PageVersion {
  id: string;
  version_number: number;
  checksum?: string;
  status?: PageLifecycleStatus;
  published_at?: string | null;
  validation_errors?: string[];
  validation_warnings?: string[];
}

export interface FeedbackRequest {
  section_id?: string | null;
  rating?: number | null;
  comment: string;
}

export interface FeedbackResponse extends FeedbackRequest {
  id: string;
  version_id: string;
}

export interface PublishResponse {
  status: PageLifecycleStatus;
  slug: string;
  version_id?: string;
}
