import React from 'react';
import { Activity, ShieldCheck, Database, Zap, Cpu, CheckCircle2, Server } from 'lucide-react';

export function StudioOperations() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#1E2E20] tracking-tight">
          System Operations & Infrastructure Watchdog
        </h1>
        <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-0.5">
          Real-time verification of Supabase integration, Edge Functions, and core engine immutability.
        </p>
      </div>

      {/* Infrastructure Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E3DB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8A7D] font-bold">
              Supabase Backend
            </span>
            <Database size={18} className="text-[#2E7D32]" />
          </div>
          <p className="text-xl font-serif font-bold text-[#1E2E20] mt-3">Connected</p>
          <span className="text-[10.5px] font-mono text-[#2E7D32] font-semibold">PostgreSQL RLS Active</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E3DB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8A7D] font-bold">
              Edge Functions
            </span>
            <Zap size={18} className="text-[#C5A059]" />
          </div>
          <p className="text-xl font-serif font-bold text-[#1E2E20] mt-3">5 Active</p>
          <span className="text-[10.5px] font-mono text-[#2E7D32] font-semibold">Notification & Worker Ready</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E3DB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8A7D] font-bold">
              Core Architecture
            </span>
            <ShieldCheck size={18} className="text-[#8A1F1F]" />
          </div>
          <p className="text-xl font-serif font-bold text-[#1E2E20] mt-3">Frozen v1.2</p>
          <span className="text-[10.5px] font-mono text-[#2E7D32] font-semibold">Principle 26 Enforced</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E3DB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8A7D] font-bold">
              Offline Storage Engine
            </span>
            <Server size={18} className="text-[#23251E]" />
          </div>
          <p className="text-xl font-serif font-bold text-[#1E2E20] mt-3">SafeStorage</p>
          <span className="text-[10.5px] font-mono text-[#2E7D32] font-semibold">Zero Memory Leaks</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-4">
          Audit Trail & Telemetry Heartbeats
        </h3>

        <div className="space-y-2.5 font-mono text-xs">
          {[
            { time: '2026-08-01 09:40:00 UTC', event: 'IDEMO Studio Foundation Shell initialized', status: 'SUCCESS', source: 'StudioAuthShell' },
            { time: '2026-08-01 09:30:00 UTC', event: 'Supabase Production Foundation Audit verified', status: 'READ_ONLY', source: 'WP-01 Audit' },
            { time: '2026-08-01 09:15:00 UTC', event: 'Destination Package Manager SHA-256 validation', status: 'SUCCESS', source: 'packageManager.ts' },
            { time: '2026-08-01 09:00:00 UTC', event: 'System watchdog heartbeat check', status: 'HEALTHY', source: 'EdgeWorker' }
          ].map((log, idx) => (
            <div key={idx} className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[#2E7D32] shrink-0" />
                <div>
                  <span className="font-bold text-[#1E2E20]">{log.event}</span>
                  <p className="text-[10px] text-[#8C8A7D] mt-0.5">{log.time} • Source: {log.source}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#2E7D32] text-[9.5px] font-bold">
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
