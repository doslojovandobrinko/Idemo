/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  FileCheck2, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  ArrowUpRight,
  Filter,
  Flame,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CuratorTask, TaskAgingTier, TaskIssueType } from '../../lib/curatorTaskService';
import { StudioTab } from './types';

interface CuratorAttentionRadarProps {
  tasks: CuratorTask[];
  onNavigateTab: (tab: StudioTab, itemId?: string) => void;
  className?: string;
  compactDefault?: boolean;
}

export function CuratorAttentionRadar({
  tasks,
  onNavigateTab,
  className = '',
  compactDefault = true
}: CuratorAttentionRadarProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'GATE_BLOCKER' | 'PARTNER_VERIFICATION' | 'PARTNER_PROPOSAL' | 'AMBIGUITY'>('ALL');
  const [isExpanded, setIsExpanded] = useState(!compactDefault);

  // Fast counts for 3-second comprehension
  const counts = useMemo(() => {
    let critical = 0;
    let gate = 0;
    let partner = 0;
    let proposals = 0;
    let ambiguity = 0;

    for (const t of tasks) {
      if (t.agingTier === 'TIER_3_BOTTLENECK' || t.urgency === 'CRITICAL') critical++;
      if (t.issueType === 'GATE_BLOCKER') gate++;
      if (t.issueType === 'PARTNER_VERIFICATION') partner++;
      if (t.issueType === 'PARTNER_PROPOSAL') proposals++;
      if (t.issueType === 'AMBIGUITY') ambiguity++;
    }

    return { total: tasks.length, critical, gate, partner, proposals, ambiguity };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterType === 'CRITICAL') return t.agingTier === 'TIER_3_BOTTLENECK' || t.urgency === 'CRITICAL';
      if (filterType === 'GATE_BLOCKER') return t.issueType === 'GATE_BLOCKER';
      if (filterType === 'PARTNER_VERIFICATION') return t.issueType === 'PARTNER_VERIFICATION';
      if (filterType === 'PARTNER_PROPOSAL') return t.issueType === 'PARTNER_PROPOSAL';
      if (filterType === 'AMBIGUITY') return t.issueType === 'AMBIGUITY';
      return true;
    });
  }, [tasks, filterType]);

  const displayedTasks = isExpanded ? filteredTasks : filteredTasks.slice(0, 3);

  const getAgingBadge = (tier: TaskAgingTier, label: string) => {
    if (tier === 'TIER_3_BOTTLENECK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] font-black uppercase tracking-wider bg-[#FFEBEE] text-[#800020] border border-[#FFCDD2] animate-pulse">
          <Flame size={10} className="text-[#800020]" />
          <span>{label}</span>
        </span>
      );
    }
    if (tier === 'TIER_2_AGING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider bg-[#FFF8E1] text-[#B45309] border border-[#FFE082]">
          <Clock size={10} className="text-[#B45309]" />
          <span>{label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] font-medium uppercase tracking-wider bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
        <CheckCircle2 size={10} className="text-[#2E7D32]" />
        <span>{label}</span>
      </span>
    );
  };

  const getIssueTypeBadge = (issueType: TaskIssueType) => {
    switch (issueType) {
      case 'GATE_BLOCKER':
        return (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8.5px] uppercase font-bold tracking-wider bg-[#23251E] text-white">
            Gate Blocker
          </span>
        );
      case 'PARTNER_VERIFICATION':
        return (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8.5px] uppercase font-bold tracking-wider bg-[#EDE9DE] text-[#23251E] border border-[#D5D1C3]">
            Passport Queue
          </span>
        );
      case 'PARTNER_PROPOSAL':
        return (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8.5px] uppercase font-bold tracking-wider bg-[#FFF8E1] text-[#B45309] border border-[#FFE082]">
            Partner Proposal
          </span>
        );
      case 'AMBIGUITY':
        return (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8.5px] uppercase font-bold tracking-wider bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]">
            Partner Ambiguity
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8.5px] uppercase font-bold tracking-wider bg-[#FAF9F5] text-[#5C5A4D] border border-border-main">
            Review
          </span>
        );
    }
  };

  if (tasks.length === 0) {
    return (
      <div className={`bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1E2E20]">
                Curator Attention Radar: Zero Blockers
              </h3>
              <p className="font-mono text-[10px] text-[#8C8A7D]">
                All candidate items, partner passports, and gate validations are clear.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#2E7D32] font-mono text-[9px] font-black uppercase tracking-widest border border-[#C8E6C9]">
            PIPELINE CLEAR
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E5E3DB] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans ${className}`}>
      {/* 1. Master Glance Header (3-Second Comprehension) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E3DB] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#800020] text-white font-mono text-[8.5px] font-black uppercase tracking-widest">
              CURATOR ATTENTION RADAR
            </span>
            <span className="font-mono text-[10px] text-[#8C8A7D]">
              SLA-Calibrated Bottleneck Triage
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
            Items Requiring Curator Decision
          </h3>
        </div>

        {/* 3-Second KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              filterType === 'ALL'
                ? 'bg-[#23251E] text-white border-[#23251E]'
                : 'bg-[#FAF9F5] hover:bg-[#F3F2EC] text-[#5C5A4D] border-[#E5E3DB]'
            }`}
          >
            <span>Total</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded text-[9.5px] font-mono">{counts.total}</span>
          </button>

          {counts.critical > 0 && (
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterType === 'CRITICAL'
                  ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                  : 'bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#800020] border-[#FFCDD2]'
              }`}
            >
              <Flame size={12} className={filterType === 'CRITICAL' ? 'text-white' : 'text-[#800020]'} />
              <span>Critical SLA ({counts.critical})</span>
            </button>
          )}

          {counts.proposals > 0 && (
            <button
              onClick={() => setFilterType('PARTNER_PROPOSAL')}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterType === 'PARTNER_PROPOSAL'
                  ? 'bg-[#B45309] text-white border-[#B45309]'
                  : 'bg-[#FFF8E1] hover:bg-[#FFE082] text-[#B45309] border-[#FFE082]'
              }`}
            >
              <span>Proposals ({counts.proposals})</span>
            </button>
          )}

          {counts.gate > 0 && (
            <button
              onClick={() => setFilterType('GATE_BLOCKER')}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterType === 'GATE_BLOCKER'
                  ? 'bg-[#23251E] text-white border-[#23251E]'
                  : 'bg-[#FAF9F5] hover:bg-[#F3F2EC] text-[#5C5A4D] border-[#E5E3DB]'
              }`}
            >
              <span>Gate ({counts.gate})</span>
            </button>
          )}

          {counts.partner > 0 && (
            <button
              onClick={() => setFilterType('PARTNER_VERIFICATION')}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterType === 'PARTNER_VERIFICATION'
                  ? 'bg-[#23251E] text-white border-[#23251E]'
                  : 'bg-[#FAF9F5] hover:bg-[#F3F2EC] text-[#5C5A4D] border-[#E5E3DB]'
              }`}
            >
              <span>Passports ({counts.partner})</span>
            </button>
          )}

          {counts.ambiguity > 0 && (
            <button
              onClick={() => setFilterType('AMBIGUITY')}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterType === 'AMBIGUITY'
                  ? 'bg-[#E65100] text-white border-[#E65100]'
                  : 'bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border-[#FFE0B2]'
              }`}
            >
              <span>Ambiguities ({counts.ambiguity})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tasks List */}
      <div className="space-y-2.5">
        {displayedTasks.map(task => (
          <div
            key={task.id}
            onClick={() => onNavigateTab(task.actionTab, task.targetId)}
            className="p-3.5 bg-[#FAF9F5] hover:bg-[#F4F3ED] border border-[#E5E3DB] hover:border-[#23251E] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all group shadow-xs active:translate-y-[1px]"
          >
            {/* Left: Entity & Problem Statement */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {getAgingBadge(task.agingTier, task.agingLabel)}
                {getIssueTypeBadge(task.issueType)}
                <span className="font-mono text-[10px] text-[#8C8A7D] uppercase tracking-wider font-bold">
                  {task.category}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <h4 className="font-serif font-bold text-[14px] text-[#1E2E20] group-hover:text-[#800020] transition-colors truncate">
                  {task.title}
                </h4>
                <span className="font-mono text-[10.5px] text-[#8C8A7D]">
                  [{task.targetId}]
                </span>
              </div>

              <p className="text-[12px] text-[#5C5A4D] font-sans leading-snug line-clamp-2">
                {task.issueSummary}
              </p>
            </div>

            {/* Right: 1-Click Action Button */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTab(task.actionTab, task.targetId);
                }}
                className="px-3.5 py-2 rounded-xl bg-white group-hover:bg-[#23251E] text-[#1E2E20] group-hover:text-white border border-[#E5E3DB] group-hover:border-[#23251E] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>{task.recommendedAction}</span>
                <ArrowUpRight size={13} className="text-[#8C8A7D] group-hover:text-[#C5A059] transition-colors" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Progressive Disclosure Toggle */}
      {filteredTasks.length > 3 && (
        <div className="pt-2 flex items-center justify-between border-t border-[#E5E3DB]/60">
          <span className="font-mono text-[10.5px] text-[#8C8A7D]">
            Showing {displayedTasks.length} of {filteredTasks.length} action items
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F3F2EC] border border-[#E5E3DB] font-mono text-[10.5px] font-bold text-[#1E2E20] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'Collapse Radar' : `View All (${filteredTasks.length})`}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}
