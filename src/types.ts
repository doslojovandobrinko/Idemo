/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Category {
  WELLBEING = 'Wellbeing',
  MEDICAL = 'Medical',
  NATURE = 'Nature',
  HISTORY = 'History',
  GASTRONOMY = 'Gastronomy',
  TRAVEL = 'Travel',
  CLUBBING = 'Clubbing',
}

export interface Recommendation {
  id: string;
  dbId?: string;
  title: string;
  category: Category | string;
  shortDescription: string; // ~50 words
  longDescription: string; // up to 200 words
  image: string;
  duration: string;
  travelTime: string;
  travelTimeMinutes: number;
  location: string;
  estimatedCost: string;
  preferredTransport: string;
  isLiked?: boolean;
  badge?: 'silver' | 'gold' | 'platinum';
  scheduledDate?: string; // ISO string
  coordinates?: { lat: number; lng: number };
  coordinateX?: number;
  coordinateY?: number;
  radius?: number;
  energy?: number;
  social?: number;
  luxury?: number;
  urbanity?: number;
  nature?: number;
  weatherDependency?: number;
  seasonality?: 'all' | 'summer' | 'winter' | 'spring-fall';
  familySuitability?: boolean;
  accessibility?: boolean;
  premiumLevel?: 'standard' | 'premium' | 'ultra';
  budgetLevel?: 'free' | 'low' | 'moderate' | 'high' | 'exclusive';
  recommendedVisitDuration?: number; // in minutes
  equivalents?: Record<string, string>;
  website?: string;
  phone?: string;
  conciergePhone?: string;
  translations?: Record<string, {
    title?: string;
    shortDescription?: string;
    longDescription?: string;
    location?: string;
  }>;
}

export interface UsefulTip {
  id: string;
  category: string;
  title: string;
  description: string;
  coordinateX?: number;
  coordinateY?: number;
  link?: string;
  androidLink?: string;
  iosLink?: string;
  equivalentPhrases?: string;
  translations?: Record<string, {
    title?: string;
    description?: string;
  }>;
}

export interface DidYouKnow {
  id: string;
  fact: string;
  whyItMatters: string;
  coordinateX?: number;
  coordinateY?: number;
  translations?: Record<string, {
    fact?: string;
    whyItMatters?: string;
  }>;
}

export type AppScreen = 'landing' | 'home' | 'details' | 'plan' | 'explore' | 'profile' | 'partners';

export interface InquiryRecordV2 {
  local_queue_id: string;
  recommendation_id: string; // UI item.id (source_id)
  recommendation_db_id?: string; // public.recommendations.id UUID
  recommendation_title: string;
  visitor_name: string;
  email?: string;
  phone_number?: string;
  visitor_notes: string;
  requested_start_at: string;
  requested_end_at: string;
  preferred_date: string;
  preferred_time: string;
  status: 'draft' | 'submitting' | 'submitted' | 'failed';
  server_inquiry_id?: string;
  public_reference_code?: string;
  is_server_authoritative: boolean;
  created_at: string;
  submitted_at?: string;
  last_error?: string;
  client_request_id: string;
}

export interface VisitorStatusResult {
  success: boolean;
  inquiry_id?: string;
  public_reference_code?: string;
  status?: string;
  visitor_status_label?: string;
  requested_start_at?: string;
  requested_end_at?: string;
  created_at?: string;
  error?: string;
}

export interface VisitorProposalResult {
  success: boolean;
  proposal_found?: boolean;
  match_id?: string;
  response_id?: string;
  response_type?: string;
  message?: string;
  proposed_start_at?: string;
  proposed_end_at?: string;
  error?: string;
}

export interface VisitorActionResult {
  success: boolean;
  inquiry_id?: string;
  match_id?: string;
  status?: string;
  error?: string;
}
