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

export type RecommendationLifecycleStatus = 
  | 'RESEARCH_CANDIDATE' 
  | 'NEEDS_EDITORIAL_IMPROVEMENT' 
  | 'NEEDS_ADDITIONAL_RESEARCH' 
  | 'CANONICAL' 
  | 'PUBLISHED' 
  | 'DEFERRED' 
  | 'RETIRED';

export interface Recommendation {
  id: string;
  dbId?: string;
  title: string;
  category: Category | string;
  publicationStatus?: RecommendationLifecycleStatus;
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
  serviceAreaId?: string;
  categories?: string[];
  expertiseIds?: string[];
  capabilityIds?: string[];
  titleEn?: string;
  titleSr?: string;
  shortDescriptionEn?: string;
  shortDescriptionSr?: string;
  longDescriptionEn?: string;
  longDescriptionSr?: string;
  locationEn?: string;
  locationSr?: string;
  bestTimeToVisitEn?: string;
  bestTimeToVisitSr?: string;
  insiderTipEn?: string;
  insiderTipSr?: string;
  moods?: string[];
  practicalInfo?: {
    opening_hours?: string;
    contact_phone?: string;
    contact_email?: string;
    website?: string;
    admission_fee?: string;
  };
  provenance?: {
    source?: string;
    method?: string;
    license?: string;
    attributionRequired?: boolean;
    attributionText?: string;
    verificationStatus?: string;
    altText?: string;
  };
  translations?: Record<string, {
    title?: string;
    shortDescription?: string;
    longDescription?: string;
    location?: string;
    bestTimeToVisit?: string;
    insiderTip?: string;
    tagline?: string;
  }>;
}

export interface Partner {
  id: string;
  pinHash: string;
  nameEn: string;
  nameSr: string;
  nameZh: string;
  category: string;
  partnerType: 'Individual' | 'Organisation';
  specialOfferEn?: string;
  specialOfferSr?: string;
  specialOfferZh?: string;
  descriptionEn?: string;
  descriptionSr?: string;
  descriptionZh?: string;
  locationEn?: string;
  locationSr?: string;
  locationZh?: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  website?: string;
  coordinateX?: number;
  coordinateY?: number;
  expertise?: string[];
  entityType?: string;
  candidateType?: string;
  verificationStatus?: string;
  verificationDetails?: string;
  lastVerified?: string;
  routingRole?: string;
  operationalRole?: string;
  conciergeRoutingEligible?: string;
  directContactAvailable?: string;
  directBookingPhone?: string;
  directBookingWhatsApp?: string;
  directBookingEmail?: string;
  directBookingUrl?: string;
  directBookingNotes?: string;
  linkedRecommendations?: string[];
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

export type AppScreen = 'landing' | 'home' | 'details' | 'plan' | 'explore' | 'profile' | 'partners' | 'studio';

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

export enum EditorialCollectionCategory {
  HISTORY_HERITAGE = 'History & Heritage',
  SPIRITUAL_CULTURE = 'Spiritual & Culture',
  NATURE_TRAILS = 'Nature & Trails',
  URBAN_MODERN = 'Urban & Modern',
  GASTRONOMY_WINE = 'Gastronomy & Wine',
  SPECIAL_JOURNEY = 'Special Journey',
}

export interface EditorialCollectionMapRouteItem {
  latitude: number;
  longitude: number;
  label?: string;
  recommendationId?: string;
}

export interface EditorialCollection {
  id: string;
  dbId?: string;
  titleEn: string;
  titleSr?: string;
  titleZh?: string;
  subtitleEn: string;
  subtitleSr?: string;
  subtitleZh?: string;
  introductionEn: string;
  introductionSr?: string;
  introductionZh?: string;
  heroImage: string;
  gallery?: string[];
  category: EditorialCollectionCategory | string;
  estimatedDuration?: string;
  visitorProfile?: string[];
  recommendedSeason?: string[];
  estimatedBudget?: string;
  geographicScope?: string;
  recommendationIds: string[];
  recommendedOrder?: number[];
  mapRoute?: EditorialCollectionMapRouteItem[];
  visitorTakeawayEn?: string;
  visitorTakeawaySr?: string;
  visitorTakeawayZh?: string;
  journeyRationale?: Record<string, string>;
  translations?: Record<string, {
    title?: string;
    subtitle?: string;
    introduction?: string;
    estimatedDuration?: string;
    geographicScope?: string;
    estimatedBudget?: string;
    visitorTakeaway?: string;
  }>;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoadEditorialCollectionsResult {
  data: EditorialCollection[] | null;
  error: string | null;
  isLive: boolean;
}

export interface SupabaseEditorialCollectionRow {
  id: string;
  source_id?: string | null;
  title_en: string;
  title_sr?: string | null;
  title_zh?: string | null;
  subtitle_en?: string | null;
  subtitle_sr?: string | null;
  subtitle_zh?: string | null;
  introduction_en?: string | null;
  introduction_sr?: string | null;
  introduction_zh?: string | null;
  hero_image?: string | null;
  gallery?: string[] | null;
  category?: string | null;
  estimated_duration?: string | null;
  visitor_profile?: string[] | null;
  recommended_season?: string[] | null;
  estimated_budget?: string | null;
  geographic_scope?: string | null;
  recommendation_ids?: string[] | null;
  recommended_order?: number[] | null;
  map_route?: any | null;
  is_published?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export type PublicationWorkflowStage = 
  | 'draft'
  | 'editorial_review'
  | 'engineering_validation'
  | 'approved'
  | 'published'
  | 'archived';

export interface DestinationManifest {
  destinationId: string;
  destinationName: string;
  contentVersion: string;
  packageVersion: string;
  schemaVersion: string;
  publishedAt: string;
  minSupportedAppVersion: string;
  sha256: string;
  packageSizeBytes: number;
  itemCount: {
    recommendations: number;
    collections: number;
    partners: number;
  };
  status: PublicationWorkflowStage;
}

export interface DestinationPackage {
  manifest: DestinationManifest;
  recommendations: Recommendation[];
  editorialCollections: EditorialCollection[];
  partners: Partner[];
}

export interface SyncStatus {
  isOnline: boolean;
  currentPackageVersion: string;
  latestPackageVersion: string | null;
  lastCheckedAt: string | null;
  lastSyncAt: string | null;
  syncState: 'idle' | 'checking' | 'downloading' | 'validating' | 'active' | 'error';
  syncError: string | null;
  availableDestinations: string[];
}


