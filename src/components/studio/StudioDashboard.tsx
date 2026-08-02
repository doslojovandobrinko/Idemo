import React from "react";
import {
  Compass,
  MapPin,
  Users,
  PackageCheck,
  Activity,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Layers,
  Sparkles,
  FileCheck2,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { StudioUserSession, StudioTab } from "./types";

interface StudioDashboardProps {
  session: StudioUserSession;
  onNavigateTab: (tab: StudioTab) => void;
  recommendationCount?: number;
  partnerCount?: number;
}

export function StudioDashboard({
  session,
  onNavigateTab,
  recommendationCount = 113,
  partnerCount = 5,
}: StudioDashboardProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-[#23251E] text-white font-mono text-[9px] uppercase tracking-widest font-bold">
                IDEMO STUDIO OPERATIONAL DESK
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] font-mono text-[9px] uppercase tracking-widest font-bold">
                SYSTEM HEALTHY
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2E20] tracking-tight">
              Welcome, {session.name}
            </h1>
            <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-1 max-w-2xl leading-relaxed">
              Business operational workspace for destination curation,
              recommendation completeness audits, partner readiness
              verification, and package publishing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab("publications")}
              className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <PackageCheck size={14} className="text-[#C5A059]" />
              <span>Publishing Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Business Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Metric 1: Destinations */}
        <div
          onClick={() => onNavigateTab("destinations")}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Destinations
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#8A1F1F] group-hover:scale-110 transition-transform">
              <MapPin size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">
              5
            </span>
            <span className="text-xs text-[#2E7D32] font-semibold">
              Active Regions
            </span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            Belgrade, Novi Sad, Zlatibor, Niš, Subotica
          </p>
        </div>

        {/* Metric 2: Recommendations Breakdown */}
        <div
          onClick={() => onNavigateTab("recommendations")}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Recommendations
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#C5A059] group-hover:scale-110 transition-transform">
              <Compass size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">
              {recommendationCount}
            </span>
            <span className="text-xs text-[#2E7D32] font-semibold">
              64 Approved
            </span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            49 Draft Expansion candidates
          </p>
        </div>

        {/* Metric 3: Partners Breakdown */}
        <div
          onClick={() => onNavigateTab("partners")}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Onboarded Partners
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#2E7D32] group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">
              {partnerCount}
            </span>
            <span className="text-xs text-[#2E7D32] font-semibold">
              3 Active / Routable
            </span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            1 Candidate, 1 Verification pending
          </p>
        </div>

        {/* Metric 4: Package Version */}
        <div
          onClick={() => onNavigateTab("publications")}
          className="bg-white p-5 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
              Published Package
            </span>
            <div className="p-2 rounded-xl bg-[#FAF9F5] text-[#23251E] group-hover:scale-110 transition-transform">
              <PackageCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1E2E20]">
              v1.2.0
            </span>
            <span className="text-xs text-[#2E7D32] font-semibold">
              SHA-256 Valid
            </span>
          </div>
          <p className="text-[11px] text-[#8C8A7D] mt-1 font-sans">
            Canonical Serbia package active
          </p>
        </div>
      </div>

      {/* Business-Critical Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Status Breakdown Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Curation & Provider Pipelines */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="font-serif text-lg font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-3">
              Curation & Partner Pipeline Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {/* Recommendations Status */}
              <div
                onClick={() => onNavigateTab("recommendations")}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-3 cursor-pointer hover:border-[#23251E]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] uppercase text-[10px]">
                    Recommendations by Status
                  </span>
                  <Compass size={16} className="text-[#C5A059]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">
                      Approved for Release:
                    </span>
                    <span className="font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                      64 items
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Draft Candidates:</span>
                    <span className="font-bold text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-md">
                      49 items
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Needs Research:</span>
                    <span className="font-bold text-[#8C8A7D] bg-[#E5E3DB] px-2 py-0.5 rounded-md">
                      0 items
                    </span>
                  </div>
                </div>
              </div>

              {/* Partners Status */}
              <div
                onClick={() => onNavigateTab("partners")}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-3 cursor-pointer hover:border-[#23251E]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] uppercase text-[10px]">
                    Partners by Lifecycle Stage
                  </span>
                  <Users size={16} className="text-[#2E7D32]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">Active & Routable:</span>
                    <span className="font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                      3 partners
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">
                      Verification Pending:
                    </span>
                    <span className="font-bold text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-md">
                      1 partner
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C8A7D]">New Candidates:</span>
                    <span className="font-bold text-[#1E2E20] bg-[#E5E3DB] px-2 py-0.5 rounded-md">
                      1 partner
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Requiring Attention */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#8A1F1F]" />
                <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                  Items Requiring Operational Attention
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#8A1F1F] font-bold bg-[#FFEBEE] px-2.5 py-1 rounded-full border border-[#FFCDD2]">
                3 ACTION ITEMS
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div
                onClick={() => onNavigateTab("partners")}
                className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] hover:border-[#23251E] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F57F17]" />
                  <div>
                    <span className="font-bold text-[#1E2E20]">
                      Partner P-005 (Kula Wine & Ethno Estate)
                    </span>
                    <p className="text-[10px] text-[#8C8A7D] mt-0.5">
                      Verification pending • Requires primary contact email
                      confirmation
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-[#8C8A7D]" />
              </div>

              <div
                onClick={() => onNavigateTab("recommendations")}
                className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] hover:border-[#23251E] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8A1F1F]" />
                  <div>
                    <span className="font-bold text-[#1E2E20]">
                      49 Expansion Pool Candidates
                    </span>
                    <p className="text-[10px] text-[#8C8A7D] mt-0.5">
                      Draft status • Completeness audit required before release
                      approval
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-[#8C8A7D]" />
              </div>

              <div
                onClick={() => onNavigateTab("publications")}
                className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] hover:border-[#23251E] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                  <div>
                    <span className="font-bold text-[#1E2E20]">
                      Destination Package v1.2.0
                    </span>
                    <p className="text-[10px] text-[#8C8A7D] mt-0.5">
                      Published & Active • All 5 destinations synchronized
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-[#8C8A7D]" />
              </div>
            </div>
          </div>
        </div>

        {/* Operator Quick Actions Sidebar */}
        <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-3">
            Quick Operator Actions
          </h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab("recommendations")}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#1E2E20] font-mono">
                  Recommendation Editor
                </span>
                <p className="text-[10px] text-[#8C8A7D]">
                  Create, edit & score curated items
                </p>
              </div>
              <ArrowUpRight
                size={16}
                className="text-[#8C8A7D] group-hover:text-[#1E2E20] transition-colors"
              />
            </button>

            <button
              onClick={() => onNavigateTab("partners")}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#1E2E20] font-mono">
                  Partner Directory & Editor
                </span>
                <p className="text-[10px] text-[#8C8A7D]">
                  Onboard partners & score readiness
                </p>
              </div>
              <ArrowUpRight
                size={16}
                className="text-[#8C8A7D] group-hover:text-[#1E2E20] transition-colors"
              />
            </button>

            <button
              onClick={() => onNavigateTab("publications")}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#1E2E20] font-mono">
                  Destination Publishing
                </span>
                <p className="text-[10px] text-[#8C8A7D]">
                  Build immutable package bundle
                </p>
              </div>
              <ArrowUpRight
                size={16}
                className="text-[#8C8A7D] group-hover:text-[#1E2E20] transition-colors"
              />
            </button>

            <button
              onClick={() => onNavigateTab("operations")}
              className="w-full p-3 rounded-2xl border border-[#E5E3DB] hover:border-[#23251E] bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#8C8A7D] font-mono">
                  System Operations & Diagnostics
                </span>
                <p className="text-[10px] text-[#8C8A7D]">
                  Infrastructure logs & telemetry
                </p>
              </div>
              <Activity size={16} className="text-[#8C8A7D]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
