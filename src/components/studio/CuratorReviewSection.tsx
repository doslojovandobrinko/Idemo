/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Check,
  X,
  Info,
} from 'lucide-react';
import { Recommendation } from '../../types';
import {
  PublicationValidationResult,
  CuratorOverride,
  FinalPublicationDecision,
  PublicationBlockingReason,
  CanonicalRecommendation,
  GovernedSynthesisInput,
} from '../../types/idemo007v2';
import { validateCanonicalRecommendationForPublication } from '../../lib/idemo007v2/publicationGate';
import { resolveFinalPublicationDecision } from '../../lib/idemo007v2/curatorAuthority';

export interface CuratorReviewSectionProps {
  recommendation: Partial<Recommendation>;
  governedInput?: GovernedSynthesisInput;
  onUpdateCuratorDecision?: (override: CuratorOverride, finalDecision: FinalPublicationDecision) => void;
}

const BLOCKING_REASON_EXPLANATIONS: Record<PublicationBlockingReason, string> = {
  MISSING_IDENTITY: 'Missing canonical recommendation ID, title, or category.',
  MISSING_REQUIRED_EDITORIAL_CONTENT: 'Missing required short description or summary in English/Serbian.',
  INVALID_LOCATION_STATE: 'Unresolved location contains non-null coordinates or verified Maps Place ID.',
  INVALID_PROVENANCE: 'Missing valid source provenance metadata.',
  PROHIBITED_RAW_PAYLOAD: 'Contains raw search or LLM debug payloads in publishable output.',
  INVALID_PUBLICATION_STATUS: 'Publication status value is not in allowed canonical set.',
};

