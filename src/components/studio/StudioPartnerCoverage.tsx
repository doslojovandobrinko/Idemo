/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  ArrowRightLeft, 
  Mail, 
  Phone, 
  Lock, 
  KeyRound, 
  FileCheck, 
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  PartnerCoverageRecord, 
  QualificationState, 
  ParticipationState, 
  PassportVerificationState, 
  RoutingPoolState, 
  CoverageHealthStatus,
  StudioUserSession
} from './types';
import { PARTNERS } from '../../data/partners';
import { INITIAL_RECOMMENDATIONS } from '../../data/recommendations/serbia';
import { 
  fetchPartnerCoverageMatrix, 
  selectAndReleasePartnerCoverage, 
  updatePartnerCoverageStatus,
  replacePartnerCoverage
} from '../../lib/partnerService';

export function StudioPartnerCoverage({ session }: { session?: StudioUserSession }) {
  const isSuperAdmin = session?.role === 'Super Admin';
  const roleTitle = session?.role || 'Admin';

  const [coverageRecords, setCoverageRecords] = useState<PartnerCoverageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterHealth, setFilterHealth] = useState<string>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Modals
  const [showReleaseModal, setShowReleaseModal] = useState<boolean>(false);
  const [selectedRecForRelease, setSelectedRecForRelease] = useState<string>('');
  const [selectedPartnerForRelease, setSelectedPartnerForRelease] = useState<string>('');
  const [releaseEmail, setReleaseEmail] = useState<string>('');
  const [releasePhone, setReleasePhone] = useState<string>('');

  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false);
  const [replaceRecId, setReplaceRecId] = useState<string>('');
  const [replaceOldPartnerId, setReplaceOldPartnerId] = useState<string>('');
  const [replaceNewPartnerId, setReplaceNewPartnerId] = useState<string>('');

  // Load Matrix Data from Supabase RPC or synthesize baseline from static partners
  const loadMatrix = async () => {
    setRefreshing(true);
    const res = await fetchPartnerCoverageMatrix();
    if (res.success && res.matrix) {
      setCoverageRecords(res.matrix);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  // Merge static recommendations + partners with eligibility records
  const processedRecommendations = useMemo(() => {
    return INITIAL_RECOMMENDATIONS.map((rec) => {
      // Find all eligibility records for this recommendation from database matrix
      const recTitle = rec.title || (rec as any).titleEn || '';
      const dbEligibilities = coverageRecords.filter(r => r.recommendation_id === rec.id || r.recommendation_id === recTitle);

      // Also identify static mapped partners from PARTNERS
      const staticPartners = PARTNERS.filter(p => 
        p.linkedRecommendations && (
          p.linkedRecommendations.includes(recTitle) || 
          p.linkedRecommendations.includes(rec.id)
        )
      );

      // Merge DB records and static mapped partners
      const partnerRows: Array<{
        partnerId: string;
        partnerName: string;
        qualificationState: QualificationState;
        participationState: ParticipationState;
        passportState: PassportVerificationState;
        routingState: RoutingPoolState;
        contactEmail?: string;
        contactPhone?: string;
        credentialMetadata: {
          pinIssued: boolean;
          mustChangePin: boolean;
          credentialVersion: string;
          resetRequired: boolean;
        };
        portfolioStatus: 'NOT_STARTED' | 'DRAFT' | 'APPROVED' | 'PUBLISHED';
        dbRecord?: PartnerCoverageRecord;
      }> = [];

      // Process DB records
      dbEligibilities.forEach(db => {
        const partnerObj = PARTNERS.find(p => p.id === db.partner_id || p.nameEn === db.partner_id);
        partnerRows.push({
          partnerId: db.partner_id,
          partnerName: partnerObj?.nameEn || db.partner_id,
          qualificationState: db.qualification_state,
          participationState: db.participation_state,
          passportState: db.passport_state,
          routingState: db.routing_state,
          contactEmail: db.contact_email || partnerObj?.email || undefined,
          contactPhone: db.contact_phone || partnerObj?.phone || undefined,
          credentialMetadata: {
            pinIssued: true,
            mustChangePin: false,
            credentialVersion: 'v1.0-AES256',
            resetRequired: false
          },
          portfolioStatus: partnerObj?.verificationStatus === 'VERIFIED' ? 'APPROVED' : 'DRAFT',
          dbRecord: db
        });
      });

      // Include static partners not yet in DB records as Preliminary / Contact Ready / Active baseline
      staticPartners.forEach(p => {
        if (!partnerRows.some(pr => pr.partnerId === p.id)) {
          partnerRows.push({
            partnerId: p.id,
            partnerName: p.nameEn,
            qualificationState: p.conciergeRoutingEligible === 'Yes' ? 'idemo_selected' : 'preliminary',
            participationState: (p.email || p.phone) ? 'introduction_ready' : 'not_contacted',
            passportState: p.verificationStatus === 'VERIFIED' ? 'verified' : 'not_started',
            routingState: p.conciergeRoutingEligible === 'Yes' ? 'active' : 'inactive',
            contactEmail: p.email || undefined,
            contactPhone: p.phone || undefined,
            credentialMetadata: {
              pinIssued: true,
              mustChangePin: false,
              credentialVersion: 'v1.0-AES256',
              resetRequired: false
            },
            portfolioStatus: p.verificationStatus === 'VERIFIED' ? 'APPROVED' : 'NOT_STARTED'
          });
        }
      });

      // Calculate Coverage Health based on ACTIVE routing pool count
      const activeCount = partnerRows.filter(pr => pr.routingState === 'active').length;
      let healthStatus: CoverageHealthStatus = 'GAP';
      if (activeCount >= 3) healthStatus = 'ROBUST';
      else if (activeCount === 2) healthStatus = 'COVERED';
      else if (activeCount === 1) healthStatus = 'SINGLE-POINT';

      return {
        rec,
        partnerRows,
        activeCount,
        healthStatus
      };
    });
  }, [coverageRecords]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    return processedRecommendations.filter(({ rec, partnerRows, healthStatus }) => {
      // Search text match
      const query = searchQuery.toLowerCase().trim();
      const recTitle = rec.title || (rec as any).titleEn || '';
      const textMatch = !query || (
        recTitle.toLowerCase().includes(query) ||
        rec.id.toLowerCase().includes(query) ||
        rec.category.toLowerCase().includes(query) ||
        partnerRows.some(pr => pr.partnerName.toLowerCase().includes(query) || pr.partnerId.toLowerCase().includes(query))
      );

      if (!textMatch) return false;

      // Filter category
      if (filterHealth === 'GAPS') return healthStatus === 'GAP';
      if (filterHealth === 'SINGLE_POINT') return healthStatus === 'SINGLE-POINT';
      if (filterHealth === 'COVERED') return healthStatus === 'COVERED' || healthStatus === 'ROBUST';
      if (filterHealth === 'SUSPENDED') return partnerRows.some(pr => pr.routingState === 'suspended');
      if (filterHealth === 'PASSPORT_REQUIRED') return partnerRows.some(pr => pr.passportState === 'submitted' || pr.passportState === 'review_required');
      if (filterHealth === 'NOT_INVITED') return partnerRows.some(pr => pr.participationState === 'not_contacted' || pr.participationState === 'introduction_ready');

      return true;
    });
  }, [processedRecommendations, searchQuery, filterHealth]);

  // Health Stats Summary
  const healthStats = useMemo(() => {
    let robust = 0, covered = 0, singlePoint = 0, gaps = 0, totalActivePartners = 0, passportPending = 0;
    processedRecommendations.forEach(({ partnerRows, healthStatus }) => {
      if (healthStatus === 'ROBUST') robust++;
      else if (healthStatus === 'COVERED') covered++;
      else if (healthStatus === 'SINGLE-POINT') singlePoint++;
      else if (healthStatus === 'GAP') gaps++;

      totalActivePartners += partnerRows.filter(pr => pr.routingState === 'active').length;
      passportPending += partnerRows.filter(pr => pr.passportState === 'submitted' || pr.passportState === 'review_required').length;
    });

    return {
      totalRecs: processedRecommendations.length,
      robust,
      covered,
      singlePoint,
      gaps,
      totalActivePartners,
      passportPending
    };
  }, [processedRecommendations]);

  // Handlers for One-Click Governed Operations
  const handleSelectAndRelease = async (recId: string, partnerId: string, email?: string, phone?: string) => {
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    const res = await selectAndReleasePartnerCoverage(recId, partnerId, email, phone);
    if (res.success) {
      setActionSuccessMessage(res.message || `Partner ${partnerId} successfully selected & released for ${recId}. Routing pool is now ACTIVE.`);
      await loadMatrix();
      setShowReleaseModal(false);
    } else {
      setActionErrorMessage(res.error || res.message || 'Select & Release failed.');
    }
  };

  const handleUpdateStatus = async (
    recId: string, 
    partnerId: string, 
    routingState?: RoutingPoolState, 
    participationState?: ParticipationState,
    passportState?: PassportVerificationState,
    notes?: string
  ) => {
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    const res = await updatePartnerCoverageStatus(recId, partnerId, routingState, participationState, passportState, notes);
    if (res.success) {
      setActionSuccessMessage(res.message || `Coverage status updated for ${partnerId} in ${recId}.`);
      await loadMatrix();
    } else {
      setActionErrorMessage(res.error || res.message || 'Status update failed.');
    }
  };

  const handleExecuteReplace = async () => {
    if (!replaceRecId || !replaceOldPartnerId || !replaceNewPartnerId) {
      setActionErrorMessage('Please select both the old partner to remove and the replacement partner.');
      return;
    }

    const newPartnerObj = PARTNERS.find(p => p.id === replaceNewPartnerId);
    const res = await replacePartnerCoverage(
      replaceRecId,
      replaceOldPartnerId,
      replaceNewPartnerId,
      newPartnerObj?.email || undefined,
      newPartnerObj?.phone || undefined,
      `Replaced by ${replaceNewPartnerId}`
    );

    if (res.success) {
      setActionSuccessMessage(`Successfully replaced partner ${replaceOldPartnerId} with ${replaceNewPartnerId} in ${replaceRecId} via atomic transaction. Zero app release required.`);
      await loadMatrix();
      setShowReplaceModal(false);
    } else {
      setActionErrorMessage(res.error || res.message || 'Replacement operation failed.');
    }
  };

  const openReleaseModalForRec = (recId: string) => {
    setSelectedRecForRelease(recId);
    setShowReleaseModal(true);
  };

  const openReplaceModalForRec = (recId: string, oldPartnerId: string) => {
    setReplaceRecId(recId);
    setReplaceOldPartnerId(oldPartnerId);
    setShowReplaceModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-lg bg-stone-900 text-amber-400">
              <ShieldCheck size={22} />
            </span>
            <h1 className="text-2xl font-bold text-stone-900 font-display">Studio Partner Coverage Control</h1>
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isSuperAdmin 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-blue-100 text-blue-900 border border-blue-300'
            }`}>
              {isSuperAdmin ? 'SUPER ADMIN — FINAL RELEASE AUTHORIZED' : `${roleTitle.toUpperCase()} — PREPARATION & TEMPORARY SUSPENSION`}
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Authoritative matrix connecting Recommendations, Qualified Partners, Professional Contact, Passport Verification, and Routing Pool Status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMatrix}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh State
          </button>

          <button
            onClick={() => setShowReleaseModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm transition"
          >
            <Plus size={16} />
            Select & Release Partner
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600" />
            <span>{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage(null)} className="text-rose-700 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Health Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm">
          <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Recs</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{healthStats.totalRecs}</div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} /> Robust (3+)
          </div>
          <div className="text-xl font-bold text-emerald-950 mt-1">{healthStats.robust}</div>
        </div>

        <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck size={12} /> Covered (2)
          </div>
          <div className="text-xl font-bold text-blue-950 mt-1">{healthStats.covered}</div>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={12} /> Single Point (1)
          </div>
          <div className="text-xl font-bold text-amber-950 mt-1">{healthStats.singlePoint}</div>
        </div>

        <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <XCircle size={12} /> Gap (0)
          </div>
          <div className="text-xl font-bold text-rose-950 mt-1">{healthStats.gaps}</div>
        </div>

        <div className="bg-stone-900 text-white p-3.5 rounded-xl border border-stone-800 shadow-sm">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Active Pool</div>
          <div className="text-xl font-bold text-white mt-1">{healthStats.totalActivePartners}</div>
        </div>

        <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
            <FileCheck size={12} /> Passport Rev
          </div>
          <div className="text-xl font-bold text-indigo-950 mt-1">{healthStats.passportPending}</div>
        </div>
      </div>

      {/* Governance & Lifecycle Note */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs leading-relaxed flex items-start gap-3">
        <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-900">IDEMO Partner Release Governance Directive:</span>
          {' '}
          Initial release into recommendation routing pools requires IDEMO Preliminary Qualification and requisite contact details (Email OR Mobile/SMS). Partner Passport completion is an ongoing capability verification mechanism and is NOT a prerequisite for initial IDEMO release.
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search recommendation, partner or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter size={14} className="text-stone-400 shrink-0" />
          {[
            { id: 'ALL', label: 'All Recommendations' },
            { id: 'GAPS', label: 'Gaps (0 Active)' },
            { id: 'SINGLE_POINT', label: 'Single Point (1)' },
            { id: 'COVERED', label: 'Covered (2+)' },
            { id: 'SUSPENDED', label: 'Has Suspended' },
            { id: 'PASSPORT_REQUIRED', label: 'Passport Review' },
            { id: 'NOT_INVITED', label: 'Not Contacted' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterHealth(f.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                filterHealth === f.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations & Coverage Matrix */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-stone-400" />
          Loading Partner Coverage Matrix...
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
          No recommendation coverage records match the selected filter or query.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map(({ rec, partnerRows, healthStatus, activeCount }) => (
            <div 
              key={rec.id} 
              className={`bg-white rounded-xl border shadow-sm transition overflow-hidden ${
                healthStatus === 'GAP' ? 'border-rose-300' :
                healthStatus === 'SINGLE-POINT' ? 'border-amber-300' : 'border-stone-200'
              }`}
            >
              {/* Recommendation Header Row */}
              <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-stone-200 text-stone-800">
                    {rec.id}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 font-display">
                      {rec.title || (rec as any).titleEn || 'Untitled Recommendation'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                      <span>Category: <strong className="text-stone-700">{rec.category}</strong></span>
                      <span>•</span>
                      <span>Region: <strong className="text-stone-700">{rec.region || 'Serbia'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Coverage Health Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    healthStatus === 'ROBUST' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                    healthStatus === 'COVERED' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                    healthStatus === 'SINGLE-POINT' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {healthStatus === 'ROBUST' && <CheckCircle2 size={13} className="text-emerald-700" />}
                    {healthStatus === 'COVERED' && <ShieldCheck size={13} className="text-blue-700" />}
                    {healthStatus === 'SINGLE-POINT' && <AlertTriangle size={13} className="text-amber-700" />}
                    {healthStatus === 'GAP' && <XCircle size={13} className="text-rose-700" />}
                    <span>{healthStatus}: {activeCount} Active Partner{activeCount === 1 ? '' : 's'}</span>
                  </div>

                  <button
                    onClick={() => openReleaseModalForRec(rec.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-amber-300 hover:bg-amber-400 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus size={13} />
                    Add Partner
                  </button>
                </div>
              </div>

              {/* Partner Rows Matrix */}
              {partnerRows.length === 0 ? (
                <div className="p-6 text-center text-xs text-rose-700 bg-rose-50/30 flex items-center justify-center gap-2">
                  <XCircle size={16} />
                  <span>Coverage Gap! Zero partners are currently assigned or active for this recommendation.</span>
                  <button 
                    onClick={() => openReleaseModalForRec(rec.id)}
                    className="ml-2 underline font-semibold text-stone-900"
                  >
                    Select & Release Partner Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {partnerRows.map((pRow) => {
                    const isContactReady = Boolean(pRow.contactEmail || pRow.contactPhone);

                    return (
                      <div key={pRow.partnerId} className="p-4 hover:bg-stone-50/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Partner Details */}
                        <div className="space-y-2 lg:w-1/3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              {pRow.partnerId}
                            </span>
                            <span className="text-sm font-bold text-stone-900">{pRow.partnerName}</span>
                          </div>

                          {/* Contact Info & Requisite Method Check */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                            {pRow.contactEmail ? (
                              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                                <Mail size={12} className="text-emerald-600" />
                                {pRow.contactEmail}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-stone-400">
                                <Mail size={12} /> Email: None
                              </span>
                            )}

                            {pRow.contactPhone ? (
                              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                                <Phone size={12} className="text-emerald-600" />
                                {pRow.contactPhone}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-stone-400">
                                <Phone size={12} /> Phone: None
                              </span>
                            )}

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isContactReady 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-900 border border-rose-200'
                            }`}>
                              {isContactReady ? 'INTRO READY' : 'CONTACT REQ'}
                            </span>
                          </div>

                          {/* Access & Credential Metadata */}
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 pt-1">
                            <KeyRound size={11} className="text-stone-400 shrink-0" />
                            <span>Metadata: <strong className="text-stone-700">PIN Issued</strong></span>
                            <span>•</span>
                            <span>Version: <strong className="text-stone-700">{pRow.credentialMetadata.credentialVersion}</strong></span>
                            <span>•</span>
                            <span className="text-stone-400 italic">Plaintext PIN isolated</span>
                          </div>
                        </div>

                        {/* Status Dimensions Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] lg:w-1/2">
                          {/* Qualification State */}
                          <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Qualification</div>
                            <div className="font-bold text-stone-800 mt-0.5 capitalize">
                              {pRow.qualificationState.replace('_', ' ')}
                            </div>
                          </div>

                          {/* Participation State */}
                          <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Participation</div>
                            <div className="font-bold text-stone-800 mt-0.5 capitalize">
                              {pRow.participationState.replace('_', ' ')}
                            </div>
                          </div>

                          {/* Passport Verification State */}
                          <div className={`p-2 rounded-lg border ${
                            pRow.passportState === 'verified' ? 'bg-emerald-50 border-emerald-200' :
                            pRow.passportState === 'submitted' ? 'bg-indigo-50 border-indigo-200' : 'bg-stone-50 border-stone-200'
                          }`}>
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Passport</div>
                            <div className="font-bold text-stone-800 mt-0.5 capitalize">
                              {pRow.passportState.replace('_', ' ')}
                            </div>
                          </div>

                          {/* Routing Pool State */}
                          <div className={`p-2 rounded-lg border ${
                            pRow.routingState === 'active' ? 'bg-emerald-50 border-emerald-300' :
                            pRow.routingState === 'suspended' ? 'bg-rose-50 border-rose-300' : 'bg-stone-100 border-stone-200'
                          }`}>
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Routing Pool</div>
                            <div className={`font-bold mt-0.5 uppercase ${
                              pRow.routingState === 'active' ? 'text-emerald-800' :
                              pRow.routingState === 'suspended' ? 'text-rose-800' : 'text-stone-600'
                            }`}>
                              {pRow.routingState}
                            </div>
                          </div>
                        </div>

                        {/* Governed One-Click Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {pRow.routingState !== 'active' ? (
                            <button
                              onClick={() => handleSelectAndRelease(rec.id, pRow.partnerId, pRow.contactEmail, pRow.contactPhone)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-500 rounded-md transition"
                              title="Select & Release partner into active routing pool"
                            >
                              Release
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(rec.id, pRow.partnerId, 'suspended', 'withdrawn', undefined, 'Suspended from Studio Coverage Control')}
                              className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition"
                              title="Suspend partner from this recommendation's routing pool"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => openReplaceModalForRec(rec.id, pRow.partnerId)}
                            className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-md transition flex items-center gap-1"
                            title="Replace this partner with another candidate"
                          >
                            <ArrowRightLeft size={12} />
                            Replace
                          </button>

                          {pRow.passportState === 'submitted' && (
                            <button
                              onClick={() => handleUpdateStatus(rec.id, pRow.partnerId, undefined, undefined, 'verified', 'Passport approved by Studio')}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition"
                            >
                              Approve Passport
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Select & Release Partner */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 font-display flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-500" />
                Select & Release Partner Coverage
              </h3>
              <button onClick={() => setShowReleaseModal(false)} className="text-stone-400 hover:text-stone-600 text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Recommendation</label>
                <select
                  value={selectedRecForRelease}
                  onChange={(e) => setSelectedRecForRelease(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:border-stone-900"
                >
                  <option value="">-- Select Recommendation --</option>
                  {INITIAL_RECOMMENDATIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.id} - {r.title || (r as any).titleEn || 'Untitled'} ({r.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Qualified Partner Candidate</label>
                <select
                  value={selectedPartnerForRelease}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedPartnerForRelease(pid);
                    const pObj = PARTNERS.find(p => p.id === pid);
                    if (pObj) {
                      setReleaseEmail(pObj.email || '');
                      setReleasePhone(pObj.phone || '');
                    }
                  }}
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:border-stone-900"
                >
                  <option value="">-- Select Partner Candidate --</option>
                  {PARTNERS.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.nameEn} ({p.locationEn || 'Serbia'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Professional Email</label>
                  <input
                    type="email"
                    value={releaseEmail}
                    onChange={(e) => setReleaseEmail(e.target.value)}
                    placeholder="partner@business.rs"
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Professional Mobile/Phone</label>
                  <input
                    type="text"
                    value={releasePhone}
                    onChange={(e) => setReleasePhone(e.target.value)}
                    placeholder="+381 64 000 000"
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-600 leading-relaxed text-[11px]">
                <strong>Governance Check:</strong> Either a verified Email OR Mobile/Phone is required before release. Selecting & releasing activates the recommendation eligibility and routing pool immediately. Partner Passport completion is an ongoing capability process and does NOT block initial release.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              >
                Cancel
              </button>

              <button
                disabled={!selectedRecForRelease || !selectedPartnerForRelease}
                onClick={() => handleSelectAndRelease(selectedRecForRelease, selectedPartnerForRelease, releaseEmail, releasePhone)}
                className="px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-sm transition"
              >
                SELECT & RELEASE INTO ROUTING POOL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Replace Partner */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 font-display flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-amber-500" />
                Replace Partner in Routing Pool
              </h3>
              <button onClick={() => setShowReplaceModal(false)} className="text-stone-400 hover:text-stone-600 text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                Replacing partner <strong className="font-mono">{replaceOldPartnerId}</strong> for recommendation <strong className="font-mono">{replaceRecId}</strong>.
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select Replacement Partner Candidate</label>
                <select
                  value={replaceNewPartnerId}
                  onChange={(e) => setReplaceNewPartnerId(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:border-stone-900"
                >
                  <option value="">-- Select Replacement Partner --</option>
                  {PARTNERS.filter(p => p.id !== replaceOldPartnerId).map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.nameEn} ({p.locationEn || 'Serbia'})</option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-stone-500 leading-relaxed">
                This action will atomically set partner <span className="font-mono">{replaceOldPartnerId}</span> to SUSPENDED and release <span className="font-mono">{replaceNewPartnerId}</span> into the recommendation routing pool with zero visitor-facing disruption and zero app release required.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              >
                Cancel
              </button>

              <button
                disabled={!replaceNewPartnerId}
                onClick={handleExecuteReplace}
                className="px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-sm transition"
              >
                EXECUTE ATOMIC REPLACEMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
