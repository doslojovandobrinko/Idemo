import React, { useState, useEffect } from "react";
import { StudioAuthShell } from "./studio/StudioAuthShell";
import { StudioLayout } from "./studio/StudioLayout";
import { StudioUserSession } from "./studio/types";
import { Recommendation } from "../types";
import { safeStorage } from "../lib/safeStorage";

interface IdemoStudioProps {
  onReturnToApp?: () => void;
  customRecommendations?: Recommendation[];
  editorialStatuses?: Record<
    string,
    "CANDIDATE" | "NEEDS RESEARCH" | "APPROVED" | "MERGE CANDIDATE" | "RETIRED"
  >;
  onUpdateEditorialStatuses?: (
    statuses: Record<
      string,
      | "CANDIDATE"
      | "NEEDS RESEARCH"
      | "APPROVED"
      | "MERGE CANDIDATE"
      | "RETIRED"
    >,
  ) => void;
}

const STUDIO_SESSION_KEY = "idemo_studio_session_v1";

export function IdemoStudio({
  onReturnToApp,
  customRecommendations = [],
  editorialStatuses = {},
  onUpdateEditorialStatuses,
}: IdemoStudioProps) {
  const [session, setSession] = useState<StudioUserSession | null>(() => {
    try {
      const saved = safeStorage.getItem(STUDIO_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (newSession: StudioUserSession) => {
    setSession(newSession);
    try {
      safeStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.warn("Failed to persist Studio session:", e);
    }
  };

  const handleLogout = () => {
    setSession(null);
    try {
      safeStorage.removeItem(STUDIO_SESSION_KEY);
    } catch (e) {
      console.warn("Failed to clear Studio session:", e);
    }
  };

  if (!session) {
    return (
      <StudioAuthShell
        onLoginSuccess={handleLoginSuccess}
        onCancel={onReturnToApp}
      />
    );
  }

  return (
    <StudioLayout
      session={session}
      onLogout={handleLogout}
      onReturnToApp={onReturnToApp}
      customRecommendations={customRecommendations}
      editorialStatuses={editorialStatuses}
      onUpdateEditorialStatuses={onUpdateEditorialStatuses}
    />
  );
}

export default IdemoStudio;
