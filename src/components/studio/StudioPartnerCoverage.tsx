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
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  ArrowRightLeft, 
  Compass, 
  Users, 
  X,
  ExternalLink,
  Award,
  Sparkles,
  Layers,
  MapPin,
  BarChart3,
  Eye,
  Mail,
  Handshake
} from 'lucide-react';
import { 
  fetchMatrixOperationalStatistics, 
  RecommendationMatrixStats 
} from '../../lib/recommendationStatsService';
import { 
  PartnerCoverageRecord, 
  QualificationState, 
  ParticipationState, 
  PassportVerificationState, 
  RoutingPoolState, 
  CoverageHealthStatus,
  PartnerCoverageViewMode,
  StudioUserSession
} from './types';
import { PARTNERS } from '../../data/partners';
import { INITIAL_RECOMMENDATIONS } from '../../data/recommendations/serbia';
import { Partner, Recommendation } from '../../types';
import { 
  fetchPartnerCoverageMatrix, 
  selectAndReleasePartnerCoverage, 
  updatePartnerCoverageStatus,
  replacePartnerCoverage,
  setPartnerCoveragePriorityRank,
  getPartnerCoveragePriorityRank,
  getPartnerCoverageQuota,
  getPartnerFitAnalysis,
  CANONICAL_REGIONS
} from '../../lib/partnerService';
import { getAllPartners, getPartnerLifecycleState } from '../../lib/partnerLifecycleService';
import { safeStorage } from '../../lib/safeStorage';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { PartnerEditorModal } from './PartnerEditorModal';
import { RecommendationEditorModal } from './RecommendationEditorModal';

// Authoritative partner display information resolver adhering to SSOT
export function resolvePartnerDisplayInfo(
  partnerId: string, 
  partnerObj?: Partner, 
  dbRecord?: PartnerCoverageRecord
): {
  partnerCode: string;
  partnerName: string;
  priorityRank?: number;
  tierLabel?: string;
} {
  const normId = (partnerId || '').toLowerCase().trim();
  const dbCode = dbRecord?.partner_code;
  const dbName = dbRecord?.partner_name;
  const dbRank = dbRecord?.priority_rank;

  // 1. Prefer database record fields if available
  if (dbCode || dbName) {
    return {
      partnerCode: dbCode || partnerId,
      partnerName: dbName || dbCode || partnerId,
      priorityRank: dbRank && dbRank <= 3 ? dbRank : undefined,
      tierLabel: dbRank && dbRank <= 3 ? `Tier ${dbRank}` : undefined
    };
  }

  // 2. Authoritative test partner mapping adhering to SSOT
  if (normId === 'a0000000-0000-0000-0000-000000000099' || dbCode === 'IDEMO') {
    return {
      partnerCode: 'IDEMO',
      partnerName: 'IDEMO — Universal Concierge & Partner',
      priorityRank: dbRank && dbRank <= 3 ? dbRank : undefined,
      tierLabel: dbRank && dbRank <= 3 ? `Tier ${dbRank}` : undefined
    };
  }
  if (normId === 'a0000000-0000-0000-0000-000000000091' || dbCode === 'UNO1') {
    return {
      partnerCode: 'UNO1',
      partnerName: 'UNO1 — Ethno Village Sunčana Reka',
      priorityRank: dbRank || 2,
      tierLabel: 'Tier 2 • Secondary'
    };
  }
  if (normId === 'a0000000-0000-0000-0000-000000000092' || dbCode === 'UNO2') {
    return {
      partnerCode: 'UNO2',
      partnerName: 'UNO2 — Transfer & Adventure Specialist',
      priorityRank: dbRank || 3,
      tierLabel: 'Tier 3 • Tertiary'
    };
  }
  if (normId === 'a0000000-0000-0000-0000-000000000093' || dbCode === 'UNO3') {
    return {
      partnerCode: 'UNO3',
      partnerName: 'UNO3 — Universal Test Partner 3',
      priorityRank: dbRank || 3,
      tierLabel: 'Tier 3 • Tertiary'
    };
  }

  // 2. Static partner lookup
  if (partnerObj) {
    return {
      partnerCode: partnerObj.id,
      partnerName: partnerObj.nameEn,
      priorityRank: dbRank,
      tierLabel: dbRank ? `Tier ${dbRank}` : undefined
    };
  }

  // 3. DB record fields if available
  if (dbCode || dbName) {
    return {
      partnerCode: dbCode || partnerId,
      partnerName: dbName || dbCode || partnerId,
      priorityRank: dbRank,
      tierLabel: dbRank ? `Tier ${dbRank}` : undefined
    };
  }

  // 4. Default fallback
  return {
    partnerCode: partnerId.length > 12 ? partnerId.slice(0, 8) + '...' : partnerId,
    partnerName: partnerId,
    priorityRank: dbRank,
    tierLabel: dbRank ? `Tier ${dbRank}` : undefined
  };
}

export function resolveDefaultPartnerPin(
  partnerId: string, 
  partnerName?: string, 
  partnerObj?: Partner
): string {
  const p = partnerObj || PARTNERS.find(item => item.id === partnerId || item.nameEn === (partnerName || partnerId));
  if (p?.pinHash) {
    return 'Configured (SHA-256)';
  }
  return 'Not assigned';
}

