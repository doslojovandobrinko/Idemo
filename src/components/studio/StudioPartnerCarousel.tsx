/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO Studio — Partner Card Gateway Carousel Manager
 * Governs the 14-slot twice-daily rotating carousel for the Partner Card.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Clock, 
  Sun, 
  Moon, 
  RotateCcw, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  Eye, 
  ChevronRight,
  AlertCircle,
  Upload
} from 'lucide-react';
import { 
  PartnerCarouselSlide, 
  CANONICAL_PARTNER_CAROUSEL_SLIDES,
  getPartnerCarouselSlides, 
  savePartnerCarouselSlides, 
  resetPartnerCarouselSlides,
  getActiveSlotIndex 
} from '../../lib/partnerCarouselStorage';

// Available Curated Image Presets from local repository assets
const CURATED_PRESETS = [
  { label: 'Uvac Canyon Meanders', url: '/src/assets/images/uvac_meanders_1778841048759.webp' },
  { label: 'Kalemegdan Terrace Sunset', url: '/src/assets/images/kalemegdanska_terasa_sunset_1778843501085.webp' },
  { label: 'Golubac Danube Fortress', url: '/src/assets/images/golubac_fortress_danube_1778842880053.webp' },
  { label: 'Silosi Belgrade Night Waterfront', url: '/src/assets/images/silosi_belgrade_industrial_night_1778842947193.webp' },
  { label: 'Manasija Royal Monastery', url: '/src/assets/images/manasija_monastery_1778841065960.webp' },
  { label: 'Salon 1905 Historical Dining', url: '/src/assets/images/salon_1905_interior_1778845083168.webp' },
  { label: 'Tara Forest Reset Hike', url: '/src/assets/images/tara_forest_reset_hike_1778848171218.webp' },
  { label: 'Zemun Danube Quay at Twilight', url: '/src/assets/images/zemun_danube_kafana_1778846414640.webp' },
  { label: 'Fruška Gora Monastic Vineyards', url: '/src/assets/images/fruska_gora_monastery_vineyard_1778842911981.webp' },
  { label: 'Hype Belgrade Splav Luxury', url: '/src/assets/images/hype_belgrade_splav_luxury_1778844082665.webp' },
  { label: 'Ovčar-Kablar Gorge Peak', url: '/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp' },
  { label: 'Rajačke Pimnice Medieval Cellars', url: '/src/assets/images/rajacke_pimnice_village_1778843436699.webp' },
  { label: 'Vrnjačka Banja Historic Park', url: '/src/assets/images/vrnjacka_banja_1778841098566.webp' },
  { label: 'Saint Sava Temple Gold Mosaics', url: '/src/assets/images/saint_sava_temple_interior_1778845911761.webp' },
  { label: 'Felix Romuliana Roman Palace', url: '/src/assets/images/felix_romuliana_ruins_1778841314415.webp' },
  { label: 'Subotica Sand Wines', url: '/src/assets/images/subotica_sand_wines_1778841182776.webp' },
  { label: 'Kopaonik Mountain Peaks', url: '/src/assets/images/kopaonik_mountain_winter_1778846397521.webp' },
  { label: 'Stara Planina Dramatic Ridge', url: '/src/assets/images/stara_planina_landscape_1778843454764.webp' }
];

const DAYS_OF_WEEK = [
  { index: 1, name: 'Monday', nameSr: 'Ponedeljak' },
  { index: 2, name: 'Tuesday', nameSr: 'Utorak' },
  { index: 3, name: 'Wednesday', nameSr: 'Sreda' },
  { index: 4, name: 'Thursday', nameSr: 'Četvrtak' },
  { index: 5, name: 'Friday', nameSr: 'Petak' },
  { index: 6, name: 'Saturday', nameSr: 'Subota' },
  { index: 0, name: 'Sunday', nameSr: 'Nedelja' }
];

