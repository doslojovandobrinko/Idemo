import React from 'react';
import { Settings, ShieldCheck, Globe, Database, Moon, Sun, Lock } from 'lucide-react';
import { StudioUserSession } from './types';

interface StudioSettingsProps {
  session: StudioUserSession;
}

export function StudioSettings({ session }: StudioSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#1E2E20] tracking-tight">
          Studio Operations Settings
        </h1>
        <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-0.5">
          System preferences, permissions matrix, dataset versions, and governance protocols.
        </p>
      </div>

      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-6">
        {/* Active Session info */}
        <div className="border-b border-[#E5E3DB] pb-5">
          <span className="text-[10px] font-mono uppercase font-bold text-[#8C8A7D]">
            OPERATOR SESSION
          </span>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E2E20]">{session.name}</h3>
              <p className="text-xs font-mono text-[#8C8A7D]">{session.email} • Role: <strong className="text-[#8A1F1F]">{session.role}</strong></p>
            </div>
            <span className="px-3 py-1 bg-[#23251E] text-white rounded-xl text-xs font-mono font-bold">
              Authenticated
            </span>
          </div>
        </div>

        {/* System Configuration Options */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-base text-[#1E2E20]">
            System Governance Directives
          </h4>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1E2E20] block">Core Engine Architecture Freeze (Principle 26)</span>
                <span className="text-[11px] text-[#8C8A7D]">No structural modifications to package manager or storage engines allowed.</span>
              </div>
              <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-md font-bold text-[10px]">
                ENFORCED
              </span>
            </div>

            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1E2E20] block">Privacy-First Policy</span>
                <span className="text-[11px] text-[#8C8A7D]">Zero tracking scripts or remote user profiling.</span>
              </div>
              <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-md font-bold text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1E2E20] block">Editorial Luxury Design System</span>
                <span className="text-[11px] text-[#8C8A7D]">Strict visual standards with warm neutral palette #FAF9F5.</span>
              </div>
              <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-md font-bold text-[10px]">
                VALIDATED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
