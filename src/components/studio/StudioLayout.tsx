import React, { useState } from 'react';
import { StudioSidebar } from './StudioSidebar';
import { StudioDashboard } from './StudioDashboard';
import { StudioDestinations } from './StudioDestinations';
import { StudioRecommendations } from './StudioRecommendations';
import { StudioEditorialReview } from './StudioEditorialReview';
import { StudioPartners } from './StudioPartners';
import { StudioPublications } from './StudioPublications';
import { StudioOperations } from './StudioOperations';
import { StudioSettings } from './StudioSettings';
import { StudioTab, StudioUserSession } from './types';
import { Recommendation } from '../../types';
import { ShieldCheck, ArrowLeft, Lock, Search } from 'lucide-react';

interface StudioLayoutProps {
  session: StudioUserSession;
  onLogout: () => void;
  onReturnToApp?: () => void;
  customRecommendations?: Recommendation[];
  editorialStatuses?: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>;
  onUpdateEditorialStatuses?: (statuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>) => void;
}

export function StudioLayout({
  session,
  onLogout,
  onReturnToApp,
  customRecommendations = [],
  editorialStatuses = {},
  onUpdateEditorialStatuses
}: StudioLayoutProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [targetRecId, setTargetRecId] = useState<string | undefined>();
  const [targetPartnerId, setTargetPartnerId] = useState<string | undefined>();

  const handleNavigateTab = (tab: StudioTab, itemId?: string) => {
    if ((tab === 'recommendations' || tab === 'editorial-review') && itemId) {
      setTargetRecId(itemId);
    } else if (tab === 'partners' && itemId) {
      setTargetPartnerId(itemId);
    }
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <StudioDashboard
            session={session}
            onNavigateTab={(tab) => handleNavigateTab(tab)}
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
          />
        );
      case 'partners':
        return <StudioPartners targetPartnerId={targetPartnerId} />;
      case 'publications':
        return <StudioPublications onNavigateTab={handleNavigateTab} />;
      case 'operations':
        return <StudioOperations />;
      case 'settings':
        return <StudioSettings session={session} />;
      default:
        return <StudioDashboard session={session} onNavigateTab={(t) => handleNavigateTab(t)} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F5] text-[#1E2E20] flex flex-col font-sans">
      {/* Top Banner */}
      <header className="bg-[#23251E] text-white h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#32352B] shrink-0 z-30">
        <div className="flex items-center gap-3">
          {onReturnToApp && (
            <button
              onClick={onReturnToApp}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} className="text-[#C5A059]" />
              <span>Back to App</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-white/70">
            <Lock size={12} className="text-[#C5A059]" />
            <span>FROZEN CORE ARCHITECTURE v1.2</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/15 text-[11px] font-mono text-white">
            <ShieldCheck size={14} className="text-[#C5A059]" />
            <span className="font-bold">{session.role}</span>
            <span className="text-white/50">({session.name})</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation */}
        <StudioSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          session={session}
          onLogout={onLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Work Canvas Area */}
        <main className="flex-1 min-w-0 bg-[#FAF9F5] p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
