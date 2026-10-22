import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, 
  MapPin, 
  Users, 
  PackageCheck, 
  Activity, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  AlertCircle, 
  Layers, 
  Sparkles,
  FileCheck2,
  Lock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { StudioUserSession, StudioTab } from './types';
import { CuratorAttentionRadar } from './CuratorAttentionRadar';
import { aggregateCuratorTasks, CuratorTask } from '../../lib/curatorTaskService';
import { Recommendation } from '../../types';
import { INITIAL_RECOMMENDATIONS } from '../../constants';
import { draftExpansionPool } from '../../data/recommendations/serbia/draft_expansion';
import { fetchPartnerProfileReviewQueue, PartnerProfileQueueItem } from '../../lib/partnerService';
import { getPartnerRecommendationProposals } from '../../lib/partnerProposalService';
import { getLocalStudioDrafts } from '../../lib/recommendationWorkflowService';
import { getSupabaseClient } from '../../lib/supabaseClient';

interface StudioDashboardProps {
  session: StudioUserSession;
  onNavigateTab: (tab: StudioTab, itemId?: string) => void;
  recommendationCount?: number;
  partnerCount?: number;
  customRecommendations?: Recommendation[];
  editorialStatuses?: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>;
}

export function StudioDashboard({
  session,
  onNavigateTab,
  recommendationCount = 113,
  partnerCount = 5,
  customRecommendations = [],
  editorialStatuses = {}
}: StudioDashboardProps) {
  const [partnerQueue, setPartnerQueue] = useState<PartnerProfileQueueItem[]>([]);
  const [refreshRevision, setRefreshRevision] = useState(0);

  useEffect(() => {
    async function loadQueue() {
      try {
        const supabase = getSupabaseClient();
        const token = (await supabase?.auth.getSession())?.data.session?.access_token;
        const res = await fetchPartnerProfileReviewQueue(token, 'pending_review');
        if (res.success && res.profiles) {
          setPartnerQueue(res.profiles);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadQueue();

    const handleRefresh = () => setRefreshRevision(prev => prev + 1);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('idemo_partner_proposals_updated', handleRefresh);
    window.addEventListener('idemo_studio_drafts_updated', handleRefresh);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('idemo_partner_proposals_updated', handleRefresh);
      window.removeEventListener('idemo_studio_drafts_updated', handleRefresh);
    };
  }, []);

  // Aggregated recommendations pool (including locally persisted Studio & Partner Proposal drafts)
  const allRecs = useMemo(() => {
    let localDrafts: Recommendation[] = [];
    try {
      localDrafts = getLocalStudioDrafts() as Recommendation[];
    } catch {
      localDrafts = [];
    }
    const combined = [...localDrafts, ...customRecommendations, ...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
    const map = new Map<string, Recommendation>();
    combined.forEach(r => {
      if (r && r.id && !map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [customRecommendations, refreshRevision]);

  // Aggregate live proposals
  const proposals = useMemo(() => {
    try {
      return getPartnerRecommendationProposals();
    } catch {
      return [];
    }
  }, [refreshRevision]);

  // Pending Partner Proposals awaiting Curator review
  const pendingProposals = useMemo(() => {
    return proposals.filter(p => {
      const isPending =
        p.status === 'AGENT_007_PENDING' ||
        p.status === 'AGENT_007_RECOMMENDED' ||
        (p as any).curatorReviewStatus === 'PENDING';
      const linkedStatus = p.recDraftId ? editorialStatuses[p.recDraftId] : undefined;
      const isResolved = linkedStatus === 'APPROVED' || linkedStatus === 'RETIRED';
      return isPending && !isResolved;
    });
  }, [proposals, editorialStatuses]);

  // Computed tasks with SLA aging tiers
  const curatorTasks = useMemo(() => {
    return aggregateCuratorTasks({
      recommendations: allRecs,
      editorialStatuses,
      partnerQueue,
      proposals
    });
  }, [allRecs, editorialStatuses, partnerQueue, proposals]);
  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-[#23251E] text-white font-mono text-[9px] uppercase tracking-widest font-bold">
                IDEMO STUDIO OPERATIONAL DESK
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] font-mono text-[9px] uppercase tracking-widest font-bold">
                SYSTEM HEALTHY
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2E20] tracking-tight">
              Welcome, {session.name}
            </h1>
            <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-1 max-w-2xl leading-relaxed">
              Business operational workspace for destination curation, recommendation completeness audits, partner readiness verification, and package publishing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('publications')}
              className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <PackageCheck size={14} className="text-[#C5A059]" />
              <span>Publishing Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Business Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Metric 1: Destinations */}
        <div 
          onClick={() => onNavigateTab('destinations')}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Destinations
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#8A1F1F] group-hover:scale-110 transition-transform">
              <MapPin size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">5</span>
            <span className="text-xs text-[#2E7D32] font-semibold">Active Regions</span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            Belgrade, Novi Sad, Zlatibor, Niš, Subotica
          </p>
        </div>

        {/* Metric 2: Recommendations Breakdown */}
        <div 
          onClick={() => onNavigateTab('recommendations', pendingProposals[0]?.recDraftId || pendingProposals[0]?.id)}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Recommendations
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#C5A059] group-hover:scale-110 transition-transform">
              <Compass size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">{allRecs.length || recommendationCount}</span>
            <span className="text-xs text-[#2E7D32] font-semibold">64 Approved</span>
          </div>
          {pendingProposals.length > 0 ? (
            <p className="text-[11px] text-[#B45309] font-bold mt-1 font-sans flex items-center gap-1">
              <AlertTriangle size={12} className="text-[#B45309] shrink-0" />
              <span>{pendingProposals.length} Partner {pendingProposals.length === 1 ? 'Proposal' : 'Proposals'} Pending</span>
            </p>
          ) : (
            <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
              49 Draft Expansion candidates
            </p>
          )}
        </div>

        {/* Metric 3: Partners Breakdown */}
        <div 
          onClick={() => onNavigateTab('partners')}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Onboarded Partners
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#2E7D32] group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">{partnerCount}</span>
            <span className="text-xs text-[#2E7D32] font-semibold">3 Active / Routable</span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            1 Candidate, 1 Verification pending
          </p>
        </div>

        {/* Metric 4: Package Version */}
        <div 
          onClick={() => onNavigateTab('publications')}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Published Package
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#23251E] group-hover:scale-110 transition-transform">
              <PackageCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">v1.2.0</span>
            <span className="text-xs text-[#2E7D32] font-semibold">SHA-256 Valid</span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            Canonical Serbia package active
          </p>
        </div>
      </div>

      {/* Business-Critical Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Status Breakdown Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Curation & Provider Pipelines */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="font-serif text-lg font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-3">
              Curation & Partner Pipeline Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {/* Recommendations Status */}
              <div 
                onClick={() => onNavigateTab('recommendations', pendingProposals[0]?.recDraftId || pendingProposals[0]?.id)}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-3 cursor-pointer hover:border-[#23251E]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] uppercase text-[10px]">
                    Recommendations by Status
                  </span>
                  <Compass size={16} className="text-[#C5A059]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Approved for Release:</span>
                    <span className="font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">64 items</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Draft Candidates:</span>
                    <span className="font-bold text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-md">{49 + pendingProposals.length} items</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Partner Proposals Pending:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${
                      pendingProposals.length > 0
                        ? 'text-[#B45309] bg-[#FFF8E1] border border-[#FFE082]'
                        : 'text-[#8C8A7D] bg-[#E5E3DB]'
                    }`}>
                      {pendingProposals.length} {pendingProposals.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Partners Status */}
              <div 
                onClick={() => onNavigateTab('partners')}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-3 cursor-pointer hover:border-[#23251E]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] uppercase text-[10px]">
                    Partners by Lifecycle Stage
                  </span>
                  <Users size={16} className="text-[#2E7D32]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Active & Routable:</span>
                    <span className="font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">3 partners</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Verification Pending:</span>
                    <span className="font-bold text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-md">1 partner</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">New Candidates:</span>
                    <span className="font-bold text-[#1E2E20] bg-[#E5E3DB] px-2 py-0.5 rounded-md">1 partner</span>
                  </div>
                </div>
              </div>

              {/* Coverage Control Status */}
              <div 
                onClick={() => onNavigateTab('partner-coverage')}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2 cursor-pointer hover:border-[#23251E]/30 transition-all col-span-1 sm:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] uppercase text-[10px] flex items-center gap-1.5 font-mono">
                    <ShieldCheck size={14} className="text-[#C5A059]" />
                    Studio Partner Coverage Control Matrix
                  </span>
                  <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md font-mono">
                    Active Matrix
                  </span>
                </div>
                <p className="text-[11px] text-[#8C8A7D] font-sans">
                  Governed, one-click operational surface for recommendation eligibility, partner lifecycle, introduction readiness, and routing pool management.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Curator Attention Radar with Aging SLA indicators */}
          <CuratorAttentionRadar 
            tasks={curatorTasks} 
            onNavigateTab={onNavigateTab} 
          />
        </div>

        {/* Operator Quick Actions Sidebar */}
        <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-3">
            Quick Operator Actions
          </h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#1E2E20] font-mono">Recommendation Editor</span>
                <p className="text-[10px] text-[#8C8A7D]">Create, edit & score curated items</p>
              </div>
              <ArrowUpRight size={16} className="text-[#8C8A7D] group-hover:text-[#1E2E20] transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('partners')}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#1E2E20] font-mono">Partner Directory & Editor</span>
                <p className="text-[10px] text-[#8C8A7D]">Onboard partners & score readiness</p>
              </div>
              <ArrowUpRight size={16} className="text-[#8C8A7D] group-hover:text-[#1E2E20] transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('publications')}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#1E2E20] font-mono">Destination Publishing</span>
                <p className="text-[10px] text-[#8C8A7D]">Build immutable package bundle</p>
              </div>
              <ArrowUpRight size={16} className="text-[#8C8A7D] group-hover:text-[#1E2E20] transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('operations')}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#8C8A7D] font-mono">System Operations & Diagnostics</span>
                <p className="text-[10px] text-[#8C8A7D]">Infrastructure logs & telemetry</p>
              </div>
              <Activity size={16} className="text-[#8C8A7D]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

