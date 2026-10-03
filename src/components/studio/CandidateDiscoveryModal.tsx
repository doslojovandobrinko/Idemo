/**
 * IDEMO Studio - Candidate Research & FactPack Seeding Agent UI Modal
 * Allows curators to input region + category + subtype and discover RESEARCH_CANDIDATE drafts.
 * Curator inspects and selects candidates to advance to the Recommendations Desk.
 */

import React, { useState } from 'react';
import { Sparkles, X, Search, CheckSquare, Square, MapPin, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import { discoverResearchCandidates, DiscoveredCandidate, CandidateDiscoveryOutput } from '../../lib/idemo007v2/candidateDiscoveryEngine';
import { validateCandidatePromotion, promoteCandidate } from '../../lib/idemo007v2/candidatePromotionGate';
import { saveLocalStudioDraft } from '../../lib/recommendationWorkflowService';
import { Recommendation, Category } from '../../types';

interface CandidateDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRecommendations?: Recommendation[];
  onAdvanceCandidates: (newRecommendations: Recommendation[]) => void;
}

const CATEGORY_OPTIONS = [
  { label: 'Place / Landmark', value: 'PLACE' },
  { label: 'Accommodation / Stay', value: 'ACCOMMODATION' },
  { label: 'Restaurant / Gastronomy', value: 'RESTAURANT' },
  { label: 'Guide / Heritage', value: 'GUIDE' },
  { label: 'Transport / Transit', value: 'TRANSPORT' },
  { label: 'Experience / Winery / Nature', value: 'EXPERIENCE_PROVIDER' },
];

