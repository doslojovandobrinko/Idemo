import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { StudioRole, StudioUserSession, CANONICAL_STUDIO_ROLE_MAP } from './types';
import IdemoLogo from '../IdemoLogo';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabaseClient';

interface StudioAuthShellProps {
  onLoginSuccess: (session: StudioUserSession) => void;
  onCancel?: () => void;
}

interface RoleConfig {
  role: StudioRole;
  description: string;
  heroImage: string;
  defaultEmail: string;
}

const AVAILABLE_ROLES: RoleConfig[] = [
  {
    role: 'Super Admin',
    description: 'Full system control, release governance & security configuration',
    heroImage: '/src/assets/images/uvac_meanders_1778841048759.webp',
    defaultEmail: 'admin@idemo.travel'
  },
  {
    role: 'Curator',
    description: 'Lead destination curation, spatial mapping & vibe calibration',
    heroImage: '/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp',
    defaultEmail: 'curator@idemo.travel'
  },
  {
    role: 'Editor',
    description: 'Editorial content review, story vetting & observation inbox',
    heroImage: '/src/assets/images/golubac_fortress_danube_1778842880053.webp',
    defaultEmail: 'editor@idemo.travel'
  },
  {
    role: 'Translator',
    description: 'Multi-language localization, Cyrillic/Latin & Chinese glossaries',
    heroImage: '/src/assets/images/manasija_monastery_1778841065960.webp',
    defaultEmail: 'translator@idemo.travel'
  },
  {
    role: 'Partner Manager',
    description: 'Experience provider onboarding, verification & QR attribution',
    heroImage: '/src/assets/images/tara_national_park_forest_1778843961956.webp',
    defaultEmail: 'partners@idemo.travel'
  },
  {
    role: 'Release Manager',
    description: 'Destination package generation, SHA-256 verification & rollbacks',
    heroImage: '/src/assets/images/djerdap_gorge_danube_1778842863362.webp',
    defaultEmail: 'releases@idemo.travel'
  }
];

/**
 * Derives and validates an allowed StudioRole strictly from user.app_metadata.role.
 * Expects canonical machine role values (e.g. "super_admin", "editorial_lead", "curator", etc.).
 * Maps canonical machine values to human-readable StudioRole display types.
 * Never reads user_metadata, UI selections, or local storage.
 * Performs exact canonical lookup without role fallback, case-insensitive guessing, or fabricated sessions.
 */
export function parseAndValidateStudioRole(rawRole: unknown): StudioRole | null {
  if (!rawRole) return null;

  let roleStr = '';
  if (typeof rawRole === 'string') {
    roleStr = rawRole.trim();
  } else if (Array.isArray(rawRole) && rawRole.length > 0 && typeof rawRole[0] === 'string') {
    roleStr = rawRole[0].trim();
  } else {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(CANONICAL_STUDIO_ROLE_MAP, roleStr)) {
    return CANONICAL_STUDIO_ROLE_MAP[roleStr as keyof typeof CANONICAL_STUDIO_ROLE_MAP];
  }

  return null;
}

export function StudioAuthShell({ onLoginSuccess, onCancel }: StudioAuthShellProps) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [emailInput, setEmailInput] = useState(AVAILABLE_ROLES[0].defaultEmail);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRoleConfig = AVAILABLE_ROLES[selectedRoleIndex];

  const handleSelectRole = (idx: number) => {
    setSelectedRoleIndex(idx);
    setEmailInput(AVAILABLE_ROLES[idx].defaultEmail);
    setErrorMsg('');
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = emailInput.trim();
    const cleanPassword = passwordInput;

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Operator email and password are required.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMsg('Supabase environment is not configured. Authoritative Studio authentication requires Supabase.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Supabase client failed to initialize.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error || !data.user) {
        setErrorMsg(error?.message || 'Authentication failed. Please check credentials.');
        setIsSubmitting(false);
        return;
      }

      // Authoritative role derivation strictly from user.app_metadata.role
      const rawAppRole = data.user.app_metadata?.role;
      const derivedRole = parseAndValidateStudioRole(rawAppRole);

      if (!derivedRole) {
        setErrorMsg(`Access Denied: Account (${data.user.email}) lacks an authorized Studio role in user.app_metadata.role.`);
        setIsSubmitting(false);
        return;
      }

      const verifiedSession: StudioUserSession = {
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || (data.user.email ? data.user.email.split('@')[0] : derivedRole),
        role: derivedRole,
        authenticatedAt: new Date().toISOString()
      };

      onLoginSuccess(verifiedSession);
    } catch (err: any) {
      setErrorMsg(`Authentication exception: ${err?.message || String(err)}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F5] text-[#1E2E20] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-2xl bg-white border border-[#E5E3DB] rounded-3xl shadow-xl overflow-hidden relative">
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
            Authenticate with your Supabase Studio operator credentials to access editorial management and package controls.
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleAuthenticate} className="p-6 sm:p-8 space-y-6">
          {/* Operator Role Selector */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold mb-3">
              1. Select Operator Persona Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {AVAILABLE_ROLES.map((r, idx) => {
                const isSelected = selectedRoleIndex === idx;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(idx)}
                    className={`group rounded-2xl text-left border transition-all cursor-pointer flex flex-col overflow-hidden ${
                      isSelected
                        ? 'bg-[#23251E] text-white border-[#23251E] shadow-md ring-2 ring-[#C5A059]'
                        : 'bg-[#FAF9F5] text-[#1E2E20] border-[#E5E3DB] hover:border-[#23251E]/40'
                    }`}
                  >
                    {/* Panoramic Destination Hero Strip */}
                    <div className="relative w-full aspect-[16/6] overflow-hidden rounded-t-2xl bg-[#23251E]">
                      <img
                        src={r.heroImage}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold font-mono uppercase tracking-wider ${isSelected ? 'text-[#C5A059]' : 'text-[#8A1F1F]'}`}>
                          {r.role.toUpperCase()}
                        </span>
                        {isSelected && <UserCheck size={14} className="text-[#C5A059]" />}
                      </div>
                      <p className={`text-[10px] mt-1.5 leading-relaxed font-sans ${isSelected ? 'text-white/80' : 'text-[#8C8A7D]'}`}>
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
                  2. Operator Email
                </label>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="operator@idemo.travel"
                  required
                  className="w-full h-12 pl-10 pr-4 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-mono text-[#1E2E20] outline-none transition-colors"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-[#8C8A7D]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C8A7D] font-bold">
                  3. Operator Password
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter Supabase account password..."
                  required
                  className="w-full h-12 pl-10 pr-4 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-mono text-[#1E2E20] outline-none transition-colors"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-[#8C8A7D]" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-[#8A1F1F] font-mono font-bold bg-[#8A1F1F]/10 p-3 rounded-xl border border-[#8A1F1F]/20">
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
            ) : <div />}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-6 bg-[#23251E] hover:bg-[#32352B] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : `Sign In to Studio`}</span>
              <ArrowRight size={14} className="text-[#C5A059]" />
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="bg-[#FAF9F5] border-t border-[#E5E3DB] p-4 px-6 text-center text-[10px] font-mono text-[#8C8A7D]">
          IDEMO Studio Operating Governance System • Zero Tracking • Supabase Auth Sync
        </div>
      </div>
    </div>
  );
}

