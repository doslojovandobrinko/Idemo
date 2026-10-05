/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Download, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { ItineraryProposal } from '../../lib/idemo007v2/dayPlanComposer';
import { exportDayPlanProposal, DayPlanExportResult } from '../../lib/idemo007v2/dayPlanExporter';

interface DayPlanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ItineraryProposal | null;
}

export const DayPlanExportModal: React.FC<DayPlanExportModalProps> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !proposal) return null;

  const exportResult: DayPlanExportResult = exportDayPlanProposal(proposal);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!exportResult.exportData) return;
    const blob = new Blob([JSON.stringify(exportResult.exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idemo-day-plan-${proposal.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-[#E5E3DB] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E3DB] flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#800020]/10 flex items-center justify-center text-[#800020]">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                Export Day Plan Itinerary
              </h3>
              <p className="font-mono text-xs text-[#8C8A7D]">
                {proposal.title} • {proposal.durationBucket}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C8A7D] hover:text-[#1E2E20] hover:bg-[#E5E3DB]/40 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!exportResult.success ? (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Cannot Export Day Plan</h4>
                <p className="text-xs mt-1 leading-relaxed">{exportResult.error}</p>
                <p className="text-[11px] font-mono mt-2 text-[#7F1D1D]">
                  Hint: Set the itinerary publication status to APPROVED in the curator composer before exporting.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 p-1 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl">
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeTab === 'text'
                        ? 'bg-[#1E2E20] text-white shadow-xs'
                        : 'text-[#8C8A7D] hover:text-[#1E2E20]'
                    }`}
                  >
                    Human Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeTab === 'json'
                        ? 'bg-[#1E2E20] text-white shadow-xs'
                        : 'text-[#8C8A7D] hover:text-[#1E2E20]'
                    }`}
                  >
                    JSON Payload
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleCopy(
                        activeTab === 'text'
                          ? exportResult.textSummary || ''
                          : JSON.stringify(exportResult.exportData, null, 2)
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#1E2E20] font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-[#2E7D32]" />
                        <span className="text-[#2E7D32]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-[#8C8A7D]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  {activeTab === 'json' && (
                    <button
                      onClick={handleDownloadJson}
                      className="px-3 py-1.5 rounded-xl bg-[#800020] text-white font-mono text-xs font-bold transition-all cursor-pointer hover:bg-[#600018] flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content view */}
              <div className="bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-[#1E2E20] whitespace-pre-wrap leading-relaxed">
                  {activeTab === 'text'
                    ? exportResult.textSummary
                    : JSON.stringify(exportResult.exportData, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E3DB] bg-[#FAF9F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1E2E20] hover:bg-[#32352B] text-white font-mono text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
