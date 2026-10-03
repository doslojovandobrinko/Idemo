/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  X,
  Sliders,
  Layers,
  Sparkles,
  Info,
  ChevronUp,
  ChevronDown,
  Trash2,
  RefreshCw,
  Plus,
  RotateCcw,
  FileText,
  Search,
} from 'lucide-react';
import { Recommendation } from '../../types';
import {
  DayPlanDurationBucket,
  DayPlanComposerInput,
  ItineraryProposal,
  DayPlanStop,
  composeDayPlan,
  recalculateItineraryProposal,
  getPublishedRecommendationsInventory,
  isPublishedRecommendation,
} from '../../lib/idemo007v2/dayPlanComposer';
import { saveLocalStudioDraft } from '../../lib/recommendationWorkflowService';
import { DayPlanExportModal } from './DayPlanExportModal';

interface DayPlanComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated?: (plan: ItineraryProposal) => void;
}

export const DayPlanComposerModal: React.FC<DayPlanComposerModalProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
}) => {
  const [serviceAreaId, setServiceAreaId] = useState<string>('sa-serbia-belgrade');
  const [durationBucket, setDurationBucket] = useState<DayPlanDurationBucket>('HALF-DAY');
  const [orbitX, setOrbitX] = useState<number>(0.5);
  const [orbitY, setOrbitY] = useState<number>(0.5);
  const [budgetLevel, setBudgetLevel] = useState<'free' | 'low' | 'moderate' | 'high' | 'exclusive' | undefined>(undefined);
  const [customTitle, setCustomTitle] = useState<string>('');

  const [composedProposal, setComposedProposal] = useState<ItineraryProposal | null>(null);
  const [initialGeneratedProposal, setInitialGeneratedProposal] = useState<ItineraryProposal | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Picker Modal State for Replace / Add Stop
  const [pickerModal, setPickerModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'REPLACE';
    targetIndex?: number;
  }>({ isOpen: false, mode: 'ADD' });
  const [pickerSearch, setPickerSearch] = useState<string>('');

  if (!isOpen) return null;

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    const input: DayPlanComposerInput = {
      serviceAreaId,
      durationBucket,
      orbitX,
      orbitY,
      budgetLevel,
      curatorTitle: customTitle.trim() || undefined,
    };

    const proposal = composeDayPlan(input);
    setComposedProposal(proposal);
    setInitialGeneratedProposal(JSON.parse(JSON.stringify(proposal)));
  };

  // Curator Editing Actions
  const handleMoveStopUp = (index: number) => {
    if (!composedProposal || index <= 0) return;
    const newStops = [...composedProposal.stops];
    const temp = newStops[index - 1];
    newStops[index - 1] = newStops[index];
    newStops[index] = temp;

    const recalculated = recalculateItineraryProposal(composedProposal, newStops, budgetLevel);
    setComposedProposal(recalculated);
    setIsSaved(false);
  };

  const handleMoveStopDown = (index: number) => {
    if (!composedProposal || index >= composedProposal.stops.length - 1) return;
    const newStops = [...composedProposal.stops];
    const temp = newStops[index + 1];
    newStops[index + 1] = newStops[index];
    newStops[index] = temp;

    const recalculated = recalculateItineraryProposal(composedProposal, newStops, budgetLevel);
    setComposedProposal(recalculated);
    setIsSaved(false);
  };

  const handleRemoveStop = (index: number) => {
    if (!composedProposal) return;
    const newStops = composedProposal.stops.filter((_, idx) => idx !== index);
    const recalculated = recalculateItineraryProposal(composedProposal, newStops, budgetLevel);
    setComposedProposal(recalculated);
    setIsSaved(false);
  };

  const handleDurationChange = (index: number, newMins: number) => {
    if (!composedProposal) return;
    const clampedMins = Math.max(15, Math.min(300, newMins));
    const newStops = [...composedProposal.stops];
    newStops[index] = { ...newStops[index], recommendedDurationMinutes: clampedMins };

    const recalculated = recalculateItineraryProposal(composedProposal, newStops, budgetLevel);
    setComposedProposal(recalculated);
    setIsSaved(false);
  };

  const handleTitleChange = (newTitle: string) => {
    if (!composedProposal) return;
    setComposedProposal({ ...composedProposal, title: newTitle });
    setIsSaved(false);
  };

  const handleCuratorNotesChange = (notes: string) => {
    if (!composedProposal) return;
    setComposedProposal({ ...composedProposal, curatorNotes: notes });
    setIsSaved(false);
  };

  const handleRevertChanges = () => {
    if (!initialGeneratedProposal) return;
    setComposedProposal(JSON.parse(JSON.stringify(initialGeneratedProposal)));
    setIsSaved(false);
  };

  const handleOpenPicker = (mode: 'ADD' | 'REPLACE', targetIndex?: number) => {
    setPickerSearch('');
    setPickerModal({ isOpen: true, mode, targetIndex });
  };

  const handleSelectCandidate = (candidateRec: Recommendation) => {
    if (!composedProposal) return;

    if (pickerModal.mode === 'REPLACE' && pickerModal.targetIndex !== undefined) {
      const newStops = [...composedProposal.stops];
      newStops[pickerModal.targetIndex] = {
        ...newStops[pickerModal.targetIndex],
        recommendation: candidateRec,
      };
      const recalculated = recalculateItineraryProposal(composedProposal, newStops, budgetLevel);
      setComposedProposal(recalculated);
    } else if (pickerModal.mode === 'ADD') {
      const newStop: DayPlanStop = {
        stopOrder: composedProposal.stops.length + 1,
        recommendation: candidateRec,
        suggestedTimeSlot: '',
        recommendedDurationMinutes: candidateRec.recommendedVisitDuration || 45,
        travelFromPreviousKm: 0,
        travelFromPreviousMins: 0,
      };
      const newStops = [...composedProposal.stops, newStop];
      const recalculated = recalculateItineraryProposal(composedProposal, newStops, budgetLevel);
      setComposedProposal(recalculated);
    }

    setIsSaved(false);
    setPickerModal({ isOpen: false, mode: 'ADD' });
    setPickerSearch('');
  };

  const getEligibleCandidates = () => {
    if (!composedProposal) return [];
    const allInventory = getPublishedRecommendationsInventory();
    const existingStopIds = new Set(composedProposal.stops.map((s) => s.recommendation.id));

    if (pickerModal.mode === 'REPLACE' && pickerModal.targetIndex !== undefined) {
      const targetId = composedProposal.stops[pickerModal.targetIndex]?.recommendation.id;
      if (targetId) existingStopIds.delete(targetId);
    }

    return allInventory
      .filter((rec) => isPublishedRecommendation(rec))
      .filter((rec) => !existingStopIds.has(rec.id))
      .filter((rec) => {
        if (!pickerSearch.trim()) return true;
        const q = pickerSearch.toLowerCase();
        return (
          rec.title.toLowerCase().includes(q) ||
          rec.location.toLowerCase().includes(q) ||
          (rec.category && rec.category.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const saClean = serviceAreaId.replace('sa-serbia-', '').toLowerCase();
        const aSaMatch = (a.serviceAreaId || '').toLowerCase().includes(saClean) || a.location.toLowerCase().includes(saClean);
        const bSaMatch = (b.serviceAreaId || '').toLowerCase().includes(saClean) || b.location.toLowerCase().includes(saClean);
        if (aSaMatch && !bSaMatch) return -1;
        if (!aSaMatch && bSaMatch) return 1;
        return a.title.localeCompare(b.title);
      });
  };

  const handleSaveAsDraft = () => {
    if (!composedProposal) return;
    const draftProposal: ItineraryProposal = {
      ...composedProposal,
      publicationStatus: 'RESEARCH_CANDIDATE',
    };
    setComposedProposal(draftProposal);

    const planAsDraftRec: Partial<Recommendation> = {
      id: draftProposal.id,
      title: draftProposal.title,
      category: 'Travel' as any,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: `Curated ${draftProposal.durationBucket} Day-Plan containing ${draftProposal.stops.length} stops (${draftProposal.totalDurationMinutes} mins, ${draftProposal.totalDistanceKm} km total distance).`,
      longDescription: draftProposal.stops
        .map((s) => `Stop ${s.stopOrder} [${s.suggestedTimeSlot}]: ${s.recommendation.title}`)
        .join(' \n'),
      image: draftProposal.stops[0]?.recommendation.image || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1200',
      duration: draftProposal.durationBucket,
      travelTime: `${draftProposal.totalDurationMinutes} mins total`,
      location: serviceAreaId.replace('sa-serbia-', '').replace('-', ' ').toUpperCase(),
      estimatedCost: '$$$',
      preferredTransport: 'Taxi / Walking',
      serviceAreaId,
    };

    saveLocalStudioDraft(planAsDraftRec as any);
    setIsSaved(true);
    if (onPlanCreated) onPlanCreated(draftProposal);
  };

  const handleApproveAndSave = () => {
    if (!composedProposal) return;
    const approvedProposal: ItineraryProposal = {
      ...composedProposal,
      publicationStatus: 'APPROVED',
    };
    setComposedProposal(approvedProposal);

    const planAsDraftRec: Partial<Recommendation> = {
      id: approvedProposal.id,
      title: approvedProposal.title,
      category: 'Travel' as any,
      publicationStatus: 'PUBLISHED',
      shortDescription: `Curated ${approvedProposal.durationBucket} Day-Plan containing ${approvedProposal.stops.length} stops (${approvedProposal.totalDurationMinutes} mins, ${approvedProposal.totalDistanceKm} km total distance).`,
      longDescription: approvedProposal.stops
        .map((s) => `Stop ${s.stopOrder} [${s.suggestedTimeSlot}]: ${s.recommendation.title}`)
        .join(' \n'),
      image: approvedProposal.stops[0]?.recommendation.image || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1200',
      duration: approvedProposal.durationBucket,
      travelTime: `${approvedProposal.totalDurationMinutes} mins total`,
      location: serviceAreaId.replace('sa-serbia-', '').replace('-', ' ').toUpperCase(),
      estimatedCost: '$$$',
      preferredTransport: 'Taxi / Walking',
      serviceAreaId,
    };

    saveLocalStudioDraft(planAsDraftRec as any);
    setIsSaved(true);
    if (onPlanCreated) onPlanCreated(approvedProposal);
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#E5E3DB] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="bg-[#1E2E20] text-white p-5 flex items-center justify-between border-b border-[#E5E3DB]">
          <div className="flex items-center gap-2">
            <Compass className="text-[#C5A059]" size={20} />
            <div>
              <h2 className="font-serif text-lg font-bold">Studio Day-Plan Composer & Curator Editor</h2>
              <p className="text-xs text-white/70 font-mono">
                Deterministic Itinerary Synthesis & Curator Controls (0 External API Calls)
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

        {/* Form Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleCompose} className="space-y-4 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E5E3DB]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {/* Service Area */}
              <div>
                <label className="font-bold text-[#1E2E20] block mb-1">Target Service Area:</label>
                <select
                  value={serviceAreaId}
                  onChange={(e) => setServiceAreaId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E5E3DB] rounded-xl focus:outline-none focus:border-[#23251E]"
                >
                  <option value="sa-serbia-belgrade">Belgrade Core & Surrounds</option>
                  <option value="sa-serbia-novisad">Novi Sad & Fruška Gora</option>
                  <option value="sa-serbia-nis">Niš & Southern Monasteries</option>
                  <option value="sa-serbia-zlatibor">Zlatibor & Western Highlands</option>
                </select>
              </div>

              {/* Duration Bucket */}
              <div>
                <label className="font-bold text-[#1E2E20] block mb-1">Duration Bucket:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['2-3 HOURS', 'HALF-DAY', 'FULL-DAY'] as DayPlanDurationBucket[]).map((bucket) => (
                    <button
                      key={bucket}
                      type="button"
                      onClick={() => setDurationBucket(bucket)}
                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        durationBucket === bucket
                          ? 'bg-[#1E2E20] text-white border-[#1E2E20]'
                          : 'bg-white text-[#1E2E20] border-[#E5E3DB] hover:border-[#1E2E20]'
                      }`}
                    >
                      {bucket}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Title */}
            <div className="text-xs font-mono">
              <label className="font-bold text-[#1E2E20] block mb-1">Custom Title (Optional):</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Belgrade Skadarlija & Fortress Express Day-Plan"
                className="w-full p-2.5 bg-white border border-[#E5E3DB] rounded-xl font-sans focus:outline-none focus:border-[#23251E]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#800020] text-white font-mono text-xs font-bold rounded-xl hover:bg-[#600018] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Compose Itinerary Proposal
            </button>
          </form>

          {/* Composed Proposal Output & Curator Editor */}
          {composedProposal && (
            <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-5 font-sans shadow-2xs">
              {/* Proposal Header & Editable Title */}
              <div className="space-y-2 border-b border-[#E5E3DB] pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 font-mono text-xs">
                    <label className="font-bold text-[#8C8A7D] block mb-1 text-[10px] uppercase tracking-wider">
                      Itinerary Title (Editable):
                    </label>
                    <input
                      type="text"
                      value={composedProposal.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full p-2 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl font-serif text-lg font-bold text-[#1E2E20] focus:outline-none focus:border-[#1E2E20]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end pb-0.5">
                    {initialGeneratedProposal && (
                      <button
                        type="button"
                        onClick={handleRevertChanges}
                        title="Revert to original generated proposal"
                        className="p-2 rounded-xl bg-[#FAF9F5] text-[#1E2E20] border border-[#E5E3DB] hover:bg-[#E5E3DB] font-mono text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <RotateCcw size={14} />
                        <span className="hidden sm:inline">REVERT</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#8C8A7D] font-mono pt-1">
                  <div className="flex items-center gap-3">
                    <span>⏱️ Total Duration: <strong>{composedProposal.totalDurationMinutes} mins</strong></span>
                    <span>📍 Estimated Transit: <strong>{composedProposal.totalDistanceKm} km</strong></span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {composedProposal.feasibilityResult?.feasible ? (
                      <span className="px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] font-mono text-xs font-bold uppercase flex items-center gap-1">
                        <ShieldCheck size={14} /> FEASIBLE
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] font-mono text-xs font-bold uppercase flex items-center gap-1">
                        <AlertTriangle size={14} /> REVIEW NEEDED
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-[#FAF9F5] text-[#1E2E20] border border-[#E5E3DB] font-mono text-xs font-bold uppercase">
                      {composedProposal.stops.length} STOPS
                    </span>
                  </div>
                </div>
              </div>

              {/* Advisory Feasibility Warnings Box */}
              {composedProposal.feasibilityResult && composedProposal.feasibilityResult.warnings.length > 0 && (
                <div className="p-3 bg-[#FFF8E1] border border-[#FFE082] rounded-xl space-y-1.5 font-mono text-xs text-[#795548]">
                  <div className="flex items-center gap-1.5 font-bold text-[#E65100]">
                    <AlertTriangle size={15} />
                    <span>Advisory Feasibility Warnings ({composedProposal.feasibilityResult.warnings.length})</span>
                  </div>
                  <ul className="space-y-1 text-[11px] list-disc list-inside">
                    {composedProposal.feasibilityResult.warnings.map((w, idx) => (
                      <li key={idx} className="leading-tight">
                        {w.message}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] italic text-[#8C8A7D] pt-1 border-t border-[#FFE082]/60">
                    Advisory Feasibility Notice — Curator retains final authority to approve or edit itinerary.
                  </p>
                </div>
              )}

              {/* Editable Stops List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-xs border-b border-[#E5E3DB] pb-1.5">
                  <span className="font-bold text-[#1E2E20] uppercase tracking-wider text-[11px]">
                    Curator Itinerary Sequence ({composedProposal.stops.length} Stops)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenPicker('ADD')}
                    className="px-2.5 py-1 bg-[#1E2E20] text-white rounded-lg font-mono text-[11px] font-bold flex items-center gap-1 hover:bg-[#2e4030] cursor-pointer transition-all"
                  >
                    <Plus size={13} /> ADD STOP
                  </button>
                </div>

                {composedProposal.stops.map((stop, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === composedProposal.stops.length - 1;

                  return (
                    <div key={stop.stopOrder} className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl space-y-2">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-bold text-[#1E2E20] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#1E2E20] text-white text-[10px]">
                            STOP {stop.stopOrder}
                          </span>
                          <span>{stop.suggestedTimeSlot}</span>
                        </span>

                        {stop.travelFromPreviousKm > 0 && (
                          <span className="text-[10px] text-[#8C8A7D]">
                            🚗 +{stop.travelFromPreviousKm} km (~{stop.travelFromPreviousMins} mins transit)
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-serif font-bold text-sm text-[#1E2E20]">{stop.recommendation.title}</h4>
                          <p className="text-xs text-[#8C8A7D] mt-0.5">
                            📍 {stop.recommendation.location} • {stop.recommendation.category}
                          </p>
                        </div>

                        {/* Experience Duration Input */}
                        <div className="flex items-center gap-1 font-mono text-xs shrink-0 bg-white p-1.5 rounded-lg border border-[#E5E3DB]">
                          <Clock size={13} className="text-[#8C8A7D]" />
                          <label className="text-[10px] text-[#8C8A7D] font-bold">Visit:</label>
                          <input
                            type="number"
                            min={15}
                            max={300}
                            step={15}
                            value={stop.recommendedDurationMinutes}
                            onChange={(e) => handleDurationChange(idx, parseInt(e.target.value) || 15)}
                            className="w-12 p-0.5 text-center font-bold text-[#1E2E20] border-b border-[#1E2E20] focus:outline-none"
                          />
                          <span className="text-[10px] text-[#8C8A7D]">m</span>
                        </div>
                      </div>

                      {/* Curator Action Toolbar for this Stop */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E3DB]/70 font-mono text-xs">
                        <div className="flex items-center gap-1">
                          {!isFirst && (
                            <button
                              type="button"
                              onClick={() => handleMoveStopUp(idx)}
                              title="Move Stop Up"
                              className="px-2 py-1 bg-white border border-[#E5E3DB] rounded hover:bg-[#E5E3DB] text-[#1E2E20] flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                            >
                              <ChevronUp size={12} /> UP
                            </button>
                          )}
                          {!isLast && (
                            <button
                              type="button"
                              onClick={() => handleMoveStopDown(idx)}
                              title="Move Stop Down"
                              className="px-2 py-1 bg-white border border-[#E5E3DB] rounded hover:bg-[#E5E3DB] text-[#1E2E20] flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                            >
                              <ChevronDown size={12} /> DOWN
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPicker('REPLACE', idx)}
                            title="Replace this stop with another published recommendation"
                            className="px-2 py-1 bg-white border border-[#E5E3DB] rounded hover:bg-[#E5E3DB] text-[#1E2E20] flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                          >
                            <RefreshCw size={12} /> REPLACE
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(idx)}
                            title="Remove this stop from itinerary"
                            className="px-2 py-1 bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] rounded hover:bg-[#FFCDD2] flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                          >
                            <Trash2 size={12} /> REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Editable Curator Notes Textarea */}
              <div className="font-mono text-xs space-y-1 border-t border-[#E5E3DB] pt-3">
                <label className="font-bold text-[#1E2E20] block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-[#800020]" /> Curator Editorial Notes:
                </label>
                <textarea
                  rows={2}
                  value={composedProposal.curatorNotes || ''}
                  onChange={(e) => handleCuratorNotesChange(e.target.value)}
                  placeholder="Add editorial context or special instructions for travelers..."
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl font-sans text-xs focus:outline-none focus:border-[#1E2E20]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-between border-t border-[#E5E3DB] gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold border border-[#1E2E20] text-[#1E2E20] hover:bg-[#FAF9F5] transition-all cursor-pointer"
                >
                  SAVE AS DRAFT
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveAndSave}
                    disabled={isSaved}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                        : 'bg-[#2E7D32] text-white hover:bg-[#1b5e20] shadow-md'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {isSaved ? 'APPROVED & SAVED TO DRAFTS' : 'APPROVE & SAVE ITINERARY'}
                  </button>

                  {composedProposal?.publicationStatus === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-[#1E2E20] text-white hover:bg-[#2D4230] flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Compass size={16} className="text-[#C5A059]" />
                      EXPORT HANDOFF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Published Recommendation Picker Modal (for Replace / Add Stop) */}
      {pickerModal.isOpen && (
        <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#E5E3DB] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0">
            <div className="bg-[#1E2E20] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="text-[#C5A059]" size={18} />
                <h3 className="font-serif text-base font-bold">
                  {pickerModal.mode === 'REPLACE' ? 'Replace Stop Recommendation' : 'Add Stop Recommendation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPickerModal({ isOpen: false, mode: 'ADD' })}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
              <p className="text-xs text-[#8C8A7D] font-mono">
                Select from published / canonical recommendations ({getEligibleCandidates().length} eligible items available).
              </p>

              <div className="relative font-mono text-xs">
                <Search size={15} className="absolute left-3 top-3 text-[#8C8A7D]" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Filter by title, category, or location..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl focus:outline-none focus:border-[#1E2E20]"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {getEligibleCandidates().length === 0 ? (
                  <p className="p-4 text-center text-xs font-mono text-[#8C8A7D]">
                    No eligible published recommendations found matching filter.
                  </p>
                ) : (
                  getEligibleCandidates().map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => handleSelectCandidate(rec)}
                      className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl hover:border-[#1E2E20] hover:bg-white cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <h5 className="font-serif font-bold text-sm text-[#1E2E20] group-hover:text-[#800020] transition-colors">
                          {rec.title}
                        </h5>
                        <p className="text-xs text-[#8C8A7D] mt-0.5 font-mono">
                          📍 {rec.location} • {rec.category} • {rec.duration || '1-2 hours'}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 bg-[#1E2E20] text-white text-[10px] font-mono font-bold rounded-lg shrink-0 uppercase tracking-wider group-hover:bg-[#800020] transition-colors">
                        SELECT
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Day Plan Export Modal */}
      <DayPlanExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        proposal={composedProposal}
      />
    </div>
  );
};
