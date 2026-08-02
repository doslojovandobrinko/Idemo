import React, { useState, useMemo, useEffect } from "react";
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  Edit3,
  History,
  Globe,
  Image as ImageIcon,
  Users,
  PackageCheck,
  Sparkles,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Layers,
  MapPin,
  ExternalLink,
  Check,
  X,
  Smartphone,
  BookOpen,
  Activity,
  Clock,
  Zap,
  Tag,
} from "lucide-react";
import { Recommendation, Category, Partner } from "../../types";
import { INITIAL_RECOMMENDATIONS } from "../../constants";
import { draftExpansionPool } from "../../data/recommendations/serbia/draft_expansion";
import { PARTNERS as PARTNERS_DATABASE } from "../../data/partners";
import { StudioTab } from "./types";
import {
  calculateRecommendationCompleteness,
  calculatePartnerReadiness,
  calculateOverallReleaseReadiness,
} from "./utils/scoring";

interface StudioEditorialReviewProps {
  customRecommendations?: Recommendation[];
  editorialStatuses?: Record<
    string,
    "CANDIDATE" | "NEEDS RESEARCH" | "APPROVED" | "MERGE CANDIDATE" | "RETIRED"
  >;
  onUpdateEditorialStatuses?: (
    statuses: Record<
      string,
      | "CANDIDATE"
      | "NEEDS RESEARCH"
      | "APPROVED"
      | "MERGE CANDIDATE"
      | "RETIRED"
    >,
  ) => void;
  onAddCustomRecommendation?: (rec: Recommendation) => void;
  onNavigateTab?: (tab: StudioTab, itemId?: string) => void;
  targetRecId?: string;
}

export type ReviewSubTab =
  | "overview"
  | "content"
  | "images"
  | "partners"
  | "translations"
  | "qa"
  | "history"
  | "publication";

export interface EditorialRevision {
  version: string;
  date: string;
  editor: string;
  reason: string;
  approvalStatus: "APPROVED" | "DRAFT" | "REVIEW";
  firstPackage: string;
  snapshot: Partial<Recommendation>;
}

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English (EN)", flag: "🇬🇧", primary: true },
  { code: "sr", label: "Serbian (SR)", flag: "🇷🇸", primary: false },
  { code: "de", label: "German (DE)", flag: "🇩🇪", primary: false },
  { code: "ru", label: "Russian (RU)", flag: "🇷🇺", primary: false },
  { code: "es", label: "Spanish (ES)", flag: "🇪🇸", primary: false },
  { code: "zh", label: "Chinese (ZH)", flag: "🇨🇳", primary: false },
];

