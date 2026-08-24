import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  XCircle, 
  Image as ImageIcon, 
  MessageSquare, 
  ShieldAlert, 
  Clock,
  Sparkles,
  Lock,
  Building2,
  Check,
  AlertCircle
} from 'lucide-react';
import { StudioUserSession } from './types';
import { 
  fetchPartnerProfileReviewQueue, 
  adminReviewPartnerProfile, 
  PartnerProfileQueueItem, 
  PartnerProfileReviewStatusFilter 
} from '../../lib/partnerService';
import { getSupabaseClient } from '../../lib/supabaseClient';

interface StudioPassportReviewViewProps {
  session?: StudioUserSession;
}

export function StudioPassportReviewView({ session }: StudioPassportReviewViewProps) {
  const [statusFilter, setStatusFilter] = useState<PartnerProfileReviewStatusFilter>('pending_review');
  const [queue, setQueue] = useState<PartnerProfileQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  // Review Action Form State
  const [reviewNote, setReviewNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const roleStr = String(session?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  const isAuthorized = roleStr === 'editor' || roleStr === 'editoriallead' || roleStr === 'superadmin';

  const getStudioAccessToken = async (): Promise<string | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const loadQueue = async (filter: PartnerProfileReviewStatusFilter, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setActionFeedback(null);

    const token = await getStudioAccessToken();
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      setError({
        code: 'UNAUTHORIZED',
        message: 'Valid Studio authentication session required. Please sign in to IDEMO Studio.'
      });
      setQueue([]);
      setSelectedPartnerId(null);
      return;
    }

    const res = await fetchPartnerProfileReviewQueue(token, filter);

    setLoading(false);
    setRefreshing(false);

    if (!res.success) {
      setError({
        code: res.error || 'FETCH_ERROR',
        message: res.message || 'Failed to fetch Partner Passport review queue.'
      });
      setQueue([]);
      setSelectedPartnerId(null);
    } else {
      const profiles = res.profiles || [];
      setQueue(profiles);
      setError(null);
      
      // Retain previous selection if still in list, else pick first
      setSelectedPartnerId((prevId) => {
        if (prevId && profiles.some((p) => p.partner_id === prevId)) {
          return prevId;
        }
        return profiles.length > 0 ? profiles[0].partner_id : null;
      });
    }
  };

  useEffect(() => {
    loadQueue(statusFilter);
  }, [statusFilter]);

  const selectedProfile = useMemo(() => {
    return queue.find((p) => p.partner_id === selectedPartnerId) || null;
  }, [queue, selectedPartnerId]);

  // Reset review note when selected profile changes
  useEffect(() => {
    setReviewNote('');
    setActionFeedback(null);
  }, [selectedPartnerId]);

  const handleReviewAction = async (action: 'approve' | 'request_changes') => {
    if (!selectedProfile) return;

    if (!isAuthorized) {
      setActionFeedback({
        type: 'error',
        message: 'Administrative authorization required. Only Editorial Lead or Super Admin roles may review Partner Passports.'
      });
      return;
    }

    setActionLoading(true);
    setActionFeedback(null);

    const token = await getStudioAccessToken();
    if (!token) {
      setActionLoading(false);
      setActionFeedback({
        type: 'error',
        message: 'Valid Studio authentication token missing.'
      });
      return;
    }

    const trimmedNote = reviewNote.trim();
    if (action === 'request_changes' && !trimmedNote) {
      setActionLoading(false);
      setActionFeedback({
        type: 'error',
        message: 'A review note explaining requested changes is required when requesting changes.'
      });
      return;
    }

    const res = await adminReviewPartnerProfile(
      selectedProfile.partner_id,
      action,
      trimmedNote || undefined,
      token
    );

    setActionLoading(false);

    if (!res.success) {
      setActionFeedback({
        type: 'error',
        message: res.message || res.error || `Failed to perform ${action} on partner profile.`
      });
    } else {
      setActionFeedback({
        type: 'success',
        message: `Partner Passport submission for ${selectedProfile.partner_name} (${selectedProfile.partner_code}) successfully ${action === 'approve' ? 'approved and published' : 'returned for changes'}.`
      });
      setReviewNote('');
      // Refresh queue after action
      await loadQueue(statusFilter, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5E3DB] rounded-2xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-bold text-[#1E2E20] tracking-tight">
              Partner Passport Submissions
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E5E3DB] text-[#8C8A7D] font-bold">
              Queue: {queue.length}
            </span>
          </div>
          <p className="text-xs font-sans text-[#8C8A7D] mt-0.5">
            Editorial review desk for partner biography introductions, professional photography, and photo consent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 font-mono text-xs bg-[#FAF9F5] p-1 rounded-xl border border-[#E5E3DB]">
            {(
              [
                { id: 'pending_review', label: 'Pending' },
                { id: 'changes_requested', label: 'Changes Req.' },
                { id: 'approved', label: 'Approved' },
                { id: 'all', label: 'All' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[#23251E] text-white shadow-xs'
                    : 'text-[#8C8A7D] hover:text-[#1E2E20]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadQueue(statusFilter, true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-[#FAF9F5] border border-[#E5E3DB] text-[#1E2E20] hover:bg-[#E5E3DB]/30 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Queue"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#C5A059]' : ''} />
          </button>
        </div>
      </div>

      {/* Authorization Warning Banner if not authorized */}
      {!isAuthorized && session && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
          <ShieldAlert size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Access:</strong> Your role ({session.role}) can view Passport submissions but cannot approve or request changes. Only <strong>editorial_lead</strong> or <strong>super_admin</strong> may perform review actions.
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span><strong>{error.code}:</strong> {error.message}</span>
          </div>
          <button
            onClick={() => loadQueue(statusFilter, true)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-mono font-bold text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue List */}
        <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E3DB] text-xs font-mono text-[#8C8A7D]">
              <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-[#C5A059]" />
              Loading Partner Passport review queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E3DB] text-xs font-mono text-[#8C8A7D]">
              No Partner Passport submissions found for status <span className="font-bold text-[#1E2E20]">"{statusFilter}"</span>.
            </div>
          ) : (
            queue.map((item) => {
              const isSelected = item.partner_id === selectedPartnerId;
              const isPending = item.review_status === 'pending_review';
              const isApprovedStatus = item.review_status === 'approved';

              return (
                <div
                  key={item.partner_id}
                  onClick={() => setSelectedPartnerId(item.partner_id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#23251E] shadow-sm ring-1 ring-[#23251E]/10'
                      : 'bg-[#FAF9F5] border-[#E5E3DB] hover:border-[#23251E]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#1E2E20] text-sm truncate max-w-[170px]">
                        {item.partner_name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#23251E]/5 font-bold text-[#23251E] shrink-0">
                        {item.partner_code}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border shrink-0 ${
                        isApprovedStatus
                          ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                          : isPending
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}
                    >
                      {item.review_status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Intro Snippet */}
                  <p className="mt-2 text-xs font-sans text-[#8C8A7D] line-clamp-2 italic">
                    "{item.introduction_draft || 'No introduction draft provided.'}"
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#E5E3DB]/60 flex items-center justify-between text-[10px] font-mono text-[#8C8A7D]">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Photo indicator */}
                      <span className={`flex items-center gap-1 font-bold ${item.photo_available ? 'text-emerald-700' : 'text-[#8C8A7D]'}`}>
                        <ImageIcon size={11} />
                        {item.photo_available ? 'Photo Available' : 'No Photo'}
                      </span>

                      {/* Consent badge */}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.photo_consent_given && !item.photo_consent_withdrawn
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.photo_consent_given && !item.photo_consent_withdrawn ? 'Consent' : 'No Consent'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Review Panel */}
        <div className="lg:col-span-2">
          {!selectedProfile ? (
            <div className="bg-white border border-[#E5E3DB] rounded-3xl p-12 text-center text-xs font-mono text-[#8C8A7D] h-full flex flex-col items-center justify-center">
              <FileCheck size={32} className="text-[#8C8A7D]/40 mb-3" />
              Select a partner passport submission from the queue to review.
            </div>
          ) : (
            <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E3DB] pb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8A7D] font-bold">
                      Partner Code: {selectedProfile.partner_code}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8A7D]">
                      ID: {selectedProfile.partner_id}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#1E2E20] mt-0.5">
                    {selectedProfile.partner_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E5E3DB] font-bold text-[#1E2E20]">
                    v{selectedProfile.content_version}
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                    selectedProfile.review_status === 'approved'
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                      : selectedProfile.review_status === 'pending_review'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}>
                    {selectedProfile.review_status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Submission Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E3DB] text-xs font-mono">
                <div>
                  <span className="text-[#8C8A7D] block text-[10px] uppercase font-bold">Submitted</span>
                  <span className="text-[#1E2E20] font-semibold">
                    {selectedProfile.submitted_at ? new Date(selectedProfile.submitted_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C8A7D] block text-[10px] uppercase font-bold">Photo Consent</span>
                  <span className={`font-bold ${selectedProfile.photo_consent_given && !selectedProfile.photo_consent_withdrawn ? 'text-emerald-700' : 'text-red-700'}`}>
                    {selectedProfile.photo_consent_given ? (selectedProfile.photo_consent_withdrawn ? 'Consent Withdrawn' : 'Granted') : 'Not Granted'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C8A7D] block text-[10px] uppercase font-bold">Word Count</span>
                  <span className="text-[#1E2E20] font-semibold">
                    {selectedProfile.introduction_word_count} words
                  </span>
                </div>
              </div>

              {/* Photo Preview & Consent */}
              <div className="space-y-2">
                <h4 className="font-serif text-sm font-bold text-[#1E2E20] flex items-center gap-2">
                  <ImageIcon size={15} className="text-[#C5A059]" />
                  <span>Professional Portrait Photo</span>
                </h4>

                {selectedProfile.photo_available && selectedProfile.photo_url ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB]">
                    <img
                      src={selectedProfile.photo_url}
                      alt={selectedProfile.partner_name}
                      referrerPolicy="no-referrer"
                      className="w-28 h-28 object-cover rounded-xl border border-[#E5E3DB] shadow-xs shrink-0"
                    />
                    <div className="text-xs font-sans text-[#1E2E20] space-y-1">
                      <p className="font-semibold text-emerald-800 flex items-center gap-1.5 font-mono text-[11px]">
                        <CheckCircle2 size={13} />
                        Signed image URL generated & validated
                      </p>
                      <p className="text-[#8C8A7D] text-[11px]">
                        Consent verified: {selectedProfile.photo_consent_given ? 'Subject provided explicit consent for publication.' : 'Consent pending.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB] text-xs font-mono text-[#8C8A7D] flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#8C8A7D]/60 shrink-0" />
                    <span>
                      {!selectedProfile.photo_available
                        ? 'No professional photo uploaded in draft.'
                        : selectedProfile.photo_consent_withdrawn
                        ? 'Photo consent was explicitly withdrawn by partner.'
                        : 'Photo provided without required consent.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Biography / Introduction Draft */}
              <div className="space-y-2">
                <h4 className="font-serif text-sm font-bold text-[#1E2E20] flex items-center gap-2">
                  <MessageSquare size={15} className="text-[#C5A059]" />
                  <span>Biography & Introduction Draft</span>
                </h4>

                <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB] text-xs font-sans text-[#1E2E20] leading-relaxed whitespace-pre-wrap">
                  {selectedProfile.introduction_draft ? (
                    selectedProfile.introduction_draft
                  ) : (
                    <span className="text-[#8C8A7D] italic">No introduction draft submitted.</span>
                  )}
                </div>

                {/* Published Version Comparison if available */}
                {selectedProfile.introduction_published && (
                  <div className="mt-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60 text-xs font-sans text-blue-950 space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                      Currently Published Version:
                    </span>
                    <p className="italic text-blue-900 leading-relaxed text-[11.5px]">
                      "{selectedProfile.introduction_published}"
                    </p>
                  </div>
                )}
              </div>

              {/* Previous Review Note if exists */}
              {selectedProfile.reviewer_note && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs font-mono text-amber-900 space-y-0.5">
                  <span className="font-bold text-[10px] uppercase text-amber-800">Previous Reviewer Note:</span>
                  <p>{selectedProfile.reviewer_note}</p>
                </div>
              )}

              {/* Action Feedback Message */}
              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                    actionFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {actionFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              {/* Review Actions Form */}
              <div className="pt-4 border-t border-[#E5E3DB] space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1E2E20] mb-1">
                    Review Note / Feedback (Optional for Approval, Required for Requesting Changes):
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter notes or explanation for requested changes..."
                    rows={3}
                    disabled={actionLoading || !isAuthorized}
                    className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none focus:border-[#23251E] disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 font-mono text-xs">
                  <button
                    onClick={() => handleReviewAction('request_changes')}
                    disabled={actionLoading || !isAuthorized}
                    className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                  >
                    <XCircle size={15} className="text-amber-700" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('approve')}
                    disabled={actionLoading || !isAuthorized}
                    className="px-5 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-95 shadow-xs"
                  >
                    <CheckCircle2 size={15} className="text-[#C5A059]" />
                    <span>Approve & Publish Passport</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
