/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  X,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Search,
  CheckCircle2,
  RefreshCw,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { InquiryRecordV2, Partner } from '../../types';
import {
  StagedPartner,
  PartnerSuitabilityTier,
  PartnerIntelligenceResult,
  evaluateInquiryPartnerSuitability,
  stageFromProposal,
  stageFromManualSelection,
  searchGovernedPartners,
} from '../../lib/partnerIntelligenceService';
import { getPartnerLifecycleState, getAllPartners } from '../../lib/partnerLifecycleService';
import { selectAndReleasePartnerCoverage } from '../../lib/partnerService';

interface InquiryMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: InquiryRecordV2 | null;
  onDispatchSuccess?: (inquiryId: string, releasedPartners: string[]) => void;
}

export const InquiryMatcherModal: React.FC<InquiryMatcherModalProps> = ({
  isOpen,
  onClose,
  inquiry,
  onDispatchSuccess,
}) => {
  const [stagedList, setStagedList] = useState<StagedPartner[]>([]);
  const [matchResult, setMatchResult] = useState<PartnerIntelligenceResult | null>(null);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Manual partner selection picker state
  const [pickerOpen, setPickerModalOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerTier, setPickerTier] = useState<PartnerSuitabilityTier>('SECONDARY');

  useEffect(() => {
    if (inquiry && isOpen) {
      setIsDispatched(false);
      setDispatchError(null);

      // Evaluate partner suitability for this inquiry
      const res = evaluateInquiryPartnerSuitability(inquiry);
      setMatchResult(res);

      // Default stage from top 3 proposed matches
      const initialStaged = res.matches.map((m) => stageFromProposal(m));
      setStagedList(initialStaged);
    }
  }, [inquiry, isOpen]);

  if (!isOpen || !inquiry) return null;

  const handleRemoveStaged = (partnerId: string) => {
    setStagedList((prev) => prev.filter((p) => p.partnerId !== partnerId));
  };

  const handleTierChange = (partnerId: string, newTier: PartnerSuitabilityTier) => {
    setStagedList((prev) =>
      prev.map((p) => (p.partnerId === partnerId ? { ...p, tier: newTier } : p))
    );
  };

  const handleAddManualPartner = (partner: Partner) => {
    try {
      // Duplicate protection: prevent adding if already in stagedList
      if (stagedList.some((p) => p.partnerId === partner.id)) {
        setDispatchError(`Duplicate Protection: Partner ${partner.nameEn} is already staged for this inquiry.`);
        return;
      }

      const staged = stageFromManualSelection(partner, pickerTier);
      setStagedList((prev) => [...prev, staged]);
      setPickerModalOpen(false);
      setPickerSearch('');
      setDispatchError(null);
    } catch (err: any) {
      setDispatchError(err?.message || 'Partner fails hard lifecycle eligibility check.');
    }
  };

  const getEligibleManualCandidates = () => {
    const all = getAllPartners();
    const existingStagedIds = new Set(stagedList.map((s) => s.partnerId));

    return searchGovernedPartners({ query: pickerSearch }, all)
      .filter((p) => !existingStagedIds.has(p.id))
      .filter((p) => {
        const state = getPartnerLifecycleState(p);
        return state.isVerified && state.isActive && !state.isRetired && !state.isSuspended && state.isConciergeRoutable;
      });
  };

  const handleExecuteDispatch = async () => {
    if (!inquiry || stagedList.length === 0) return;
    setDispatchError(null);

    // Pre-dispatch revalidation: re-check current lifecycle state for each staged partner
    const allPartnersMap = new Map(getAllPartners().map((p) => [p.id, p]));
    const invalidPartners: string[] = [];

    for (const staged of stagedList) {
      const livePartner = allPartnersMap.get(staged.partnerId);
      if (!livePartner) {
        invalidPartners.push(`${staged.partnerName} (not found)`);
        continue;
      }
      const liveState = getPartnerLifecycleState(livePartner);
      if (!liveState.isVerified || !liveState.isActive || liveState.isRetired || liveState.isSuspended || !liveState.isConciergeRoutable) {
        invalidPartners.push(`${staged.partnerName} (${liveState.stage || 'ineligible'})`);
      }
    }

    if (invalidPartners.length > 0) {
      setDispatchError(
        `DISPATCH BLOCKED: The following staged partner(s) are currently ineligible under hard lifecycle governance rules: ${invalidPartners.join(
          ', '
        )}`
      );
      return;
    }

    // Execute release via selectAndReleasePartnerCoverage
    const recId = inquiry.recommendation_db_id || inquiry.recommendation_id;
    const partnerIds = stagedList.map((s) => s.partnerId);

    const res = await selectAndReleasePartnerCoverage(
      recId,
      partnerIds,
      `Curator staged dispatch for Inquiry ${inquiry.public_reference_code || inquiry.local_queue_id}`
    );

    if (res.success) {
      setIsDispatched(true);
      if (onDispatchSuccess) {
        onDispatchSuccess(inquiry.local_queue_id, partnerIds);
      }
    } else {
      setDispatchError(res.error || res.message || 'Failed to dispatch partner coverage opportunity.');
    }
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#E5E3DB] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="bg-[#1E2E20] text-white p-5 flex items-center justify-between border-b border-[#E5E3DB]">
          <div className="flex items-center gap-2">
            <Compass className="text-[#C5A059]" size={20} />
            <div>
              <h2 className="font-serif text-lg font-bold">Curator Inquiry Matcher & Dispatch Stager</h2>
              <p className="text-xs text-white/70 font-mono">
                Ref: {inquiry.public_reference_code || inquiry.local_queue_id} • Internal Governance Staging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Inquiry Summary Box */}
          <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
              <span className="font-bold text-[#800020] uppercase tracking-wider text-[11px]">
                Target Visitor Request
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1E2E20] text-white text-[10px] font-bold uppercase">
                {inquiry.status || 'submitted'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#1E2E20]">
              <div>
                <span className="text-[#8C8A7D] block text-[10px] uppercase font-bold">Experience:</span>
                <strong className="font-serif font-bold text-sm text-[#1E2E20]">
                  {inquiry.recommendation_title}
                </strong>
              </div>
              <div>
                <span className="text-[#8C8A7D] block text-[10px] uppercase font-bold">Requested Time:</span>
                <strong>{inquiry.preferred_date || 'Flex'} @ {inquiry.preferred_time || '10:00'}</strong>
              </div>
            </div>

            {inquiry.visitor_notes && (
              <div className="pt-2 border-t border-[#E5E3DB]/70">
                <span className="text-[#8C8A7D] block text-[10px] uppercase font-bold">Visitor Notes:</span>
                <p className="text-[#1E2E20] italic font-sans text-xs bg-white p-2 rounded-xl border border-[#E5E3DB] mt-0.5">
                  "{inquiry.visitor_notes}"
                </p>
              </div>
            )}

            {/* Privacy Barrier Warning */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#8C8A7D] pt-1">
              <Lock size={12} className="text-[#2E7D32]" />
              <span>Visitor and partner direct contact details are protected in staging until mutual confirmation.</span>
            </div>
          </div>

          {/* Coverage Gap Warning if 0 Matches */}
          {matchResult?.coverageGap && (
            <div className="p-4 bg-[#FFF8E1] border border-[#FFE082] rounded-2xl space-y-2 font-mono text-xs text-[#795548]">
              <div className="flex items-center gap-1.5 font-bold text-[#E65100]">
                <AlertTriangle size={16} />
                <span>Coverage Gap Detected</span>
              </div>
              <p className="text-[11px] leading-tight">{matchResult.coverageGap.reason}</p>
              <p className="text-[10px] italic text-[#8C8A7D] border-t border-[#FFE082]/60 pt-1">
                {matchResult.coverageGap.recommendedAction}
              </p>
            </div>
          )}

          {/* Staged Partner List */}
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between font-mono text-xs border-b border-[#E5E3DB] pb-2">
              <span className="font-bold text-[#1E2E20] uppercase tracking-wider text-[11px]">
                Staged Shortlist ({stagedList.length} Partners)
              </span>

              <button
                type="button"
                onClick={() => setPickerModalOpen(true)}
                className="px-2.5 py-1 bg-[#1E2E20] text-white rounded-lg font-mono text-[11px] font-bold flex items-center gap-1 hover:bg-[#2e4030] cursor-pointer transition-all"
              >
                <Plus size={13} /> ADD PARTNER
              </button>
            </div>

            {stagedList.length === 0 ? (
              <p className="p-4 text-center text-xs font-mono text-[#8C8A7D] bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl">
                No partners currently staged. Click "ADD PARTNER" to search and stage eligible partners.
              </p>
            ) : (
              stagedList.map((staged) => (
                <div
                  key={staged.partnerId}
                  className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2 font-sans"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#1E2E20]">
                        {staged.partnerName}
                      </span>
                      <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded text-[10px] font-bold uppercase flex items-center gap-1">
                        <UserCheck size={12} /> VERIFIED
                      </span>
                    </div>

                    {/* Tier Selector */}
                    <select
                      value={staged.tier}
                      onChange={(e) => handleTierChange(staged.partnerId, e.target.value as PartnerSuitabilityTier)}
                      className="p-1 text-[11px] font-mono font-bold bg-white border border-[#E5E3DB] rounded-lg text-[#1E2E20] focus:outline-none"
                    >
                      <option value="PRIMARY">PRIMARY TIER</option>
                      <option value="SECONDARY">SECONDARY TIER</option>
                      <option value="TERTIARY">TERTIARY TIER</option>
                    </select>
                  </div>

                  {staged.operationalRole && (
                    <p className="text-xs text-[#8C8A7D] font-mono">
                      Role: <strong>{staged.operationalRole}</strong>
                    </p>
                  )}

                  {staged.matchReasons && staged.matchReasons.length > 0 && (
                    <ul className="text-[11px] font-mono text-[#1E2E20] space-y-0.5 list-disc list-inside bg-white p-2 rounded-xl border border-[#E5E3DB]">
                      {staged.matchReasons.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#E5E3DB]/60 text-[10px] font-mono text-[#8C8A7D]">
                    <span>Source: {staged.origin === '007_PROPOSAL' ? '007 Match Engine' : 'Curator Manual Selection'}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStaged(staged.partnerId)}
                      className="text-[#C62828] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} /> REMOVE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dispatch Error Banner */}
          {dispatchError && (
            <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] rounded-xl text-xs font-mono space-y-1">
              <strong>Governance Notice:</strong>
              <p>{dispatchError}</p>
            </div>
          )}

          {/* Dispatch Action Footer */}
          <div className="pt-3 border-t border-[#E5E3DB] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-[#8C8A7D]">
              Matching is purely internal until curator explicitly executes dispatch.
            </span>

            <button
              type="button"
              onClick={handleExecuteDispatch}
              disabled={stagedList.length === 0 || isDispatched}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isDispatched
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                  : stagedList.length === 0
                  ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
                  : 'bg-[#800020] text-white hover:bg-[#600018] shadow-md'
              }`}
            >
              <Send size={15} />
              {isDispatched ? 'DISPATCHED & RELEASED' : 'APPROVE & DISPATCH SHORTLIST'}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Partner Selector Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
          <div className="bg-white border border-[#E5E3DB] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            <div className="bg-[#1E2E20] text-white p-4 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold">Add Governed Partner to Shortlist</h3>
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs font-mono text-[#8C8A7D]">
                Search verified, active, and concierge-routable partners ({getEligibleManualCandidates().length} eligible available).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                <div className="sm:col-span-2 relative">
                  <Search size={15} className="absolute left-3 top-3 text-[#8C8A7D]" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search by name, role, or location..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl focus:outline-none focus:border-[#1E2E20]"
                  />
                </div>

                <select
                  value={pickerTier}
                  onChange={(e) => setPickerTier(e.target.value as PartnerSuitabilityTier)}
                  className="p-2 bg-white border border-[#E5E3DB] rounded-xl font-bold text-[#1E2E20] focus:outline-none"
                >
                  <option value="PRIMARY">PRIMARY TIER</option>
                  <option value="SECONDARY">SECONDARY TIER</option>
                  <option value="TERTIARY">TERTIARY TIER</option>
                </select>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {getEligibleManualCandidates().length === 0 ? (
                  <p className="p-4 text-center text-xs font-mono text-[#8C8A7D]">
                    No eligible verified partners found matching query.
                  </p>
                ) : (
                  getEligibleManualCandidates().map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddManualPartner(p)}
                      className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl hover:border-[#1E2E20] hover:bg-white cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <h5 className="font-serif font-bold text-sm text-[#1E2E20] group-hover:text-[#800020] transition-colors">
                          {p.nameEn}
                        </h5>
                        <p className="text-xs text-[#8C8A7D] font-mono mt-0.5">
                          Role: {p.operationalRole || p.category} • {p.locationEn || 'Belgrade'}
                        </p>
                      </div>

                      <span className="px-3 py-1.5 bg-[#1E2E20] text-white text-[10px] font-mono font-bold rounded-lg uppercase group-hover:bg-[#800020] transition-colors">
                        STAGE
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
