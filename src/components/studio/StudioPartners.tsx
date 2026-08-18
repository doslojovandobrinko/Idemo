import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Search, 
  Filter, 
  Edit, 
  Phone, 
  Mail, 
  Globe, 
  AlertTriangle,
  Award,
  Compass,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { Partner } from '../../types';
import { PARTNERS as INITIAL_PARTNERS } from '../../data/partners';
import { PartnerEditorModal, PartnerLifecycleStage } from './PartnerEditorModal';
import { calculatePartnerReadiness } from './utils/scoring';

interface StudioPartnersProps {
  targetPartnerId?: string;
}

export function StudioPartners({ targetPartnerId }: StudioPartnersProps) {
  const [partnerList, setPartnerList] = useState<Partner[]>(INITIAL_PARTNERS);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('P-001');

  useEffect(() => {
    if (targetPartnerId) {
      setSelectedPartnerId(targetPartnerId);
    }
  }, [targetPartnerId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Filtered Partners
  const filteredPartners = useMemo(() => {
    return partnerList.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.nameSr && p.nameSr.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.locationEn && p.locationEn.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedStageFilter === 'ALL') return true;

      const vStatus = (p.verificationStatus || '').toLowerCase();
      if (selectedStageFilter === 'ACTIVE') return p.conciergeRoutingEligible === 'Yes' && !vStatus.includes('suspended') && !vStatus.includes('archived');
      if (selectedStageFilter === 'CANDIDATE') return vStatus.includes('candidate') || p.conciergeRoutingEligible === 'Pending qualification';
      if (selectedStageFilter === 'VERIFICATION') return vStatus.includes('unverified') || vStatus.includes('review');
      if (selectedStageFilter === 'APPROVED') return vStatus.includes('verified') && p.conciergeRoutingEligible !== 'Yes';
      if (selectedStageFilter === 'SUSPENDED') return vStatus.includes('suspended');
      if (selectedStageFilter === 'ARCHIVED') return vStatus.includes('archived');

      return true;
    });
  }, [partnerList, searchQuery, selectedStageFilter]);

  const activePartner = useMemo(() => {
    return partnerList.find(p => p.id === selectedPartnerId) || partnerList[0] || INITIAL_PARTNERS[0];
  }, [partnerList, selectedPartnerId]);

  const handleCreateNew = () => {
    setEditingPartner(null);
    setIsEditorOpen(true);
  };

  const handleEditActive = () => {
    if (activePartner) {
      setEditingPartner(activePartner);
      setIsEditorOpen(true);
    }
  };

  const handleSavePartner = (savedPartner: Partner, stage: PartnerLifecycleStage) => {
    setPartnerList(prev => {
      const idx = prev.findIndex(p => p.id === savedPartner.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedPartner;
        return copy;
      }
      return [savedPartner, ...prev];
    });
    setSelectedPartnerId(savedPartner.id);
  };

  const getPartnerStageLabel = (p: Partner): { label: string; color: string } => {
    const vStatus = (p.verificationStatus || '').toLowerCase();
    if (vStatus.includes('archived')) return { label: 'Archived', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    if (vStatus.includes('suspended')) return { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200' };
    if (p.conciergeRoutingEligible === 'Yes') return { label: 'Active Partner', color: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' };
    if (vStatus.includes('verified')) return { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (vStatus.includes('unverified') || vStatus.includes('review')) return { label: 'Verification', color: 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]' };
    return { label: 'Candidate', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1E2E20] tracking-tight">
            Partner Management Studio
          </h1>
          <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-0.5">
            Operational desk for experience provider onboarding, recommendation mapping, and inquiry routing.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs self-start sm:self-auto">
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
          >
            <Plus size={15} className="text-[#C5A059]" />
            <span>Onboard New Partner</span>
          </button>

          <span className="px-3 py-2 rounded-xl bg-white border border-[#E5E3DB] font-bold text-[#1E2E20]">
            Total Partners: {partnerList.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E3DB] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8A7D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners, guide names, locations..."
            className="w-full h-10 pl-9 pr-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none focus:border-[#23251E]"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-1.5 font-mono text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-[#8C8A7D] mr-1 shrink-0" />
          {['ALL', 'ACTIVE', 'APPROVED', 'VERIFICATION', 'CANDIDATE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStageFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedStageFilter === st
                  ? 'bg-[#23251E] text-white'
                  : 'bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner List */}
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {filteredPartners.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E3DB] text-xs font-mono text-[#8C8A7D]">
              No partners match current filter criteria.
            </div>
          ) : (
            filteredPartners.map(partner => {
              const isSelected = partner.id === activePartner?.id;
              const stage = getPartnerStageLabel(partner);

              const readiness = calculatePartnerReadiness(partner);

              return (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartnerId(partner.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#23251E] shadow-sm ring-1 ring-[#23251E]/10'
                      : 'bg-[#FAF9F5] border-[#E5E3DB] hover:border-[#23251E]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-[#1E2E20] text-sm truncate max-w-[180px]">
                      {partner.nameEn}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded-md font-bold border ${
                        readiness.scorePercentage >= 90 ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' :
                        readiness.scorePercentage >= 70 ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]' :
                        'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                      }`}>
                        {readiness.scorePercentage}% Ready
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border ${stage.color}`}>
                        {stage.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-mono text-[#8C8A7D] flex items-center justify-between">
                    <span>{partner.category}</span>
                    <span className="text-[#1E2E20] font-bold truncate max-w-[120px]">
                      {partner.partnerType}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Partner Workspace Detail */}
        {activePartner && (
          <div className="lg:col-span-2 bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8A7D] font-bold">
                    Partner ID: {activePartner.id}
                  </span>
                  <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold border ${getPartnerStageLabel(activePartner).color}`}>
                    {getPartnerStageLabel(activePartner).label}
                  </span>
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1E2E20] mt-1">
                  {activePartner.nameEn}
                </h2>
                {activePartner.nameSr && (
                  <p className="text-xs font-sans text-[#8C8A7D] mt-0.5">
                    Serbian: {activePartner.nameSr}
                  </p>
                )}
              </div>

              <button
                onClick={handleEditActive}
                className="px-4 py-2 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Edit size={14} className="text-[#C5A059]" />
                <span>Edit Partner Profile</span>
              </button>
            </div>

            {/* Partner Readiness Indicator Card */}
            {(() => {
              const readiness = calculatePartnerReadiness(activePartner);
              return (
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8C8A7D] block">
                        Partner Operational Readiness Score
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-serif text-2xl font-bold text-[#1E2E20]">
                          {readiness.scorePercentage}%
                        </span>
                        <span className="text-xs text-[#8C8A7D]">
                          ({readiness.completedItems.length} of {readiness.items.length} criteria satisfied)
                        </span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      readiness.scorePercentage >= 90 ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' :
                      readiness.scorePercentage >= 70 ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]' :
                      'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                    }`}>
                      {readiness.scorePercentage >= 90 ? 'Activation Ready' : readiness.scorePercentage >= 70 ? 'Pending Profile' : 'Incomplete'}
                    </span>
                  </div>

                  <div className="w-full bg-[#E5E3DB] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        readiness.scorePercentage >= 90 ? 'bg-[#2E7D32]' :
                        readiness.scorePercentage >= 70 ? 'bg-[#C5A059]' :
                        'bg-[#8A1F1F]'
                      }`}
                      style={{ width: `${readiness.scorePercentage}%` }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#2E7D32] font-bold">
                      <CheckCircle2 size={13} />
                      <span>{readiness.completedItems.length} Satisfied Criteria</span>
                    </div>

                    {readiness.missingItems.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[#8A1F1F] font-bold">
                        <AlertTriangle size={13} />
                        <span>{readiness.missingItems.length} Missing Items ({readiness.missingItems[0]})</span>
                      </div>
                    )}

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] uppercase ${
                      readiness.isActivationEligible ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF8E1] text-[#F57F17]'
                    }`}>
                      {readiness.isActivationEligible ? 'ROUTING ELIGIBLE' : 'NOT ROUTABLE YET'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Quick Metadata Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
                <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">Category & Type</span>
                <span className="text-sm font-bold text-[#1E2E20] mt-1 block truncate">
                  {activePartner.category} ({activePartner.partnerType})
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
                <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">Primary Email</span>
                <span className="text-xs font-bold text-[#1E2E20] mt-1 block truncate">
                  {activePartner.email || 'Not verified'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
                <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">Phone / WhatsApp</span>
                <span className="text-xs font-bold text-[#1E2E20] mt-1 block truncate">
                  {activePartner.phone || activePartner.whatsApp || 'Not verified'}
                </span>
              </div>
            </div>

            {/* Expertise Capabilities */}
            {activePartner.expertise && activePartner.expertise.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2 font-mono text-xs">
                <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">Key Capabilities & Expertise</span>
                <ul className="list-disc list-inside space-y-1 text-[#1E2E20] font-sans">
                  {activePartner.expertise.map((exp, idx) => (
                    <li key={idx} className="text-xs">{exp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mapped Recommendations */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[#C5A059]" />
                  <span className="text-xs uppercase font-bold text-[#1E2E20]">
                    Mapped Recommendations ({activePartner.linkedRecommendations?.length || 0})
                  </span>
                </div>
              </div>

              {activePartner.linkedRecommendations && activePartner.linkedRecommendations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activePartner.linkedRecommendations.map((recTitle, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] font-medium">
                      {recTitle}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8C8A7D] italic">No recommendations mapped to this partner yet.</p>
              )}
            </div>

            {/* QR Code Attribution Box */}
            <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={18} className="text-[#8A1F1F]" />
                  <h4 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    QR Code Attribution Tracker
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#2E7D32] font-bold">
                  ACTIVE TRACKER
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={`https://idemo.travel/?src=QR_${activePartner.nameEn.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${activePartner.id}`}
                  className="flex-1 h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] select-all"
                />
                <button
                  onClick={() => alert(`Copied QR Attribution link for ${activePartner.nameEn}`)}
                  className="px-4 h-10 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Verification Details */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D]">Verification Record & Audit Notes</span>
                <span className="text-[10px] text-[#8C8A7D]">Last Verified: {activePartner.lastVerified || '2026-08-01'}</span>
              </div>
              <p className="text-xs text-[#1E2E20] font-sans">
                {activePartner.verificationDetails || 'Verified in official directory registry.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <PartnerEditorModal
        isOpen={isEditorOpen}
        initialPartner={editingPartner}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSavePartner}
      />
    </div>
  );
}
