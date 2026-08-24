import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  QrCode, 
  MapPin, 
  Award, 
  Bell, 
  FileText, 
  Layers,
  Check,
  User,
  Link as LinkIcon,
  Compass,
  Lock,
  Power,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Partner } from '../../types';
import { calculatePartnerReadiness } from './utils/scoring';
import { 
  getPartnerLifecycleState, 
  savePartnerProfile, 
  verifyPartnerAction, 
  activatePartnerAction, 
  enableConciergeRoutingAction, 
  disableConciergeRoutingAction, 
  suspendPartnerAction, 
  retirePartnerAction, 
  reactivatePartnerAction 
} from '../../lib/partnerLifecycleService';

export type PartnerLifecycleStage = 'Candidate' | 'Verification' | 'Approved' | 'Active' | 'Suspended' | 'Archived';

interface PartnerEditorModalProps {
  initialPartner?: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (partner: Partner, stage: PartnerLifecycleStage) => void;
}

const SERVICE_AREA_OPTIONS = [
  'Belgrade',
  'Novi Sad & Fruška Gora',
  'Zlatibor & Tara',
  'Niš & Southern Serbia',
  'Šumadija & Central Serbia',
  'Vojvodina & Subotica',
  'Eastern Serbia & Iron Gate',
  'Kopaonik & Raška Region'
];

const LANGUAGE_OPTIONS = [
  'English',
  'Serbian',
  'German',
  'Russian',
  'Chinese',
  'Italian',
  'French',
  'Spanish'
];

const CATEGORY_OPTIONS = [
  'Tourist Guide',
  'Gastronomy & Fine Dining',
  'Craft Wine & Winery',
  'Ethno Heritage & Stays',
  'Private Transport & Transfers',
  'Cultural Center & Museum',
  'Artisanal Crafts & Workshop'
];