export function StudioEditorialReview({
  customRecommendations = [],
  editorialStatuses = {},
  onUpdateEditorialStatuses,
  onAddCustomRecommendation,
  onNavigateTab,
  targetRecId,
}: StudioEditorialReviewProps) {
  // Combine all recs
  const allRecs = useMemo(() => {
    const combined = [
      ...INITIAL_RECOMMENDATIONS,
      ...draftExpansionPool,
      ...customRecommendations,
    ];
    const map = new Map<string, Recommendation>();
    combined.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [customRecommendations]);

  const [selectedRecId, setSelectedRecId] = useState<string>(
    targetRecId || allRecs[0]?.id || "101",
  );
  const [activeSubTab, setActiveSubTab] = useState<ReviewSubTab>("overview");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [healthFilter, setHealthFilter] = useState<string>("ALL");

  // Mobile Preview Modal
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<
    "en" | "sr" | "de" | "ru" | "es" | "zh"
  >("en");

  // Version Comparison Modal
  const [comparingRevision, setComparingRevision] =
    useState<EditorialRevision | null>(null);

  // Translation statuses per language for active item
  const [translationStatuses, setTranslationStatuses] = useState<
    Record<string, "APPROVED" | "NEEDS_REVIEW" | "IN_PROGRESS" | "NOT_STARTED">
  >({
    en: "APPROVED",
    sr: "APPROVED",
    de: "NEEDS_REVIEW",
    ru: "NEEDS_REVIEW",
    es: "IN_PROGRESS",
    zh: "IN_PROGRESS",
  });

  // Local editable recommendation state for active rec
  const [editableRec, setEditableRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (targetRecId) {
      setSelectedRecId(targetRecId);
    }
  }, [targetRecId]);

  const activeRec = useMemo(() => {
    return allRecs.find((r) => r.id === selectedRecId) || allRecs[0];
  }, [allRecs, selectedRecId]);

  useEffect(() => {
    if (activeRec) {
      setEditableRec(activeRec);
    }
  }, [activeRec]);

  // Filter logic
  const filteredRecs = useMemo(() => {
    return allRecs.filter((r) => {
      const titleMatch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase());

      const catMatch =
        selectedCategory === "ALL" || r.category === selectedCategory;
      const status =
        editorialStatuses[r.id] ||
        (INITIAL_RECOMMENDATIONS.some((i) => i.id === r.id)
          ? "APPROVED"
          : "CANDIDATE");
      const statusMatch = selectedStatus === "ALL" || status === selectedStatus;

      const comp = calculateRecommendationCompleteness(r, status);
      let healthMatch = true;
      if (healthFilter === "EXCELLENT")
        healthMatch = comp.scorePercentage >= 90;
      if (healthFilter === "GOOD")
        healthMatch = comp.scorePercentage >= 70 && comp.scorePercentage < 90;
      if (healthFilter === "NEEDS_WORK")
        healthMatch = comp.scorePercentage < 70;

      return titleMatch && catMatch && statusMatch && healthMatch;
    });
  }, [
    allRecs,
    searchQuery,
    selectedCategory,
    selectedStatus,
    healthFilter,
    editorialStatuses,
  ]);

  // Active status
  const currentStatus =
    editorialStatuses[activeRec?.id || ""] ||
    (INITIAL_RECOMMENDATIONS.some((i) => i.id === activeRec?.id)
      ? "APPROVED"
      : "CANDIDATE");

  // Scoring & Health calculations for active item
  const completeness = useMemo(() => {
    if (!activeRec) return null;
    return calculateRecommendationCompleteness(activeRec, currentStatus);
  }, [activeRec, currentStatus]);

  // Overall Health Score Calculation
  const healthMetrics = useMemo(() => {
    if (!activeRec || !completeness) return null;

    const hasHero = Boolean(
      activeRec.image && !activeRec.image.includes("placeholder"),
    );
    const imageScore = hasHero ? 100 : 50;

    const srTrans = activeRec.translations?.sr;
    const deTrans = activeRec.translations?.de;
    const transScore = (srTrans?.title ? 50 : 0) + (deTrans?.title ? 50 : 0);

    const linkedPartner = PARTNERS_DATABASE.find((p) =>
      p.linkedRecommendations.includes(activeRec.id),
    );
    const partnerScore = linkedPartner
      ? linkedPartner.conciergeRoutingEligible === "Yes"
        ? 100
        : 70
      : 50;

    const hasCoords = Boolean(
      activeRec.coordinates && activeRec.coordinates.lat !== 0,
    );
    const coordScore = hasCoords ? 100 : 0;

    const hasMood =
      typeof activeRec.coordinateX === "number" &&
      typeof activeRec.coordinateY === "number";
    const moodScore = hasMood ? 100 : 0;

    const qaScore = completeness.scorePercentage >= 85 ? 95 : 70;

    const overallHealth = Math.round(
      completeness.scorePercentage * 0.25 +
        imageScore * 0.15 +
        transScore * 0.2 +
        partnerScore * 0.15 +
        coordScore * 0.1 +
        moodScore * 0.1 +
        qaScore * 0.05,
    );

    return {
      overallHealth,
      editorialCompleteness: completeness.scorePercentage,
      imageCompleteness: imageScore,
      translationCompleteness: transScore,
      partnerMappingScore: partnerScore,
      coordinatesScore: coordScore,
      moodOrbitScore: moodScore,
      qaScore,
      publicationReady:
        completeness.isPublicationEligible && overallHealth >= 80,
      linkedPartner,
    };
  }, [activeRec, completeness]);

  // Operational Dashboard Aggregates
  const dashStats = useMemo(() => {
    const readyCount = allRecs.filter((r) => {
      const st =
        editorialStatuses[r.id] ||
        (INITIAL_RECOMMENDATIONS.some((i) => i.id === r.id)
          ? "APPROVED"
          : "CANDIDATE");
      const comp = calculateRecommendationCompleteness(r, st);
      return st === "APPROVED" && comp.scorePercentage >= 85;
    }).length;

    const reviewCount = allRecs.filter((r) => {
      const st =
        editorialStatuses[r.id] ||
        (INITIAL_RECOMMENDATIONS.some((i) => i.id === r.id)
          ? "APPROVED"
          : "CANDIDATE");
      return st === "NEEDS RESEARCH" || st === "CANDIDATE";
    }).length;

    const blockedCount = allRecs.filter((r) => {
      const st =
        editorialStatuses[r.id] ||
        (INITIAL_RECOMMENDATIONS.some((i) => i.id === r.id)
          ? "APPROVED"
          : "CANDIDATE");
      const comp = calculateRecommendationCompleteness(r, st);
      return comp.scorePercentage < 60;
    }).length;

    return {
      total: allRecs.length,
      ready: readyCount,
      needsReview: reviewCount,
      blocked: blockedCount,
      avgReviewTime: "1.4 hours",
      translationCompletion: 88,
      partnerReadiness: 94,
      qaCompletion: 92,
      publicationReadiness: "READY (135 Canonical)",
    };
  }, [allRecs, editorialStatuses]);

  // Editorial Change Intelligence (ECI) impact analysis mockup for active rec
  const eciImpact = useMemo(() => {
    if (!activeRec) return null;
    return {
      sourceFieldChanged: "shortDescription",
      changeReason: "Curator stylistic refinement & etiquette emphasis",
      affectedTranslations: ["Serbian (SR)", "German (DE)", "Russian (RU)"],
      affectedCollections: [
        "Belgrade Cultural Trail",
        "Historic Highlights v2",
      ],
      affectedPartnerMappings: healthMetrics?.linkedPartner
        ? [healthMetrics.linkedPartner.nameEn]
        : ["Kafana Pavle"],
      affectedPackages: ["serbia-concierge-v1.2.0.pkg"],
      estimatedReviewEffort: "~15 minutes",
    };
  }, [activeRec, healthMetrics]);

  // Mock revision history for active recommendation
  const revisionHistory: EditorialRevision[] = useMemo(() => {
    if (!activeRec) return [];
    return [
      {
        version: "v1.4.2 (Current)",
        date: "2026-07-28 14:30",
        editor: "Milena Popović (Senior Curator)",
        reason: "Added local etiquette tips and expanded practical advice",
        approvalStatus: "APPROVED",
        firstPackage: "serbia-concierge-v1.2.0.pkg",
        snapshot: { ...activeRec },
      },
      {
        version: "v1.4.0",
        date: "2026-07-15 09:12",
        editor: "Dusan Vasić (Lead Editor)",
        reason: "Updated Mood Orbit X/Y spatial vectors and photo aspect ratio",
        approvalStatus: "APPROVED",
        firstPackage: "serbia-concierge-v1.1.8.pkg",
        snapshot: {
          ...activeRec,
          shortDescription:
            activeRec.shortDescription + " (Legacy draft v1.4.0)",
        },
      },
      {
        version: "v1.2.0",
        date: "2026-06-01 11:00",
        editor: "Jelena Nikolić (Translator)",
        reason: "Initial Serbian & German translation sync",
        approvalStatus: "REVIEW",
        firstPackage: "serbia-concierge-v1.0.0.pkg",
        snapshot: {
          ...activeRec,
          shortDescription: "Initial draft version for review.",
        },
      },
    ];
  }, [activeRec]);

  // QA Issues for active item
  const qaIssues = useMemo(() => {
    if (!activeRec || !completeness) return [];
    const issues = [];
    if (!activeRec.title || activeRec.title.length < 3) {
      issues.push({
        id: "qa-1",
        severity: "BLOCKING",
        title: "Title too short",
        detail: "Title must be at least 3 characters",
        targetTab: "content",
      });
    }
    if (!activeRec.image || activeRec.image.includes("placeholder")) {
      issues.push({
        id: "qa-2",
        severity: "WARNING",
        title: "Placeholder image detected",
        detail: "High resolution canonical hero image recommended",
        targetTab: "images",
      });
    }
    if (!activeRec.translations?.sr?.shortDescription) {
      issues.push({
        id: "qa-3",
        severity: "WARNING",
        title: "Serbian localization missing",
        detail:
          "Serbian short description is required for local audience parity",
        targetTab: "translations",
      });
    }
    if (
      typeof activeRec.coordinateX !== "number" ||
      typeof activeRec.coordinateY !== "number"
    ) {
      issues.push({
        id: "qa-4",
        severity: "WARNING",
        title: "Mood Orbit uncalibrated",
        detail:
          "2D spatial vector coordinates required for visual map positioning",
        targetTab: "content",
      });
    }
    if (!activeRec.website && !activeRec.phone) {
      issues.push({
        id: "qa-5",
        severity: "INFO",
        title: "No direct contact info",
        detail: "Consider mapping website URL or contact phone number",
        targetTab: "partners",
      });
    }
    return issues;
  }, [activeRec, completeness]);

  const handleStatusChange = (
    newStatus:
      | "CANDIDATE"
      | "NEEDS RESEARCH"
      | "APPROVED"
      | "MERGE CANDIDATE"
      | "RETIRED",
  ) => {
    if (activeRec && onUpdateEditorialStatuses) {
      onUpdateEditorialStatuses({
        ...editorialStatuses,
        [activeRec.id]: newStatus,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-[#23251E] text-white font-mono text-[9px] uppercase font-bold tracking-wider">
              IDEMO Studio Workspace
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#C5A059]/15 text-[#8A1F1F] font-mono text-[9px] uppercase font-bold border border-[#C5A059]/30">
              Work Package WP-10
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2E20] tracking-tight">
            Editorial Review Workspace
          </h1>
          <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-0.5">
            Operational curation desk to review, validate, translate, and
            certify recommendation intelligence at scale.
          </p>
        </div>

        {/* Quick Actions & Mobile Preview trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobilePreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Smartphone size={15} className="text-[#C5A059]" />
            <span>Mobile Preview</span>
          </button>
        </div>
      </div>

      {/* Operational Executive Dashboard Metrics */}
      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1E2E20]">
            <Activity size={16} className="text-[#8A1F1F]" />
            <span>EDITORIAL ATTENTION DASHBOARD</span>
          </div>
          <span className="font-mono text-[10px] text-[#8C8A7D]">
            Real-time Operational Guidance
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl">
            <span className="text-[9px] text-[#8C8A7D] uppercase font-bold block">
              Total Recs
            </span>
            <span className="text-base font-bold text-[#1E2E20]">
              {dashStats.total}
            </span>
          </div>
          <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl">
            <span className="text-[9px] text-[#2E7D32] uppercase font-bold block">
              Ready & Approved
            </span>
            <span className="text-base font-bold text-[#2E7D32]">
              {dashStats.ready}
            </span>
          </div>
          <div className="p-3 bg-[#FFF8E1] border border-[#FFE082] rounded-2xl">
            <span className="text-[9px] text-[#F57F17] uppercase font-bold block">
              Needs Review
            </span>
            <span className="text-base font-bold text-[#F57F17]">
              {dashStats.needsReview}
            </span>
          </div>
          <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-2xl">
            <span className="text-[9px] text-[#C62828] uppercase font-bold block">
              Blocked
            </span>
            <span className="text-base font-bold text-[#C62828]">
              {dashStats.blocked}
            </span>
          </div>
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl">
            <span className="text-[9px] text-[#8C8A7D] uppercase font-bold block">
              Avg Review Time
            </span>
            <span className="text-xs font-bold text-[#1E2E20]">
              {dashStats.avgReviewTime}
            </span>
          </div>
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl">
            <span className="text-[9px] text-[#8C8A7D] uppercase font-bold block">
              Translations
            </span>
            <span className="text-xs font-bold text-[#1E2E20]">
              {dashStats.translationCompletion}%
            </span>
          </div>
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl">
            <span className="text-[9px] text-[#8C8A7D] uppercase font-bold block">
              Partners
            </span>
            <span className="text-xs font-bold text-[#1E2E20]">
              {dashStats.partnerReadiness}%
            </span>
          </div>
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl">
            <span className="text-[9px] text-[#8C8A7D] uppercase font-bold block">
              QA Pass
            </span>
            <span className="text-xs font-bold text-[#2E7D32]">
              {dashStats.qaCompletion}%
            </span>
          </div>
        </div>
      </div>

      {/* Master Filter Bar */}
      <div className="bg-white border border-[#E5E3DB] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter recommendations by title, ID, or location..."
            className="w-full h-10 pl-9 pr-4 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
          />
          <Search size={14} className="absolute left-3 top-3 text-[#8C8A7D]" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          {Object.values(Category).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">APPROVED</option>
          <option value="CANDIDATE">CANDIDATE</option>
          <option value="NEEDS RESEARCH">NEEDS RESEARCH</option>
          <option value="RETIRED">RETIRED</option>
        </select>

        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Health Scores</option>
          <option value="EXCELLENT">Excellent (&gt;=90%)</option>
          <option value="GOOD">Good (70-89%)</option>
          <option value="NEEDS_WORK">Needs Work (&lt;70%)</option>
        </select>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommendation Selector Sidebar List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E3DB] rounded-3xl overflow-hidden shadow-xs flex flex-col h-[750px]">
          <div className="p-4 border-b border-[#E5E3DB] bg-[#FAF9F5] flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#1E2E20]">
              RECOMMENDATION CATALOGUE ({filteredRecs.length})
            </span>
            <span className="text-[10px] font-mono text-[#8C8A7D]">
              Click to Select
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E3DB] no-scrollbar">
            {filteredRecs.map((r) => {
              const isSelected = r.id === selectedRecId;
              const status =
                editorialStatuses[r.id] ||
                (INITIAL_RECOMMENDATIONS.some((i) => i.id === r.id)
                  ? "APPROVED"
                  : "CANDIDATE");
              const comp = calculateRecommendationCompleteness(r, status);

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecId(r.id)}
                  className={`p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-[#FAF9F5] border-l-4 border-l-[#8A1F1F]"
                      : "hover:bg-[#FAF9F5]/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9.5px] font-bold text-[#8C8A7D]">
                      #{r.id}
                    </span>
                    <span
                      className={`text-[8.5px] font-mono px-2 py-0.5 rounded-md font-bold uppercase border ${
                        status === "APPROVED"
                          ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                          : status === "NEEDS RESEARCH"
                            ? "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                            : "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-xs text-[#1E2E20] line-clamp-1">
                    {r.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8C8A7D] pt-0.5">
                    <span>{r.category}</span>
                    <span
                      className={`font-bold ${
                        comp.scorePercentage >= 90
                          ? "text-[#2E7D32]"
                          : comp.scorePercentage >= 70
                            ? "text-[#C5A059]"
                            : "text-[#8A1F1F]"
                      }`}
                    >
                      Health: {comp.scorePercentage}%
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredRecs.length === 0 && (
              <div className="p-8 text-center text-[#8C8A7D] font-mono text-xs">
                No matching recommendations found.
              </div>
            )}
          </div>
        </div>

        {/* Workspace Details & Sub-tabs Canvas (8 cols) */}
        {activeRec && healthMetrics ? (
          <div className="lg:col-span-8 bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs flex flex-col space-y-5">
            {/* Top Identity Header */}
            <div className="border-b border-[#E5E3DB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#8A1F1F]">
                    #{activeRec.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E5E3DB] font-mono text-[10px] font-bold text-[#1E2E20]">
                    {activeRec.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#23251E] text-white font-mono text-[10px] font-bold">
                    v1.4.2 Canonical
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#1E2E20]">
                  {activeRec.title}
                </h2>
                <p className="text-xs text-[#8C8A7D] font-mono mt-0.5">
                  {activeRec.location} • Curator: Milena Popović
                </p>
              </div>

              {/* Status Change Selector */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#8C8A7D] text-[10px] uppercase font-bold">
                  Status:
                </span>
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DB] font-bold text-[#1E2E20] outline-none cursor-pointer"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="CANDIDATE">CANDIDATE</option>
                  <option value="NEEDS RESEARCH">NEEDS RESEARCH</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>
            </div>

            {/* Sub-Tab Navigation Bar */}
            <div className="flex items-center gap-1 border-b border-[#E5E3DB] pb-2 overflow-x-auto no-scrollbar font-mono text-xs font-bold">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "content", label: "Content", icon: Edit3 },
                { id: "images", label: "Images", icon: ImageIcon },
                { id: "partners", label: "Partners", icon: Users },
                { id: "translations", label: "Translations", icon: Globe },
                {
                  id: "qa",
                  label: `QA (${qaIssues.length})`,
                  icon: AlertTriangle,
                  badgeColor: qaIssues.some((i) => i.severity === "BLOCKING")
                    ? "bg-[#8A1F1F]"
                    : "bg-[#C5A059]",
                },
                { id: "history", label: "History", icon: History },
                { id: "publication", label: "Publication", icon: PackageCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as ReviewSubTab)}
                    className={`px-3 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#23251E] text-white shadow-xs"
                        : "text-[#8C8A7D] hover:text-[#1E2E20] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={isActive ? "text-[#C5A059]" : ""}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Tab Content Rendering */}
            <div className="flex-1 space-y-6">
              {/* OVERVIEW SUB-TAB */}
              {activeSubTab === "overview" && (
                <div className="space-y-6">
                  {/* Recommendation Health Score Deterministic Card */}
                  <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#1E2E20] flex items-center gap-2">
                          <Sparkles size={16} className="text-[#C5A059]" />
                          RECOMMENDATION HEALTH SCORE
                        </span>
                        <p className="text-[10.5px] text-[#8C8A7D] font-mono mt-0.5">
                          Deterministic health score evaluating completeness,
                          image quality, translations, coordinates & QA.
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-3xl font-serif font-bold text-[#1E2E20]">
                          {healthMetrics.overallHealth}%
                        </span>
                        <span className="block text-[9px] font-mono text-[#8C8A7D] uppercase font-bold">
                          Overall Score
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Scores Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Editorial
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E7D32] h-full"
                            style={{
                              width: `${healthMetrics.editorialCompleteness}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.editorialCompleteness}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Images
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E7D32] h-full"
                            style={{
                              width: `${healthMetrics.imageCompleteness}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.imageCompleteness}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Translations
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#C5A059] h-full"
                            style={{
                              width: `${healthMetrics.translationCompleteness}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.translationCompleteness}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Partner Link
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E7D32] h-full"
                            style={{
                              width: `${healthMetrics.partnerMappingScore}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.partnerMappingScore}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Coordinates
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E7D32] h-full"
                            style={{
                              width: `${healthMetrics.coordinatesScore}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.coordinatesScore}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Mood Orbit
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E7D32] h-full"
                            style={{
                              width: `${healthMetrics.moodOrbitScore}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.moodOrbitScore}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          QA Audit
                        </span>
                        <div className="w-full bg-[#E5E3DB] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E7D32] h-full"
                            style={{ width: `${healthMetrics.qaScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2E20]">
                          {healthMetrics.qaScore}%
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] space-y-1">
                        <span className="text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          Publication Ready
                        </span>
                        <span
                          className={`text-xs font-bold block mt-2 ${healthMetrics.publicationReady ? "text-[#2E7D32]" : "text-[#F57F17]"}`}
                        >
                          {healthMetrics.publicationReady
                            ? "YES (Eligible)"
                            : "NO (Pending)"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-xl border border-[#E5E3DB] text-[10px] font-mono text-[#8C8A7D]">
                      💡 <strong>Operational Note:</strong> Recommendation
                      Health Score provides automated operational guidance to
                      curators. It never overrides official publication rules.
                    </div>
                  </div>

                  {/* One-Click Quick Actions Toolbar */}
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold text-[#1E2E20] block">
                      ONE-CLICK EDITORIAL ACTIONS
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                      <button
                        onClick={() => setActiveSubTab("translations")}
                        className="p-3 bg-white border border-[#E5E3DB] hover:border-[#23251E] rounded-xl text-left font-bold text-[#1E2E20] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Globe size={14} className="text-[#C5A059]" /> Review
                          Translation
                        </span>
                        <ChevronRight size={14} className="text-[#8C8A7D]" />
                      </button>

                      <button
                        onClick={() => {
                          if (healthMetrics.linkedPartner && onNavigateTab) {
                            onNavigateTab(
                              "partners",
                              healthMetrics.linkedPartner.id,
                            );
                          } else {
                            setActiveSubTab("partners");
                          }
                        }}
                        className="p-3 bg-white border border-[#E5E3DB] hover:border-[#23251E] rounded-xl text-left font-bold text-[#1E2E20] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Users size={14} className="text-[#8A1F1F]" /> Open
                          Partner
                        </span>
                        <ChevronRight size={14} className="text-[#8C8A7D]" />
                      </button>

                      <button
                        onClick={() => setActiveSubTab("images")}
                        className="p-3 bg-white border border-[#E5E3DB] hover:border-[#23251E] rounded-xl text-left font-bold text-[#1E2E20] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <ImageIcon size={14} className="text-[#2E7D32]" />{" "}
                          Open Images
                        </span>
                        <ChevronRight size={14} className="text-[#8C8A7D]" />
                      </button>

                      <button
                        onClick={() => setActiveSubTab("history")}
                        className="p-3 bg-white border border-[#E5E3DB] hover:border-[#23251E] rounded-xl text-left font-bold text-[#1E2E20] flex items-center justify-between cursor-pointer transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <History size={14} className="text-[#C5A059]" /> Open
                          History
                        </span>
                        <ChevronRight size={14} className="text-[#8C8A7D]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT SUB-TAB */}
              {activeSubTab === "content" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <span className="font-mono text-xs font-bold text-[#1E2E20]">
                      EDITORIAL CONTENT INSPECTION & QUICK EDIT
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8A7D]">
                      Canonical Text Payload
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editableRec?.title || ""}
                        onChange={(e) =>
                          editableRec &&
                          setEditableRec({
                            ...editableRec,
                            title: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl font-serif font-bold text-sm text-[#1E2E20] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                        Short Editorial Overview
                      </label>
                      <textarea
                        rows={3}
                        value={editableRec?.shortDescription || ""}
                        onChange={(e) =>
                          editableRec &&
                          setEditableRec({
                            ...editableRec,
                            shortDescription: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-[#1E2E20] outline-none leading-relaxed"
                      />
                      {(editableRec?.shortDescription?.length || 0) < 30 && (
                        <p className="text-[10px] font-mono text-[#8A1F1F] mt-1 flex items-center gap-1 font-bold">
                          <AlertTriangle size={12} /> Short overview is under 30
                          characters. Expand for optimal mobile reading.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                        Long Story & Curator Advice
                      </label>
                      <textarea
                        rows={6}
                        value={editableRec?.longDescription || ""}
                        onChange={(e) =>
                          editableRec &&
                          setEditableRec({
                            ...editableRec,
                            longDescription: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-[#1E2E20] outline-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Location Area String
                        </label>
                        <input
                          type="text"
                          value={editableRec?.location || ""}
                          onChange={(e) =>
                            editableRec &&
                            setEditableRec({
                              ...editableRec,
                              location: e.target.value,
                            })
                          }
                          className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl font-mono text-xs text-[#1E2E20] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Estimated Duration
                        </label>
                        <input
                          type="text"
                          value={editableRec?.duration || "2-3 hours"}
                          onChange={(e) =>
                            editableRec &&
                            setEditableRec({
                              ...editableRec,
                              duration: e.target.value,
                            })
                          }
                          className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl font-mono text-xs text-[#1E2E20] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGES SUB-TAB */}
              {activeSubTab === "images" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <span className="font-mono text-xs font-bold text-[#1E2E20]">
                      HERO EXPERIENCE IMAGE & ASSET AUDIT
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8A7D]">
                      Aspect Ratio & Resolution Check
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-[#E5E3DB] bg-[#23251E] aspect-video">
                        <img
                          src={activeRec.image}
                          alt={activeRec.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-[#23251E]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-mono font-bold text-white">
                          Hero Image (16:9 Aspect)
                        </div>
                      </div>

                      <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl font-mono text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#2E7D32]">
                          <span>Aspect Ratio Check:</span>
                          <span className="font-bold">PASSED (16:9)</span>
                        </div>
                        <div className="flex items-center justify-between text-[#2E7D32]">
                          <span>Image Resolution:</span>
                          <span className="font-bold">
                            High Res (Canonical)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Image Asset URL
                        </label>
                        <input
                          type="text"
                          value={editableRec?.image || ""}
                          onChange={(e) =>
                            editableRec &&
                            setEditableRec({
                              ...editableRec,
                              image: e.target.value,
                            })
                          }
                          className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs text-[#1E2E20] outline-none"
                        />
                      </div>

                      <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl space-y-2">
                        <span className="text-[10px] uppercase font-bold text-[#8C8A7D] block">
                          Image Quality Guidelines
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-[#1E2E20] space-y-1">
                          <li>
                            High contrast, daylight, authentic local photography
                          </li>
                          <li>
                            No artificial watermarks or heavy filter presets
                          </li>
                          <li>Minimum resolution: 1280x720px</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PARTNERS SUB-TAB */}
              {activeSubTab === "partners" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <span className="font-mono text-xs font-bold text-[#1E2E20]">
                      LINKED EXPERIENCE PARTNER & ROUTING
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8A7D]">
                      Concierge Dispatch Status
                    </span>
                  </div>

                  {healthMetrics.linkedPartner ? (
                    <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                        <div>
                          <span className="font-mono text-[9px] uppercase font-bold text-[#8A1F1F]">
                            Partner ID: #{healthMetrics.linkedPartner.id}
                          </span>
                          <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                            {healthMetrics.linkedPartner.nameEn}
                          </h3>
                          <p className="text-xs text-[#8C8A7D] font-mono">
                            {healthMetrics.linkedPartner.category} •{" "}
                            {healthMetrics.linkedPartner.locationEn}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                            healthMetrics.linkedPartner
                              .conciergeRoutingEligible === "Yes"
                              ? "bg-[#E8F5E9] text-[#2E7D32]"
                              : "bg-[#FFF8E1] text-[#F57F17]"
                          }`}
                        >
                          Routing:{" "}
                          {healthMetrics.linkedPartner.conciergeRoutingEligible}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs text-[#1E2E20]">
                        <div>
                          <span className="text-[#8C8A7D] block text-[9.5px]">
                            Verified Contact Email:
                          </span>
                          <strong>{healthMetrics.linkedPartner.email}</strong>
                        </div>
                        <div>
                          <span className="text-[#8C8A7D] block text-[9.5px]">
                            Direct Phone/WhatsApp:
                          </span>
                          <strong>
                            {healthMetrics.linkedPartner.phone ||
                              healthMetrics.linkedPartner.whatsApp}
                          </strong>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onNavigateTab &&
                          onNavigateTab(
                            "partners",
                            healthMetrics.linkedPartner?.id,
                          )
                        }
                        className="py-2.5 px-4 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <ExternalLink size={14} className="text-[#C5A059]" />
                        <span>Open Partner in Partner Workspace</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#8C8A7D] font-mono text-xs bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB]">
                      No specific experience partner is currently mapped to this
                      recommendation.
                    </div>
                  )}

                  {/* Partner Passport Introduction Review Workspace */}
                  <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#8A1F1F]" />
                        <h4 className="font-serif font-bold text-sm text-[#1E2E20]">
                          Partner Passport Introduction Governance
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#8C8A7D]">
                        IDEMO Review Queue
                      </span>
                    </div>

                    <p className="text-xs text-[#8C8A7D] font-sans">
                      Review submitted professional introductions and profile
                      photos before they are published to visitors upon inquiry
                      acceptance.
                    </p>

                    <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-[#1E2E20]">
                          Submitted Introduction
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32] font-bold">
                          READY FOR REVIEW
                        </span>
                      </div>

                      <p className="text-xs text-[#1E2E20] font-sans leading-relaxed p-3 bg-white border border-[#E5E3DB] rounded-lg border-l-4 border-l-[#C5A059]">
                        "Licensed professional guide with over 10 years of
                        experience in Serbia's cultural heritage, natural
                        meanders, and bespoke gastronomy tours across Belgrade
                        and Novi Sad."
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-xs font-mono text-[#8C8A7D]">
                          <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Professional Photo: Attached & Consented</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              alert(
                                "Partner Passport introduction approved and published to live visitor views.",
                              );
                            }}
                            className="px-3 py-1.5 bg-[#2E7D32] text-white text-xs font-mono font-bold rounded-lg hover:bg-[#2E7D32]/90 cursor-pointer"
                          >
                            Approve & Publish
                          </button>
                          <button
                            onClick={() => {
                              alert("Changes requested from partner.");
                            }}
                            className="px-3 py-1.5 bg-[#C5A059] text-white text-xs font-mono font-bold rounded-lg hover:bg-[#C5A059]/90 cursor-pointer"
                          >
                            Request Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSLATIONS SUB-TAB */}
              {activeSubTab === "translations" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <span className="font-mono text-xs font-bold text-[#1E2E20]">
                      6-LANGUAGE SIDE-BY-SIDE LOCALIZATION WORKSPACE
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8A7D]">
                      EN, SR, DE, RU, ES, ZH Baseline
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isEn = lang.code === "en";
                      const trans = isEn
                        ? {
                            title: activeRec.title,
                            shortDescription: activeRec.shortDescription,
                          }
                        : (activeRec.translations as any)?.[lang.code];
                      const status =
                        translationStatuses[lang.code] || "IN_PROGRESS";

                      return (
                        <div
                          key={lang.code}
                          className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                            <span className="font-mono text-xs font-bold text-[#1E2E20] flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                              {isEn && (
                                <span className="text-[9px] bg-[#23251E] text-white px-2 py-0.5 rounded-md uppercase font-bold">
                                  Source Canonical
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <button
                                onClick={() =>
                                  setTranslationStatuses({
                                    ...translationStatuses,
                                    [lang.code]: "APPROVED",
                                  })
                                }
                                className={`px-2.5 py-1 rounded-md font-bold uppercase ${
                                  status === "APPROVED"
                                    ? "bg-[#2E7D32] text-white"
                                    : "bg-white border border-[#E5E3DB] text-[#8C8A7D]"
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setTranslationStatuses({
                                    ...translationStatuses,
                                    [lang.code]: "NEEDS_REVIEW",
                                  })
                                }
                                className={`px-2.5 py-1 rounded-md font-bold uppercase ${
                                  status === "NEEDS_REVIEW"
                                    ? "bg-[#F57F17] text-white"
                                    : "bg-white border border-[#E5E3DB] text-[#8C8A7D]"
                                }`}
                              >
                                Needs Review
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                                Title ({lang.code.toUpperCase()})
                              </span>
                              <p className="p-2.5 bg-white rounded-xl border border-[#E5E3DB] font-semibold text-[#1E2E20]">
                                {trans?.title || (
                                  <span className="text-[#8A1F1F] italic">
                                    Missing translation string
                                  </span>
                                )}
                              </p>
                            </div>

                            <div>
                              <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                                Short Overview ({lang.code.toUpperCase()})
                              </span>
                              <p className="p-2.5 bg-white rounded-xl border border-[#E5E3DB] text-[#1E2E20] leading-relaxed">
                                {trans?.shortDescription || (
                                  <span className="text-[#8A1F1F] italic">
                                    Missing short overview translation
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Editorial Change Intelligence (ECI) Downstream Impact */}
                  {eciImpact && (
                    <div className="p-4 bg-[#FFF8E1] border border-[#FFE082] rounded-2xl space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F57F17] flex items-center gap-2">
                          <Zap size={14} /> EDITORIAL CHANGE INTELLIGENCE (ECI)
                          DOWNSTREAM IMPACT
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#C5A059]/20 text-[#8A1F1F] text-[9px] font-bold uppercase border border-[#C5A059]/40">
                          PREVIEW / DEMONSTRATION
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1E2E20]">
                        Changes detected in source English text trigger
                        automatic review requests for:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div>
                          • Affected Languages:{" "}
                          <strong>
                            {eciImpact.affectedTranslations.join(", ")}
                          </strong>
                        </div>
                        <div>
                          • Affected Collections:{" "}
                          <strong>
                            {eciImpact.affectedCollections.join(", ")}
                          </strong>
                        </div>
                        <div>
                          • Affected Packages:{" "}
                          <strong>
                            {eciImpact.affectedPackages.join(", ")}
                          </strong>
                        </div>
                        <div>
                          • Estimated Review Effort:{" "}
                          <strong>{eciImpact.estimatedReviewEffort}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* QA AUDIT SUB-TAB */}
              {activeSubTab === "qa" && (
                <div className="space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2 text-xs">
                    <span className="font-bold text-[#1E2E20]">
                      QUALITY ASSURANCE VERIFICATION AUDIT
                    </span>
                    <span className="text-[#8C8A7D] text-[10px]">
                      {qaIssues.length} Issues Detected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {qaIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          issue.severity === "BLOCKING"
                            ? "bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]"
                            : issue.severity === "WARNING"
                              ? "bg-[#FFF8E1] border-[#FFE082] text-[#F57F17]"
                              : "bg-[#FAF9F5] border-[#E5E3DB] text-[#1E2E20]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} />
                          <div>
                            <span className="font-bold uppercase text-[10px] block">
                              [{issue.severity}] {issue.title}
                            </span>
                            <span className="text-[11px] font-sans text-[#1E2E20]">
                              {issue.detail}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setActiveSubTab(issue.targetTab as ReviewSubTab)
                          }
                          className="px-3 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#23251E] font-bold text-[10px] text-[#1E2E20] shrink-0 cursor-pointer"
                        >
                          Inspect Tab
                        </button>
                      </div>
                    ))}

                    {qaIssues.length === 0 && (
                      <div className="p-8 text-center text-[#2E7D32] bg-[#E8F5E9] rounded-2xl border border-[#C8E6C9] font-bold text-xs">
                        ✓ All Quality Assurance checks passed perfectly!
                        Recommendation is publication ready.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HISTORY SUB-TAB */}
              {activeSubTab === "history" && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <span className="font-bold text-[#1E2E20] flex items-center gap-2">
                      <span>EDITORIAL REVISION & VERSION HISTORY LOG</span>
                      <span className="px-2 py-0.5 rounded bg-[#C5A059]/20 text-[#8A1F1F] text-[9px] font-bold uppercase border border-[#C5A059]/40">
                        PREVIEW / DEMONSTRATION
                      </span>
                    </span>
                    <span className="text-[#8C8A7D] text-[10px]">
                      Decoupled Versioning (Principle 28)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {revisionHistory.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#8A1F1F] text-sm">
                              {rev.version}
                            </span>
                            <span className="text-[10px] bg-white border border-[#E5E3DB] px-2 py-0.5 rounded-md font-bold">
                              {rev.date}
                            </span>
                          </div>
                          <p className="font-sans text-xs text-[#1E2E20]">
                            {rev.reason}
                          </p>
                          <p className="text-[10px] text-[#8C8A7D]">
                            Editor: {rev.editor} • Package: {rev.firstPackage}
                          </p>
                        </div>

                        {idx > 0 && (
                          <button
                            onClick={() => setComparingRevision(rev)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E3DB] hover:border-[#23251E] font-bold text-xs text-[#1E2E20] shrink-0 cursor-pointer"
                          >
                            Compare Diff
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PUBLICATION SUB-TAB */}
              {activeSubTab === "publication" && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <span className="font-bold text-[#1E2E20]">
                      DESTINATION PACKAGE INCLUSION & PUBLICATION STATUS
                    </span>
                    <span className="text-[#8C8A7D] text-[10px]">
                      Serbia Baseline v2
                    </span>
                  </div>

                  <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Destination Package Snapshot:</span>
                      <strong className="text-[#2E7D32]">
                        Included in serbia-concierge-v1.2.0.pkg
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Publication Eligibility Gate:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold uppercase ${
                          healthMetrics.publicationReady
                            ? "bg-[#E8F5E9] text-[#2E7D32]"
                            : "bg-[#FFF8E1] text-[#F57F17]"
                        }`}
                      >
                        {healthMetrics.publicationReady
                          ? "APPROVED FOR RELEASE"
                          : "NEEDS EDITORIAL VERIFICATION"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Affected Destinations:</span>
                      <strong className="text-[#1E2E20]">
                        Serbia (Belgrade, Novi Sad, Niš, Zlatibor)
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-[#8C8A7D] font-mono text-xs bg-white rounded-3xl border border-[#E5E3DB]">
            Select a recommendation from the catalogue list to begin editorial
            review.
          </div>
        )}
      </div>

      {/* MOBILE PREVIEW MODAL */}
      {isMobilePreviewOpen && activeRec && (
        <div className="fixed inset-0 z-50 bg-[#23251E]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] border border-[#E5E3DB] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col h-[680px]">
            {/* Phone Top Header */}
            <div className="bg-[#23251E] text-white p-4 flex items-center justify-between shrink-0">
              <span className="font-mono text-xs font-bold text-[#C5A059] flex items-center gap-1.5">
                <Smartphone size={14} /> IDEMO App Preview
              </span>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {(["en", "sr", "de", "ru", "es", "zh"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setPreviewLanguage(l)}
                    className={`px-1.5 py-0.5 rounded-md font-bold uppercase ${
                      previewLanguage === l
                        ? "bg-[#C5A059] text-[#23251E]"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsMobilePreviewOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated Mobile Device Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#E5E3DB] bg-[#23251E]">
                <img
                  src={activeRec.image}
                  alt={activeRec.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-[#23251E]/80 text-white font-mono text-[9px] px-2 py-0.5 rounded-md uppercase font-bold">
                  {activeRec.category}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-[#1E2E20]">
                  {previewLanguage === "en"
                    ? activeRec.title
                    : (activeRec.translations as any)?.[previewLanguage]
                        ?.title || activeRec.title}
                </h3>
                <p className="font-mono text-xs text-[#8C8A7D] mt-0.5">
                  📍 {activeRec.location}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E5E3DB] text-xs text-[#1E2E20] leading-relaxed">
                {previewLanguage === "en"
                  ? activeRec.shortDescription
                  : (activeRec.translations as any)?.[previewLanguage]
                      ?.shortDescription || activeRec.shortDescription}
              </div>

              {/* Layout Overflow Audit Banner */}
              <div className="p-2.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl font-mono text-[10px] text-[#2E7D32] flex items-center justify-between">
                <span>Layout & Overflow Audit:</span>
                <strong className="font-bold">✓ PASSED</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERSION COMPARISON MODAL */}
      {comparingRevision && activeRec && (
        <div className="fixed inset-0 z-50 bg-[#23251E]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E3DB] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
              <span className="font-bold text-[#1E2E20] flex items-center gap-2">
                <History size={16} className="text-[#C5A059]" />
                REVISION COMPARISON ({comparingRevision.version} vs Current)
              </span>
              <button
                onClick={() => setComparingRevision(null)}
                className="cursor-pointer text-[#8C8A7D] hover:text-[#1E2E20]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#FFEBEE]/50 border border-[#FFCDD2] rounded-xl space-y-1">
                <span className="font-bold text-[#C62828] block">
                  Revision ({comparingRevision.version}):
                </span>
                <p className="font-sans text-[#1E2E20] leading-relaxed">
                  {comparingRevision.snapshot.shortDescription}
                </p>
              </div>

              <div className="p-3 bg-[#E8F5E9]/50 border border-[#C8E6C9] rounded-xl space-y-1">
                <span className="font-bold text-[#2E7D32] block">
                  Current Canonical Version:
                </span>
                <p className="font-sans text-[#1E2E20] leading-relaxed">
                  {activeRec.shortDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
