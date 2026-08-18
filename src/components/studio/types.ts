export type StudioRole = 
  | 'Curator' 
  | 'Editor' 
  | 'Translator' 
  | 'Partner Manager' 
  | 'Release Manager' 
  | 'Super Admin';

export type CanonicalStudioRole =
  | 'super_admin'
  | 'editorial_lead'
  | 'curator'
  | 'translator'
  | 'partner_manager'
  | 'release_manager';

export const CANONICAL_STUDIO_ROLE_MAP: Record<CanonicalStudioRole, StudioRole> = {
  super_admin: 'Super Admin',
  editorial_lead: 'Editor',
  curator: 'Curator',
  translator: 'Translator',
  partner_manager: 'Partner Manager',
  release_manager: 'Release Manager',
};

export type StudioTab = 
  | 'dashboard'
  | 'destinations'
  | 'recommendations'
  | 'editorial-review'
  | 'partners'
  | 'partner-coverage'
  | 'publications'
  | 'operations'
  | 'settings'
  | 'collections';

export type QualificationState = 'research' | 'preliminary' | 'idemo_selected';
export type ParticipationState = 'not_contacted' | 'introduction_ready' | 'introduced' | 'confirmed' | 'declined' | 'withdrawn';
export type PassportVerificationState = 'not_started' | 'draft' | 'submitted' | 'under_review' | 'partial' | 'verified' | 'review_required';
export type RoutingPoolState = 'active' | 'inactive' | 'suspended';

export interface PartnerCoverageRecord {
  id?: string;
  recommendation_id: string;
  partner_id: string;
  qualification_state: QualificationState;
  participation_state: ParticipationState;
  passport_state: PassportVerificationState;
  routing_state: RoutingPoolState;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type CoverageHealthStatus = 'ROBUST' | 'COVERED' | 'SINGLE-POINT' | 'GAP';


export interface StudioUserSession {
  email: string;
  name: string;
  role: StudioRole;
  avatarUrl?: string;
  authenticatedAt: string;
}

export interface StudioNavSection {
  id: StudioTab;
  label: string;
  iconName: string;
  badge?: string | number;
  allowedRoles?: StudioRole[];
}
