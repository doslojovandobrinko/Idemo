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
  | 'publications'
  | 'operations'
  | 'settings'
  | 'collections';

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
