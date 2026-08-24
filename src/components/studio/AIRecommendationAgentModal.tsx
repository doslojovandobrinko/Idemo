/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, X, Compass, Image as ImageIcon, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Shield } from 'lucide-react';
import { ServiceAreaOption, SERVICE_AREA_OPTIONS } from '../../lib/recommendationWorkflowService';
import { AgentProposalInput, compileRecommendationProposal, AgentCompilationResult } from '../../lib/recommendationAgentService';

interface AIRecommendationAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceAreas: ServiceAreaOption[];
  onApplyProposal: (result: AgentCompilationResult) => void;
}

export const AIRecommendationAgentModal: React.FC<AIRecommendationAgentModalProps> = ({
  isOpen,
  onClose,
  serviceAreas,
  onApplyProposal,
}) => {
  const [nameOrTitle, setNameOrTitle] = useState('');
  const [destinationOrLocation, setDestinationOrLocation] = useState('');
  const [selectedServiceAreaId, setSelectedServiceAreaId] = useState('');
  const [descriptionOrNotes, setDescriptionOrNotes] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [curatorNotes, setCuratorNotes] = useState('');
  
  // Human media inputs (HUMAN_MANDATORY)
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaSource, setMediaSource] = useState('Curator Field Photography');
  const [mediaLicense, setMediaLicense] = useState('Proprietary / Editorial Rights Approved');
  const [mediaAltText, setMediaAltText] = useState('');

  const [isCompiling, setIsCompiling] = useState(false);
  const isCompilingRef = React.useRef(false);
  const [compilationProgress, setCompilationProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompiling || isCompilingRef.current) {
      return;
    }
    if (!nameOrTitle.trim()) {
      setErrorMsg('Please provide an Experience Name or Title to begin compilation.');
      return;
    }

    isCompilingRef.current = true;
    setErrorMsg(null);
    setIsCompiling(true);
    setCompilationProgress('Resolving destination service area & taxonomy...');

    try {
      await new Promise(r => setTimeout(r, 300));
      setCompilationProgress('Synthesizing 6-language editorial narratives & insider tips...');
      
      await new Promise(r => setTimeout(r, 300));
      setCompilationProgress('Calibrating 2D Mood Orbit spatial vector and 6 normalized dimensions...');

      await new Promise(r => setTimeout(r, 300));
      setCompilationProgress('Evaluating Concierge Partner Intelligence and coverage...');

      const input: AgentProposalInput = {
        nameOrTitle: nameOrTitle.trim(),
        destinationOrLocation: destinationOrLocation.trim() || undefined,
        targetServiceAreaId: selectedServiceAreaId || undefined,
        descriptionOrNotes: descriptionOrNotes.trim() || undefined,
        referenceUrl: referenceUrl.trim() || undefined,
        additionalCuratorNotes: curatorNotes.trim() || undefined,
        humanProvidedMedia: mediaUrl.trim() ? {
          url: mediaUrl.trim(),
          source: mediaSource.trim() || 'Curator Field Photography',
          license: mediaLicense.trim() || 'Editorial Rights Approved',
          altText: mediaAltText.trim() || nameOrTitle.trim(),
        } : undefined,
      };

      const result = await compileRecommendationProposal(input, serviceAreas);
      
      setCompilationProgress('Proposal compiled into canonical 6-step structure. Transferring to human review...');
      await new Promise(r => setTimeout(r, 400));

      onApplyProposal(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Compilation error: ${err?.message || String(err)}`);
    } finally {
      isCompilingRef.current = false;
      setIsCompiling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl bg-white border border-[#E5E3DB] rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#23251E] text-white p-5 px-6 flex items-center justify-between border-b border-[#32352B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#C5A059]">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold block">
                IDEMO PROPOSAL AGENT (V9-STUDIO-AI-REC-01)
              </span>
              <h2 className="font-serif text-lg font-bold text-white leading-tight">
                AI Recommendation Proposal Agent
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
        <form onSubmit={handleCompile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Governance Notice */}
          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl flex items-start gap-3 text-xs text-[#57534E]">
            <Shield size={18} className="text-[#C5A059] shrink-0 mt-0.5" />
            <div className="space-y-0.5 font-mono text-[11px]">
              <span className="font-bold text-[#1E2E20] block">CANONICAL PARITY & GOVERNANCE GUARANTEE</span>
              <p className="leading-tight text-[#8C8A7D]">
                The Proposal Agent compiles directly into the canonical 6-step Recommendation Editor. It initializes in the governed AMBER review state awaiting human Admin approval.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs font-mono text-[#C62828] flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Core Identification */}
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                Experience Name / Title *
              </label>
              <input
                type="text"
                required
                value={nameOrTitle}
                onChange={(e) => setNameOrTitle(e.target.value)}
                placeholder="e.g., Kalemegdan Fortress Sunset Walk or Vinarija Zvonko Bogdan Tasting"
                className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Authoritative Service Area
                </label>
                {(() => {
                  const activeAreas = serviceAreas && serviceAreas.length > 0 ? serviceAreas : SERVICE_AREA_OPTIONS;
                  return (
                    <select
                      value={selectedServiceAreaId}
                      onChange={(e) => {
                        setSelectedServiceAreaId(e.target.value);
                        const found = activeAreas.find(sa => sa.id === e.target.value);
                        if (found && !destinationOrLocation) {
                          setDestinationOrLocation(found.name_en);
                        }
                      }}
                      className="w-full h-11 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none cursor-pointer"
                    >
                      <option value="">-- Auto-Resolve from Context --</option>
                      {activeAreas.map((sa) => (
                        <option key={sa.id} value={sa.id}>
                          {sa.name_en} {sa.name_sr ? `(${sa.name_sr})` : ''}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div>
                <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Location / Sub-Region Prompt
                </label>
                <input
                  type="text"
                  value={destinationOrLocation}
                  onChange={(e) => setDestinationOrLocation(e.target.value)}
                  placeholder="e.g., Belgrade Upper Town, Subotica Palić, Tara"
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                Curator Notes / Context / Raw Description
              </label>
              <textarea
                rows={3}
                value={descriptionOrNotes}
                onChange={(e) => setDescriptionOrNotes(e.target.value)}
                placeholder="Paste curator research notes, key highlights, historic context, or menu highlights..."
                className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Reference / Verification URL (Optional)
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3.5 top-3.5 text-[#8C8A7D]" />
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder="https://example.com/venue"
                    className="w-full h-11 pl-9 pr-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Curator Editorial Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={curatorNotes}
                  onChange={(e) => setCuratorNotes(e.target.value)}
                  placeholder="e.g., Emphasize sunset views & wine tasting"
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Human Media Precedence (HUMAN_MANDATORY) */}
          <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-[#C5A059]" />
                <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                  Human Media Precedence (HUMAN_MANDATORY)
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#1E2E20] text-[#C5A059] font-mono text-[9px] font-bold rounded uppercase">
                Zero Replacement Rule
              </span>
            </div>

            <p className="text-[11px] font-mono text-[#8C8A7D] leading-tight">
              If a human curator supplies a photograph or media URL below, the Proposal Agent is strictly forbidden from replacing, regenerating, or overriding it.
            </p>

            <div>
              <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                Human-Supplied Image URL
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://images.example.com/curator-photo.jpg"
                className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
              />
            </div>

            {mediaUrl && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E5E3DB]">
                <div>
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#8C8A7D] mb-0.5">
                    Media Source
                  </label>
                  <input
                    type="text"
                    value={mediaSource}
                    onChange={(e) => setMediaSource(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-[10px] font-mono text-[#1E2E20]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#8C8A7D] mb-0.5">
                    License / Usage Rights
                  </label>
                  <input
                    type="text"
                    value={mediaLicense}
                    onChange={(e) => setMediaLicense(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-[10px] font-mono text-[#1E2E20]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#8C8A7D] mb-0.5">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={mediaAltText}
                    onChange={(e) => setMediaAltText(e.target.value)}
                    placeholder={nameOrTitle}
                    className="w-full h-8 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-[10px] font-mono text-[#1E2E20]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Compilation Progress */}
          {isCompiling && (
            <div className="p-4 bg-[#FAF9F5] border border-[#C5A059] rounded-2xl flex items-center gap-3 text-xs font-mono text-[#1E2E20]">
              <Loader2 size={18} className="animate-spin text-[#C5A059] shrink-0" />
              <span>{compilationProgress}</span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E3DB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isCompiling}
              className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] text-xs font-mono uppercase font-bold text-[#8C8A7D] hover:text-[#1E2E20] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCompiling || !nameOrTitle.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {isCompiling ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#C5A059]" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-[#C5A059]" />
                  <span>Compile Canonical Proposal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
