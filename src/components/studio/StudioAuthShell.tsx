import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { StudioRole, StudioUserSession } from "./types";
import IdemoLogo from "../IdemoLogo";

interface StudioAuthShellProps {
  onLoginSuccess: (session: StudioUserSession) => void;
  onCancel?: () => void;
}

const AVAILABLE_ROLES: {
  role: StudioRole;
  description: string;
  defaultName: string;
  defaultEmail: string;
}[] = [
  {
    role: "Super Admin",
    description:
      "Full system control, release governance & security configuration",
    defaultName: "Milan Stojković",
    defaultEmail: "milan.admin@idemo.travel",
  },
  {
    role: "Curator",
    description:
      "Lead destination curation, spatial mapping & vibe calibration",
    defaultName: "Jelena Petrović",
    defaultEmail: "jelena.curator@idemo.travel",
  },
  {
    role: "Editor",
    description: "Editorial content review, story vetting & observation inbox",
    defaultName: "Marko Nikolić",
    defaultEmail: "marko.editor@idemo.travel",
  },
  {
    role: "Translator",
    description:
      "Multi-language localization, Cyrillic/Latin & Chinese glossaries",
    defaultName: "Chen Wei",
    defaultEmail: "chen.translator@idemo.travel",
  },
  {
    role: "Partner Manager",
    description:
      "Experience provider onboarding, verification & QR attribution",
    defaultName: "Ana Jovanović",
    defaultEmail: "ana.partners@idemo.travel",
  },
  {
    role: "Release Manager",
    description:
      "Destination package generation, SHA-256 verification & rollbacks",
    defaultName: "Stefan Đorđević",
    defaultEmail: "stefan.releases@idemo.travel",
  },
];

export function StudioAuthShell({
  onLoginSuccess,
  onCancel,
}: StudioAuthShellProps) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRoleConfig = AVAILABLE_ROLES[selectedRoleIndex];

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    setTimeout(() => {
      // In development / studio shell foundation, accept any 4+ char pin or empty in dev
      if (pinInput.length === 0 || pinInput.length >= 4) {
        onLoginSuccess({
          role: activeRoleConfig.role,
          name: activeRoleConfig.defaultName,
          email: activeRoleConfig.defaultEmail,
          authenticatedAt: new Date().toISOString(),
        });
      } else {
        setErrorMsg("Invalid Security PIN. Minimum 4 digits required.");
        setIsSubmitting(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F5] text-[#1E2E20] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl bg-white border border-[#E5E3DB] rounded-3xl shadow-xl overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-[#23251E] text-white p-6 sm:p-8 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IdemoLogo className="h-6 w-auto" />
              <div className="h-4 w-[1px] bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold">
                STUDIO OPERATIONS
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/15 text-[10px] font-mono text-white/80">
              <ShieldCheck size={12} className="text-[#C5A059]" />
              <span>FROZEN CORE v1.2</span>
            </div>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
            IDEMO Studio Access
          </h2>
          <p className="text-white/70 text-xs sm:text-sm font-sans mt-1 leading-relaxed">
            Select your operator persona to access editorial management, partner
            onboarding, and package release controls.
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleAuthenticate} className="p-6 sm:p-8 space-y-6">
          {/* Operator Role Selector */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold mb-3">
              1. Select Operator Persona
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_ROLES.map((r, idx) => {
                const isSelected = selectedRoleIndex === idx;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRoleIndex(idx)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#23251E] text-white border-[#23251E] shadow-sm scale-[1.01]"
                        : "bg-[#FAF9F5] text-[#1E2E20] border-[#E5E3DB] hover:border-[#23251E]/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold font-mono uppercase tracking-wider ${isSelected ? "text-[#C5A059]" : "text-[#8A1F1F]"}`}
                        >
                          {r.role}
                        </span>
                        {isSelected && (
                          <UserCheck size={14} className="text-[#C5A059]" />
                        )}
                      </div>
                      <p
                        className={`text-[11px] font-medium mt-1 leading-tight ${isSelected ? "text-white/90" : "text-[#1E2E20]"}`}
                      >
                        {r.defaultName}
                      </p>
                      <p
                        className={`text-[9.5px] mt-1 line-clamp-2 leading-relaxed ${isSelected ? "text-white/60" : "text-[#8C8A7D]"}`}
                      >
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security PIN input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
                2. Operator Security PIN / Auth Key
              </label>
              <span className="text-[10px] font-mono text-[#8C8A7D]">
                Dev Bypass Active (Leave blank or enter PIN)
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-digit security PIN..."
                className="w-full h-12 pl-10 pr-4 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-mono text-[#1E2E20] outline-none transition-colors"
              />
              <Lock
                size={16}
                className="absolute left-3.5 top-3.5 text-[#8C8A7D]"
              />
            </div>
            {errorMsg && (
              <p className="text-xs text-[#8A1F1F] font-mono mt-1.5 font-bold">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] text-xs font-mono uppercase tracking-wider text-[#8C8A7D] hover:text-[#1E2E20] transition-colors cursor-pointer"
              >
                Back to App
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-6 bg-[#23251E] hover:bg-[#32352B] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              <span>
                {isSubmitting
                  ? "Authenticating..."
                  : `Enter Studio as ${activeRoleConfig.role}`}
              </span>
              <ArrowRight size={14} className="text-[#C5A059]" />
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="bg-[#FAF9F5] border-t border-[#E5E3DB] p-4 px-6 text-center text-[10px] font-mono text-[#8C8A7D]">
          IDEMO Studio Operating Governance System • Zero Tracking • Local &
          Supabase Auth Sync
        </div>
      </div>
    </div>
  );
}
