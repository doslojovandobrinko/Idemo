import React, { useState, useMemo, useEffect } from "react";
import {
  Compass,
  Search,
  Filter,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Recommendation, Category } from "../../types";
import { INITIAL_RECOMMENDATIONS } from "../../constants";
import { draftExpansionPool } from "../../data/recommendations/serbia/draft_expansion";
import { RecommendationEditorModal } from "./RecommendationEditorModal";
import { calculateRecommendationCompleteness } from "./utils/scoring";

interface StudioRecommendationsProps {
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
  targetRecId?: string;
}

export function StudioRecommendations({
  customRecommendations = [],
  editorialStatuses = {},
  onUpdateEditorialStatuses,
  onAddCustomRecommendation,
  targetRecId,
}: StudioRecommendationsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);

  useEffect(() => {
    if (targetRecId) {
      setSelectedRecId(targetRecId);
      setSelectedCategory("ALL");
      setSelectedStatus("ALL");
    }
  }, [targetRecId]);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null);
  const [localCustomRecs, setLocalCustomRecs] = useState<Recommendation[]>([]);

  // Combine recommendations
  const allRecs = useMemo(() => {
    const combined = [
      ...INITIAL_RECOMMENDATIONS,
      ...draftExpansionPool,
      ...customRecommendations,
      ...localCustomRecs,
    ];
    const map = new Map<string, Recommendation>();
    combined.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [customRecommendations, localCustomRecs]);

  const filteredRecs = useMemo(() => {
    return allRecs.filter((r) => {
      const titleMatch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());

      const catMatch =
        selectedCategory === "ALL" || r.category === selectedCategory;

      const currentStat =
        editorialStatuses[r.id] ||
        (INITIAL_RECOMMENDATIONS.some((i) => i.id === r.id)
          ? "APPROVED"
          : "CANDIDATE");
      const statusMatch =
        selectedStatus === "ALL" || currentStat === selectedStatus;

      return titleMatch && catMatch && statusMatch;
    });
  }, [
    allRecs,
    searchQuery,
    selectedCategory,
    selectedStatus,
    editorialStatuses,
  ]);

  const activeRec = useMemo(() => {
    return (
      allRecs.find((r) => r.id === selectedRecId) ||
      filteredRecs[0] ||
      allRecs[0]
    );
  }, [allRecs, filteredRecs, selectedRecId]);

  const handleStatusChange = (
    recId: string,
    newStatus:
      | "CANDIDATE"
      | "NEEDS RESEARCH"
      | "APPROVED"
      | "MERGE CANDIDATE"
      | "RETIRED",
  ) => {
    if (onUpdateEditorialStatuses) {
      const next = { ...editorialStatuses, [recId]: newStatus };
      onUpdateEditorialStatuses(next);
    }
  };

  const handleCreateNew = () => {
    setEditingRec(null);
    setIsEditorOpen(true);
  };

  const handleEditActive = () => {
    if (activeRec) {
      setEditingRec(activeRec);
      setIsEditorOpen(true);
    }
  };

  const handleSaveFromEditor = (
    savedRec: Recommendation,
    status: "CANDIDATE" | "NEEDS RESEARCH" | "APPROVED" | "RETIRED",
  ) => {
    // Add to local custom recs if not present
    setLocalCustomRecs((prev) => {
      const idx = prev.findIndex((r) => r.id === savedRec.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedRec;
        return copy;
      }
      return [savedRec, ...prev];
    });

    if (onAddCustomRecommendation) {
      onAddCustomRecommendation(savedRec);
    }

    if (onUpdateEditorialStatuses) {
      onUpdateEditorialStatuses({
        ...editorialStatuses,
        [savedRec.id]: status,
      });
    }

    setSelectedRecId(savedRec.id);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1E2E20] tracking-tight">
            Recommendations Desk
          </h1>
          <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-0.5">
            Manage, review, and audit 148 curated recommendations across Serbia
            destinations (135 Canonical Baseline v2).
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
          >
            <Plus size={15} className="text-[#C5A059]" />
            <span>Create Recommendation</span>
          </button>

          <span className="px-3 py-2 rounded-xl bg-white border border-[#E5E3DB] font-bold text-[#1E2E20]">
            Total Items: {allRecs.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E3DB] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID, or location..."
            className="w-full h-10 pl-9 pr-4 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
          />
          <Search size={14} className="absolute left-3 top-3 text-[#8C8A7D]" />
        </div>

        {/* Category Dropdown */}
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

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-10 px-3 bg-[#FAF9F5] border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">APPROVED</option>
          <option value="CANDIDATE">CANDIDATE</option>
          <option value="NEEDS RESEARCH">NEEDS RESEARCH</option>
          <option value="MERGE CANDIDATE">MERGE CANDIDATE</option>
          <option value="RETIRED">RETIRED</option>
        </select>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations List Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5E3DB] rounded-3xl overflow-hidden shadow-xs">
          <div className="max-h-[600px] overflow-y-auto no-scrollbar divide-y divide-[#E5E3DB]">
            {filteredRecs.map((rec) => {
              const isSelected = activeRec && activeRec.id === rec.id;
              const status =
                editorialStatuses[rec.id] ||
                (INITIAL_RECOMMENDATIONS.some((i) => i.id === rec.id)
                  ? "APPROVED"
                  : "CANDIDATE");
              const completeness = calculateRecommendationCompleteness(
                rec,
                status,
              );

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecId(rec.id)}
                  className={`p-4 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-[#FAF9F5] border-l-4 border-l-[#8A1F1F]"
                      : "hover:bg-[#FAF9F5]/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] font-bold uppercase text-[#8C8A7D]">
                        #{rec.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E5E3DB] text-[9px] font-mono uppercase font-bold text-[#8A1F1F]">
                        {rec.category}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-[#1E2E20] truncate">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-[#8C8A7D] truncate mt-0.5">
                      {rec.location} • {rec.duration || "2-3 hours"}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold border ${
                        completeness.scorePercentage >= 90
                          ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                          : completeness.scorePercentage >= 70
                            ? "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                            : "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                      }`}
                    >
                      {completeness.scorePercentage}% Complete
                    </span>

                    <span
                      className={`text-[9.5px] font-mono px-2.5 py-1 rounded-full uppercase font-bold border ${
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
                </div>
              );
            })}

            {filteredRecs.length === 0 && (
              <div className="p-8 text-center text-[#8C8A7D] font-mono text-xs">
                No recommendations match your query filter.
              </div>
            )}
          </div>
        </div>

        {/* Inspector Panel */}
        {activeRec &&
          (() => {
            const activeStatus =
              editorialStatuses[activeRec.id] ||
              (INITIAL_RECOMMENDATIONS.some((i) => i.id === activeRec.id)
                ? "APPROVED"
                : "CANDIDATE");
            const completeness = calculateRecommendationCompleteness(
              activeRec,
              activeStatus,
            );

            return (
              <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-5">
                <div className="border-b border-[#E5E3DB] pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#8C8A7D]">
                      ID: #{activeRec.id}
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#8A1F1F]">
                      {activeRec.category}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#1E2E20]">
                    {activeRec.title}
                  </h3>
                  <p className="text-xs text-[#8C8A7D] font-mono">
                    {activeRec.location}
                  </p>

                  <button
                    onClick={handleEditActive}
                    className="w-full py-2 px-3 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Edit size={14} className="text-[#C5A059]" />
                    <span>Open in Recommendation Editor</span>
                  </button>
                </div>

                {/* Recommendation Completeness Score Card */}
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D]">
                      Completeness Score
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[9.5px] font-bold border ${
                        completeness.scorePercentage >= 90
                          ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                          : completeness.scorePercentage >= 70
                            ? "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                            : "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                      }`}
                    >
                      {completeness.scorePercentage}% Complete
                    </span>
                  </div>

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

                  {/* Completed / Missing Stats */}
                  <div className="space-y-1.5 font-mono text-[11px] pt-1">
                    <div className="flex items-center justify-between text-[#2E7D32]">
                      <span className="flex items-center gap-1 font-bold">
                        <CheckCircle2 size={12} /> Completed Criteria:
                      </span>
                      <span className="font-bold">
                        {completeness.completedItems.length} /{" "}
                        {completeness.items.length}
                      </span>
                    </div>

                    {completeness.missingItems.length > 0 && (
                      <div className="mt-2 text-[#8A1F1F] bg-[#FFEBEE]/60 p-2 rounded-xl border border-[#FFCDD2] space-y-1">
                        <span className="flex items-center gap-1 font-bold text-[10px] uppercase">
                          <AlertTriangle size={12} /> Missing (
                          {completeness.missingItems.length}):
                        </span>
                        <ul className="list-disc list-inside text-[10.5px] space-y-0.5">
                          {completeness.missingItems
                            .slice(0, 3)
                            .map((m, idx) => (
                              <li key={idx} className="truncate">
                                {m}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Publication Eligibility status */}
                    <div className="pt-2 flex items-center justify-between text-[10px]">
                      <span className="text-[#8C8A7D]">
                        Package Release Eligibility:
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          completeness.isPublicationEligible
                            ? "bg-[#E8F5E9] text-[#2E7D32]"
                            : "bg-[#FFF8E1] text-[#F57F17]"
                        }`}
                      >
                        {completeness.isPublicationEligible
                          ? "RELEASE READY"
                          : "INELIGIBLE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Status Setter */}
                <div>
                  <label className="block font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1.5">
                    Editorial Lifecycle Status
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                    {(
                      [
                        "APPROVED",
                        "CANDIDATE",
                        "NEEDS RESEARCH",
                        "RETIRED",
                      ] as const
                    ).map((st) => {
                      const currentSt =
                        editorialStatuses[activeRec.id] ||
                        (INITIAL_RECOMMENDATIONS.some(
                          (i) => i.id === activeRec.id,
                        )
                          ? "APPROVED"
                          : "CANDIDATE");
                      const isCurrent = currentSt === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(activeRec.id, st)}
                          className={`p-2 rounded-xl border text-center font-bold uppercase transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-[#23251E] text-white border-[#23251E]"
                              : "bg-[#FAF9F5] text-[#1E2E20] border-[#E5E3DB] hover:border-[#23251E]/30"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description previews */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block mb-1">
                      Short Description
                    </span>
                    <p className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3DB] text-[#1E2E20] leading-relaxed">
                      {activeRec.shortDescription}
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block mb-1">
                      Long Description
                    </span>
                    <p className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3DB] text-[#1E2E20] leading-relaxed max-h-40 overflow-y-auto no-scrollbar">
                      {activeRec.longDescription}
                    </p>
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="pt-3 border-t border-[#E5E3DB] grid grid-cols-2 gap-2 text-[10.5px] font-mono text-[#8C8A7D]">
                  <div>
                    <span>Duration:</span>{" "}
                    <strong className="text-[#1E2E20]">
                      {activeRec.duration || "2-3 hours"}
                    </strong>
                  </div>
                  <div>
                    <span>Est. Cost:</span>{" "}
                    <strong className="text-[#1E2E20]">
                      {activeRec.estimatedCost || "Free / Standard"}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Recommendation Editor Modal */}
      <RecommendationEditorModal
        isOpen={isEditorOpen}
        initialRecommendation={editingRec}
        currentStatus={
          editingRec
            ? (editorialStatuses[editingRec.id] as any) || "APPROVED"
            : "CANDIDATE"
        }
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveFromEditor}
      />
    </div>
  );
}