export const CuratorReviewSection: React.FC<CuratorReviewSectionProps> = ({
  recommendation,
  governedInput,
  onUpdateCuratorDecision,
}) => {
  const [showFactsAccordion, setShowFactsAccordion] = useState(false);

  // Consume existing publicationValidation directly from domain layer or fallback to strongly typed gate execution for legacy recommendations pre-dating Slice 4.5
  const pubValidation: PublicationValidationResult =
    recommendation.publicationValidation ||
    validateCanonicalRecommendationForPublication(recommendation as CanonicalRecommendation, governedInput);

  // Manage current curator override state
  const [currentOverride, setCurrentOverride] = useState<CuratorOverride | undefined>(
    recommendation.curatorOverride
  );

  const [reasonText, setReasonText] = useState<string>(
    recommendation.curatorOverride?.reason || ''
  );

  // Resolve final decision using domain authority function
  const finalDecision: FinalPublicationDecision = resolveFinalPublicationDecision(
    pubValidation,
    currentOverride
  );

  const handleDecisionClick = (decision: 'APPROVE' | 'REJECT') => {
    const timestamp = new Date().toISOString();
    const newOverride: CuratorOverride = {
      decision,
      reason: reasonText.trim() || undefined,
      decidedAt: timestamp,
      curatorId: 'curator-007',
    };

    setCurrentOverride(newOverride);
    const updatedFinal = resolveFinalPublicationDecision(pubValidation, newOverride);

    if (onUpdateCuratorDecision) {
      onUpdateCuratorDecision(newOverride, updatedFinal);
    }
  };

  const handleReasonBlur = () => {
    if (!currentOverride) return;
    const updatedOverride: CuratorOverride = {
      ...currentOverride,
      reason: reasonText.trim() || undefined,
      decidedAt: new Date().toISOString(),
    };
    setCurrentOverride(updatedOverride);
    const updatedFinal = resolveFinalPublicationDecision(pubValidation, updatedOverride);
    if (onUpdateCuratorDecision) {
      onUpdateCuratorDecision(updatedOverride, updatedFinal);
    }
  };

  const isApproved = currentOverride?.decision === 'APPROVE';
  const isRejected = currentOverride?.decision === 'REJECT';

  return (
    <div className="space-y-6 font-sans">
      {/* 1. RECOMMENDATION PREVIEW SUMMARY */}
      <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
          <span className="font-mono text-xs font-bold text-[#1E2E20] uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-[#C5A059]" />
            Canonical Recommendation Preview
          </span>
          <span className="font-mono text-[10px] text-[#8C8A7D]">
            ID: {recommendation.id || 'N/A'}
          </span>
        </div>

        <div>
          <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
            {recommendation.title || (recommendation as any).titleEn || 'Untitled Recommendation'}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#8C8A7D] font-mono">
            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E3DB] font-bold text-[#1E2E20]">
              {recommendation.category || 'General'}
            </span>
            <span>📍 {recommendation.location || (recommendation as any).locationEn || 'Serbia'}</span>
          </div>
        </div>

        <p className="text-xs text-[#1E2E20] leading-relaxed bg-white p-3 rounded-xl border border-[#E5E3DB]">
          {recommendation.shortDescription || (recommendation as any).shortDescriptionEn || 'No short description provided.'}
        </p>
      </div>

      {/* 2. AUTOMATED GOVERNANCE SECTION */}
      <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#800020]" />
            <span className="font-mono text-xs font-bold text-[#1E2E20] uppercase tracking-wider">
              Automated Governance
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#8C8A7D]">Result:</span>
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase text-[11px] flex items-center gap-1 ${
                pubValidation.publishable
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                  : 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
              }`}
            >
              {pubValidation.publishable ? (
                <>
                  <CheckCircle2 size={13} /> PASS
                </>
              ) : (
                <>
                  <XCircle size={13} /> BLOCKED
                </>
              )}
            </span>
          </div>
        </div>

        {/* Blocking Reasons List if BLOCKED */}
        {!pubValidation.publishable && pubValidation.blockingReasons.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#C62828] uppercase block">
              Automated Blocking Reasons ({pubValidation.blockingReasons.length}):
            </span>
            <div className="space-y-2">
              {pubValidation.blockingReasons.map((reason) => (
                <div
                  key={reason}
                  className="p-3 rounded-xl bg-[#FFEBEE]/60 border border-[#FFCDD2] flex items-start gap-2 text-xs"
                >
                  <AlertTriangle size={15} className="text-[#C62828] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-[#C62828] text-[11px]">
                      {reason}
                    </span>
                    <p className="text-[#1E2E20]">
                      {BLOCKING_REASON_EXPLANATIONS[reason] || 'Automated publication constraint violated.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pubValidation.publishable && (
          <div className="p-3 bg-[#E8F5E9]/50 border border-[#C8E6C9] rounded-xl text-xs text-[#2E7D32] flex items-center gap-2 font-mono">
            <CheckCircle2 size={15} />
            <span>All automated publication governance invariants passed successfully.</span>
          </div>
        )}
      </div>

      {/* 3. CURATOR FINAL DECISION SECTION */}
      <div className="p-5 bg-[#FAF9F5] border border-[#C5A059]/40 rounded-2xl space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#C5A059]" />
            <span className="font-mono text-xs font-bold text-[#1E2E20] uppercase tracking-wider">
              Curator Final Decision
            </span>
          </div>

          <span className="font-mono text-[10px] text-[#8C8A7D] uppercase font-bold px-2 py-0.5 rounded bg-white border border-[#E5E3DB]">
            Final Authority
          </span>
        </div>

        {/* Action Buttons: APPROVE & REJECT */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleDecisionClick('APPROVE')}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isApproved
                ? 'bg-[#2E7D32] text-white shadow-md ring-2 ring-[#2E7D32]/30'
                : 'bg-white text-[#2E7D32] border border-[#2E7D32]/40 hover:bg-[#E8F5E9]'
            }`}
          >
            <Check size={16} />
            APPROVE
          </button>

          <button
            type="button"
            onClick={() => handleDecisionClick('REJECT')}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isRejected
                ? 'bg-[#C62828] text-white shadow-md ring-2 ring-[#C62828]/30'
                : 'bg-white text-[#C62828] border border-[#C62828]/40 hover:bg-[#FFEBEE]'
            }`}
          >
            <X size={16} />
            REJECT
          </button>

          {currentOverride && (
            <button
              type="button"
              onClick={() => {
                setCurrentOverride(undefined);
                setReasonText('');
                const resetFinal = resolveFinalPublicationDecision(pubValidation, undefined);
                if (onUpdateCuratorDecision) {
                  onUpdateCuratorDecision(undefined as any, resetFinal);
                }
              }}
              className="text-xs text-[#8C8A7D] hover:text-[#1E2E20] font-mono underline ml-auto cursor-pointer"
            >
              Reset to Automated Default
            </button>
          )}
        </div>

        {/* Reason Input */}
        <div className="space-y-1">
          <label className="font-mono text-[11px] font-bold text-[#1E2E20] block">
            Reason / note (optional):
          </label>
          <input
            type="text"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            onBlur={handleReasonBlur}
            placeholder="e.g. Manually verified with monastery authority or temporary maintenance closure..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] bg-white text-xs text-[#1E2E20] focus:outline-none focus:border-[#23251E] font-sans"
          />
        </div>

        {/* Effective Decision Status Output */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E3DB] space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#8C8A7D]">Effective Final Outcome:</span>
            <span
              className={`px-3 py-1 rounded-md font-bold uppercase text-xs ${
                finalDecision.finalPublishable
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                  : 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
              }`}
            >
              {finalDecision.finalPublishable ? 'PUBLISHABLE' : 'NOT PUBLISHABLE'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8C8A7D]">Decision Source:</span>
            <strong className="text-[#1E2E20] font-bold">
              {finalDecision.source === 'CURATOR_OVERRIDE'
                ? isApproved
                  ? 'APPROVED BY CURATOR'
                  : 'REJECTED BY CURATOR'
                : finalDecision.automatedPublishable
                ? 'PASS — automated'
                : 'BLOCKED — awaiting curator decision'}
            </strong>
          </div>

          {currentOverride?.decidedAt && (
            <div className="flex items-center justify-between text-[10px] text-[#8C8A7D] pt-1 border-t border-[#E5E3DB]/60">
              <span className="flex items-center gap-1">
                <Clock size={12} /> Decided at: {currentOverride.decidedAt}
              </span>
              {currentOverride.curatorId && (
                <span>Curator ID: {currentOverride.curatorId}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. PROVENANCE ACCORDION */}
      <div className="border border-[#E5E3DB] rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFactsAccordion(!showFactsAccordion)}
          className="w-full p-4 flex items-center justify-between bg-[#FAF9F5] hover:bg-[#F5F3EB] font-mono text-xs font-bold text-[#1E2E20] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info size={15} className="text-[#C5A059]" />
            PROVENANCE
          </span>
          {showFactsAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFactsAccordion && (
          <div className="p-4 space-y-3 font-mono text-xs border-t border-[#E5E3DB] bg-white">
            {recommendation.provenance ? (
              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3DB] space-y-1">
                <span className="font-bold text-[#1E2E20] block text-[11px]">Provenance Metadata:</span>
                <p className="text-[11px] text-[#8C8A7D]">
                  Source: {recommendation.provenance.source || 'Curator Record'}<br />
                  Method: {recommendation.provenance.method || 'Direct Verification'}<br />
                  Status: {recommendation.provenance.verificationStatus || 'VERIFIED'}
                </p>
              </div>
            ) : (
              <div className="text-[#8C8A7D] italic text-[11px]">
                No external provenance object attached to recommendation.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
