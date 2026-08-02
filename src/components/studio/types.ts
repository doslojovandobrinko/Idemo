export type StudioRole =
  | "Curator"
  | "Editor"
  | "Translator"
  | "Partner Manager"
  | "Release Manager"
  | "Super Admin";

export type StudioTab =
  | "dashboard"
  | "destinations"
  | "recommendations"
  | "editorial-review"
  | "partners"
  | "publications"
  | "operations"
  | "settings"
  | "collections";

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