export const CandidateDiscoveryModal: React.FC<CandidateDiscoveryModalProps> = ({
  isOpen,
  onClose,
  existingRecommendations = [],
  onAdvanceCandidates,
}) => {
  const [intakeMode, setIntakeMode] = useState<'DISCOVERY' | 'EXACT_PROPOSITION'>('DISCOVERY');
  const [region, setRegion] = useState('');
  const [exactProposition, setExactProposition] = useState('');
  const [category, setCategory] = useState('PLACE');
  const [subtype, setSubtype] = useState('');
  const [maxCandidates, setMaxCandidates] = useState(5);

  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<CandidateDiscoveryOutput | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [unresolvedAcks, setUnresolvedAcks] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (intakeMode === 'DISCOVERY' && !region.trim()) {
      setErrorMsg('Please specify a target region or location (e.g. Fruška Gora, Belgrade, Tara).');
      return;
    }
    if (intakeMode === 'EXACT_PROPOSITION' && !exactProposition.trim()) {
      setErrorMsg('Please enter an exact proposition (e.g. "Pršutijada, Mačkat", "Žestival, Užice").');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    setDiscoveryResult(null);

    try {
      const existingEntities = existingRecommendations.map((r) => ({
        canonicalName: r.title,
        location: r.location,
      }));

      const res = await discoverResearchCandidates({
        mode: intakeMode,
        exactProposition: intakeMode === 'EXACT_PROPOSITION' ? exactProposition.trim() : undefined,
        region: region.trim() || undefined,
        category,
        subtype: subtype.trim() || undefined,
        maxCandidates,
        existingEntities,
      });

      if (!res.success && res.reason) {
        setErrorMsg(`Research run failed: ${res.reason}`);
      } else {
        setDiscoveryResult(res);
        // Select all discovered candidates by default
        const allIds = new Set((res.candidates || []).map((c) => c.id));
        setSelectedCandidateIds(allIds);
      }
    } catch (err: any) {
      setErrorMsg(`Research error: ${err?.message || String(err)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!discoveryResult) return;
    if (selectedCandidateIds.size === discoveryResult.candidates.length) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(discoveryResult.candidates.map((c) => c.id)));
    }
  };

  const handleAdvanceSelected = () => {
    if (!discoveryResult || selectedCandidateIds.size === 0) return;

    const selectedList = discoveryResult.candidates.filter((c) => selectedCandidateIds.has(c.id));

    // Validate all selected candidates first before promotion
    for (const cand of selectedList) {
      const isAck = Boolean(unresolvedAcks[cand.id]);
      const val = validateCandidatePromotion(cand, { locationAcknowledged: isAck });
      if (!val.eligible) {
        setErrorMsg(`Cannot promote candidate "${cand.canonicalName}": ${val.blockingReasons.join(', ')}`);
        return;
      }
    }

    const newRecs: Recommendation[] = selectedList.map((cand) => {
      const isAck = Boolean(unresolvedAcks[cand.id]);
      const promotedCand = promoteCandidate(cand, { locationAcknowledged: isAck });

      const recId = `rec-draft-cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const recCategory =
        promotedCand.entityType === 'ACCOMMODATION' || promotedCand.entityType === 'TRANSPORT'
          ? Category.TRAVEL
          : promotedCand.entityType === 'RESTAURANT'
          ? Category.GASTRONOMY
          : promotedCand.entityType === 'GUIDE'
          ? Category.HISTORY
          : Category.NATURE;

      const rec: Recommendation = {
        id: recId,
        title: promotedCand.canonicalName,
        category: recCategory,
        location: promotedCand.location,
        shortDescription: promotedCand.summaryNote || `Promoted candidate entity in ${promotedCand.location}.`,
        longDescription: `Promoted candidate entity "${promotedCand.canonicalName}" (${promotedCand.subtype || promotedCand.entityType}) located in ${promotedCand.location}. Verified by curator and promoted for Agent 007 synthesis.`,
        image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1200',
        duration: '1-2 hours',
        travelTime: '30 mins',
        travelTimeMinutes: 30,
        estimatedCost: 'Standard',
        preferredTransport: 'Taxi / Drive',
        coordinates: promotedCand.coordinates || undefined,
        publicationStatus: 'PROMOTED',
        serviceAreaId: 'sa-serbia-belgrade',
      };

      // Persist to local drafts
      try {
        saveLocalStudioDraft(rec);
      } catch (err) {
        console.warn('[CandidateDiscoveryModal] Failed to save draft:', err);
      }

      return rec;
    });

    onAdvanceCandidates(newRecs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-3xl bg-white border border-[#E5E3DB] rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#23251E] text-white p-5 px-6 flex items-center justify-between border-b border-[#32352B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#C5A059]">
              <Compass size={20} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold block">
                CANDIDATE RESEARCH & FACTPACK SEEDING AGENT
              </span>
              <h2 className="font-serif text-lg font-bold text-white leading-tight">
                Neutral Candidate Discovery
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Governance Notice */}
          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl flex items-start gap-3 text-xs text-[#57534E]">
            <ShieldCheck size={18} className="text-[#C5A059] shrink-0 mt-0.5" />
            <div className="space-y-0.5 font-mono text-[11px]">
              <span className="font-bold text-[#1E2E20] block">HUMAN-IN-THE-LOOP SEEDING GUARANTEE</span>
              <p className="leading-tight text-[#8C8A7D]">
                Generates neutral RESEARCH_CANDIDATE drafts using 1 grounded search call and Maps resolution. No automatic publication or recommendation creation occurs without explicit curator approval.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs font-mono text-[#C62828] flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Intake Mode Switcher Tabs */}
          <div className="flex border-b border-[#E5E3DB] pb-1 gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setIntakeMode('DISCOVERY');
                setErrorMsg(null);
              }}
              className={`px-4 py-2 rounded-t-xl font-bold uppercase transition-colors cursor-pointer ${
                intakeMode === 'DISCOVERY'
                  ? 'bg-[#23251E] text-[#C5A059] border-b-2 border-[#C5A059]'
                  : 'bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20]'
              }`}
            >
              1. Discovery Mode (Broad Search)
            </button>
            <button
              type="button"
              onClick={() => {
                setIntakeMode('EXACT_PROPOSITION');
                setErrorMsg(null);
              }}
              className={`px-4 py-2 rounded-t-xl font-bold uppercase transition-colors cursor-pointer ${
                intakeMode === 'EXACT_PROPOSITION'
                  ? 'bg-[#23251E] text-[#C5A059] border-b-2 border-[#C5A059]'
                  : 'bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20]'
              }`}
            >
              2. Exact Proposition Mode (Curator Specific)
            </button>
          </div>

          {/* Search Inputs */}
          <form onSubmit={handleRunDiscovery} className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
            {intakeMode === 'EXACT_PROPOSITION' ? (
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Exact Curator Proposition *
                  </label>
                  <input
                    type="text"
                    required
                    value={exactProposition}
                    onChange={(e) => setExactProposition(e.target.value)}
                    placeholder="e.g. 'Pršutijada, Mačkat' or 'Žestival, Užice'"
                    className="w-full h-10 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                  />
                  <span className="font-mono text-[10px] text-[#8C8A7D] block mt-1">
                    Bypasses broad discovery. Resolves exact event/place identity and builds seeded FactPack.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Region / Location Hint (Optional)
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Zlatibor, Užice, Western Serbia"
                      className="w-full h-10 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Target Region / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Fruška Gora, Subotica, Zlatibor, Zemun"
                      className="w-full h-10 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Subtype Filter (Optional)
                    </label>
                    <input
                      type="text"
                      value={subtype}
                      onChange={(e) => setSubtype(e.target.value)}
                      placeholder="e.g. Monastery, Winery, Traditional Kafana, Hiking Trail"
                      className="w-full h-10 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Max Candidates (1-10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxCandidates}
                      onChange={(e) => setMaxCandidates(Math.min(Math.max(1, parseInt(e.target.value) || 5), 10))}
                      className="w-full h-10 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-[10px] text-[#8C8A7D]">
                Grounded Search Budget: Strictly 1 call • {intakeMode === 'EXACT_PROPOSITION' ? 'Targeted verification' : 'Neutral discovery'}
              </span>
              <button
                type="submit"
                disabled={isSearching || (intakeMode === 'DISCOVERY' ? !region.trim() : !exactProposition.trim())}
                className="px-5 py-2 rounded-xl bg-[#23251E] hover:bg-[#32352B] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#C5A059]" />
                    <span>Resolving & Seeding...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} className="text-[#C5A059]" />
                    <span>{intakeMode === 'EXACT_PROPOSITION' ? 'Resolve Proposition' : 'Discover Candidates'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Discovery Results View */}
          {discoveryResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#1E2E20]">
                    {discoveryResult.mode === 'EXACT_PROPOSITION'
                      ? `Resolved Proposition Candidate (${discoveryResult.candidates.length})`
                      : `Discovered ${discoveryResult.discoveredCount} Candidates in ${discoveryResult.region}`}
                  </h3>
                  <p className="font-mono text-[11px] text-[#8C8A7D]">
                    Mode: <strong className="text-[#1E2E20]">{discoveryResult.mode}</strong> • Search calls: {discoveryResult.searchCallCount} • Deduplicated: {discoveryResult.deduplicatedCount}
                  </p>
                </div>

                {discoveryResult.candidates.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="font-mono text-xs font-bold text-[#8A1F1F] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    {selectedCandidateIds.size === discoveryResult.candidates.length ? (
                      <CheckSquare size={14} />
                    ) : (
                      <Square size={14} />
                    )}
                    <span>
                      {selectedCandidateIds.size === discoveryResult.candidates.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                )}
              </div>

              {discoveryResult.candidates.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl font-mono text-xs text-[#8C8A7D]">
                  No new research candidates found matching criteria or candidate was deduplicated.
                </div>
              ) : (
                <div className="space-y-3">
                  {discoveryResult.candidates.map((cand) => {
                    const isSelected = selectedCandidateIds.has(cand.id);
                    const isVerifiedLoc = cand.locationResolutionStatus === 'VERIFIED';

                    return (
                      <div
                        key={cand.id}
                        onClick={() => toggleSelectCandidate(cand.id)}
                        className={`p-4 border rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-white border-[#1E2E20] shadow-sm'
                            : 'bg-[#FAF9F5] border-[#E5E3DB] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-[#1E2E20] hover:text-[#C5A059] transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-[#1E2E20]" />
                          ) : (
                            <Square size={18} className="text-[#8C8A7D]" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-serif font-bold text-sm text-[#1E2E20] truncate">
                              {cand.canonicalName}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold border ${
                                  isVerifiedLoc
                                    ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
                                    : 'bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]'
                                }`}
                              >
                                {isVerifiedLoc ? 'MAPS VERIFIED' : 'MAPS UNRESOLVED'}
                              </span>
                              <span className="px-2 py-0.5 bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082] rounded-md font-mono text-[9px] uppercase font-bold">
                                {cand.verificationStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 font-mono text-[11px] text-[#8C8A7D]">
                            <span className="font-bold text-[#8A1F1F] uppercase">{cand.entityType}</span>
                            <span>•</span>
                            <span>{cand.subtype || 'General'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-[#C5A059]" />
                              {cand.location}
                            </span>
                          </div>

                          {cand.summaryNote && (
                            <p className="text-xs text-[#57534E] leading-relaxed pt-1">
                              {cand.summaryNote}
                            </p>
                          )}

                          <div className="pt-1.5 flex items-center gap-4 font-mono text-[10px] text-[#8C8A7D]">
                            <span>
                              Coordinates:{' '}
                              <strong className={isVerifiedLoc ? 'text-[#1E2E20]' : 'text-[#E65100]'}>
                                {cand.coordinates
                                  ? `${cand.coordinates.lat.toFixed(4)}, ${cand.coordinates.lng.toFixed(4)}`
                                  : 'Unresolved (No Regional Substitution)'}
                              </strong>
                            </span>
                            <span>
                              FactPack Facts:{' '}
                              <strong className="text-[#1E2E20]">
                                {cand.factPack?.facts?.length || 0}
                              </strong>
                            </span>
                          </div>

                          {!isVerifiedLoc && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2.5 p-3 bg-[#FFF3E0] border border-[#FFE082] rounded-xl flex items-start gap-2.5 font-mono text-[11px] text-[#E65100]"
                            >
                              <input
                                type="checkbox"
                                id={`ack-${cand.id}`}
                                checked={Boolean(unresolvedAcks[cand.id])}
                                onChange={(e) => {
                                  setUnresolvedAcks((prev) => ({
                                    ...prev,
                                    [cand.id]: e.target.checked,
                                  }));
                                }}
                                className="mt-0.5 rounded border-[#FFCC80] text-[#E65100] focus:ring-0 cursor-pointer"
                              />
                              <label htmlFor={`ack-${cand.id}`} className="cursor-pointer leading-tight select-none">
                                <strong>Location remains unresolved.</strong> Google Maps could not verify an exact location. No substitute coordinates were assigned. I understand and want to promote this candidate with unresolved location data.
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#FAF9F5] border-t border-[#E5E3DB] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E3DB] font-mono text-xs uppercase font-bold text-[#8C8A7D] hover:text-[#1E2E20] cursor-pointer"
          >
            Close
          </button>

          {discoveryResult && discoveryResult.candidates.length > 0 && (
            <button
              type="button"
              onClick={handleAdvanceSelected}
              disabled={selectedCandidateIds.size === 0}
              className="px-6 py-2 rounded-xl bg-[#23251E] hover:bg-[#32352B] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <CheckCircle2 size={15} className="text-[#C5A059]" />
              <span>PROMOTE {selectedCandidateIds.size} TO AGENT 007</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
