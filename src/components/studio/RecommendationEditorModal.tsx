import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  MapPin,
  Compass,
  Sparkles,
  Globe,
  Link as LinkIcon,
  Layers,
  ShieldCheck,
  Building2,
  Check,
} from "lucide-react";
import { Recommendation, Category } from "../../types";
import { calculateRecommendationCompleteness } from "./utils/scoring";

interface RecommendationEditorModalProps {
  initialRecommendation?: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    recommendation: Recommendation,
    status: "CANDIDATE" | "NEEDS RESEARCH" | "APPROVED" | "RETIRED",
  ) => void;
  currentStatus?: "CANDIDATE" | "NEEDS RESEARCH" | "APPROVED" | "RETIRED";
}

const PARTNER_OPTIONS = [
  { id: "", name: "None (Standalone Curation)" },
  { id: "pt-001", name: "Restoran Ambar & Waterfront Fine Dining" },
  { id: "pt-002", name: "Manasija Monastery Cultural Heritage Center" },
  { id: "pt-003", name: "Fruška Gora Wine Estate Kovacevic" },
  { id: "pt-[#4]", name: "Sirogojno Old Village Open Air Museum" },
  { id: "pt-005", name: "Niš Fortress Crafts Guild" },
];

export function RecommendationEditorModal({
  initialRecommendation,
  isOpen,
  onClose,
  onSave,
  currentStatus = "CANDIDATE",
}: RecommendationEditorModalProps) {
  const isEditing = !!initialRecommendation;

  const [form, setForm] = useState<Partial<Recommendation>>({
    id: `rec-custom-${Date.now()}`,
    title: "",
    category: Category.GASTRONOMY,
    shortDescription: "",
    longDescription: "",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    location: "Belgrade, Serbia",
    duration: "2-3 hours",
    travelTime: "15 mins",
    travelTimeMinutes: 15,
    estimatedCost: "€€",
    preferredTransport: "Taxi / Walking",
    coordinateX: 0.5,
    coordinateY: 0.5,
    coordinates: { lat: 44.8176, lng: 20.4569 },
    premiumLevel: "standard",
    budgetLevel: "moderate",
    website: "",
    phone: "",
  });

  const [selectedStatus, setSelectedStatus] = useState<
    "CANDIDATE" | "NEEDS RESEARCH" | "APPROVED" | "RETIRED"
  >(currentStatus);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "details" | "media" | "mood" | "localization"
  >("details");

  useEffect(() => {
    if (initialRecommendation) {
      setForm({ ...initialRecommendation });
      setSelectedStatus(currentStatus);
    } else {
      setForm({
        id: `rec-custom-${Date.now()}`,
        title: "",
        category: Category.GASTRONOMY,
        shortDescription: "",
        longDescription: "",
        image:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
        location: "Belgrade, Serbia",
        duration: "2-3 hours",
        travelTime: "15 mins",
        travelTimeMinutes: 15,
        estimatedCost: "€€",
        preferredTransport: "Taxi / Walking",
        coordinateX: 0.5,
        coordinateY: 0.5,
        coordinates: { lat: 44.8176, lng: 20.4569 },
        premiumLevel: "standard",
        budgetLevel: "moderate",
        website: "",
        phone: "",
      });
      setSelectedStatus("CANDIDATE");
    }
  }, [initialRecommendation, currentStatus, isOpen]);

  if (!isOpen) return null;

  // Completeness & Validation Scoring
  const completeness = calculateRecommendationCompleteness(
    form,
    selectedStatus,
  );
  const warnings = completeness.missingItems;
  const isPublishEligible = completeness.isPublicationEligible;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      alert("Please enter a recommendation title");
      return;
    }
    onSave(form as Recommendation, selectedStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-4xl bg-white border border-[#E5E3DB] rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#23251E] text-white p-5 px-6 flex items-center justify-between border-b border-[#32352B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#C5A059]">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold block">
                {isEditing ? `EDITING REC #${form.id}` : "NEW CURATION ITEM"}
              </span>
              <h2 className="font-serif text-lg font-bold text-white leading-tight">
                {isEditing
                  ? `Edit: ${form.title || "Untitled"}`
                  : "Create Recommendation"}
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

        {/* Navigation Sub-Header */}
        <div className="bg-[#FAF9F5] border-b border-[#E5E3DB] px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "details"
                  ? "bg-[#23251E] text-white"
                  : "text-[#8C8A7D] hover:text-[#1E2E20]"
              }`}
            >
              1. Core Metadata
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "media"
                  ? "bg-[#23251E] text-white"
                  : "text-[#8C8A7D] hover:text-[#1E2E20]"
              }`}
            >
              2. Descriptions & Media
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mood")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "mood"
                  ? "bg-[#23251E] text-white"
                  : "text-[#8C8A7D] hover:text-[#1E2E20]"
              }`}
            >
              3. Mood Orbit Spatial
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("localization")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "localization"
                  ? "bg-[#23251E] text-white"
                  : "text-[#8C8A7D] hover:text-[#1E2E20]"
              }`}
            >
              4. Localization
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-mono">
            <span className="text-[#8C8A7D]">Status:</span>
            <span className="font-bold text-[#8A1F1F] uppercase">
              {selectedStatus}
            </span>
          </div>
        </div>

        {/* Modal Form Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* TAB 1: CORE METADATA */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Recommendation Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title || ""}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g., Kalemegdan Fortress Sunset Walk"
                    className="w-full h-11 px-3.5 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category || Category.GASTRONOMY}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full h-11 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                  >
                    {Object.values(Category).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Location / Area *
                  </label>
                  <input
                    type="text"
                    value={form.location || ""}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="e.g., Belgrade Fortress, Belgrade"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={form.duration || ""}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    placeholder="e.g., 2-3 hours"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Estimated Cost / Tier
                  </label>
                  <input
                    type="text"
                    value={form.estimatedCost || ""}
                    onChange={(e) =>
                      setForm({ ...form, estimatedCost: e.target.value })
                    }
                    placeholder="e.g., €€ (Moderate)"
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>

              {/* Linked Partner */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB] space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#8A1F1F]" />
                  <label className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Linked Experience Partner
                  </label>
                </div>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none cursor-pointer"
                >
                  {PARTNER_OPTIONS.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-[#8C8A7D] font-mono">
                  Attributes QR analytics and verified status badge to on-site
                  experience provider.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DESCRIPTIONS & MEDIA */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Short Editorial Description (~50 words) *
                  </label>
                  <span className="font-mono text-[10px] text-[#8C8A7D]">
                    {(form.shortDescription || "").length} characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={form.shortDescription || ""}
                  onChange={(e) =>
                    setForm({ ...form, shortDescription: e.target.value })
                  }
                  placeholder="Concise overview highlighting key traveler experience..."
                  className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Long Description & Curator Notes *
                  </label>
                  <span className="font-mono text-[10px] text-[#8C8A7D]">
                    {(form.longDescription || "").length} characters
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={form.longDescription || ""}
                  onChange={(e) =>
                    setForm({ ...form, longDescription: e.target.value })
                  }
                  placeholder="Detailed background story, insider advice, best times to visit..."
                  className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                />
              </div>

              {/* Main Image URL */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                  Main Image URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.image || ""}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                {form.image && (
                  <div className="mt-3 relative h-36 rounded-2xl overflow-hidden border border-[#E5E3DB] bg-[#FAF9F5]">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200";
                      }}
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white rounded-lg font-mono text-[9px]">
                      Image Aspect Preview
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MOOD ORBIT SPATIAL VECTOR */}
          {activeTab === "mood" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-[#C5A059]" />
                    <span className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Mood Orbit 2D Spatial Calibration
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8C8A7D]">
                    X: {(form.coordinateX || 0.5).toFixed(2)}, Y:{" "}
                    {(form.coordinateY || 0.5).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      X Axis (Serene vs Vibrant)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.coordinateX ?? 0.5}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinateX: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8C8A7D] mt-1">
                      <span>0.0 Serene</span>
                      <span>1.0 High Vibrant</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Y Axis (Cultural vs Urban)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.coordinateY ?? 0.5}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinateY: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8C8A7D] mt-1">
                      <span>0.0 Heritage/Nature</span>
                      <span>1.0 Urban/Social</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Latitude (Lat)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.coordinates?.lat ?? 44.8176}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        coordinates: {
                          lat: parseFloat(e.target.value) || 44.8176,
                          lng: form.coordinates?.lng || 20.4569,
                        },
                      })
                    }
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Longitude (Lng)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.coordinates?.lng ?? 20.4569}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        coordinates: {
                          lat: form.coordinates?.lat || 44.8176,
                          lng: parseFloat(e.target.value) || 20.4569,
                        },
                      })
                    }
                    className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCALIZATION */}
          {activeTab === "localization" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-[#8A1F1F]" />
                  <span className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Multi-Language Glossary Status
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="p-3 bg-white border border-[#E5E3DB] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-[#8C8A7D] block">
                      English (EN)
                    </span>
                    <span className="text-[#2E7D32] font-bold text-[11px] flex items-center gap-1 mt-1">
                      <Check size={12} /> Primary Source
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E5E3DB] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-[#8C8A7D] block">
                      Serbian Cyrillic
                    </span>
                    <span className="text-[#2E7D32] font-bold text-[11px] flex items-center gap-1 mt-1">
                      <Check size={12} /> Validated
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E5E3DB] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-[#8C8A7D] block">
                      Serbian Latin
                    </span>
                    <span className="text-[#2E7D32] font-bold text-[11px] flex items-center gap-1 mt-1">
                      <Check size={12} /> Validated
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E5E3DB] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-[#8C8A7D] block">
                      Chinese (ZH)
                    </span>
                    <span className="text-[#F57F17] font-bold text-[11px] flex items-center gap-1 mt-1">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDITORIAL LIFECYCLE & RECOMMENDATION COMPLETENESS SCORE CARD */}
          <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E3DB] pb-3">
              <div>
                <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                  Editorial Lifecycle & Completeness Audit
                </span>
                <span className="font-serif font-bold text-sm text-[#1E2E20]">
                  Set Lifecycle Status & Quality Score
                </span>
              </div>

              {/* Status Selector Pills */}
              <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                {(
                  [
                    "CANDIDATE",
                    "NEEDS RESEARCH",
                    "APPROVED",
                    "RETIRED",
                  ] as const
                ).map((st) => {
                  const isSelected = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#23251E] text-white"
                          : "bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]"
                      }`}
                    >
                      {st === "CANDIDATE"
                        ? "Draft"
                        : st === "NEEDS RESEARCH"
                          ? "Review"
                          : st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Completeness Meter */}
            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#8C8A7D] block">
                    Recommendation Completeness Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-2xl font-bold text-[#1E2E20]">
                      {completeness.scorePercentage}%
                    </span>
                    <span className="font-mono text-xs text-[#8C8A7D]">
                      ({completeness.completedItems.length} of{" "}
                      {completeness.items.length} items complete)
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase border ${
                    completeness.scorePercentage >= 90
                      ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                      : completeness.scorePercentage >= 70
                        ? "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                        : "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                  }`}
                >
                  {completeness.scorePercentage >= 90
                    ? "High Quality"
                    : completeness.scorePercentage >= 70
                      ? "In Progress"
                      : "Incomplete"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#E5E3DB] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    completeness.scorePercentage >= 90
                      ? "bg-[#2E7D32]"
                      : completeness.scorePercentage >= 70
                        ? "bg-[#C5A059]"
                        : "bg-[#8A1F1F]"
                  }`}
                  style={{ width: `${completeness.scorePercentage}%` }}
                />
              </div>

              {/* Items Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-[#E5E3DB]">
                <div>
                  <span className="font-bold text-[#2E7D32] flex items-center gap-1 mb-1.5 text-[10.5px] uppercase">
                    <CheckCircle2 size={13} /> Completed Items (
                    {completeness.completedItems.length}):
                  </span>
                  <ul className="space-y-1 text-[#1E2E20] text-[11px] list-disc list-inside">
                    {completeness.completedItems.map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-[#8A1F1F] flex items-center gap-1 mb-1.5 text-[10.5px] uppercase">
                    <AlertTriangle size={13} /> Missing / Action Items (
                    {completeness.missingItems.length}):
                  </span>
                  {completeness.missingItems.length > 0 ? (
                    <ul className="space-y-1 text-[#8A1F1F] text-[11px] list-disc list-inside">
                      {completeness.missingItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#2E7D32] italic">
                      All 10 recommendation fields are fully satisfied.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Publication Eligibility Notice */}
            <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className={
                    isPublishEligible ? "text-[#2E7D32]" : "text-[#8C8A7D]"
                  }
                />
                <div>
                  <span className="font-bold text-[#1E2E20] block">
                    Publication Eligibility Status
                  </span>
                  <span className="text-[10.5px] text-[#8C8A7D]">
                    {isPublishEligible
                      ? "Item meets editorial quality standards & approved status for next Destination Package Release."
                      : "Requires status set to APPROVED and minimum 80% completeness score to become release-eligible."}
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-bold uppercase text-[9.5px] border ${
                  isPublishEligible
                    ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                    : "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                }`}
              >
                {isPublishEligible ? "RELEASE READY" : "NOT ELIGIBLE"}
              </span>
            </div>

            <p className="text-[10px] text-[#8C8A7D] font-mono italic text-center">
              * Note: The completeness score indicates readiness but does not
              automatically publish content. Published state is controlled
              exclusively through the Destination Package publishing workflow.
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

            <div className="flex items-center gap-2">
              <button
                type="submit"
                onClick={() => setSelectedStatus("CANDIDATE")}
                className="px-4 py-2.5 rounded-xl border border-[#23251E] bg-[#FAF9F5] hover:bg-white text-[#1E2E20] font-mono text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Save size={14} className="text-[#C5A059]" />
                <span>Save Recommendation</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
