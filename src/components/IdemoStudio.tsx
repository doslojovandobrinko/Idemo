import React, { useState, useEffect } from 'react';
import { StudioAuthShell, parseAndValidateStudioRole } from './studio/StudioAuthShell';
import { StudioLayout } from './studio/StudioLayout';
import { StudioUserSession } from './studio/types';
import { Recommendation } from '../types';
import { safeStorage } from '../lib/safeStorage';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';

interface IdemoStudioProps {
  onReturnToApp?: () => void;
  customRecommendations?: Recommendation[];
  editorialStatuses?: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>;
  onUpdateEditorialStatuses?: (statuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>) => void;
  onPreviewInTravelerApp?: (recId: string) => void;
}

const STUDIO_SESSION_KEY = 'idemo_studio_session_v1';

export function IdemoStudio({
  onReturnToApp,
  customRecommendations = [],
  editorialStatuses = {},
  onUpdateEditorialStatuses,
  onPreviewInTravelerApp
}: IdemoStudioProps) {
  const [session, setSession] = useState<StudioUserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreAuthSession() {
      if (!isSupabaseConfigured()) {
        if (mounted) setIsInitializing(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        if (mounted) setIsInitializing(false);
        return;
      }

      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.user) {
          const derivedRole = parseAndValidateStudioRole(sbSession.user.app_metadata?.role);
          if (derivedRole) {
            const restoredSession: StudioUserSession = {
              email: sbSession.user.email || '',
              name: sbSession.user.user_metadata?.name || sbSession.user.user_metadata?.full_name || (sbSession.user.email ? sbSession.user.email.split('@')[0] : derivedRole),
              role: derivedRole,
              authenticatedAt: new Date().toISOString()
            };
            if (mounted) {
              setSession(restoredSession);
              try {
                safeStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(restoredSession));
              } catch (e) {
                console.warn('Failed to persist Studio session:', e);
              }
            }
          } else {
            // User session exists in Supabase auth but lacks authorized app_metadata.role
            if (mounted) {
              setSession(null);
              safeStorage.removeItem(STUDIO_SESSION_KEY);
            }
          }
        } else {
          if (mounted) {
            setSession(null);
            safeStorage.removeItem(STUDIO_SESSION_KEY);
          }
        }
      } catch (e) {
        console.warn('Failed to restore Supabase session:', e);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    restoreAuthSession();

    let authListener: { subscription?: { unsubscribe: () => void } } | null = null;
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSbSession) => {
          if (!mounted) return;
          if (newSbSession?.user) {
            const derivedRole = parseAndValidateStudioRole(newSbSession.user.app_metadata?.role);
            if (derivedRole) {
              const updatedSession: StudioUserSession = {
                email: newSbSession.user.email || '',
                name: newSbSession.user.user_metadata?.name || newSbSession.user.user_metadata?.full_name || (newSbSession.user.email ? newSbSession.user.email.split('@')[0] : derivedRole),
                role: derivedRole,
                authenticatedAt: new Date().toISOString()
              };
              setSession(updatedSession);
              try {
                safeStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(updatedSession));
              } catch (e) {
                console.warn('Failed to persist Studio session on auth state change:', e);
              }
            } else {
              setSession(null);
              safeStorage.removeItem(STUDIO_SESSION_KEY);
            }
          } else {
            setSession(null);
            safeStorage.removeItem(STUDIO_SESSION_KEY);
          }
        });
        authListener = listener;
      }
    }

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLoginSuccess = (newSession: StudioUserSession) => {
    setSession(newSession);
    try {
      safeStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.warn('Failed to persist Studio session:', e);
    }
  };

  const handleLogout = async () => {
    setSession(null);
    try {
      safeStorage.removeItem(STUDIO_SESSION_KEY);
    } catch (e) {
      console.warn('Failed to clear Studio session:', e);
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Failed to sign out from Supabase:', e);
        }
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full bg-[#FAF9F5] flex items-center justify-center p-6 text-[#1E2E20] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#23251E] border-t-[#C5A059] rounded-full animate-spin" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#8C8A7D]">
            Verifying Studio Session...
          </span>
        </div>
      </div>
    );
  }

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
      onPreviewInTravelerApp={onPreviewInTravelerApp}
    />
  );
}

export default IdemoStudio;
