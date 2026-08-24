/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO STUDIO — PARTNER INTELLIGENCE & ASSOCIATION COMPONENT (STEP 6)
 * Governs AI 007 Advisory Proposals and Explicit Admin Partner Associations.
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Award, 
  Info, 
  Search, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Phone,
  Mail,
  UserCheck,
  Send
} from 'lucide-react';
import { 
  PartnerIntelligenceResult, 
  PartnerMatchScore, 
  PartnerSuitabilityTier,
  StagedPartner,
  searchGovernedPartners,
  stageFromProposal,
  stageFromManualSelection
} from '../../lib/partnerIntelligenceService';
import { PARTNERS } from '../../data/partners';
import { selectAndReleasePartnerCoverage } from '../../lib/partnerService';

interface PartnerIntelligenceReviewProps {
  partnerIntelligence?: PartnerIntelligenceResult;
  onRefreshEvaluation?: () => void;
  stagedPartners?: StagedPartner[];
  onUpdateStagedPartners?: (partners: StagedPartner[]) => void;
  recommendationId?: string;
  isExistingCanonical?: boolean;
}

export const PartnerIntelligenceReview: React.FC<PartnerIntelligenceReviewProps> = ({
  partnerIntelligence,
  onRefreshEvaluation,
  stagedPartners = [],
  onUpdateStagedPartners,
  recommendationId,
  isExistingCanonical = false,
}) => {
  // Local state for dismissed 007 proposals (temporary view dismissal)
  const [dismissedProposalIds, setDismissedProposalIds] = useState<string[]>([]);
  
  // Search & Filter state for Manual Partner Selection
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('all');
  const [verifiedOnlyFilter, setVerifiedOnlyFilter] = useState(false);

  // Live Routing Pool release execution state
  const [releasingPartnerId, setReleasingPartnerId] = useState<string | null>(null);
  const [releaseFeedback, setReleaseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered 007 proposals (excluding dismissed ones)
  const visibleMatches = useMemo(() => {
    if (!partnerIntelligence?.matches) return [];
    return partnerIntelligence.matches.filter(m => !dismissedProposalIds.includes(m.partnerId));
  }, [partnerIntelligence?.matches, dismissedProposalIds]);

  // Governed partner categories for search filter
  const partnerCategories = useMemo(() => {
    const cats = new Set<string>();
    PARTNERS.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, []);

  // Filtered partners from full governed pool
  const searchResults = useMemo(() => {
    return searchGovernedPartners({
      query: searchQuery,
      category: selectedCategoryFilter,
      location: selectedLocationFilter,
      verifiedOnly: verifiedOnlyFilter,
    });
  }, [searchQuery, selectedCategoryFilter, selectedLocationFilter, verifiedOnlyFilter]);

  // Handler: Add or re-assign a partner to staged list
  const handleStagePartner = (partner: StagedPartner) => {
    if (!onUpdateStagedPartners) return;
    
    // Remove if already staged under another tier
    const filtered = stagedPartners.filter(p => p.partnerId !== partner.partnerId);
    
    // If assigning to a tier already occupied, bump or replace
    const tierOccupant = filtered.find(p => p.tier === partner.tier);
    let updated: StagedPartner[];
    
    if (tierOccupant) {
      // Replace occupant of that tier
      updated = filtered.filter(p => p.tier !== partner.tier).concat(partner);
    } else {
      updated = [...filtered, partner];
    }

    onUpdateStagedPartners(updated);
    setReleaseFeedback(null);
  };

  // Handler: Remove partner from staged list
  const handleRemoveStagedPartner = (partnerId: string) => {
    if (!onUpdateStagedPartners) return;
    onUpdateStagedPartners(stagedPartners.filter(p => p.partnerId !== partnerId));
    setReleaseFeedback(null);
  };

  // Handler: Change tier of staged partner
  const handleChangeTier = (partnerId: string, newTier: PartnerSuitabilityTier) => {
    if (!onUpdateStagedPartners) return;
    
    const target = stagedPartners.find(p => p.partnerId === partnerId);
    if (!target) return;

    const filtered = stagedPartners.filter(p => p.partnerId !== partnerId);
    // If another partner has newTier, swap or replace
    const otherInNewTier = filtered.find(p => p.tier === newTier);
    
    let updated: StagedPartner[];
    if (otherInNewTier) {
      // Swap tiers
      const swapped = { ...otherInNewTier, tier: target.tier };
      const modifiedTarget = { ...target, tier: newTier };
      updated = filtered.filter(p => p.partnerId !== otherInNewTier.partnerId).concat(swapped, modifiedTarget);
    } else {
      updated = [...filtered, { ...target, tier: newTier }];
    }

    onUpdateStagedPartners(updated);
  };

  // Handler: Update direct contact details for staged partner
  const handleUpdateContactDetails = (partnerId: string, email?: string, phone?: string) => {
    if (!onUpdateStagedPartners) return;
    onUpdateStagedPartners(
      stagedPartners.map(p => {
        if (p.partnerId === partnerId) {
          return { ...p, contactEmail: email, contactPhone: phone };
        }
        return p;
      })
    );
  };

  // Handler: Dismiss 007 proposal
  const handleDismissProposal = (partnerId: string) => {
    setDismissedProposalIds(prev => [...prev, partnerId]);
  };

  // Handler: Immediate Release into Live Routing Pool (governed RPC)
  const handleReleaseToRoutingPool = async (staged: StagedPartner) => {
    if (!recommendationId) {
      setReleaseFeedback({
        type: 'error',
        message: 'Recommendation must have a valid authoritative UUID before releasing to live routing pool.'
      });
      return;
    }

    setReleasingPartnerId(staged.partnerId);
    setReleaseFeedback(null);

    try {
      const res = await selectAndReleasePartnerCoverage(
        recommendationId,
        staged.partnerId,
        staged.contactEmail || staged.email,
        staged.contactPhone || staged.phone
      );

      if (res.success) {
        setReleaseFeedback({
          type: 'success',
          message: `Partner "${staged.partnerName}" successfully released into live concierge routing pool!`
        });
      } else {
        setReleaseFeedback({
          type: 'error',
          message: res.message || res.error || 'Failed to release partner coverage.'
        });
      }
    } catch (err: any) {
      setReleaseFeedback({
        type: 'error',
        message: `Release exception: ${err?.message || String(err)}`
      });
    } finally {
      setReleasingPartnerId(null);
    }
  };

  if (!partnerIntelligence) {
    return null;
  }

  const { coverageGap, evaluatedPartnersCount, qualifiedPartnersCount, advisoryNotice } = partnerIntelligence;

  // Staged partners grouped by tier
  const primaryStaged = stagedPartners.find(p => p.tier === 'PRIMARY');
  const secondaryStaged = stagedPartners.find(p => p.tier === 'SECONDARY');
  const tertiaryStaged = stagedPartners.find(p => p.tier === 'TERTIARY');

  return (
    <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-6 font-sans">
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* SECTION HEADER                                                        */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E3DB] pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#E5E3DB] text-[#C5A059]">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20] tracking-wide">
              Partner Intelligence & Association
            </h3>
            <span className="font-mono text-[10.5px] text-[#8C8A7D]">
              Evaluated {evaluatedPartnersCount} verified partners | {qualifiedPartnersCount} qualified candidates | {stagedPartners.length} Admin Selected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshEvaluation && (
            <button
              type="button"
              onClick={onRefreshEvaluation}
              className="px-3 py-1.5 rounded-lg border border-[#E5E3DB] hover:bg-[#FAF9F5] font-mono text-[10.5px] font-bold text-[#1E2E20] uppercase transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              Re-evaluate 007
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="px-3 py-1.5 rounded-lg bg-[#1E2E20] text-[#C5A059] font-mono text-[10.5px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 hover:bg-[#2A3E2D]"
          >
            <Search size={12} />
            {isSearchOpen ? 'Hide Partner Search' : 'Search Governed Pool'}
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl flex items-start gap-2.5 text-[11px] font-mono text-[#8C8A7D]">
        <Info size={15} className="shrink-0 text-[#C5A059] mt-0.5" />
        <span className="leading-tight">
          <strong>ADVISORY ONLY:</strong> {advisoryNotice}
        </span>
      </div>

      {/* Release feedback banner */}
      {releaseFeedback && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-mono ${
          releaseFeedback.type === 'success' 
            ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]' 
            : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
        }`}>
          {releaseFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{releaseFeedback.message}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 1. ADMIN SELECTED PARTNERS (STAGED ASSOCIATION)                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-[#1E2E20]" />
            <h4 className="font-mono text-xs font-bold uppercase text-[#1E2E20]">
              Admin Selected Partners (Staged for Canonical Routing)
            </h4>
          </div>
          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase border ${
            stagedPartners.length > 0
              ? 'bg-[#1E2E20] text-[#C5A059] border-[#C5A059]/40'
              : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
          }`}>
            {stagedPartners.length > 0 ? `${stagedPartners.length} Staged Candidates` : 'Coverage Unresolved'}
          </span>
        </div>

        {stagedPartners.length === 0 ? (
          <div className="p-4 bg-[#FAF9F5] border border-dashed border-[#D6D3C7] rounded-xl text-center space-y-2">
            <div className="flex justify-center text-[#8C8A7D]">
              <AlertTriangle size={20} className="text-[#C5A059]" />
            </div>
            <p className="font-mono text-xs font-bold text-[#1E2E20] uppercase">
              Partner Coverage Unresolved
            </p>
            <p className="text-xs text-[#8C8A7D] max-w-lg mx-auto">
              No partner is currently associated with this recommendation. 
              Select a candidate from the 007 proposals below or search the governed partner pool to assign a provider.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['PRIMARY', 'SECONDARY', 'TERTIARY'] as PartnerSuitabilityTier[]).map(tier => {
              const staged = stagedPartners.find(p => p.tier === tier);
              const isPrimary = tier === 'PRIMARY';
              const isSecondary = tier === 'SECONDARY';

              if (!staged) {
                return (
                  <div 
                    key={tier}
                    className="p-3.5 rounded-xl border border-dashed border-[#E5E3DB] bg-[#FAF9F5]/50 flex flex-col justify-center items-center text-center space-y-2 min-h-[140px]"
                  >
                    <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D]">
                      {tier} SLOT EMPTY
                    </span>
                    <span className="text-[11px] text-[#A8A29E] font-mono">
                      No partner assigned as {tier.toLowerCase()} candidate.
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={staged.partnerId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isPrimary
                      ? 'bg-[#FAF9F5] border-[#C5A059] shadow-xs'
                      : isSecondary
                      ? 'bg-white border-[#1E2E20]/40'
                      : 'bg-white border-[#E5E3DB]'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header & Badges */}
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase border ${
                        isPrimary
                          ? 'bg-[#1E2E20] text-[#C5A059] border-[#C5A059]/40'
                          : isSecondary
                          ? 'bg-[#FAF9F5] text-[#1E2E20] border-[#E5E3DB]'
                          : 'bg-white text-[#8C8A7D] border-[#E5E3DB]'
                      }`}>
                        ADMIN: {staged.tier}
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#E5E3DB]/60 text-[#57534E] uppercase">
                        {staged.origin === '007_PROPOSAL' ? 'From 007' : 'Manual Pick'}
                      </span>
                    </div>

                    {/* Partner Name & Role */}
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#1E2E20] leading-tight">
                        {staged.partnerName}
                      </h4>
                      <span className="font-mono text-[10px] text-[#8C8A7D] block">
                        {staged.operationalRole || staged.category}
                      </span>
                    </div>

                    {/* Contact & Routing Info */}
                    <div className="pt-2 border-t border-[#E5E3DB] space-y-1 text-[10px] font-mono text-[#57534E]">
                      {staged.contactEmail && (
                        <div className="flex items-center gap-1 truncate">
                          <Mail size={11} className="shrink-0 text-[#8C8A7D]" />
                          <span className="truncate">{staged.contactEmail}</span>
                        </div>
                      )}
                      {staged.contactPhone && (
                        <div className="flex items-center gap-1 truncate">
                          <Phone size={11} className="shrink-0 text-[#8C8A7D]" />
                          <span className="truncate">{staged.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Re-rank, Release, Remove */}
                  <div className="pt-2 border-t border-[#E5E3DB] space-y-2">
                    <div className="flex items-center gap-1">
                      {(['PRIMARY', 'SECONDARY', 'TERTIARY'] as PartnerSuitabilityTier[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          disabled={staged.tier === t}
                          onClick={() => handleChangeTier(staged.partnerId, t)}
                          className={`flex-1 py-1 rounded font-mono text-[8.5px] font-bold uppercase transition-colors ${
                            staged.tier === t
                              ? 'bg-[#1E2E20] text-white cursor-default'
                              : 'bg-[#FAF9F5] border border-[#E5E3DB] text-[#57534E] hover:bg-[#E5E3DB]/50 cursor-pointer'
                          }`}
                        >
                          {t[0]}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleRemoveStagedPartner(staged.partnerId)}
                        title="Remove Candidate"
                        className="p-1 rounded text-[#991B1B] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Optional Live Routing Pool Release (If recommendation has UUID) */}
                    {recommendationId && (
                      <button
                        type="button"
                        disabled={releasingPartnerId === staged.partnerId}
                        onClick={() => handleReleaseToRoutingPool(staged)}
                        className="w-full py-1 px-2 rounded bg-[#FAF9F5] border border-[#C5A059] text-[#1E2E20] hover:bg-[#C5A059]/10 font-mono text-[9.5px] font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        {releasingPartnerId === staged.partnerId ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <Send size={11} className="text-[#C5A059]" />
                        )}
                        Release into Routing Pool
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 2. MANUAL PARTNER SEARCH DRAWER / PANEL                               */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="p-4 bg-[#FAF9F5] border border-[#C5A059]/40 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-[#C5A059]" />
              <h4 className="font-mono text-xs font-bold uppercase text-[#1E2E20]">
                Search Governed Partner Pool ({searchResults.length} Matches)
              </h4>
            </div>
            <span className="font-mono text-[10px] text-[#8C8A7D]">
              Select any partner from the pool even if 007 did not rank them
            </span>
          </div>

          {/* Search Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="sm:col-span-1">
              <input
                type="text"
                placeholder="Search by name, expertise, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 bg-white border border-[#E5E3DB] rounded-lg font-sans text-xs focus:outline-none focus:border-[#1E2E20]"
              />
            </div>

            <div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full p-2 bg-white border border-[#E5E3DB] rounded-lg font-mono text-[11px] focus:outline-none focus:border-[#1E2E20]"
              >
                <option value="all">All Partner Categories</option>
                {partnerCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 font-mono text-[11px] text-[#57534E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnlyFilter}
                  onChange={(e) => setVerifiedOnlyFilter(e.target.checked)}
                  className="rounded border-[#E5E3DB] text-[#1E2E20] focus:ring-0 cursor-pointer"
                />
                Verified Only
              </label>
            </div>
          </div>

          {/* Search Results List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {searchResults.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-[#E5E3DB] text-center text-xs font-mono text-[#8C8A7D]">
                No partners found matching search criteria.
              </div>
            ) : (
              searchResults.slice(0, 10).map(partner => {
                const staged = stagedPartners.find(p => p.partnerId === partner.id);
                return (
                  <div
                    key={partner.id}
                    className="p-3 bg-white border border-[#E5E3DB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-[#C5A059]/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-[#1E2E20]">{partner.nameEn}</span>
                        <span className="px-1.5 py-0.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded font-mono text-[9px] text-[#8C8A7D]">
                          {partner.category}
                        </span>
                        {partner.locationEn && (
                          <span className="font-mono text-[9.5px] text-[#8C8A7D]">
                            • {partner.locationEn}
                          </span>
                        )}
                      </div>

                      {partner.expertise && (
                        <div className="text-[10px] text-[#57534E] font-mono truncate max-w-md">
                          {partner.expertise.slice(0, 2).join(' • ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {staged ? (
                        <span className="px-2 py-1 bg-[#FAF9F5] border border-[#1E2E20] rounded font-mono text-[9.5px] font-bold text-[#1E2E20] uppercase">
                          Selected as {staged.tier}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStagePartner(stageFromManualSelection(partner, 'PRIMARY'))}
                            className="px-2 py-1 rounded bg-[#1E2E20] text-[#C5A059] font-mono text-[9.5px] font-bold uppercase hover:bg-[#2A3E2D] cursor-pointer"
                          >
                            + Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStagePartner(stageFromManualSelection(partner, 'SECONDARY'))}
                            className="px-2 py-1 rounded bg-white border border-[#E5E3DB] text-[#1E2E20] font-mono text-[9.5px] font-bold uppercase hover:bg-[#FAF9F5] cursor-pointer"
                          >
                            + Secondary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStagePartner(stageFromManualSelection(partner, 'TERTIARY'))}
                            className="px-2 py-1 rounded bg-white border border-[#E5E3DB] text-[#8C8A7D] font-mono text-[9.5px] font-bold uppercase hover:bg-[#FAF9F5] cursor-pointer"
                          >
                            + Tertiary
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 3. 007 ADVISORY PROPOSALS DISPLAY                                     */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-[#C5A059]" />
            <h4 className="font-mono text-xs font-bold uppercase text-[#1E2E20]">
              IDEMO 007 Advisory Proposals ({visibleMatches.length} Candidate Matches)
            </h4>
          </div>
          <span className="font-mono text-[10px] text-[#8C8A7D]">
            Suitability scoring based on taxonomy, expertise, and geography
          </span>
        </div>

        {visibleMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {visibleMatches.map((partner: PartnerMatchScore) => {
              const staged = stagedPartners.find(p => p.partnerId === partner.partnerId);
              const isPrimary = partner.tier === 'PRIMARY';
              const isSecondary = partner.tier === 'SECONDARY';

              return (
                <div
                  key={partner.partnerId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    staged
                      ? 'bg-[#FAF9F5] border-[#1E2E20]'
                      : isPrimary
                      ? 'bg-[#FAF9F5]/40 border-[#C5A059]/60'
                      : 'bg-white border-[#E5E3DB]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase border ${
                        isPrimary
                          ? 'bg-[#1E2E20] text-[#C5A059] border-[#C5A059]/40'
                          : isSecondary
                          ? 'bg-[#FAF9F5] text-[#1E2E20] border-[#E5E3DB]'
                          : 'bg-white text-[#8C8A7D] border-[#E5E3DB]'
                      }`}>
                        007: {partner.tier}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1E2E20]">
                        {partner.suitabilityScore}% Match
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#1E2E20] leading-tight">
                        {partner.partnerName}
                      </h4>
                      <span className="font-mono text-[10px] text-[#8C8A7D] block">
                        {partner.operationalRole}
                      </span>
                    </div>

                    {/* Match Reasons */}
                    <div className="space-y-1 pt-1 border-t border-[#E5E3DB]/60">
                      {partner.matchReasons.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[9.5px] font-mono text-[#57534E]">
                          <span className="text-[#C5A059]">•</span>
                          <span className="leading-tight">{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Verification & Routable info */}
                    <div className="pt-2 border-t border-[#E5E3DB] flex items-center justify-between text-[9.5px] font-mono text-[#8C8A7D]">
                      <span className="flex items-center gap-1 text-[#2E7D32]">
                        <ShieldCheck size={12} /> {partner.verificationStatus}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award size={12} className="text-[#C5A059]" />
                        {partner.conciergeRoutingEligible === 'Yes' ? 'Routable' : 'Review Required'}
                      </span>
                    </div>
                  </div>

                  {/* Actions on 007 proposal */}
                  <div className="pt-2 border-t border-[#E5E3DB] space-y-1.5">
                    {staged ? (
                      <div className="flex items-center justify-between bg-white p-1.5 rounded border border-[#1E2E20]/30 font-mono text-[9px]">
                        <span className="text-[#1E2E20] font-bold">
                          ✓ Staged as {staged.tier}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedPartner(partner.partnerId)}
                          className="text-[#991B1B] hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStagePartner(stageFromProposal(partner, 'PRIMARY'))}
                          className="flex-1 py-1 px-1.5 rounded bg-[#1E2E20] text-[#C5A059] font-mono text-[8.5px] font-bold uppercase hover:bg-[#2A3E2D] cursor-pointer"
                        >
                          + Primary
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStagePartner(stageFromProposal(partner, 'SECONDARY'))}
                          className="flex-1 py-1 px-1.5 rounded bg-[#FAF9F5] border border-[#E5E3DB] text-[#1E2E20] font-mono text-[8.5px] font-bold uppercase hover:bg-[#E5E3DB]/40 cursor-pointer"
                        >
                          + Secondary
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStagePartner(stageFromProposal(partner, 'TERTIARY'))}
                          className="flex-1 py-1 px-1.5 rounded bg-white border border-[#E5E3DB] text-[#8C8A7D] font-mono text-[8.5px] font-bold uppercase hover:bg-[#FAF9F5] cursor-pointer"
                        >
                          + Tertiary
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissProposal(partner.partnerId)}
                          title="Dismiss Proposal"
                          className="p-1 rounded text-[#8C8A7D] hover:text-[#991B1B] transition-colors cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Coverage Gap Presentation */
          coverageGap && (
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-[#92400E]">
                <AlertTriangle size={16} className="shrink-0" />
                <h4 className="font-mono text-xs font-bold uppercase">
                  Partner Coverage Gap Identified
                </h4>
              </div>

              <p className="text-xs text-[#92400E] font-sans leading-relaxed">
                {coverageGap.reason}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#FDE68A] text-[10.5px] font-mono text-[#92400E]">
                <div>
                  <span className="font-bold block mb-0.5 uppercase">Missing Expertise:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {coverageGap.missingExpertise.map((exp, i) => (
                      <li key={i}>{exp}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold block mb-0.5 uppercase">Recommended Action:</span>
                  <p className="leading-tight">{coverageGap.recommendedAction}</p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