export function PartnerEditorModal({
  initialPartner,
  isOpen,
  onClose,
  onSave
}: PartnerEditorModalProps) {
  const isEditing = !!initialPartner;

  const [form, setForm] = useState<Partial<Partner>>({
    id: `P-${Math.floor(100 + Math.random() * 900)}`,
    nameEn: '',
    nameSr: '',
    nameZh: '',
    category: 'Tourist Guide',
    partnerType: 'Individual',
    candidateType: 'Individual',
    operationalRole: 'Concierge / Service Partner Candidate',
    verificationStatus: 'Public contact verified',
    lastVerified: new Date().toISOString().split('T')[0],
    verificationDetails: 'Verified in operational registry.',
    routingRole: 'Eligible for concierge dispatch subject to active status and availability',
    conciergeRoutingEligible: 'Yes',
    directContactAvailable: 'Yes',
    phone: '',
    whatsApp: '',
    email: '',
    website: '',
    directBookingPhone: '',
    directBookingWhatsApp: '',
    directBookingEmail: '',
    directBookingUrl: '',
    directBookingNotes: 'Direct booking available via phone/email.',
    expertise: [],
    linkedRecommendations: []
  });

  const [lifecycleStage, setLifecycleStage] = useState<PartnerLifecycleStage>('Active');
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>(['Belgrade']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English', 'Serbian']);
  const [notificationChannel, setNotificationChannel] = useState<'Email' | 'WhatsApp' | 'SMS' | 'Webhook'>('Email');
  const [notificationFrequency, setNotificationFrequency] = useState<'Immediate' | 'Daily Digest'>('Immediate');
  const [expertiseInput, setExpertiseInput] = useState<string>('');
  const [linkedRecsInput, setLinkedRecsInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'routing' | 'governance'>('info');

  useEffect(() => {
    if (initialPartner) {
      setForm({ ...initialPartner });
      const st = getPartnerLifecycleState(initialPartner);
      setLifecycleStage(st.stage);
      setExpertiseInput((initialPartner.expertise || []).join('\n'));
      setLinkedRecsInput((initialPartner.linkedRecommendations || []).join('\n'));
    } else {
      const newId = `P-${Math.floor(100 + Math.random() * 900)}`;
      setForm({
        id: newId,
        nameEn: '',
        nameSr: '',
        nameZh: '',
        category: 'Tourist Guide',
        partnerType: 'Individual',
        candidateType: 'Individual',
        operationalRole: 'Concierge / Service Partner Candidate',
        verificationStatus: 'unverified',
        stage: 'Candidate',
        status: 'invited',
        conciergeRoutingEligible: 'No',
        directContactAvailable: 'Yes',
        phone: '',
        whatsApp: '',
        email: '',
        website: '',
        directBookingPhone: '',
        directBookingWhatsApp: '',
        directBookingEmail: '',
        directBookingUrl: '',
        directBookingNotes: '',
        expertise: ['Licensed tourist guide service'],
        linkedRecommendations: ['Belgrade Fortress & Kalemegdan Park']
      });
      setLifecycleStage('Candidate');
      setExpertiseInput('Licensed tourist guide service');
      setLinkedRecsInput('Belgrade Fortress & Kalemegdan Park');
    }
  }, [initialPartner, isOpen]);

  if (!isOpen) return null;

  // Readiness Scoring & Validation
  const currentPartnerState: Partial<Partner> = {
    ...form,
    expertise: expertiseInput.split('\n').filter(e => e.trim().length > 0),
    linkedRecommendations: linkedRecsInput.split('\n').filter(l => l.trim().length > 0)
  };

  const lifecycleState = getPartnerLifecycleState(currentPartnerState);
  const readiness = calculatePartnerReadiness(currentPartnerState, lifecycleState.stage);
  const warnings = readiness.missingItems;

  const toggleServiceArea = (area: string) => {
    setSelectedServiceAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleVerify = () => {
    if (!form.id) return;
    const updated = verifyPartnerAction(form.id, 'Admin');
    setForm(updated);
    const st = getPartnerLifecycleState(updated);
    setLifecycleStage(st.stage);
    onSave(updated, st.stage);
  };

  const handleActivate = () => {
    if (!form.id) return;
    try {
      const updated = activatePartnerAction(form.id);
      setForm(updated);
      const st = getPartnerLifecycleState(updated);
      setLifecycleStage(st.stage);
      onSave(updated, st.stage);
    } catch (err: any) {
      alert(err?.message || 'Activation failed');
    }
  };

  const handleEnableRouting = () => {
    if (!form.id) return;
    try {
      const updated = enableConciergeRoutingAction(form.id);
      setForm(updated);
      const st = getPartnerLifecycleState(updated);
      setLifecycleStage(st.stage);
      onSave(updated, st.stage);
    } catch (err: any) {
      alert(err?.message || 'Enabling routing failed');
    }
  };

  const handleDisableRouting = () => {
    if (!form.id) return;
    const updated = disableConciergeRoutingAction(form.id);
    setForm(updated);
    const st = getPartnerLifecycleState(updated);
    setLifecycleStage(st.stage);
    onSave(updated, st.stage);
  };

  const handleSuspend = () => {
    if (!form.id) return;
    const updated = suspendPartnerAction(form.id, 'Suspended via Partner Studio');
    setForm(updated);
    const st = getPartnerLifecycleState(updated);
    setLifecycleStage(st.stage);
    onSave(updated, st.stage);
  };

  const handleRetire = () => {
    if (!form.id) return;
    if (window.confirm('Retire this partner profile? It will be archived and excluded from active routing while preserving all historical records.')) {
      const updated = retirePartnerAction(form.id, 'Retired via Partner Studio');
      setForm(updated);
      const st = getPartnerLifecycleState(updated);
      setLifecycleStage(st.stage);
      onSave(updated, st.stage);
    }
  };

  const handleReactivate = () => {
    if (!form.id) return;
    const updated = reactivatePartnerAction(form.id);
    setForm(updated);
    const st = getPartnerLifecycleState(updated);
    setLifecycleStage(st.stage);
    onSave(updated, st.stage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn) {
      alert('Please provide a partner name.');
      return;
    }

    const updatedExpertise = expertiseInput.split('\n').map(s => s.trim()).filter(Boolean);
    const updatedLinkedRecs = linkedRecsInput.split('\n').map(s => s.trim()).filter(Boolean);

    const updatedPartner: Partner = {
      ...form,
      nameEn: form.nameEn || 'New Partner',
      nameSr: form.nameSr || form.nameEn || 'Novi Partner',
      nameZh: form.nameZh || form.nameEn || '',
      category: form.category || 'Tourist Guide',
      partnerType: form.partnerType || 'Individual',
      pinHash: form.pinHash || '0000000000000000000000000000000000000000000000000000000000000000',
      expertise: updatedExpertise,
      linkedRecommendations: updatedLinkedRecs
    } as Partner;

    // Preserves existing lifecycle state without automatic escalation
    const saved = savePartnerProfile(updatedPartner);
    const st = getPartnerLifecycleState(saved);
    onSave(saved, st.stage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-4xl bg-white border border-[#E5E3DB] rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#23251E] text-white p-5 px-6 flex items-center justify-between border-b border-[#32352B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#C5A059]">
              <Building2 size={18} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold block">
                {isEditing ? `PARTNER MANAGEMENT SYSTEM • ${form.id}` : 'NEW PARTNER ONBOARDING'}
              </span>
              <h2 className="font-serif text-lg font-bold text-white leading-tight">
                {isEditing ? `Manage: ${form.nameEn}` : 'Onboard New Experience Partner'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#FAF9F5] border-b border-[#E5E3DB] px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'info' ? 'bg-[#23251E] text-white' : 'text-[#8C8A7D] hover:text-[#1E2E20]'
              }`}
            >
              1. Profile & Offerings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'contact' ? 'bg-[#23251E] text-white' : 'text-[#8C8A7D] hover:text-[#1E2E20]'
              }`}
            >
              2. Contact & Booking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('routing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'routing' ? 'bg-[#23251E] text-white' : 'text-[#8C8A7D] hover:text-[#1E2E20]'
              }`}
            >
              3. Routing & Mappings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('governance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'governance' ? 'bg-[#23251E] text-white' : 'text-[#8C8A7D] hover:text-[#1E2E20]'
              }`}
            >
              4. Lifecycle & Verification
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-mono">
            <span className="text-[#8C8A7D]">Stage:</span>
            <span className="font-bold text-[#2E7D32] uppercase">{lifecycleStage}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFILE & OFFERINGS */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Partner Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nameEn || ''}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="e.g., Restoran Ambar & Waterfront Fine Dining"
                    className="w-full h-11 px-3.5 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category || 'Tourist Guide'}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-11 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Serbian Translation Name
                  </label>
                  <input
                    type="text"
                    value={form.nameSr || ''}
                    onChange={(e) => setForm({ ...form, nameSr: e.target.value })}
                    placeholder="e.g., Ресторан Амбар"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Entity / Partner Type
                  </label>
                  <select
                    value={form.partnerType || 'Individual'}
                    onChange={(e) => setForm({ ...form, partnerType: e.target.value as 'Individual' | 'Organisation' })}
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                  >
                    <option value="Individual">Individual Guide / Local Artisan</option>
                    <option value="Organisation">Organisation / Business Entity</option>
                  </select>
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1.5">
                  Regional Service Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_AREA_OPTIONS.map((area) => {
                    const isSelected = selectedServiceAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleServiceArea(area)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#23251E] text-white font-bold'
                            : 'bg-[#FAF9F5] text-[#8C8A7D] border border-[#E5E3DB] hover:text-[#1E2E20]'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spoken Languages */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1.5">
                  Spoken Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#23251E] text-white font-bold'
                            : 'bg-[#FAF9F5] text-[#8C8A7D] border border-[#E5E3DB] hover:text-[#1E2E20]'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expertise Bullet points */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Key Capabilities & Expertise (One per line)
                </label>
                <textarea
                  rows={3}
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  placeholder="e.g. Customized private city walks&#10;Sommelier-guided wine tasting&#10;VIP transport coordination"
                  className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & BOOKING */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Primary Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="reservation@partner.rs"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Primary Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+381 64 123 4567"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    WhatsApp Contact
                  </label>
                  <input
                    type="text"
                    value={form.whatsApp || ''}
                    onChange={(e) => setForm({ ...form, whatsApp: e.target.value })}
                    placeholder="+381 64 123 4567"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={form.website || ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://partner.rs"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>

              {/* Direct Booking Notes */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB] space-y-3">
                <span className="font-mono text-xs uppercase font-bold text-[#1E2E20] block">
                  Direct Guest Booking Channel Instructions
                </span>
                <input
                  type="text"
                  value={form.directBookingUrl || ''}
                  onChange={(e) => setForm({ ...form, directBookingUrl: e.target.value })}
                  placeholder="Direct Booking Engine URL (optional)"
                  className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                />
                <textarea
                  rows={2}
                  value={form.directBookingNotes || ''}
                  onChange={(e) => setForm({ ...form, directBookingNotes: e.target.value })}
                  placeholder="Notes for traveler concierge desk on direct booking process..."
                  className="w-full p-2.5 bg-white border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] outline-none"
                />
              </div>

              {/* Notification Preferences */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB] space-y-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[#C5A059]" />
                  <span className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Inquiry Notification & Dispatch Channel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">Dispatch Method</label>
                    <select
                      value={notificationChannel}
                      onChange={(e) => setNotificationChannel(e.target.value as any)}
                      className="w-full h-9 px-3 bg-white border border-[#E5E3DB] rounded-xl font-bold text-[#1E2E20]"
                    >
                      <option value="Email font-bold">Encrypted Email Dispatch</option>
                      <option value="WhatsApp">Direct WhatsApp Business</option>
                      <option value="SMS">Automated SMS Notification</option>
                      <option value="Webhook">Webhook Integration API</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">Batch Frequency</label>
                    <select
                      value={notificationFrequency}
                      onChange={(e) => setNotificationFrequency(e.target.value as any)}
                      className="w-full h-9 px-3 bg-white border border-[#E5E3DB] rounded-xl font-bold text-[#1E2E20]"
                    >
                      <option value="Immediate">Immediate Real-time Dispatch</option>
                      <option value="Daily Digest">Daily Digest Summary (20:00 UTC)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROUTING & MAPPINGS */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              {/* Linked Recommendations */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Mapped Curated Recommendation Items (One title per line)
                </label>
                <textarea
                  rows={4}
                  value={linkedRecsInput}
                  onChange={(e) => setLinkedRecsInput(e.target.value)}
                  placeholder="Belgrade Fortress & Kalemegdan Park&#10;Saint Sava Temple (Hram Svetog Save)"
                  className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none leading-relaxed"
                />
                <p className="text-[10px] text-[#8C8A7D] font-mono mt-1">
                  When travelers query these recommendation items, this partner receives direct routing priority.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-[#1E2E20]">Concierge Routing</span>
                    <select
                      value={form.conciergeRoutingEligible || 'Yes'}
                      onChange={(e) => setForm({ ...form, conciergeRoutingEligible: e.target.value })}
                      className="h-8 px-2 bg-white border border-[#E5E3DB] rounded-lg text-xs font-mono font-bold"
                    >
                      <option value="Yes">Eligible</option>
                      <option value="Pending qualification">Pending</option>
                      <option value="No">Disabled</option>
                    </select>
                  </div>
                  <p className="text-[10.5px] text-[#8C8A7D] font-mono">
                    Enables automated traveler inquiry matching via edge functions.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-[#1E2E20]">Direct Guest Access</span>
                    <select
                      value={form.directContactAvailable || 'Yes'}
                      onChange={(e) => setForm({ ...form, directContactAvailable: e.target.value })}
                      className="h-8 px-2 bg-white border border-[#E5E3DB] rounded-lg text-xs font-mono font-bold"
                    >
                      <option value="Yes">Available</option>
                      <option value="No">Unavailable</option>
                    </select>
                  </div>
                  <p className="text-[10.5px] text-[#8C8A7D] font-mono">
                    Displays verified direct contact badges on public experience details.
                  </p>
                </div>
              </div>

              {/* QR Attribution Generator */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-[#8A1F1F]" />
                  <span className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    QR Attribution Link Code
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`QR_${(form.nameEn || 'PARTNER').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${form.id}`}
                    className="flex-1 h-9 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] select-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOVERNANCE & LIFECYCLE STAGE */}
          {activeTab === 'governance' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Verification Details & Curator Audit Log
                </label>
                <textarea
                  rows={3}
                  value={form.verificationDetails || ''}
                  onChange={(e) => setForm({ ...form, verificationDetails: e.target.value })}
                  placeholder="Record verification proof, registration checks, and background qualification notes..."
                  className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Last Verification Date
                </label>
                <input
                  type="date"
                  value={form.lastVerified || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, lastVerified: e.target.value })}
                  className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                />
              </div>
            </div>
          )}

          {/* PIPELINE & PARTNER READINESS SCORE CARD */}
          <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-4">
            <div className="border-b border-[#E5E3DB] pb-3">
              <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                Partner Governance Stage & Readiness Audit
              </span>
              <span className="font-serif font-bold text-sm text-[#1E2E20]">
                Lifecycle Stage & Operational Readiness
              </span>
            </div>

            {/* GOVERNED LIFECYCLE ACTIONS PANEL */}
            <div className="space-y-3 p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DB] pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C8A7D] block">Current Governed State</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase border ${
                      lifecycleState.stage === 'Active' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' :
                      lifecycleState.stage === 'Suspended' || lifecycleState.stage === 'Archived' ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]' :
                      lifecycleState.stage === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]'
                    }`}>
                      Stage: {lifecycleState.stage}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase border ${
                      lifecycleState.isVerified ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {lifecycleState.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase border ${
                      lifecycleState.isRoutable ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      ROUTING: {lifecycleState.isRoutable ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explicit Governed Action Buttons */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8C8A7D] block">Explicit Admin Governance Actions</span>
                <div className="flex flex-wrap gap-2">
                  {lifecycleState.mayVerify && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ShieldCheck size={13} />
                      Verify Profile
                    </button>
                  )}

                  {lifecycleState.mayActivate && (
                    <button
                      type="button"
                      onClick={handleActivate}
                      className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Power size={13} />
                      Activate Partner
                    </button>
                  )}

                  {lifecycleState.mayEnableRouting && (
                    <button
                      type="button"
                      onClick={handleEnableRouting}
                      className="px-3 py-1.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Compass size={13} />
                      Enable Concierge Routing
                    </button>
                  )}

                  {lifecycleState.mayDisableRouting && (
                    <button
                      type="button"
                      onClick={handleDisableRouting}
                      className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock size={13} />
                      Disable Routing
                    </button>
                  )}

                  {lifecycleState.maySuspend && (
                    <button
                      type="button"
                      onClick={handleSuspend}
                      className="px-3 py-1.5 rounded-lg bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock size={13} />
                      Suspend Partner
                    </button>
                  )}

                  {lifecycleState.mayRetire && (
                    <button
                      type="button"
                      onClick={handleRetire}
                      className="px-3 py-1.5 rounded-lg bg-[#37474F] hover:bg-[#263238] text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Retire / Archive
                    </button>
                  )}

                  {lifecycleState.mayReactivate && (
                    <button
                      type="button"
                      onClick={handleReactivate}
                      className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      Reactivate Partner
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Partner Readiness Score Box */}
            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#8C8A7D] block">
                    Partner Operational Readiness Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-2xl font-bold text-[#1E2E20]">
                      {readiness.scorePercentage}%
                    </span>
                    <span className="font-mono text-xs text-[#8C8A7D]">
                      ({readiness.completedItems.length} of {readiness.items.length} criteria satisfied)
                    </span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase border ${
                  readiness.scorePercentage >= 90 ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' :
                  readiness.scorePercentage >= 70 ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]' :
                  'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                }`}>
                  {readiness.scorePercentage >= 90 ? 'Activation Ready' : readiness.scorePercentage >= 70 ? 'Pending Profile' : 'Incomplete'}
                </span>
              </div>

              {/* Progress Bar */}
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

              {/* Items Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-[#E5E3DB]">
                <div>
                  <span className="font-bold text-[#2E7D32] flex items-center gap-1 mb-1.5 text-[10.5px] uppercase">
                    <CheckCircle2 size={13} /> Satisfied Criteria ({readiness.completedItems.length}):
                  </span>
                  <ul className="space-y-1 text-[#1E2E20] text-[11px] list-disc list-inside">
                    {readiness.completedItems.map((item, idx) => (
                      <li key={idx} className="truncate">{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-[#8A1F1F] flex items-center gap-1 mb-1.5 text-[10.5px] uppercase">
                    <AlertTriangle size={13} /> Action Required ({readiness.missingItems.length}):
                  </span>
                  {readiness.missingItems.length > 0 ? (
                    <ul className="space-y-1 text-[#8A1F1F] text-[11px] list-disc list-inside">
                      {readiness.missingItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#2E7D32] italic">Partner profile meets all 10 readiness requirements.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Routing & Activation Eligibility Notice */}
            <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={readiness.isActivationEligible ? 'text-[#2E7D32]' : 'text-[#8C8A7D]'} />
                <div>
                  <span className="font-bold text-[#1E2E20] block">Concierge Routing & Activation Status</span>
                  <span className="text-[10.5px] text-[#8C8A7D]">
                    {readiness.isActivationEligible
                      ? 'Partner is fully verified, contactable, and eligible for active Concierge routing.'
                      : 'Complete identity, verified contact details, and routing eligibility to activate.'}
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[9.5px] border ${
                readiness.isActivationEligible
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                  : 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]'
              }`}>
                {readiness.isActivationEligible ? 'ROUTING READY' : 'NOT READY'}
              </span>
            </div>

            <p className="text-[10px] text-[#8C8A7D] font-mono italic text-center">
              * Note: Partner routing readiness evaluates profile completeness. A partner does not become routable solely because the score is high; existing verification and routing rules remain authoritative.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E3DB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] text-xs font-mono uppercase font-bold text-[#8C8A7D] hover:text-[#1E2E20]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Save size={14} className="text-[#C5A059]" />
              <span>Save Partner Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