function getPartnerLifecycleBadge(partner: Partner): { label: string; bg: string; text: string; border: string } {
  const vStatus = (partner.verificationStatus || '').toLowerCase();
  if (vStatus.includes('archived')) {
    return { label: 'Archived', bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' };
  }
  if (vStatus.includes('suspended')) {
    return { label: 'Suspended', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' };
  }
  if (partner.conciergeRoutingEligible === 'Yes') {
    return { label: 'Active Partner', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' };
  }
  if (vStatus.includes('verified') || vStatus.includes('approved')) {
    return { label: 'Approved', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' };
  }
  if (vStatus.includes('unverified') || vStatus.includes('review') || partner.conciergeRoutingEligible === 'Pending qualification') {
    return { label: 'Verification', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };
  }
  return { label: 'Candidate', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' };
}

export interface CorrelationMatrixItem {
  recId: string;
  recTitle: string;
  category: string;
  region: string;
  partner1st: { id: string; name: string; code: string; phone?: string; statusBadge?: string } | null;
  partner2nd: { id: string; name: string; code: string; phone?: string; statusBadge?: string } | null;
  partner3rd: { id: string; name: string; code: string; phone?: string; statusBadge?: string } | null;
  assignedCount: number;
  healthStatus: CoverageHealthStatus;
  recObj: Recommendation;
}

export function StudioPartnerCoverage({ session }: { session?: StudioUserSession }) {
  const isSuperAdmin = session?.role === 'Super Admin';
  const roleTitle = session?.role || 'Admin';

  // Primary view mode defaults to the Single Unified Correlation Matrix Table
  const [viewMode, setViewMode] = useState<PartnerCoverageViewMode>('UNIFIED_MATRIX');
  const [coverageRecords, setCoverageRecords] = useState<PartnerCoverageRecord[]>([]);
  const [matrixFetchSuccess, setMatrixFetchSuccess] = useState<boolean | null>(null);
  const [matrixFetchError, setMatrixFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [operationalStats, setOperationalStats] = useState<Record<string, RecommendationMatrixStats>>({});
  
  // Specific Filters requested for Step 1:
  // 1. Filter by Partner: visibility of all recommendations assigned to this partner and which priority (1, 2, or 3)
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('ALL');
  // 2. Filter by Recommendation: visibility of all partner names assigned to it
  const [selectedRecFilter, setSelectedRecFilter] = useState<string>('ALL');
  // 3. Health status filter
  const [filterHealth, setFilterHealth] = useState<string>('ALL');
  const [filterPartnerStage, setFilterPartnerStage] = useState<string>('ALL');

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  // Quick Priority Assignment Modal
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [priorityModalRecId, setPriorityModalRecId] = useState<string>('');
  const [priorityModalPartnerId, setPriorityModalPartnerId] = useState<string>('');
  const [priorityModalRank, setPriorityModalRank] = useState<number>(1);

  // Modals for Coverage Operations
  const [showReleaseModal, setShowReleaseModal] = useState<boolean>(false);
  const [selectedRecForRelease, setSelectedRecForRelease] = useState<string>('');
  const [selectedPartnerForRelease, setSelectedPartnerForRelease] = useState<string>('');
  const [releaseEmail, setReleaseEmail] = useState<string>('');
  const [releasePhone, setReleasePhone] = useState<string>('');

  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false);
  const [replaceRecId, setReplaceRecId] = useState<string>('');
  const [replaceOldPartnerId, setReplaceOldPartnerId] = useState<string>('');
  const [replaceNewPartnerId, setReplaceNewPartnerId] = useState<string>('');

  // Modals for Direct Entity Inspection/Editing
  const [isPartnerEditorOpen, setIsPartnerEditorOpen] = useState<boolean>(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [isRecEditorOpen, setIsRecEditorOpen] = useState<boolean>(false);
  const [editingRecommendation, setEditingRecommendation] = useState<Recommendation | null>(null);

  // 1. Authoritative list of ALL APPROVED RECOMMENDATIONS
  const approvedRecommendations = useMemo(() => {
    return INITIAL_RECOMMENDATIONS.filter(r => 
      !r.publicationStatus || 
      r.publicationStatus === 'CANONICAL' || 
      r.publicationStatus === 'PUBLISHED'
    );
  }, []);

  // 2. Authoritative list of ALL APPROVED PARTNERS
  const approvedPartners = useMemo(() => {
    const list: Array<{ id: string; code: string; nameEn: string; email?: string; phone?: string; stage: string }> = [];

    // Mock test partners (always available for QA)
    list.push({
      id: 'a0000000-0000-0000-0000-000000000099',
      code: 'IDEMO',
      nameEn: 'IDEMO — Universal Concierge & Partner',
      email: 'office@idemo.group',
      phone: '+381600000003',
      stage: 'Approved'
    });
    list.push({
      id: 'a0000000-0000-0000-0000-000000000091',
      code: 'UNO1',
      nameEn: 'UNO1 — Ethno Village Sunčana Reka',
      email: 'uno1.test@idemo.internal',
      phone: '+381600000001',
      stage: 'Approved'
    });
    list.push({
      id: 'a0000000-0000-0000-0000-000000000092',
      code: 'UNO2',
      nameEn: 'UNO2 — Transfer & Adventure Specialist',
      email: 'uno2.test@idemo.internal',
      phone: '+381600000002',
      stage: 'Approved'
    });

    const all = getAllPartners();
    all.forEach(p => {
      const state = getPartnerLifecycleState(p);
      const vStatus = (p.verificationStatus || '').toLowerCase();
      const isApprovedOrActive = state.isVerified || state.isActive || state.stage === 'Approved' || state.stage === 'Active' || vStatus.includes('verified') || vStatus.includes('approved');
      if (isApprovedOrActive && !list.some(item => item.id === p.id)) {
        list.push({
          id: p.id,
          code: p.id,
          nameEn: p.nameEn,
          email: p.email,
          phone: p.phone,
          stage: state.stage
        });
      }
    });

    return list;
  }, [refreshing]);

  // Load Matrix Data and Operational Funnel Telemetry
  const loadMatrix = async () => {
    setRefreshing(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchPartnerCoverageMatrix(),
        fetchMatrixOperationalStatistics()
      ]);
      if (res.success && res.matrix) {
        setCoverageRecords(res.matrix);
      }
      if (statsRes.success && statsRes.data) {
        setOperationalStats(statsRes.data);
      }
    } catch (e) {
      console.warn('Error loading matrix data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  // Listen for storage or partner updates
  useEffect(() => {
    const handleUpdate = () => {
      loadMatrix();
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('idemo_partners_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('idemo_partners_updated', handleUpdate);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE ENGINE: SINGLE UNIFIED MATRIX (CORRELATING ALL APPROVED RECS & PARTNERS)
  // ─────────────────────────────────────────────────────────────────────────────
  const unifiedMatrix = useMemo<CorrelationMatrixItem[]>(() => {
    return approvedRecommendations.map((rec) => {
      const recId = rec.id;
      const recTitle = rec.title || (rec as any).titleEn || recId;

      let p1: CorrelationMatrixItem['partner1st'] = null;
      let p2: CorrelationMatrixItem['partner2nd'] = null;
      let p3: CorrelationMatrixItem['partner3rd'] = null;

      // 1. Server-First: Read authoritative DB coverage records directly from Supabase RPC
      const dbMatches = coverageRecords.filter(r => r.recommendation_id === recId || r.recommendation_id === recTitle);
      dbMatches.forEach(db => {
        const rank = db.priority_rank;
        const pId = db.partner_id;
        const pObj = approvedPartners.find(p => p.id === pId || p.code === pId || p.nameEn === pId);
        const name = db.partner_name || pObj?.nameEn || pId;
        const code = db.partner_code || pObj?.code || pId;
        const phone = db.contact_phone || pObj?.phone;
        const statusBadge = db.routing_state === 'active' ? 'Active' : 'Approved';

        if (rank === 1) p1 = { id: pId, name, code, phone, statusBadge };
        else if (rank === 2) p2 = { id: pId, name, code, phone, statusBadge };
        else if (rank === 3) p3 = { id: pId, name, code, phone, statusBadge };
      });

      // 2. Secondary client-cache fallback ONLY when database is unconfigured (offline mode)
      if (!p1 && !p2 && !p3 && !isSupabaseConfigured()) {
        let localRanks: Record<string, Record<string, number>> = {};
        try {
          const raw = safeStorage.getItem('idemo_coverage_ranks');
          if (raw) localRanks = JSON.parse(raw);
        } catch {
          // ignore
        }
        const recRanks = localRanks[recId] || {};
        for (const [pId, rank] of Object.entries(recRanks)) {
          const pObj = approvedPartners.find(p => p.id === pId || p.code === pId || p.nameEn === pId);
          const name = pObj?.nameEn || pId;
          const code = pObj?.code || pId;
          const phone = pObj?.phone;
          const statusBadge = pObj?.stage || 'Approved';

          if (rank === 1 && !p1) p1 = { id: pId, name, code, phone, statusBadge };
          else if (rank === 2 && !p2) p2 = { id: pId, name, code, phone, statusBadge };
          else if (rank === 3 && !p3) p3 = { id: pId, name, code, phone, statusBadge };
        }
      }

      // 3. Process static linked recommendations on Partner entity ONLY if no server data is available (offline fallback)
      const hasServerData = coverageRecords.length > 0;
      if (!hasServerData) {
        PARTNERS.forEach(p => {

        const links = p.linkedRecommendations || [];
        if (links.includes(recId) || links.includes(recTitle)) {
          const pObj = approvedPartners.find(ap => ap.id === p.id);
          const name = p.nameEn;
          const code = p.id;
          const phone = p.phone;
          const statusBadge = p.conciergeRoutingEligible === 'Yes' ? 'Active' : 'Approved';

          if (!p1 && p2?.id !== p.id && p3?.id !== p.id) {
            p1 = { id: p.id, name, code, phone, statusBadge };
          } else if (!p2 && p1?.id !== p.id && p3?.id !== p.id) {
            p2 = { id: p.id, name, code, phone, statusBadge };
          } else if (!p3 && p1?.id !== p.id && p2?.id !== p.id) {
            p3 = { id: p.id, name, code, phone, statusBadge };
          }
        }
      });

            }

      const assignedCount = [p1, p2, p3].filter(Boolean).length;
      let healthStatus: CoverageHealthStatus = 'GAP';
      if (assignedCount >= 3) healthStatus = 'ROBUST';
      else if (assignedCount === 2) healthStatus = 'COVERED';
      else if (assignedCount === 1) healthStatus = 'SINGLE-POINT';

      return {
        recId,
        recTitle,
        category: rec.category,
        region: (rec as any).region || rec.location || 'Serbia',
        partner1st: p1,
        partner2nd: p2,
        partner3rd: p3,
        assignedCount,
        healthStatus,
        recObj: rec
      };
    });
  }, [approvedRecommendations, approvedPartners, coverageRecords, refreshing]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FILTERED MATRIX COMPUTATION (WITH PARTNER FILTER & RECOMMENDATION FILTER)
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredMatrix = useMemo(() => {
    return unifiedMatrix.filter(row => {
      // 1. Filter by specific Partner
      if (selectedPartnerFilter !== 'ALL') {
        const normFilter = selectedPartnerFilter.toLowerCase();
        const matches1st = row.partner1st?.id.toLowerCase() === normFilter || row.partner1st?.code.toLowerCase() === normFilter;
        const matches2nd = row.partner2nd?.id.toLowerCase() === normFilter || row.partner2nd?.code.toLowerCase() === normFilter;
        const matches3rd = row.partner3rd?.id.toLowerCase() === normFilter || row.partner3rd?.code.toLowerCase() === normFilter;
        if (!matches1st && !matches2nd && !matches3rd) return false;
      }

      // 2. Filter by specific Recommendation
      if (selectedRecFilter !== 'ALL') {
        const normRec = selectedRecFilter.toLowerCase();
        if (row.recId.toLowerCase() !== normRec && row.recTitle.toLowerCase() !== normRec) {
          return false;
        }
      }

      // 3. Health status filter
      if (filterHealth === 'ROBUST' && row.healthStatus !== 'ROBUST') return false;
      if (filterHealth === 'COVERED' && row.healthStatus !== 'COVERED') return false;
      if (filterHealth === 'SINGLE_POINT' && row.healthStatus !== 'SINGLE-POINT') return false;
      if (filterHealth === 'GAPS' && row.healthStatus !== 'GAP') return false;

      // 4. Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = row.recTitle.toLowerCase().includes(q) || row.recId.toLowerCase().includes(q);
        const matchCategory = row.category.toLowerCase().includes(q);
        const matchP1 = row.partner1st?.name.toLowerCase().includes(q) || row.partner1st?.code.toLowerCase().includes(q);
        const matchP2 = row.partner2nd?.name.toLowerCase().includes(q) || row.partner2nd?.code.toLowerCase().includes(q);
        const matchP3 = row.partner3rd?.name.toLowerCase().includes(q) || row.partner3rd?.code.toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchP1 && !matchP2 && !matchP3) return false;
      }

      return true;
    });
  }, [unifiedMatrix, selectedPartnerFilter, selectedRecFilter, filterHealth, searchQuery]);

  // Aggregate statistics for the correlation matrix
  const matrixStats = useMemo(() => {
    let robust = 0;
    let covered = 0;
    let singlePoint = 0;
    let gaps = 0;
    let totalAssignedSlots = 0;

    unifiedMatrix.forEach(row => {
      if (row.healthStatus === 'ROBUST') robust++;
      else if (row.healthStatus === 'COVERED') covered++;
      else if (row.healthStatus === 'SINGLE-POINT') singlePoint++;
      else gaps++;

      totalAssignedSlots += row.assignedCount;
    });

    let totalViews = 0;
    let totalInquiries = 0;
    let totalAgreements = 0;

    Object.values(operationalStats).forEach(s => {
      totalViews += s.view_count || 0;
      totalInquiries += s.inquiries_count || 0;
      totalAgreements += s.agreements_count || 0;
    });

    return {
      totalRecs: unifiedMatrix.length,
      totalPartners: approvedPartners.length,
      robust,
      covered,
      singlePoint,
      gaps,
      totalAssignedSlots,
      totalViews,
      totalInquiries,
      totalAgreements
    };
  }, [unifiedMatrix, approvedPartners, operationalStats]);

  // Partner assignment breakdown when filtering by a specific partner
  const selectedPartnerBreakdown = useMemo(() => {
    if (selectedPartnerFilter === 'ALL') return null;
    const norm = selectedPartnerFilter.toLowerCase();
    const partner = approvedPartners.find(p => p.id.toLowerCase() === norm || p.code.toLowerCase() === norm);
    
    let count1st = 0;
    let count2nd = 0;
    let count3rd = 0;

    unifiedMatrix.forEach(row => {
      if (row.partner1st?.id.toLowerCase() === norm || row.partner1st?.code.toLowerCase() === norm) count1st++;
      if (row.partner2nd?.id.toLowerCase() === norm || row.partner2nd?.code.toLowerCase() === norm) count2nd++;
      if (row.partner3rd?.id.toLowerCase() === norm || row.partner3rd?.code.toLowerCase() === norm) count3rd++;
    });

    const quota = partner ? getPartnerCoverageQuota(partner.id) : null;
    let canonicalRegionName = 'Belgrade Metropolitan Area';
    try {
      const pRaw = safeStorage.getItem(`idemo_partner_passport_${(partner?.id || '').toUpperCase()}`) ||
                   safeStorage.getItem(`idemo_partner_passport_${(partner?.id || '').toLowerCase()}`);
      if (pRaw) {
        const parsed = JSON.parse(pRaw);
        if (parsed.canonical_region && CANONICAL_REGIONS[parsed.canonical_region]) {
          canonicalRegionName = CANONICAL_REGIONS[parsed.canonical_region].nameEn;
        }
      }
    } catch {
      // ignore
    }

    return {
      partner,
      total: count1st + count2nd + count3rd,
      count1st,
      count2nd,
      count3rd,
      quota,
      canonicalRegionName
    };
  }, [selectedPartnerFilter, unifiedMatrix, approvedPartners]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS FOR PRIORITY RANK ASSIGNMENT & ATOMIC SWAPPING
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenAssignModal = (recId: string, rank: number, currentPartnerId?: string) => {
    setPriorityModalRecId(recId);
    setPriorityModalRank(rank);
    setPriorityModalPartnerId(currentPartnerId || approvedPartners[0]?.id || '');
    setShowPriorityModal(true);
  };

  const handleSavePriorityRank = async () => {
    if (!priorityModalRecId || !priorityModalPartnerId) return;
    setIsMutating(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await setPartnerCoveragePriorityRank(
        priorityModalRecId,
        priorityModalPartnerId,
        priorityModalRank
      );

      if (res.success) {
        const partnerObj = approvedPartners.find(p => p.id === priorityModalPartnerId);
        const name = partnerObj?.nameEn || priorityModalPartnerId;
        const swapNotice = res.swappedPartnerId ? ` (Swapped with ${res.swappedPartnerId})` : '';
        const recObj = approvedRecommendations.find(r => r.id === priorityModalRecId);
        const recTitle = recObj?.title || priorityModalRecId;
        
        setActionSuccessMessage(
          `Priority ${priorityModalRank} successfully assigned to ${name} for "${recTitle}"${swapNotice}. Persisted to SafeStorage & Supabase!`
        );
        setShowPriorityModal(false);
        await loadMatrix();
      } else {
        setActionErrorMessage(res.error || res.message || 'Failed to update priority rank.');
      }
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Error occurred updating priority rank.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleQuickSwapRanks = async (recId: string, currentRank: number, targetRank: number, partnerId: string) => {
    setIsMutating(true);
    setActionSuccessMessage(null);
    try {
      const res = await setPartnerCoveragePriorityRank(recId, partnerId, targetRank);
      if (res.success) {
        setActionSuccessMessage(`Successfully moved partner to Priority ${targetRank} with atomic collision-free rank swapping!`);
        await loadMatrix();
      }
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Swap failed.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSelectAndRelease = async (recId: string, partnerId: string, email?: string, phone?: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await selectAndReleasePartnerCoverage(recId, partnerId, email, phone);
      if (res.success) {
        setActionSuccessMessage(res.message || `Partner ${partnerId} successfully selected & released for ${recId}. Routing pool is now ACTIVE.`);
        await loadMatrix();
        setShowReleaseModal(false);
      } else {
        setActionErrorMessage(res.error || res.message || 'Select & Release failed.');
      }
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Select & Release failed unexpectedly.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleExecuteReplace = async () => {
    if (!replaceRecId || !replaceOldPartnerId || !replaceNewPartnerId) {
      setActionErrorMessage('Please select both the old partner to remove and the replacement partner.');
      return;
    }
    if (isMutating) return;
    setIsMutating(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const newPartnerObj = approvedPartners.find(p => p.id === replaceNewPartnerId);
      const res = await replacePartnerCoverage(
        replaceRecId,
        replaceOldPartnerId,
        replaceNewPartnerId,
        newPartnerObj?.email || undefined,
        newPartnerObj?.phone || undefined,
        `Replaced by ${replaceNewPartnerId}`
      );

      if (res.success) {
        setActionSuccessMessage(`Successfully replaced partner ${replaceOldPartnerId} with ${replaceNewPartnerId} in ${replaceRecId}. Zero app release required.`);
        await loadMatrix();
        setShowReplaceModal(false);
      } else {
        setActionErrorMessage(res.error || res.message || 'Replacement operation failed.');
      }
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Replacement operation failed unexpectedly.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#32352B]/15 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-[#23251E] text-[#C5A059] shadow-xs">
              <ShieldCheck size={22} />
            </span>
            <h1 className="text-2xl font-bold text-[#1E2E20] font-serif tracking-tight">
              Recommendation–Partner Correlation Matrix
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
              isSuperAdmin 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {isSuperAdmin ? 'SUPER ADMIN — CANONICAL WRITE' : `${roleTitle.toUpperCase()} — ACTIVE DISPATCH`}
            </span>
          </div>
          <p className="text-xs text-[#1E2E20]/70 mt-1 max-w-3xl">
            Single authoritative matrix correlating all approved recommendations with all approved partners across 1st, 2nd, and 3rd priority tiers. Filter by partner to inspect assigned coverage and priority, or filter by recommendation to inspect assigned partners.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Authoritative Operational Funnel Summary */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-stone-100/90 border border-stone-200/90 rounded-xl text-stone-800 text-[11px] font-mono shadow-2xs">
            <span className="flex items-center gap-1 font-semibold" title="Total visitor views across recommendations">
              <Eye size={12} className="text-stone-500" />
              {matrixStats.totalViews.toLocaleString()} views
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1 font-semibold text-amber-900" title="Total inquiries generated">
              <Mail size={12} className="text-amber-600" />
              {matrixStats.totalInquiries} inq
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1 font-bold text-emerald-900" title="Total confirmed partner agreements">
              <Handshake size={12} className="text-emerald-600" />
              {matrixStats.totalAgreements} deals
            </span>
          </div>

          <button
            onClick={loadMatrix}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold text-[#1E2E20] bg-white border border-[#32352B]/20 rounded-xl hover:bg-stone-50 transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => {
              setSelectedRecForRelease('');
              setSelectedPartnerForRelease('');
              setReleaseEmail('');
              setReleasePhone('');
              setShowReleaseModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#23251E] bg-[#C5A059] hover:bg-[#b08e4d] rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            Assign Eligibility
          </button>
        </div>
      </div>

      {/* Action Feedback Messages */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:underline text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage(null)} className="text-rose-700 hover:underline text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Health Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">Approved Recs</div>
          <div className="text-xl font-bold text-stone-900 mt-1 font-serif">{matrixStats.totalRecs}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">Approved Partners</div>
          <div className="text-xl font-bold text-stone-900 mt-1 font-serif">{matrixStats.totalPartners}</div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-1">
            <CheckCircle2 size={12} /> Robust (3 Slots)
          </div>
          <div className="text-xl font-bold text-emerald-950 mt-1 font-serif">{matrixStats.robust}</div>
        </div>

        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-blue-800 font-bold flex items-center gap-1">
            <ShieldCheck size={12} /> Covered (2 Slots)
          </div>
          <div className="text-xl font-bold text-blue-950 mt-1 font-serif">{matrixStats.covered}</div>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold flex items-center gap-1">
            <AlertTriangle size={12} /> Single (1 Slot)
          </div>
          <div className="text-xl font-bold text-amber-950 mt-1 font-serif">{matrixStats.singlePoint}</div>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-rose-800 font-bold flex items-center gap-1">
            <XCircle size={12} /> Gaps (0 Slots)
          </div>
          <div className="text-xl font-bold text-rose-950 mt-1 font-serif">{matrixStats.gaps}</div>
        </div>
      </div>

      {/* Primary Toolbar: Dual Filters & Live Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        {/* Top Filter Bar: Filter by Partner & Filter by Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* FILTER 1: BY PARTNER */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Users size={13} className="text-[#C5A059]" />
              <span>Filter by Partner</span>
              {selectedPartnerFilter !== 'ALL' && (
                <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.2 rounded font-normal">Active</span>
              )}
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedPartnerFilter}
                onChange={(e) => setSelectedPartnerFilter(e.target.value)}
                className="w-full p-2.5 text-xs font-medium border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:border-[#C5A059] transition"
              >
                <option value="ALL">All Approved Partners ({approvedPartners.length})</option>
                {approvedPartners.map(p => {
                  const assignedCount = unifiedMatrix.filter(r => 
                    r.partner1st?.id === p.id || r.partner2nd?.id === p.id || r.partner3rd?.id === p.id
                  ).length;
                  return (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.nameEn} ({assignedCount} assigned)
                    </option>
                  );
                })}
              </select>
              {selectedPartnerFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedPartnerFilter('ALL')}
                  className="p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Clear Partner Filter"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* FILTER 2: BY RECOMMENDATION */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Compass size={13} className="text-[#C5A059]" />
              <span>Filter by Recommendation</span>
              {selectedRecFilter !== 'ALL' && (
                <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.2 rounded font-normal">Active</span>
              )}
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRecFilter}
                onChange={(e) => setSelectedRecFilter(e.target.value)}
                className="w-full p-2.5 text-xs font-medium border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:border-[#C5A059] transition"
              >
                <option value="ALL">All Approved Recommendations ({approvedRecommendations.length})</option>
                {approvedRecommendations.map(r => {
                  const mItem = unifiedMatrix.find(u => u.recId === r.id);
                  const assigned = mItem?.assignedCount || 0;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.title || (r as any).titleEn || r.id} ({assigned} partners)
                    </option>
                  );
                })}
              </select>
              {selectedRecFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedRecFilter('ALL')}
                  className="p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Clear Recommendation Filter"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* SEARCH BAR */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Search size={13} className="text-stone-400" />
              <span>Instant Keyword Search</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search recommendation, partner or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A059] transition"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Health status filter buttons & View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-mono font-semibold text-stone-500 mr-1 flex items-center gap-1">
              <Filter size={12} /> Coverage:
            </span>
            {[
              { id: 'ALL', label: `All (${unifiedMatrix.length})` },
              { id: 'ROBUST', label: `Robust (${matrixStats.robust})` },
              { id: 'COVERED', label: `Covered (${matrixStats.covered})` },
              { id: 'SINGLE_POINT', label: `Single (${matrixStats.singlePoint})` },
              { id: 'GAPS', label: `Gaps (${matrixStats.gaps})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterHealth(f.id)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition cursor-pointer whitespace-nowrap ${
                  filterHealth === f.id
                    ? 'bg-[#23251E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-fit self-end sm:self-auto">
            <button
              onClick={() => setViewMode('UNIFIED_MATRIX')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'UNIFIED_MATRIX'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers size={13} className={viewMode === 'UNIFIED_MATRIX' ? 'text-[#C5A059]' : ''} />
              Single Matrix ({filteredMatrix.length})
            </button>

            <button
              onClick={() => setViewMode('BY_PARTNER')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'BY_PARTNER'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Users size={13} className={viewMode === 'BY_PARTNER' ? 'text-[#C5A059]' : ''} />
              By Partner
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE FILTER BANNER (IF FILTERING BY PARTNER) */}
      {selectedPartnerBreakdown && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-200/70 text-amber-900">
              <Users size={16} />
            </span>
            <div>
              <div className="text-xs font-bold text-amber-950 flex items-center gap-2 flex-wrap">
                <span>Filtering by Partner: <strong>{selectedPartnerBreakdown.partner?.nameEn || selectedPartnerFilter}</strong></span>
                <span className="font-mono text-[11px] bg-amber-200 px-2 py-0.5 rounded font-bold">
                  {selectedPartnerBreakdown.partner?.code || selectedPartnerFilter}
                </span>
                <span className="text-[10px] font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300/60 flex items-center gap-1">
                  <MapPin size={11} className="text-[#8A1F1F]" />
                  {selectedPartnerBreakdown.canonicalRegionName}
                </span>
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5 flex items-center gap-2 flex-wrap font-mono">
                <span>Allocation Quota: <strong className={selectedPartnerBreakdown.total >= 12 ? 'text-[#8A1F1F]' : 'text-stone-900'}>{selectedPartnerBreakdown.total} / 12 max</strong></span>
                <span>•</span>
                <span>⭐ 1st: <strong className="text-amber-950">{selectedPartnerBreakdown.count1st}/4 max</strong></span>
                <span>•</span>
                <span>🥈 2nd: <strong className="text-amber-950">{selectedPartnerBreakdown.count2nd}/4 max</strong></span>
                <span>•</span>
                <span>🥉 3rd: <strong className="text-amber-950">{selectedPartnerBreakdown.count3rd}/4 max</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedPartnerFilter('ALL')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            Clear Partner Filter
          </button>
        </div>
      )}

      {/* ACTIVE FILTER BANNER (IF FILTERING BY RECOMMENDATION) */}
      {selectedRecFilter !== 'ALL' && (
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-200/70 text-blue-900">
              <Compass size={16} />
            </span>
            <div>
              <div className="text-xs font-bold text-blue-950">
                Filtering by Recommendation: <strong>{filteredMatrix[0]?.recTitle || selectedRecFilter}</strong>
              </div>
              <div className="text-[11px] text-blue-800 mt-0.5">
                Displaying all partner names assigned across 1st, 2nd, and 3rd priority slots ({filteredMatrix[0]?.assignedCount || 0} assigned).
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedRecFilter('ALL')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-blue-900 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            Clear Recommendation Filter
          </button>
        </div>
      )}

      {/* MAIN VIEW: SINGLE MATRIX TABLE */}
      {loading ? (
        <div className="p-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#C5A059]" />
          <span className="font-mono text-xs">Loading Authoritative Correlation Matrix...</span>
        </div>
      ) : viewMode === 'UNIFIED_MATRIX' ? (
        filteredMatrix.length === 0 ? (
          <div className="p-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <AlertTriangle size={24} className="mx-auto mb-2 text-stone-400" />
            <p className="font-serif text-sm font-bold text-stone-800">No matching matrix records found</p>
            <p className="text-xs text-stone-500 mt-1">Try resetting the partner, recommendation, or status filter.</p>
            <button
              onClick={() => {
                setSelectedPartnerFilter('ALL');
                setSelectedRecFilter('ALL');
                setSearchQuery('');
                setFilterHealth('ALL');
              }}
              className="mt-4 px-4 py-2 text-xs font-mono font-bold text-stone-900 bg-amber-300 hover:bg-amber-400 rounded-xl transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#23251E] text-white text-[11px] font-mono uppercase tracking-wider border-b border-[#32352B]">
                    <th className="py-3.5 px-4 w-12 text-center text-white/50">#</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Approved Recommendation</th>
                    <th className="py-3.5 px-4 min-w-[170px]">
                      <div className="flex items-center gap-1.5 text-amber-200">
                        <BarChart3 size={13} />
                        <span>Funnel & Conversion</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-1.5 text-[#C5A059]">
                        <Award size={13} />
                        <span>1st Priority (0m Instant)</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-1.5 text-blue-300">
                        <span>2nd Priority (+30m)</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-1.5 text-stone-300">
                        <span>3rd Priority (+60m)</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-32 text-center">Status</th>
                    <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredMatrix.map((row, index) => {
                    const isFilteredPartnerRow = selectedPartnerFilter !== 'ALL';
                    const isP1Selected = isFilteredPartnerRow && (row.partner1st?.id.toLowerCase() === selectedPartnerFilter.toLowerCase() || row.partner1st?.code.toLowerCase() === selectedPartnerFilter.toLowerCase());
                    const isP2Selected = isFilteredPartnerRow && (row.partner2nd?.id.toLowerCase() === selectedPartnerFilter.toLowerCase() || row.partner2nd?.code.toLowerCase() === selectedPartnerFilter.toLowerCase());
                    const isP3Selected = isFilteredPartnerRow && (row.partner3rd?.id.toLowerCase() === selectedPartnerFilter.toLowerCase() || row.partner3rd?.code.toLowerCase() === selectedPartnerFilter.toLowerCase());

                    return (
                      <tr 
                        key={row.recId}
                        className={`transition hover:bg-stone-50/70 ${
                          isP1Selected ? 'bg-amber-50/40' :
                          isP2Selected ? 'bg-blue-50/30' :
                          isP3Selected ? 'bg-stone-50/60' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-stone-400">
                          {index + 1}
                        </td>

                        {/* Approved Recommendation */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="font-serif font-bold text-stone-900 hover:text-[#C5A059] transition cursor-pointer flex items-center gap-1.5"
                                   onClick={() => setSelectedRecFilter(row.recId)}
                                   title="Click to filter by this recommendation"
                              >
                                <span>{row.recTitle}</span>
                                <ExternalLink size={11} className="text-stone-400 inline" />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                                <span className="font-mono text-stone-400 text-[10px]">ID: {row.recId}</span>
                                <span>·</span>
                                <span>{row.category}</span>
                                <span>·</span>
                                <span>{row.region}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Funnel & Conversion Telemetry */}
                        <td className="py-3.5 px-4">
                          {(() => {
                            const recStats = operationalStats[row.recId];
                            const views = recStats?.view_count || 0;
                            const inquiries = recStats?.inquiries_count || 0;
                            const deals = recStats?.agreements_count || 0;
                            const convRate = inquiries > 0 ? Math.round((deals / inquiries) * 100) : 0;
                            return (
                              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/90 text-[11px] font-mono space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between text-stone-600">
                                  <span className="flex items-center gap-1 text-[10.5px]">
                                    <Eye size={11} className="text-stone-400" /> Views:
                                  </span>
                                  <span className="font-bold text-stone-900">{views.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-stone-600">
                                  <span className="flex items-center gap-1 text-[10.5px]">
                                    <Mail size={11} className="text-amber-600" /> Inquiries:
                                  </span>
                                  <span className="font-bold text-amber-900">{inquiries}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-stone-200/80 text-stone-700">
                                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-800">
                                    <Handshake size={11} className="text-emerald-600" /> Deals:
                                  </span>
                                  <span className="font-bold text-emerald-900">
                                    {deals} <span className="text-[9.5px] text-stone-400 font-normal">({convRate}%)</span>
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 1st Priority Slot */}
                        <td className="py-3.5 px-4">
                          {row.partner1st ? (
                            <div className={`p-2 rounded-xl border transition ${
                              isP1Selected 
                                ? 'bg-[#C5A059]/15 border-[#C5A059] text-stone-900 shadow-xs' 
                                : 'bg-stone-50/80 border-stone-200 text-stone-900'
                            }`}>
                              <div className="flex items-center justify-between gap-1">
                                <span 
                                  className="font-bold truncate text-xs hover:underline cursor-pointer"
                                  onClick={() => setSelectedPartnerFilter(row.partner1st?.id || 'ALL')}
                                  title="Filter by this partner"
                                >
                                  {row.partner1st.name}
                                </span>
                                {isP1Selected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#800020] text-white">
                                    ⭐ 1st
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[10.5px] text-stone-500 font-mono">
                                <span className="font-bold text-stone-700">[{row.partner1st.code}]</span>
                                <button
                                  onClick={() => handleOpenAssignModal(row.recId, 1, row.partner1st?.id)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 underline cursor-pointer"
                                  title="Change or reassign 1st priority slot"
                                >
                                  Change
                                </button>
                              </div>
                              {(() => {
                                const rStats = operationalStats[row.recId];
                                const pStats = rStats?.partner_breakdown?.[row.partner1st.id] || 
                                               rStats?.partner_breakdown?.[row.partner1st.code] || 
                                               rStats?.partner_breakdown?.['default'];
                                if (!pStats) return null;
                                return (
                                  <div className="mt-1.5 pt-1.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-emerald-700 font-semibold" title="Partner accepted offers">✓ {pStats.accepted_count}</span>
                                    <span className="text-rose-600 font-semibold" title="Partner rejected offers">✗ {pStats.rejected_count}</span>
                                    <span className="text-stone-800 font-bold" title="Confirmed agreements">{pStats.agreements_count} deals</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(row.recId, 1)}
                              className="w-full py-2 px-2.5 rounded-xl border border-dashed border-stone-300 text-stone-400 hover:text-stone-800 hover:border-stone-400 hover:bg-stone-50 text-[11px] font-mono font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Plus size={12} />
                              Assign 1st
                            </button>
                          )}
                        </td>

                        {/* 2nd Priority Slot */}
                        <td className="py-3.5 px-4">
                          {row.partner2nd ? (
                            <div className={`p-2 rounded-xl border transition ${
                              isP2Selected 
                                ? 'bg-blue-100/60 border-blue-400 text-stone-900 shadow-xs' 
                                : 'bg-stone-50/80 border-stone-200 text-stone-900'
                            }`}>
                              <div className="flex items-center justify-between gap-1">
                                <span 
                                  className="font-bold truncate text-xs hover:underline cursor-pointer"
                                  onClick={() => setSelectedPartnerFilter(row.partner2nd?.id || 'ALL')}
                                  title="Filter by this partner"
                                >
                                  {row.partner2nd.name}
                                </span>
                                {isP2Selected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-700 text-white">
                                    2nd
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[10.5px] text-stone-500 font-mono">
                                <span className="font-bold text-stone-700">[{row.partner2nd.code}]</span>
                                <button
                                  onClick={() => handleOpenAssignModal(row.recId, 2, row.partner2nd?.id)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 underline cursor-pointer"
                                  title="Change or reassign 2nd priority slot"
                                >
                                  Change
                                </button>
                              </div>
                              {(() => {
                                const rStats = operationalStats[row.recId];
                                const pStats = rStats?.partner_breakdown?.[row.partner2nd.id] || 
                                               rStats?.partner_breakdown?.[row.partner2nd.code] || 
                                               rStats?.partner_breakdown?.['default'];
                                if (!pStats) return null;
                                return (
                                  <div className="mt-1.5 pt-1.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-emerald-700 font-semibold" title="Partner accepted offers">✓ {pStats.accepted_count}</span>
                                    <span className="text-rose-600 font-semibold" title="Partner rejected offers">✗ {pStats.rejected_count}</span>
                                    <span className="text-stone-800 font-bold" title="Confirmed agreements">{pStats.agreements_count} deals</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(row.recId, 2)}
                              className="w-full py-2 px-2.5 rounded-xl border border-dashed border-stone-300 text-stone-400 hover:text-stone-800 hover:border-stone-400 hover:bg-stone-50 text-[11px] font-mono font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Plus size={12} />
                              Assign 2nd
                            </button>
                          )}
                        </td>

                        {/* 3rd Priority Slot */}
                        <td className="py-3.5 px-4">
                          {row.partner3rd ? (
                            <div className={`p-2 rounded-xl border transition ${
                              isP3Selected 
                                ? 'bg-stone-200/80 border-stone-400 text-stone-900 shadow-xs' 
                                : 'bg-stone-50/80 border-stone-200 text-stone-900'
                            }`}>
                              <div className="flex items-center justify-between gap-1">
                                <span 
                                  className="font-bold truncate text-xs hover:underline cursor-pointer"
                                  onClick={() => setSelectedPartnerFilter(row.partner3rd?.id || 'ALL')}
                                  title="Filter by this partner"
                                >
                                  {row.partner3rd.name}
                                </span>
                                {isP3Selected && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-stone-700 text-white">
                                    3rd
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[10.5px] text-stone-500 font-mono">
                                <span className="font-bold text-stone-700">[{row.partner3rd.code}]</span>
                                <button
                                  onClick={() => handleOpenAssignModal(row.recId, 3, row.partner3rd?.id)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 underline cursor-pointer"
                                  title="Change or reassign 3rd priority slot"
                                >
                                  Change
                                </button>
                              </div>
                              {(() => {
                                const rStats = operationalStats[row.recId];
                                const pStats = rStats?.partner_breakdown?.[row.partner3rd.id] || 
                                               rStats?.partner_breakdown?.[row.partner3rd.code] || 
                                               rStats?.partner_breakdown?.['default'];
                                if (!pStats) return null;
                                return (
                                  <div className="mt-1.5 pt-1.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-emerald-700 font-semibold" title="Partner accepted offers">✓ {pStats.accepted_count}</span>
                                    <span className="text-rose-600 font-semibold" title="Partner rejected offers">✗ {pStats.rejected_count}</span>
                                    <span className="text-stone-800 font-bold" title="Confirmed agreements">{pStats.agreements_count} deals</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(row.recId, 3)}
                              className="w-full py-2 px-2.5 rounded-xl border border-dashed border-stone-300 text-stone-400 hover:text-stone-800 hover:border-stone-400 hover:bg-stone-50 text-[11px] font-mono font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Plus size={12} />
                              Assign 3rd
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold ${
                            row.healthStatus === 'ROBUST' 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : row.healthStatus === 'COVERED'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : row.healthStatus === 'SINGLE-POINT'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {row.healthStatus === 'ROBUST' && '3 / 3 Robust'}
                            {row.healthStatus === 'COVERED' && '2 / 3 Covered'}
                            {row.healthStatus === 'SINGLE-POINT' && '1 / 3 Single'}
                            {row.healthStatus === 'GAP' && '0 / 3 Gap'}
                          </span>
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenAssignModal(row.recId, 1)}
                              className="p-1.5 text-stone-500 hover:text-[#C5A059] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                              title="Manage Priority Slots"
                            >
                              <ArrowRightLeft size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRecommendation(row.recObj);
                                setIsRecEditorOpen(true);
                              }}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                              title="Open in Recommendation Editor"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Table Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
              <div>
                Showing <strong>{filteredMatrix.length}</strong> of <strong>{unifiedMatrix.length}</strong> approved recommendations correlated with <strong>{approvedPartners.length}</strong> approved partners.
              </div>
              <div className="text-[11px] font-mono text-stone-400">
                Single Source of Truth: safeStorage ('idemo_coverage_ranks') & Supabase RPC
              </div>
            </div>
          </div>
        )
      ) : (
        /* PERSPECTIVE: BY PARTNER CARDS */
        <div className="space-y-4">
          {approvedPartners.map(p => {
            const assignedRows = unifiedMatrix.filter(r => 
              r.partner1st?.id === p.id || r.partner2nd?.id === p.id || r.partner3rd?.id === p.id
            );

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-stone-900 text-[#C5A059]">
                      <Users size={16} />
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                        <span>{p.nameEn}</span>
                        <span className="font-mono text-xs text-stone-500 font-normal">[{p.code}]</span>
                      </h3>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {p.email && <span>Email: {p.email}</span>}
                        {p.phone && <span className="ml-2">Phone: {p.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-stone-200 text-stone-800">
                      {assignedRows.length} Assigned Spots
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPartnerFilter(p.id);
                        setViewMode('UNIFIED_MATRIX');
                      }}
                      className="px-3 py-1 text-xs font-mono font-bold text-[#23251E] bg-[#C5A059] hover:bg-[#b08e4d] rounded-lg transition cursor-pointer"
                    >
                      View in Matrix
                    </button>
                  </div>
                </div>

                {assignedRows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500">
                    No recommendations currently assigned to this partner.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {assignedRows.map(ar => {
                      const priority = ar.partner1st?.id === p.id ? 1 : ar.partner2nd?.id === p.id ? 2 : 3;
                      return (
                        <div key={ar.recId} className="p-3.5 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition">
                          <div>
                            <div className="font-serif font-bold text-stone-900 text-xs">
                              {ar.recTitle}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {ar.category} · {ar.region}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold ${
                              priority === 1 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : priority === 2
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-stone-200 text-stone-800'
                            }`}>
                              {priority === 1 ? '⭐ 1st Priority (Primary)' : priority === 2 ? '2nd Priority' : '3rd Priority'}
                            </span>
                            <button
                              onClick={() => handleOpenAssignModal(ar.recId, priority, p.id)}
                              className="text-xs text-stone-500 hover:text-stone-900 underline font-mono"
                            >
                              Swap Slot
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN / CHANGE PRIORITY RANK                                    */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                <Award size={18} className="text-[#C5A059]" />
                Assign Priority Slot
              </h3>
              <button 
                onClick={() => setShowPriorityModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>

            {(() => {
              const modalTargetRec = approvedRecommendations.find(r => r.id === priorityModalRecId);
              const modalPartnerQuota = priorityModalPartnerId ? getPartnerCoverageQuota(priorityModalPartnerId) : null;
              const modalFit = priorityModalPartnerId && priorityModalRecId ? getPartnerFitAnalysis(priorityModalPartnerId, priorityModalRecId, modalTargetRec) : null;

              const isSlotQuotaExceeded = modalPartnerQuota ? (
                (priorityModalRank === 1 && modalPartnerQuota.rank1Count >= 4) ||
                (priorityModalRank === 2 && modalPartnerQuota.rank2Count >= 4) ||
                (priorityModalRank === 3 && modalPartnerQuota.rank3Count >= 4) ||
                modalPartnerQuota.totalAssigned >= 12
              ) : false;

              return (
                <>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Target Approved Recommendation</label>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-serif font-bold text-stone-900">
                        {modalTargetRec?.title || priorityModalRecId}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Target Priority Slot</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { rank: 1, label: '1st (Instant 0m)' },
                          { rank: 2, label: '2nd (+30m)' },
                          { rank: 3, label: '3rd (+60m)' }
                        ].map(slot => (
                          <button
                            key={slot.rank}
                            type="button"
                            onClick={() => setPriorityModalRank(slot.rank)}
                            className={`p-2 rounded-xl text-center font-mono font-bold text-xs border transition cursor-pointer ${
                              priorityModalRank === slot.rank
                                ? 'bg-[#23251E] text-[#C5A059] border-[#23251E]'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Select Approved Partner</label>
                      <select
                        value={priorityModalPartnerId}
                        onChange={(e) => setPriorityModalPartnerId(e.target.value)}
                        className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#C5A059]"
                      >
                        {approvedPartners.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.nameEn}</option>
                        ))}
                      </select>
                    </div>

                    {/* Partner Quota Overview */}
                    {modalPartnerQuota && (
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800">Partner Allocation Quota:</span>
                          <span className={modalPartnerQuota.totalAssigned >= 12 ? 'text-[#8A1F1F] font-bold' : 'text-emerald-700 font-bold'}>
                            {modalPartnerQuota.totalAssigned} / 12 max
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-600">
                          <span className={modalPartnerQuota.rank1Count >= 4 ? 'text-red-700 font-bold' : ''}>⭐ 1st: {modalPartnerQuota.rank1Count}/4</span>
                          <span>·</span>
                          <span className={modalPartnerQuota.rank2Count >= 4 ? 'text-red-700 font-bold' : ''}>🥈 2nd: {modalPartnerQuota.rank2Count}/4</span>
                          <span>·</span>
                          <span className={modalPartnerQuota.rank3Count >= 4 ? 'text-red-700 font-bold' : ''}>🥉 3rd: {modalPartnerQuota.rank3Count}/4</span>
                        </div>
                      </div>
                    )}

                    {/* Agent Fit Analysis badge */}
                    {modalFit && (
                      <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950 font-mono text-[10.5px]">
                            <Sparkles size={12} className="text-[#C5A059]" />
                            <span>Agent Fit Score: {modalFit.fitScore}% ({modalFit.fitTier})</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded font-bold">
                            {modalFit.regionMatch ? '🎯 Regional Match' : 'Extended Scope'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-amber-900 leading-snug">
                          {modalFit.rationale} {modalFit.proposedRank ? `Suggested Slot: Priority ${modalFit.proposedRank}.` : ''}
                        </p>
                      </div>
                    )}

                    {/* Quota Exceeded Warning */}
                    {isSlotQuotaExceeded && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] font-mono font-bold flex items-center gap-1.5">
                        <AlertTriangle size={14} className="shrink-0 text-red-600" />
                        <span>Quota limit: Partner has reached 4 recommendations for Priority {priorityModalRank} (max 4 as 1st, 4 as 2nd, 4 as 3rd — 12 total).</span>
                      </div>
                    )}

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-[11px] leading-relaxed">
                      <strong>Collision-free swapping:</strong> If another partner already occupies this slot, IDEMO's atomic priority router will automatically swap their positions without collision.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                    <button
                      onClick={() => setShowPriorityModal(false)}
                      className="px-4 py-2 text-xs font-mono font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      disabled={isMutating || isSlotQuotaExceeded}
                      onClick={handleSavePriorityRank}
                      className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#23251E] bg-[#C5A059] hover:bg-[#b08e4d] disabled:opacity-40 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isMutating && <RefreshCw size={13} className="animate-spin" />}
                      Save & Persist Slot
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: SELECT & RELEASE ELIGIBILITY (CANONICAL BACKEND WRITE)          */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#C5A059]" />
                Assign & Release Coverage Eligibility
              </h3>
              <button onClick={() => setShowReleaseModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer text-lg leading-none">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Approved Recommendation</label>
                <select
                  value={selectedRecForRelease}
                  onChange={(e) => setSelectedRecForRelease(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-stone-900"
                >
                  <option value="">-- Select Recommendation --</option>
                  {approvedRecommendations.map(r => (
                    <option key={r.id} value={r.id}>{r.id} - {r.title || (r as any).titleEn || 'Untitled'} ({r.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Approved Partner</label>
                <select
                  value={selectedPartnerForRelease}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedPartnerForRelease(pid);
                    const pObj = approvedPartners.find(p => p.id === pid);
                    if (pObj) {
                      setReleaseEmail(pObj.email || '');
                      setReleasePhone(pObj.phone || '');
                    }
                  }}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-stone-900"
                >
                  <option value="">-- Select Approved Partner --</option>
                  {approvedPartners.map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.nameEn}</option>
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
                    className="w-full p-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Professional Mobile/Phone</label>
                  <input
                    type="text"
                    value={releasePhone}
                    onChange={(e) => setReleasePhone(e.target.value)}
                    placeholder="+381 64 000 000"
                    className="w-full p-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 leading-relaxed text-[11px]">
                <strong>Governance Check:</strong> Either a verified Email OR Mobile/Phone is required before release into the live dispatch routing pool.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="px-4 py-2 text-xs font-mono font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={!selectedRecForRelease || !selectedPartnerForRelease || isMutating}
                onClick={() => handleSelectAndRelease(selectedRecForRelease, selectedPartnerForRelease, releaseEmail, releasePhone)}
                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#23251E] bg-[#C5A059] hover:bg-[#b08e4d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {isMutating ? <RefreshCw size={13} className="animate-spin" /> : null}
                Release into Routing Pool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: REPLACE PARTNER (CANONICAL ATOMIC MUTATION)                     */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-[#C5A059]" />
                Replace Partner in Routing Pool
              </h3>
              <button onClick={() => setShowReplaceModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer text-lg leading-none">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                Replacing partner <strong className="font-mono">{replaceOldPartnerId}</strong> for recommendation <strong className="font-mono">{replaceRecId}</strong>.
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select Replacement Partner</label>
                <select
                  value={replaceNewPartnerId}
                  onChange={(e) => setReplaceNewPartnerId(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-stone-900"
                >
                  <option value="">-- Select Replacement Partner --</option>
                  {approvedPartners.filter(p => p.id !== replaceOldPartnerId).map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.nameEn}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 text-xs font-mono font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={!replaceNewPartnerId || isMutating}
                onClick={handleExecuteReplace}
                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#23251E] bg-[#C5A059] hover:bg-[#b08e4d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {isMutating ? <RefreshCw size={13} className="animate-spin" /> : null}
                Execute Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: DIRECT PARTNER EDITOR MODAL                                    */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {isPartnerEditorOpen && editingPartner && (
        <PartnerEditorModal
          initialPartner={editingPartner}
          isOpen={isPartnerEditorOpen}
          onClose={() => {
            setIsPartnerEditorOpen(false);
            setEditingPartner(null);
          }}
          onSave={(_savedPartner, _stage) => {
            setIsPartnerEditorOpen(false);
            setEditingPartner(null);
            loadMatrix();
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: DIRECT RECOMMENDATION EDITOR MODAL                             */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {isRecEditorOpen && editingRecommendation && (
        <RecommendationEditorModal
          initialRecommendation={editingRecommendation}
          isOpen={isRecEditorOpen}
          onClose={() => {
            setIsRecEditorOpen(false);
            setEditingRecommendation(null);
          }}
          onSave={(_savedRec, _status) => {
            setIsRecEditorOpen(false);
            setEditingRecommendation(null);
            loadMatrix();
          }}
        />
      )}
    </div>
  );
}
