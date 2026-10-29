export type GenerationStatusValue = 'queued' | 'generating' | 'draft' | 'failed' | 'published' | 'unpublished' | string;

export interface GenerationRequest {
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
  reference_urls?: string[];
  image_urls?: string[];
  skill_slugs?: string[];
}

export interface GenerationAccepted {
  job_id: string;
  status: GenerationStatusValue;
  slug: string;
}

export interface GenerationStatus {
  job_id: string;
  status: GenerationStatusValue;
  error: string | null;
  slug: string | null;
  version_id?: string | null;
}
