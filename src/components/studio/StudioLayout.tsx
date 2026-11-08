import React, { useState, useEffect } from 'react';
import { StudioSidebar } from './StudioSidebar';
import { StudioDashboard } from './StudioDashboard';
import { StudioDestinations } from './StudioDestinations';
import { StudioRecommendations } from './StudioRecommendations';
import { StudioEditorialReview } from './StudioEditorialReview';
import { StudioPartners } from './StudioPartners';
import { StudioPartnerCoverage } from './StudioPartnerCoverage';
import { StudioPublications } from './StudioPublications';
import { StudioOperations } from './StudioOperations';
import { StudioSettings } from './StudioSettings';
import { StudioTab, StudioUserSession } from './types';
import { Recommendation } from '../../types';
import { ShieldCheck, ArrowLeft, Lock, Menu } from 'lucide-react';

interface StudioLayoutProps {
  session: StudioUserSession;
  onLogout: () => void;
  onReturnToApp?: () => void;
  customRecommendations?: Recommendation[];
  editorialStatuses?: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>;
  onUpdateEditorialStatuses?: (statuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>) => void;
  onPreviewInTravelerApp?: (recId: string) => void;
}

export function StudioLayout({
  session,
  onLogout,
  onReturnToApp,
  customRecommendations = [],
  editorialStatuses = {},
  onUpdateEditorialStatuses,
  onPreviewInTravelerApp
}: StudioLayoutProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [targetRecId, setTargetRecId] = useState<string | undefined>();
  const [targetPartnerId, setTargetPartnerId] = useState<string | undefined>();

  // Keep mobile drawer state and scroll lock consistent when crossing mobile/desktop widths (768px)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const desktopMediaQuery = window.matchMedia('(min-width: 768px)');
    const handleViewportChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setIsMobileDrawerOpen(false);
      }
    };

    handleViewportChange(desktopMediaQuery);

    if (typeof desktopMediaQuery.addEventListener === 'function') {
      desktopMediaQuery.addEventListener('change', handleViewportChange);
      return () => desktopMediaQuery.removeEventListener('change', handleViewportChange);
    } else if (typeof desktopMediaQuery.addListener === 'function') {
      desktopMediaQuery.addListener(handleViewportChange);
      return () => desktopMediaQuery.removeListener(handleViewportChange);
    }
  }, []);

  // Close mobile drawer on Escape key and lock document body scroll only while mobile drawer is open
  useEffect(() => {
    if (!isMobileDrawerOpen || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
      }
    };

    const prevBodyOverflow = document.body?.style?.overflow;
    if (document.body?.style) {
      document.body.style.overflow = 'hidden';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (document.body?.style) {
        document.body.style.overflow = prevBodyOverflow || '';
      }
    };
  }, [isMobileDrawerOpen]);

  const handleSelectTab = (tab: StudioTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const handleNavigateTab = (tab: StudioTab, itemId?: string) => {
    if ((tab === 'recommendations' || tab === 'editorial-review') && itemId) {
      setTargetRecId(itemId);
    } else if (tab === 'partners' && itemId) {
      setTargetPartnerId(itemId);
    }
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <StudioDashboard
            session={session}
            onNavigateTab={handleNavigateTab}
            customRecommendations={customRecommendations}
            editorialStatuses={editorialStatuses}
          />
        );
      case 'destinations':
        return <StudioDestinations />;
      case 'recommendations':
        return (
          <StudioRecommendations
            customRecommendations={customRecommendations}
            editorialStatuses={editorialStatuses}
            onUpdateEditorialStatuses={onUpdateEditorialStatuses}
            targetRecId={targetRecId}
            onPreviewInTravelerApp={onPreviewInTravelerApp}
          />
        );
      case 'editorial-review':
        return (
          <StudioEditorialReview
            customRecommendations={customRecommendations}
            editorialStatuses={editorialStatuses}
            onUpdateEditorialStatuses={onUpdateEditorialStatuses}
            onNavigateTab={handleNavigateTab}
            targetRecId={targetRecId}
            onPreviewInTravelerApp={onPreviewInTravelerApp}
          />
        );
      case 'partners':
        return <StudioPartners session={session} targetPartnerId={targetPartnerId} />;
      case 'partner-coverage':
        return <StudioPartnerCoverage session={session} />;
      case 'publications':
        return <StudioPublications onNavigateTab={handleNavigateTab} />;
      case 'operations':
        return <StudioOperations />;
      case 'settings':
        return <StudioSettings session={session} />;
      default:
        return (
          <StudioDashboard 
            session={session} 
            onNavigateTab={handleNavigateTab}
            customRecommendations={customRecommendations}
            editorialStatuses={editorialStatuses}
          />
        );
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full max-w-full overflow-hidden bg-[#FAF9F5] text-[#1E2E20] flex flex-col font-sans">
      {/* Top Banner */}
      <header className="bg-[#23251E] text-white min-h-[56px] px-3 sm:px-6 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between gap-2 border-b border-[#32352B] shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Navigation Drawer Trigger (< 768px) — Minimum 44x44px touch target */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
            aria-label={isMobileDrawerOpen ? 'Close Studio navigation' : 'Open Studio navigation'}
            aria-expanded={isMobileDrawerOpen}
            aria-controls="studio-mobile-drawer"
            className="md:hidden min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Menu size={20} className="text-[#C5A059]" />
          </button>

          {onReturnToApp && (
            <button
              type="button"
              onClick={() => {
                setIsMobileDrawerOpen(false);
                onReturnToApp();
              }}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} className="text-[#C5A059] shrink-0" />
              <span className="truncate">Back to App</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-white/70 shrink-0">
            <Lock size={12} className="text-[#C5A059]" />
            <span>FROZEN CORE ARCHITECTURE v1.2</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-white/10 rounded-full border border-white/15 text-[11px] font-mono text-white min-w-0 max-w-[180px] sm:max-w-none">
            <ShieldCheck size={14} className="text-[#C5A059] shrink-0" />
            <span className="font-bold truncate">{session.role}</span>
            <span className="hidden xs:inline sm:inline text-white/50 truncate">({session.name})</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative w-full max-w-full">
        {/* Navigation (Mobile Overlay Drawer + Desktop Collapsible Sidebar) */}
        <StudioSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          session={session}
          onLogout={onLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        />

        {/* Work Canvas Area — Full width on mobile, independent vertical scrolling, zero page-level horizontal overflow */}
        <main
          className={`flex-1 min-w-0 w-full max-w-full bg-[#FAF9F5] p-4 sm:p-6 lg:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] overflow-x-hidden overscroll-y-contain no-scrollbar ${
            isMobileDrawerOpen ? 'overflow-y-hidden md:overflow-y-auto' : 'overflow-y-auto'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

