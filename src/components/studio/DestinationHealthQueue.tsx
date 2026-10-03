/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Filter, 
  ChevronRight, 
  RefreshCw,
  Search,
  Activity,
  Layers,
  MapPin,
  Globe,
  ImageIcon
} from 'lucide-react';
import { 
  DestinationHealthReport, 
  DestinationHealthFinding, 
  DestinationHealthSeverity,
  DestinationHealthCategory
} from '../../lib/idemo007v2/destinationHealthService';

interface DestinationHealthQueueProps {
  report: DestinationHealthReport;
  onRefreshScan?: () => void;
  onSelectRecommendation?: (recommendationId: string) => void;
}

export const DestinationHealthQueue: React.FC<DestinationHealthQueueProps> = ({
  report,
  onRefreshScan,
  onSelectRecommendation,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<DestinationHealthSeverity | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<DestinationHealthCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFindings = useMemo(() => {
    return report.findings.filter(f => {
      if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && f.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${f.recommendationTitle || ''} ${f.code} ${f.actionableReason} ${f.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [report.findings, selectedSeverity, selectedCategory, searchQuery]);

  return (
    <div className="space-y-5 bg-white border border-[#E5E3DB] rounded-2xl p-5 shadow-xs">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E3DB] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg ${
            report.status === 'HEALTHY' ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]' :
            report.status === 'NEEDS_ATTENTION' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
            'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
          }`}>
            {report.healthScore}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-bold text-[#1E2E20]">
                {report.destinationName} Health Monitor
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                report.status === 'HEALTHY' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                report.status === 'NEEDS_ATTENTION' ? 'bg-[#FEF3C7] text-[#92400E]' :
                'bg-[#FEE2E2] text-[#991B1B]'
              }`}>
                {report.status}
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#8C8A7D] mt-0.5">
              Evaluated {report.totalRecommendationsEvaluated} experiences • {report.findings.length} total findings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-1 bg-[#FEE2E2] text-[#991B1B] rounded-lg font-bold">
              {report.summary.blockingCount} Blocking
            </span>
            <span className="px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded-lg font-bold">
              {report.summary.warningCount} Warnings
            </span>
            <span className="px-2 py-1 bg-[#E0F2FE] text-[#075985] rounded-lg font-bold">
              {report.summary.infoCount} Info
            </span>
          </div>

          {onRefreshScan && (
            <button
              type="button"
              onClick={onRefreshScan}
              className="p-2 border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#1E2E20] rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Re-run Destination Health Scan"
            >
              <RefreshCw size={14} className="text-[#C5A059]" />
              <span className="hidden sm:inline">Rescan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-[#E5E3DB]">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['ALL', 'BLOCKING', 'WARNING', 'INFO'] as const).map((sev) => {
            const count = sev === 'ALL'
              ? report.findings.length
              : report.findings.filter(f => f.severity === sev).length;

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[10.5px] font-bold transition-all cursor-pointer ${
                  selectedSeverity === sev
                    ? 'bg-[#23251E] text-white'
                    : 'bg-white text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                }`}
              >
                {sev} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#8C8A7D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings..."
            className="w-full h-8 pl-8 pr-2.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-lg text-xs font-mono text-[#1E2E20] outline-none"
          />
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] rounded-xl border border-[#E5E3DB]">
            <CheckCircle2 size={24} className="text-[#2E7D32] mx-auto mb-2" />
            <p className="font-mono text-xs font-bold text-[#1E2E20] uppercase">Zero Health Findings</p>
            <p className="font-sans text-xs text-[#8C8A7D] mt-1">
              All evaluated experiences satisfy canonical publication, location, media, and localization health standards.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            return (
              <div
                key={finding.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  finding.severity === 'BLOCKING' ? 'bg-[#FEF2F2] border-[#FCA5A5]' :
                  finding.severity === 'WARNING' ? 'bg-[#FFFBEB] border-[#FDE68A]' :
                  'bg-[#F0F9FF] border-[#BAE6FD]'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      finding.severity === 'BLOCKING' ? 'bg-[#DC2626] text-white' :
                      finding.severity === 'WARNING' ? 'bg-[#D97706] text-white' :
                      'bg-[#0284C7] text-white'
                    }`}>
                      {finding.severity}
                    </span>

                    <span className="font-mono text-[10px] font-bold uppercase text-[#8C8A7D]">
                      {finding.category}
                    </span>

                    <span className="font-mono text-[10px] text-[#1E2E20] font-bold">
                      [{finding.code}]
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-bold text-[#1E2E20] truncate">
                    {finding.recommendationTitle || 'Destination Package Scope'}
                  </h4>

                  <p className="font-sans text-xs text-[#374151] leading-relaxed">
                    {finding.actionableReason}
                  </p>

                  <p className="font-mono text-[10.5px] text-[#6B7280] italic">
                    Remediation: {finding.remediationAdvice}
                  </p>
                </div>

                {/* Remediation Trigger Button */}
                {finding.recommendationId && onSelectRecommendation && (
                  <button
                    type="button"
                    onClick={() => onSelectRecommendation(finding.recommendationId!)}
                    className="self-start sm:self-auto px-3 py-1.5 bg-[#23251E] hover:bg-[#32352B] text-white rounded-lg font-mono text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Remediate</span>
                    <ChevronRight size={12} className="text-[#C5A059]" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