export function StudioPartnerCarousel() {
  const [slides, setSlides] = useState<PartnerCarouselSlide[]>(() => getPartnerCarouselSlides());
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(() => getActiveSlotIndex(getPartnerCarouselSlides()));
  const [editingSlide, setEditingSlide] = useState<PartnerCarouselSlide | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form state for editing / adding
  const [formState, setFormState] = useState<Partial<PartnerCarouselSlide>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const currentSystemActiveIndex = getActiveSlotIndex(slides);
  const previewSlide = slides[activePreviewIndex] || slides[0];

  const handleOpenEdit = (slide: PartnerCarouselSlide) => {
    setEditingSlide(slide);
    setIsAddingNew(false);
    setFormState({ ...slide });
  };

  const handleOpenAddNew = () => {
    setIsAddingNew(true);
    setEditingSlide(null);
    setFormState({
      id: `custom-slot-${Date.now()}`,
      dayIndex: 1,
      slotTime: 'AM',
      slotLabelEn: 'CUSTOM SLOT • 06:00–18:00',
      slotLabelSr: 'PRILAGOĐENI SLOT • 06:00–18:00',
      titleEn: 'New Partner Curation Experience',
      titleSr: 'Novo Kustosko Partnersko Iskustvo',
      locationEn: 'Belgrade, Serbia',
      locationSr: 'Beograd, Srbija',
      tagEn: 'PARTNER PORTFOLIO',
      tagSr: 'PARTNERSKI PORTFOLIO',
      imageUrl: CURATED_PRESETS[0].url,
      isCustom: true
    });
  };

  const handleSaveForm = () => {
    if (!formState.titleEn || !formState.imageUrl) {
      showToast('Title and Image are required.');
      return;
    }

    let updatedList: PartnerCarouselSlide[];
    if (isAddingNew) {
      const newSlide: PartnerCarouselSlide = {
        id: formState.id || `slot-${Date.now()}`,
        dayIndex: formState.dayIndex ?? 1,
        slotTime: formState.slotTime || 'AM',
        slotLabelEn: formState.slotLabelEn || `${DAYS_OF_WEEK.find(d => d.index === formState.dayIndex)?.name || 'Custom'} Daylight`,
        slotLabelSr: formState.slotLabelSr || `${DAYS_OF_WEEK.find(d => d.index === formState.dayIndex)?.nameSr || 'Prilagođeni'} Dan`,
        titleEn: formState.titleEn || 'Featured Partner Highlight',
        titleSr: formState.titleSr || 'Istaknuti Partnerski Sadržaj',
        locationEn: formState.locationEn || 'Serbia Network',
        locationSr: formState.locationSr || 'Mreža Srbije',
        tagEn: formState.tagEn || 'PARTNER PORTFOLIO',
        tagSr: formState.tagSr || 'PARTNERSKI PORTFOLIO',
        imageUrl: formState.imageUrl,
        isCustom: true
      };
      updatedList = [...slides, newSlide];
      showToast('New carousel slot added successfully.');
    } else if (editingSlide) {
      updatedList = slides.map(s => (s.id === editingSlide.id ? { ...s, ...formState, isCustom: true } as PartnerCarouselSlide : s));
      showToast(`Updated slide "${editingSlide.titleEn}".`);
    } else {
      return;
    }

    setSlides(updatedList);
    savePartnerCarouselSlides(updatedList);
    setEditingSlide(null);
    setIsAddingNew(false);
  };

  const handleRemoveSlide = (slideId: string) => {
    if (slides.length <= 1) {
      showToast('Cannot delete the last remaining carousel slide.');
      return;
    }
    const filtered = slides.filter(s => s.id !== slideId);
    setSlides(filtered);
    savePartnerCarouselSlides(filtered);
    if (activePreviewIndex >= filtered.length) {
      setActivePreviewIndex(0);
    }
    showToast('Carousel slide removed.');
  };

  const handleResetToCanonical = () => {
    if (window.confirm('Reset all partner card carousel images to default canonical 14-slot IDEMO curation?')) {
      resetPartnerCarouselSlides();
      setSlides(CANONICAL_PARTNER_CAROUSEL_SLIDES);
      setActivePreviewIndex(getActiveSlotIndex(CANONICAL_PARTNER_CAROUSEL_SLIDES));
      showToast('Reset to canonical IDEMO 14-slot schedule.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#23251E] text-white border border-[#C5A059]/40 font-mono text-xs shadow-xl flex items-center gap-2">
          <Check size={14} className="text-[#C5A059]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Overview */}
      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-[#C5A059] font-mono text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            <span>PARTNER CARD TOP IMAGE CAROUSEL</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1E2E20] tracking-tight">
            Twice-Daily Automated Rotation (7 Days a Week)
          </h2>
          <p className="text-xs text-[#8C8A7D] leading-relaxed">
            The top panoramic hero banner of the Partner Card dynamically updates twice each day: Day slot (06:00–18:00) and Evening slot (18:00–06:00), providing 14 distinct atmospheres across all 7 days of the week.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <button
            onClick={handleResetToCanonical}
            className="px-3.5 py-2 rounded-xl border border-[#E5E3DB] hover:bg-neutral-50 text-[#8C8A7D] hover:text-[#1E2E20] font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleOpenAddNew}
            className="px-4 py-2 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <Plus size={14} className="text-[#C5A059]" />
            <span>Add Custom Slide</span>
          </button>
        </div>
      </div>

      {/* Live Preview & Simulation Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Card Simulation (Exact container size h-48 sm:h-52) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-[#1E2E20] uppercase tracking-wider flex items-center gap-2">
              <Eye size={14} className="text-[#C5A059]" />
              <span>Live Card Preview (Exact Dimensions)</span>
            </span>
            <span className="text-[10px] text-[#8C8A7D] bg-neutral-100 px-2 py-0.5 rounded-md font-bold">
              Slot {activePreviewIndex + 1} of {slides.length}
            </span>
          </div>

          {/* SIMULATED CARD CONTAINER — EXACT h-48 sm:h-52 */}
          <div className="bg-white border border-[#E5E3DB] rounded-[32px] shadow-[0_12px_40px_rgba(35,37,30,0.06)] overflow-hidden text-left flex flex-col max-w-md mx-auto">
            {/* Top Panoramic Hero Strip */}
            <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-[#23251E]">
              <img 
                src={previewSlide.imageUrl} 
                alt={previewSlide.titleEn}
                className="w-full h-full object-cover object-center transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[9px] font-mono font-bold tracking-[0.25em] text-[#C5A059] uppercase">
                  {previewSlide.tagEn || 'PARTNER PORTFOLIO'}
                </span>
                <span className="text-[9px] font-mono text-white/70 uppercase tracking-widest font-semibold">
                  SERBIA CONCIERGE
                </span>
              </div>

              {/* Title & Timing */}
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight leading-tight">
                  {previewSlide.titleEn}
                </h2>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest font-bold">
                    📍 {previewSlide.locationEn}
                  </p>
                  <span className="text-[8.5px] font-mono text-white/60 bg-black/50 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                    {previewSlide.slotTime === 'AM' ? '☀️ DAYLIGHT' : '🌙 EVENING'}
                  </span>
                </div>
              </div>

              {/* Real-time Indicator Pill */}
              {activePreviewIndex === currentSystemActiveIndex && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-mono text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>ACTIVE NOW</span>
                </div>
              )}
            </div>

            {/* Bottom Card Mock Strip */}
            <div className="p-4 bg-[#FAF9F5] border-t border-[#E5E3DB] flex items-center justify-between text-xs text-[#8C8A7D]">
              <span className="font-mono text-[10px] uppercase font-bold text-[#8A1F1F]">
                {previewSlide.slotLabelEn}
              </span>
              <span className="text-[10px] font-mono font-medium">
                Locked container: 100% responsive
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Status & Quick Simulation Switcher */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1E2E20] uppercase tracking-wider">
              <Clock size={14} className="text-[#C5A059]" />
              <span>Current System Time Simulation</span>
            </div>
            <p className="text-xs text-[#8C8A7D] leading-relaxed">
              Based on your device clock, the slot automatically active right now is:
            </p>
            <div className="p-3.5 bg-white border border-[#E5E3DB] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-serif text-sm font-bold text-[#1E2E20]">
                  {slides[currentSystemActiveIndex]?.titleEn || 'Default'}
                </p>
                <p className="font-mono text-[10px] text-[#C5A059] uppercase tracking-widest mt-0.5">
                  {slides[currentSystemActiveIndex]?.slotLabelEn || 'Active'}
                </p>
              </div>
              <button
                onClick={() => setActivePreviewIndex(currentSystemActiveIndex)}
                className="px-3 py-1.5 rounded-lg bg-[#23251E] text-white font-mono text-[10px] font-bold hover:bg-[#32352B] transition-all cursor-pointer"
              >
                Inspect Active
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E5E3DB] rounded-2xl p-5 space-y-3">
            <span className="font-mono text-xs font-bold text-[#1E2E20] uppercase tracking-wider block">
              Quick Simulation Picker
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`p-2 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                    activePreviewIndex === idx
                      ? 'bg-[#23251E] text-white border-[#23251E] shadow-xs'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-[#8C8A7D] border-[#E5E3DB]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] uppercase font-bold">
                    <span>{s.id.split('-')[0]}</span>
                    <span>{s.slotTime}</span>
                  </div>
                  <p className="text-[10px] font-sans font-bold truncate mt-1">
                    {s.titleEn}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled 14-Slot Management Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
          <div className="space-y-0.5">
            <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
              Weekly Rotation Schedule ({slides.length} Slots)
            </h3>
            <p className="text-xs text-[#8C8A7D]">
              Click "Edit" on any slot to change the destination, imagery, or schedule wording.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {slides.map((slide, idx) => (
            <div 
              key={slide.id}
              className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 transition-all relative ${
                activePreviewIndex === idx ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20' : 'border-[#E5E3DB]'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                  slide.slotTime === 'AM'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                }`}>
                  {slide.slotTime === 'AM' ? <Sun size={10} /> : <Moon size={10} />}
                  <span>{slide.slotLabelEn}</span>
                </span>

                {idx === currentSystemActiveIndex && (
                  <span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Active Now
                  </span>
                )}
              </div>

              {/* Image & Title Preview */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E3DB] shrink-0">
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.titleEn} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-sm font-bold text-[#1E2E20] truncate">
                    {slide.titleEn}
                  </h4>
                  <p className="font-sans text-xs text-[#8C8A7D] truncate mt-0.5">
                    {slide.titleSr}
                  </p>
                  <p className="font-mono text-[9px] text-[#C5A059] truncate mt-1">
                    📍 {slide.locationEn}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#E5E3DB] flex items-center justify-between text-xs font-mono">
                <button
                  onClick={() => setActivePreviewIndex(idx)}
                  className="text-[#8C8A7D] hover:text-[#1E2E20] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(slide)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#1E2E20] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleRemoveSlide(slide.id)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Remove Slot"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT / ADD MODAL */}
      {(editingSlide || isAddingNew) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E3DB] shadow-2xl w-full max-w-lg p-6 space-y-5 animate-scale-in text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                  {isAddingNew ? 'Add Carousel Slot' : `Edit "${editingSlide?.titleEn}"`}
                </h3>
                <p className="text-xs text-[#8C8A7D]">
                  Configure image asset, title, and day scheduling.
                </p>
              </div>
              <button 
                onClick={() => { setEditingSlide(null); setIsAddingNew(false); }}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs font-mono">
              {/* Day & Slot Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                    Day of the Week
                  </label>
                  <select
                    value={formState.dayIndex ?? 1}
                    onChange={(e) => setFormState({ ...formState, dayIndex: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] bg-neutral-50 font-sans font-medium"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.index} value={d.index}>{d.name} ({d.nameSr})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                    Slot Time Window
                  </label>
                  <select
                    value={formState.slotTime || 'AM'}
                    onChange={(e) => setFormState({ ...formState, slotTime: e.target.value as 'AM' | 'PM' })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] bg-neutral-50 font-sans font-medium"
                  >
                    <option value="AM">☀️ Daylight (06:00 – 18:00)</option>
                    <option value="PM">🌙 Evening (18:00 – 06:00)</option>
                  </select>
                </div>
              </div>

              {/* Title EN & SR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formState.titleEn || ''}
                    onChange={(e) => setFormState({ ...formState, titleEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] font-sans font-bold text-sm"
                    placeholder="e.g. Uvac Canyon Meanders"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                    Title (Serbian)
                  </label>
                  <input
                    type="text"
                    value={formState.titleSr || ''}
                    onChange={(e) => setFormState({ ...formState, titleSr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] font-sans font-bold text-sm"
                    placeholder="npr. Meandri Kanjona Uvca"
                  />
                </div>
              </div>

              {/* Location EN & SR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                    Location (English)
                  </label>
                  <input
                    type="text"
                    value={formState.locationEn || ''}
                    onChange={(e) => setFormState({ ...formState, locationEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] font-sans"
                    placeholder="e.g. Sjenica & Pešter"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                    Location (Serbian)
                  </label>
                  <input
                    type="text"
                    value={formState.locationSr || ''}
                    onChange={(e) => setFormState({ ...formState, locationSr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] font-sans"
                    placeholder="npr. Sjenica i Pešter"
                  />
                </div>
              </div>

              {/* Preset Image Asset Picker */}
              <div>
                <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                  Choose Curated Image Preset
                </label>
                <select
                  value={formState.imageUrl || ''}
                  onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] bg-neutral-50 font-sans"
                >
                  {CURATED_PRESETS.map((p, pIdx) => (
                    <option key={pIdx} value={p.url}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Image URL (Direct Override) */}
              <div>
                <label className="block text-[10px] text-[#8C8A7D] uppercase font-bold mb-1">
                  Image Path / Direct URL
                </label>
                <input
                  type="text"
                  value={formState.imageUrl || ''}
                  onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E3DB] font-mono text-xs"
                  placeholder="/src/assets/images/...webp"
                />
              </div>

              {/* Image Preview inside Modal */}
              {formState.imageUrl && (
                <div className="w-full h-24 rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E3DB]">
                  <img 
                    src={formState.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 border-t border-[#E5E3DB] flex items-center justify-end gap-2.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => { setEditingSlide(null); setIsAddingNew(false); }}
                className="px-4 py-2 rounded-xl border border-[#E5E3DB] text-[#8C8A7D] hover:bg-neutral-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                className="px-5 py-2 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-bold cursor-pointer shadow-xs"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
