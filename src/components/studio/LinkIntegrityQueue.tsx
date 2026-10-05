/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Link2,
  AlertTriangle,
  ShieldAlert,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  LinkIntegrityReport,
  LinkIntegrityFinding,
  LinkIntegritySeverity,
} from '../../lib/idemo007v2/linkIntegrityService';

interface LinkIntegrityQueueProps {
  report: LinkIntegrityReport;
  onRefreshScan?: () => void;
  onSelectRecommendation?: (recommendationId: string) => void;
}

export const LinkIntegrityQueue: React.FC<LinkIntegrityQueueProps> = ({
  report,
  onRefreshScan,
  onSelectRecommendation,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<LinkIntegritySeverity | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFindings = useMemo(() => {
    return report.findings.filter((f) => {
      if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${f.recommendationTitle || ''} ${f.code} ${f.url} ${f.field} ${f.message}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [report.findings, selectedSeverity, searchQuery]);

  const blockingCount = useMemo(
    () => report.findings.filter((f) => f.severity === 'BLOCKING').length,
    [report.findings]
  );
  const warningCount = useMemo(
    () => report.findings.filter((f) => f.severity === 'WARNING').length,
    [report.findings]
  );

  return (
    <div className="space-y-5 bg-white border border-[#E5E3DB] rounded-2xl p-5 shadow-xs">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E3DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg bg-[#FAF9F5] text-[#1E2E20] border border-[#E5E3DB]">
            <Link2 size={22} className="text-[#8A1F1F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-bold text-[#1E2E20]">
                Link Integrity Monitor
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  report.findingCount === 0
                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                    : blockingCount > 0
                    ? 'bg-[#FEE2E2] text-[#991B1B]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {report.findingCount === 0 ? 'CLEAN' : `${report.findingCount} ISSUES`}
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#8C8A7D] mt-0.5">
              Evaluated {report.totalEvaluated} items • {report.healthyCount} fully verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-1 bg-[#FEE2E2] text-[#991B1B] rounded-lg font-bold">
              {blockingCount} Blocking
            </span>
            <span className="px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded-lg font-bold">
              {warningCount} Warnings
            </span>
          </div>

          {onRefreshScan && (
            <button
              type="button"
              onClick={onRefreshScan}
              className="p-2 border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#1E2E20] rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Re-run Link Integrity Scan"
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
          {(['ALL', 'BLOCKING', 'WARNING'] as const).map((sev) => {
            const count =
              sev === 'ALL'
                ? report.findings.length
                : report.findings.filter((f) => f.severity === sev).length;

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
      <div className="space-y-2">
        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl">
            <p className="font-mono text-xs text-[#8C8A7D]">
              {report.findings.length === 0
                ? 'All outbound URLs passed syntax and protocol verification.'
                : 'No findings match the current filter criteria.'}
            </p>
          </div>
        ) : (
          filteredFindings.map((f) => (
            <div
              key={f.id}
              onClick={() => onSelectRecommendation?.(f.recommendationId)}
              className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] hover:border-[#23251E]/30 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {f.severity === 'BLOCKING' ? (
                    <ShieldAlert size={14} className="text-[#DC2626]" />
                  ) : (
                    <AlertTriangle size={14} className="text-[#D97706]" />
                  )}
                  <span className="font-serif font-bold text-xs text-[#1E2E20]">
                    {f.recommendationTitle}
                  </span>
                  <span className="font-mono text-[10px] text-[#8C8A7D]">
                    [{f.field}]
                  </span>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white border border-[#E5E3DB] text-[#1E2E20] font-bold">
                    {f.code}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#8C8A7D] truncate max-w-xl">
                  {f.message}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center font-mono text-[10px] text-[#8C8A7D]">
                <span className="truncate max-w-[200px]">{f.url}</span>
                <ExternalLink size={12} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
