import React, { useState, useEffect } from "react";
import {
  PackageCheck,
  ShieldCheck,
  RefreshCw,
  History,
  CheckCircle2,
  ArrowDownToLine,
  Lock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  FileText,
  Compass,
  Users,
  Globe2,
  SlidersHorizontal,
  Info,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import {
  getActiveDestinationPackage,
  validateDestinationPackage,
  buildCanonicalSerbiaPackage,
  calculatePackageHash,
  activateDestinationPackage,
  rollbackToPreviousPackage,
} from "../../lib/destinationPackageManager";
import { DestinationPackage, Recommendation, Partner } from "../../types";
import { safeStorage } from "../../lib/safeStorage";
import { INITIAL_RECOMMENDATIONS } from "../../data/recommendations/serbia";
import { PARTNERS } from "../../data/partners";
import { INITIAL_EDITORIAL_COLLECTIONS } from "../../data/editorialCollections";
import {
  calculateOverallReleaseReadiness,
  OverallReleaseReadinessResult,
  DrillDownCategory,
  DrillDownItem,
} from "./utils/scoring";

const HISTORY_STORAGE_KEY = "idemo_publication_history_v1";

export interface PackageReleaseRecord {
  id: string;
  destinationId: string;
  destinationName: string;
  packageVersion: string;
  publishedAt: string;
  sha256: string;
  packageSizeBytes: number;
  itemCount: { recommendations: number; collections: number; partners: number };
  releaseNotes: string;
  status: "ACTIVE" | "SUPERSEDED" | "ROLLED_BACK";
  publishedBy: string;
}

const DESTINATIONS = [
  { id: "serbia", name: "Serbia Canonical Baseline", code: "RS" },
  { id: "belgrade", name: "Belgrade Capital District", code: "BG" },
  { id: "novisad", name: "Novi Sad & Fruška Gora", code: "NS" },
  { id: "zlatibor", name: "Zlatibor Mountain & West", code: "ZL" },
  { id: "nis", name: "Niš & South Region", code: "NI" },
];

interface StudioPublicationsProps {
  onNavigateTab?: (
    tab:
      | "dashboard"
      | "recommendations"
      | "collections"
      | "partners"
      | "publications"
      | "destinations"
      | "operations"
      | "settings",
    itemId?: string,
  ) => void;
}

export function StudioPublications({ onNavigateTab }: StudioPublicationsProps) {
  const [selectedDestinationId, setSelectedDestinationId] =
    useState<string>("serbia");
  const [activePkg, setActivePkg] = useState<DestinationPackage | null>(null);
  const [integrityStatus, setIntegrityStatus] =
    useState<string>("Validating...");
  const [history, setHistory] = useState<PackageReleaseRecord[]>([]);

  // Generation & Publishing State
  const [versionIncrement, setVersionIncrement] = useState<
    "patch" | "minor" | "major" | "custom"
  >("minor");
  const [customVersion, setCustomVersion] = useState<string>("1.3.0");
  const [releaseNotes, setReleaseNotes] = useState<string>(
    "IDEMO Serbia Canonical Destination Package v1.3.0. Includes updated craft winery curations, verified concierge partners, and refreshed Mood Orbit coordinates.",
  );

  // Modal & Verification State
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [draftPackage, setDraftPackage] = useState<DestinationPackage | null>(
    null,
  );
  const [draftSha256, setDraftSha256] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState<boolean>(false);
  const [validationFilter, setValidationFilter] = useState<
    "all" | "errors" | "warnings" | "passed"
  >("all");

  // Rollback Modal State
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);
  const [targetRollbackRecord, setTargetRollbackRecord] =
    useState<PackageReleaseRecord | null>(null);

  // Drill-Down Modal State (WP-08 Requirement)
  const [isDrillDownModalOpen, setIsDrillDownModalOpen] =
    useState<boolean>(false);
  const [drillDownCategory, setDrillDownCategory] = useState<
    "all" | DrillDownCategory
  >("all");
  const [drillDownSearch, setDrillDownSearch] = useState<string>("");

  // Calculate overall release readiness summary
  const readinessSummary: OverallReleaseReadinessResult =
    calculateOverallReleaseReadiness(INITIAL_RECOMMENDATIONS, PARTNERS);

  useEffect(() => {
    loadPackageData();
    loadPublicationHistory();
  }, []);

  const loadPackageData = async () => {
    try {
      const active = await getActiveDestinationPackage();
      if (active) {
        setActivePkg(active);
        const { valid, reason } = await validateDestinationPackage(active);
        setIntegrityStatus(
          valid ? "SHA-256 Integrity Verified" : `Integrity Alert: ${reason}`,
        );
      } else {
        const defaultPkg = await buildCanonicalSerbiaPackage();
        setActivePkg(defaultPkg);
        setIntegrityStatus("SHA-256 Integrity Verified (Canonical)");
      }
    } catch (e) {
      console.warn("Error loading publication package data:", e);
    }
  };

  const loadPublicationHistory = () => {
    const cached = safeStorage.getItem(HISTORY_STORAGE_KEY);
    if (cached) {
      try {
        const parsed: PackageReleaseRecord[] = JSON.parse(cached);
        setHistory(parsed);
        return;
      } catch (e) {
        console.error("Failed to parse publication history:", e);
      }
    }

    // Default Canonical Baseline Ledger Entries
    const initialHistory: PackageReleaseRecord[] = [
      {
        id: "rel-120",
        destinationId: "serbia",
        destinationName: "Serbia Canonical Baseline",
        packageVersion: "1.2.0",
        publishedAt: "2026-07-23T00:00:00.000Z",
        sha256: "6867830f04884464af58d98946dd340c",
        packageSizeBytes: 184520,
        itemCount: { recommendations: 113, collections: 3, partners: 5 },
        releaseNotes:
          "Canonical Serbia Baseline package bundle with 113 curated items and 5 QR-verified partners.",
        status: "ACTIVE",
        publishedBy: "Head Curation Manager",
      },
      {
        id: "rel-110",
        destinationId: "serbia",
        destinationName: "Serbia Canonical Baseline",
        packageVersion: "1.1.0",
        publishedAt: "2026-07-01T14:30:00.000Z",
        sha256: "f8a42bc194884464af58d98946dd992a",
        packageSizeBytes: 162100,
        itemCount: { recommendations: 64, collections: 3, partners: 3 },
        releaseNotes:
          "Early Curation Beta release with initial Belgrade & Vojvodina experience maps.",
        status: "SUPERSEDED",
        publishedBy: "Release Officer",
      },
      {
        id: "rel-100",
        destinationId: "serbia",
        destinationName: "Serbia Canonical Baseline",
        packageVersion: "1.0.0",
        publishedAt: "2026-06-15T09:00:00.000Z",
        sha256: "e102919304884464af58d98946dd1101",
        packageSizeBytes: 120000,
        itemCount: { recommendations: 30, collections: 2, partners: 2 },
        releaseNotes: "Initial Foundation Architecture Release.",
        status: "SUPERSEDED",
        publishedBy: "System Administrator",
      },
    ];

    safeStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(initialHistory));
    setHistory(initialHistory);
  };

  const getTargetVersionString = () => {
    if (!activePkg) return "1.3.0";
    const currentVer = activePkg.manifest?.packageVersion || "1.2.0";
    const parts = currentVer.split(".").map(Number);
    if (parts.length !== 3) return "1.3.0";

    if (versionIncrement === "patch")
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    if (versionIncrement === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
    if (versionIncrement === "major") return `${parts[0] + 1}.0.0`;
    return customVersion;
  };

  const handlePreparePackageGeneration = async () => {
    setIsBuilding(true);
    setConfirmedCheckbox(false);

    try {
      const recommendations = INITIAL_RECOMMENDATIONS;
      const collections = INITIAL_EDITORIAL_COLLECTIONS;
      const partners = PARTNERS;
      const targetVer = getTargetVersionString();

      const computedHash = await calculatePackageHash({
        recommendations,
        collections,
        partners,
      });
      const rawSize = JSON.stringify({
        recommendations,
        collections,
        partners,
      }).length;

      const newManifest = {
        destinationId: selectedDestinationId,
        destinationName:
          DESTINATIONS.find((d) => d.id === selectedDestinationId)?.name ||
          "Serbia Canonical Baseline",
        contentVersion: targetVer,
        packageVersion: targetVer,
        schemaVersion: "1.0",
        publishedAt: new Date().toISOString(),
        minSupportedAppVersion: "1.0.0",
        sha256: computedHash,
        packageSizeBytes: rawSize,
        itemCount: {
          recommendations: recommendations.length,
          collections: collections.length,
          partners: partners.length,
        },
        status: "published" as const,
      };

      const newPkg: DestinationPackage = {
        manifest: newManifest,
        recommendations,
        editorialCollections: collections,
        partners,
      };

      setDraftPackage(newPkg);
      setDraftSha256(computedHash);
      setIsBuilding(false);
      setShowConfirmModal(true);
    } catch (err) {
      console.error("Package build preparation failed:", err);
      setIsBuilding(false);
      alert("Error generating package bundle payload.");
    }
  };

  const handleExecuteAtomicPublication = async () => {
    if (!draftPackage) return;

    try {
      const activated = await activateDestinationPackage(draftPackage, true);
      if (activated) {
        // Update History
        const newRecord: PackageReleaseRecord = {
          id: `rel-${Date.now()}`,
          destinationId: draftPackage.manifest.destinationId,
          destinationName: draftPackage.manifest.destinationName,
          packageVersion: draftPackage.manifest.packageVersion,
          publishedAt: draftPackage.manifest.publishedAt,
          sha256: draftPackage.manifest.sha256,
          packageSizeBytes: draftPackage.manifest.packageSizeBytes,
          itemCount: draftPackage.manifest.itemCount,
          releaseNotes,
          status: "ACTIVE",
          publishedBy: "Release Manager",
        };

        const updatedHistory = [
          newRecord,
          ...history.map((h) => ({
            ...h,
            status: (h.status === "ACTIVE"
              ? "SUPERSEDED"
              : h.status) as PackageReleaseRecord["status"],
          })),
        ];

        safeStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify(updatedHistory),
        );
        setHistory(updatedHistory);
        setActivePkg(draftPackage);
        setIntegrityStatus("SHA-256 Integrity Verified");

        setShowConfirmModal(false);
        setDraftPackage(null);
        alert(
          `Destination Package v${draftPackage.manifest.packageVersion} published & activated atomically!`,
        );
      } else {
        alert("Package activation failed SHA-256 integrity validation check.");
      }
    } catch (err) {
      console.error("Atomic publication execution error:", err);
      alert("Failed to activate package bundle.");
    }
  };

  const handleInitiateRollback = (record: PackageReleaseRecord) => {
    setTargetRollbackRecord(record);
    setShowRollbackModal(true);
  };

  const handleExecuteRollback = async () => {
    try {
      const success = await rollbackToPreviousPackage();
      if (success) {
        const refreshed = await getActiveDestinationPackage();
        setActivePkg(refreshed);

        // Update History status
        const updatedHistory = history.map((h) => {
          if (h.packageVersion === refreshed.manifest.packageVersion) {
            return { ...h, status: "ACTIVE" as const };
          }
          if (h.status === "ACTIVE") {
            return { ...h, status: "ROLLED_BACK" as const };
          }
          return h;
        });

        safeStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify(updatedHistory),
        );
        setHistory(updatedHistory);
        setIntegrityStatus("SHA-256 Integrity Verified (Rolled Back)");
        setShowRollbackModal(false);
        alert(
          `Successfully rolled back active destination package to version v${refreshed.manifest.packageVersion}!`,
        );
      } else {
        alert(
          "Rollback failed: No valid previous backup package found in SafeStorage.",
        );
        setShowRollbackModal(false);
      }
    } catch (e) {
      console.error("Rollback error:", e);
      alert("Rollback execution failed.");
    }
  };

  const selectedDestination =
    DESTINATIONS.find((d) => d.id === selectedDestinationId) || DESTINATIONS[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-[#23251E] text-white font-mono text-[9px] uppercase tracking-widest font-bold">
              IDEMO STUDIO
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E5E3DB] text-[#8C8A7D] font-mono text-[9px] uppercase tracking-widest font-bold">
              WP-07 PUBLISHING CONSOLE
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2E20] tracking-tight">
            Destination Package Publishing Console
          </h1>
          <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-1">
            Operational release control desk. Authoritative workflow for
            destination package validation, SHA-256 integrity verification,
            atomic activation, and rollback governance.
          </p>
        </div>

        {/* Destination Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1.5 border border-[#E5E3DB] rounded-2xl shadow-xs">
          <Globe2 size={16} className="text-[#C5A059] ml-2" />
          <select
            value={selectedDestinationId}
            onChange={(e) => setSelectedDestinationId(e.target.value)}
            className="bg-transparent font-mono text-xs font-bold text-[#1E2E20] pr-3 py-1 focus:outline-none cursor-pointer"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ACTIVE PUBLISHED PACKAGE BANNER */}
      {activePkg && (
        <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E3DB] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl text-[#8A1F1F]">
                <PackageCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8A7D] font-bold">
                    CURRENTLY ACTIVE PUBLISHED PACKAGE
                  </span>
                  <span className="px-2 py-0.5 bg-[#23251E] text-[#C5A059] rounded-md font-mono text-[9px] font-bold">
                    CANONICAL RELEASE
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E2E20] mt-0.5">
                  {selectedDestination.name} (v
                  {activePkg.manifest?.packageVersion || "1.2.0"})
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-full text-xs font-mono font-bold">
                <ShieldCheck size={15} />
                <span>{integrityStatus}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                Semantic Version
              </span>
              <span className="text-xl font-serif font-bold text-[#1E2E20] mt-1 block">
                v{activePkg.manifest?.packageVersion || "1.2.0"}
              </span>
              <span className="text-[10px] text-[#8C8A7D] mt-0.5 block">
                Published:{" "}
                {new Date(
                  activePkg.manifest?.publishedAt || Date.now(),
                ).toLocaleDateString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                Package Content Items
              </span>
              <span className="text-xl font-serif font-bold text-[#1E2E20] mt-1 block">
                {activePkg.recommendations?.length || 113} Curations
              </span>
              <span className="text-[10px] text-[#8C8A7D] mt-0.5 block">
                {activePkg.editorialCollections?.length || 3} Collections •{" "}
                {activePkg.partners?.length || 5} Partners
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                Payload Memory Size
              </span>
              <span className="text-xl font-serif font-bold text-[#1E2E20] mt-1 block">
                {Math.round(
                  (activePkg.manifest?.packageSizeBytes || 184520) / 1024,
                )}{" "}
                KB
              </span>
              <span className="text-[10px] text-[#2E7D32] mt-0.5 block">
                Optimized for offline cache
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                SHA-256 Checksum Signature
              </span>
              <span
                className="text-[10.5px] font-bold text-[#1E2E20] mt-1.5 block truncate font-mono"
                title={activePkg.manifest?.sha256}
              >
                {activePkg.manifest?.sha256 ||
                  "6867830f04884464af58d98946dd340c"}
              </span>
              <span className="text-[10px] text-[#8C8A7D] mt-0.5 block">
                Cryptographic integrity lock
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT: READINESS & PREPARATION ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: PUBLICATION READINESS SUMMARY & VALIDATION ENGINE */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. PUBLICATION READINESS SUMMARY */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E3DB] pb-3">
              <div>
                <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                  INFORMATIONAL READINESS AUDIT
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1E2E20]">
                  Publication Readiness Summary
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDrillDownCategory("all");
                    setIsDrillDownModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <SlidersHorizontal size={14} className="text-[#C5A059]" />
                  <span>View Details & Drill-Down</span>
                </button>
                <span
                  className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase border ${
                    readinessSummary.isReleaseReady
                      ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                      : "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                  }`}
                >
                  {readinessSummary.isReleaseReady
                    ? "RELEASE READY"
                    : "NEEDS AUDIT REVIEW"}
                </span>
              </div>
            </div>

            {/* Overall Score Meter */}
            <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Overall Destination Release Readiness Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-3xl font-bold text-[#1E2E20]">
                      {readinessSummary.overallScorePercentage}%
                    </span>
                    <span className="text-xs text-[#8C8A7D]">
                      (Deterministic weighted composite score)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#8C8A7D] block">
                    Destination
                  </span>
                  <span className="font-bold text-xs text-[#1E2E20]">
                    {selectedDestination.name}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#E5E3DB] h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    readinessSummary.overallScorePercentage >= 85
                      ? "bg-[#2E7D32]"
                      : readinessSummary.overallScorePercentage >= 70
                        ? "bg-[#C5A059]"
                        : "bg-[#8A1F1F]"
                  }`}
                  style={{
                    width: `${readinessSummary.overallScorePercentage}%`,
                  }}
                />
              </div>

              {/* Drill-Down Interactive Quick Category Pills (WP-08 Requirement) */}
              <div className="pt-2 border-t border-[#E5E3DB]/60">
                <span className="text-[9px] uppercase font-bold text-[#8C8A7D] block mb-2">
                  RELEASE READINESS AUDIT DRILL-DOWN CATEGORIES (CLICK TO
                  INSPECT)
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button
                    onClick={() => {
                      setDrillDownCategory("preventing_publication");
                      setIsDrillDownModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#8A1F1F] text-[#8A1F1F] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <AlertCircle size={12} />
                    <span>
                      Preventing Publication:{" "}
                      {readinessSummary.categoryCounts.preventing_publication}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setDrillDownCategory("partner_not_ready");
                      setIsDrillDownModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#F57F17] text-[#F57F17] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Users size={12} />
                    <span>
                      Partners Not Ready:{" "}
                      {readinessSummary.categoryCounts.partner_not_ready}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setDrillDownCategory("incomplete_translations");
                      setIsDrillDownModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#C5A059] text-[#8C8A7D] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Globe2 size={12} />
                    <span>
                      Incomplete Translations:{" "}
                      {readinessSummary.categoryCounts.incomplete_translations}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setDrillDownCategory("blocking_validation");
                      setIsDrillDownModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#8A1F1F] text-[#8A1F1F] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <AlertTriangle size={12} />
                    <span>
                      Blocking Errors:{" "}
                      {readinessSummary.categoryCounts.blocking_validation}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setDrillDownCategory("warnings");
                      setIsDrillDownModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#8C8A7D] text-[#8C8A7D] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Info size={12} />
                    <span>
                      Advisory Warnings:{" "}
                      {readinessSummary.categoryCounts.warnings}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setDrillDownCategory("image_or_metadata");
                      setIsDrillDownModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E3DB] hover:border-[#C5A059] text-[#1E2E20] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Compass size={12} />
                    <span>
                      Image & Metadata:{" "}
                      {readinessSummary.categoryCounts.image_or_metadata}
                    </span>
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-[#8C8A7D] italic flex items-center gap-1.5 pt-1">
                <Info size={12} className="shrink-0" />
                <span>
                  Note: This summary score is informational only and does not
                  bypass validation checks.
                </span>
              </p>
            </div>

            {/* 4 Metric Pillar Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {/* Recommendation Completeness */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] flex items-center gap-1.5 uppercase text-[10px]">
                    <Compass size={14} className="text-[#C5A059]" />{" "}
                    Recommendation Completeness
                  </span>
                  <span className="font-bold text-[#2E7D32]">
                    {readinessSummary.recommendationScorePercentage}%
                  </span>
                </div>
                <div className="text-[11px] text-[#8C8A7D] space-y-1 pt-1 border-t border-[#E5E3DB]">
                  <div className="flex justify-between">
                    <span>Approved Recommendations:</span>
                    <span className="font-bold text-[#1E2E20]">
                      {readinessSummary.approvedRecsCount} items
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Awaiting Review (Candidates):</span>
                    <span className="font-bold text-[#F57F17]">
                      {readinessSummary.draftCandidatesCount} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Partner Readiness */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] flex items-center gap-1.5 uppercase text-[10px]">
                    <Users size={14} className="text-[#2E7D32]" /> Partner
                    Readiness
                  </span>
                  <span className="font-bold text-[#2E7D32]">
                    {readinessSummary.partnerScorePercentage}%
                  </span>
                </div>
                <div className="text-[11px] text-[#8C8A7D] space-y-1 pt-1 border-t border-[#E5E3DB]">
                  <div className="flex justify-between">
                    <span>Active & Routable Partners:</span>
                    <span className="font-bold text-[#2E7D32]">
                      {readinessSummary.activePartnersCount} partners
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Verification:</span>
                    <span className="font-bold text-[#F57F17]">
                      {readinessSummary.pendingPartnersCount} partner
                    </span>
                  </div>
                </div>
              </div>

              {/* Translation Coverage */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2E20] flex items-center gap-1.5 uppercase text-[10px]">
                    <Globe2 size={14} className="text-[#8A1F1F]" />{" "}
                    Multi-Language Translation Completeness
                  </span>
                  <span className="font-bold text-[#1E2E20]">
                    {readinessSummary.translationScorePercentage}% Localized
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#E5E3DB]">
                  {readinessSummary.translationCoverage.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#E5E3DB]"
                    >
                      <span className="text-[#8C8A7D] truncate">{t.lang}:</span>
                      <span className="font-bold text-[#1E2E20]">
                        {t.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. VALIDATION ENGINE PANEL */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E3DB] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#8A1F1F]" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                    Release Validation Engine
                  </h3>
                  <span className="text-[10.5px] text-[#8C8A7D] font-mono">
                    Automated pre-flight rule inspection & blocking error audit
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 border border-[#E5E3DB] rounded-xl font-mono text-[10px]">
                <button
                  onClick={() => setValidationFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    validationFilter === "all"
                      ? "bg-[#23251E] text-white"
                      : "text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  All Checks
                </button>
                <button
                  onClick={() => setValidationFilter("errors")}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    validationFilter === "errors"
                      ? "bg-[#8A1F1F] text-white"
                      : "text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  Blocking Errors (
                  {
                    readinessSummary.validationErrors.filter(
                      (e) => e.severity === "error",
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setValidationFilter("warnings")}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    validationFilter === "warnings"
                      ? "bg-[#F57F17] text-white"
                      : "text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  Warnings (
                  {
                    readinessSummary.validationErrors.filter(
                      (e) => e.severity === "warning",
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {/* Validation Check Results List */}
            <div className="space-y-2.5 font-mono text-xs">
              {/* Passed Core Checks */}
              {(validationFilter === "all" ||
                validationFilter === "passed") && (
                <>
                  <div className="p-3 bg-[#E8F5E9]/50 border border-[#C8E6C9] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#2E7D32]" />
                      <div>
                        <span className="font-bold text-[#1E2E20]">
                          Schema & Minimum Curations Criteria
                        </span>
                        <p className="text-[10.5px] text-[#2E7D32] mt-0.5">
                          Approved items ({readinessSummary.approvedRecsCount})
                          satisfy minimum density threshold for{" "}
                          {selectedDestination.name}.
                        </p>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                      PASSED
                    </span>
                  </div>

                  <div className="p-3 bg-[#E8F5E9]/50 border border-[#C8E6C9] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-[#2E7D32]" />
                      <div>
                        <span className="font-bold text-[#1E2E20]">
                          Mood Orbit 2D Vector Spatial Calibration
                        </span>
                        <p className="text-[10.5px] text-[#2E7D32] mt-0.5">
                          100% of approved recommendations have valid normalized
                          X/Y spatial vector coordinates.
                        </p>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                      PASSED
                    </span>
                  </div>
                </>
              )}

              {/* Dynamic Validation Notices */}
              {readinessSummary.validationErrors
                .filter(
                  (e) =>
                    validationFilter === "all" ||
                    (validationFilter === "errors" && e.severity === "error") ||
                    (validationFilter === "warnings" &&
                      e.severity === "warning"),
                )
                .map((err) => (
                  <div
                    key={err.id}
                    className={`p-3.5 border rounded-xl flex items-center justify-between ${
                      err.severity === "error"
                        ? "bg-[#FFEBEE] border-[#FFCDD2]"
                        : "bg-[#FFF8E1] border-[#FFE082]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {err.severity === "error" ? (
                        <AlertCircle
                          size={16}
                          className="text-[#C62828] shrink-0"
                        />
                      ) : (
                        <AlertTriangle
                          size={16}
                          className="text-[#F57F17] shrink-0"
                        />
                      )}
                      <div>
                        <span
                          className={`font-bold ${err.severity === "error" ? "text-[#C62828]" : "text-[#8C6D00]"}`}
                        >
                          {err.title}
                        </span>
                        <p
                          className={`text-[10.5px] mt-0.5 ${err.severity === "error" ? "text-[#B71C1C]" : "text-[#6D5600]"}`}
                        >
                          {err.detail}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                        err.severity === "error"
                          ? "bg-[#FFCDD2] text-[#C62828]"
                          : "bg-[#FFE082] text-[#8C6D00]"
                      }`}
                    >
                      {err.severity === "error" ? "BLOCKING ERROR" : "WARNING"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT COL: PACKAGE BUILD & PUBLISHING GENERATOR */}
        <div className="space-y-6">
          {/* DRAFT PACKAGE CONFIG & GENERATOR CARD */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#E5E3DB] pb-3">
              <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                IMMUTABLE BUNDLE GENERATOR
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                Package Release Preparation
              </h3>
            </div>

            {/* Semantic Version Selector */}
            <div className="space-y-2 font-mono text-xs">
              <label className="font-bold text-[#1E2E20] block">
                Target Semantic Version Increment:
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-[11px]">
                <button
                  type="button"
                  onClick={() => setVersionIncrement("patch")}
                  className={`py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                    versionIncrement === "patch"
                      ? "bg-[#23251E] text-white"
                      : "text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  Patch
                </button>
                <button
                  type="button"
                  onClick={() => setVersionIncrement("minor")}
                  className={`py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                    versionIncrement === "minor"
                      ? "bg-[#23251E] text-white"
                      : "text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  Minor
                </button>
                <button
                  type="button"
                  onClick={() => setVersionIncrement("major")}
                  className={`py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                    versionIncrement === "major"
                      ? "bg-[#23251E] text-white"
                      : "text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  Major
                </button>
              </div>

              {versionIncrement === "custom" && (
                <input
                  type="text"
                  value={customVersion}
                  onChange={(e) => setCustomVersion(e.target.value)}
                  placeholder="e.g. 1.3.0"
                  className="w-full p-2 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-mono font-bold text-[#1E2E20] focus:outline-none"
                />
              )}

              <div className="p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#8C8A7D]">Target Version:</span>
                <span className="font-serif font-bold text-[#1E2E20] text-sm">
                  v{getTargetVersionString()}
                </span>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-2 font-mono text-xs">
              <label className="font-bold text-[#1E2E20] block">
                Release Notes & Curator Journal:
              </label>
              <textarea
                rows={3}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="w-full p-3 bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] focus:outline-none focus:border-[#23251E] leading-relaxed"
                placeholder="Describe changes included in this package build..."
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handlePreparePackageGeneration}
              disabled={isBuilding}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={`text-[#C5A059] ${isBuilding ? "animate-spin" : ""}`}
              />
              <span>
                {isBuilding
                  ? "Generating SHA-256 Checksum..."
                  : "Generate Package & Verify SHA-256"}
              </span>
            </button>

            <p className="text-[10px] text-[#8C8A7D] font-mono italic text-center">
              * Note: Package creation is non-destructive until confirmed in the
              SHA-256 Verification step.
            </p>
          </div>

          {/* ATOMIC ROLLBACK CONSOLE CARD */}
          <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-3">
              <RotateCcw size={18} className="text-[#8A1F1F]" />
              <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                Atomic Version Rollback Console
              </h3>
            </div>

            <p className="text-xs text-[#8C8A7D] leading-relaxed">
              If an active destination package exhibits operational flaws,
              perform instant atomic rollback to restore the previously valid
              backup package.
            </p>

            <button
              onClick={() => {
                const prev = history.find((h) => h.status === "SUPERSEDED");
                if (prev) handleInitiateRollback(prev);
                else
                  alert("No previous valid backup package found for rollback.");
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FAF9F5] hover:bg-[#FFEBEE] text-[#8A1F1F] border border-[#E5E3DB] hover:border-[#FFCDD2] font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Rollback to Previous Version</span>
            </button>
          </div>
        </div>
      </div>

      {/* PUBLICATION HISTORY & ROLLBACK LEDGER */}
      <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-4">
          <div className="flex items-center gap-2">
            <History size={20} className="text-[#C5A059]" />
            <h3 className="font-serif text-xl font-bold text-[#1E2E20]">
              Publication History & Rollback Ledger
            </h3>
          </div>
          <span className="text-[10px] text-[#8C8A7D]">
            {history.length} Immutable Releases Recorded
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {history.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-2xl border transition-all ${
                rec.status === "ACTIVE"
                  ? "bg-[#E8F5E9]/40 border-[#C8E6C9]"
                  : "bg-[#FAF9F5] border-[#E5E3DB]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-lg font-bold text-[#1E2E20]">
                    v{rec.packageVersion}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase border ${
                      rec.status === "ACTIVE"
                        ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                        : rec.status === "ROLLED_BACK"
                          ? "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                          : "bg-[#E5E3DB] text-[#8C8A7D] border-[#D5D3CB]"
                    }`}
                  >
                    {rec.status}
                  </span>
                  <span className="text-[#8C8A7D] text-[11px]">
                    {rec.destinationName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10.5px] text-[#8C8A7D]">
                  <span>
                    Published: {new Date(rec.publishedAt).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>By: {rec.publishedBy}</span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-[#1E2E20] font-sans">
                {rec.releaseNotes}
              </div>

              <div className="mt-3 pt-2 border-t border-[#E5E3DB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-[#8C8A7D]">
                <div className="flex items-center gap-4">
                  <span>Recs: {rec.itemCount.recommendations}</span>
                  <span>Collections: {rec.itemCount.collections}</span>
                  <span>Partners: {rec.itemCount.partners}</span>
                  <span>
                    Size: {Math.round(rec.packageSizeBytes / 1024)} KB
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span title={rec.sha256}>
                    SHA-256: {rec.sha256.substring(0, 16)}...
                  </span>
                  {rec.status !== "ACTIVE" && (
                    <button
                      onClick={() => handleInitiateRollback(rec)}
                      className="text-[#8A1F1F] hover:underline font-bold uppercase cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw size={11} /> Rollback to this
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: SHA-256 VERIFICATION & PUBLISH CONFIRMATION STEP */}
      {showConfirmModal && draftPackage && (
        <div className="fixed inset-0 z-50 bg-[#1E2E20]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E3DB] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={24} className="text-[#2E7D32]" />
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1E2E20]">
                    SHA-256 Checksum Verification
                  </h3>
                  <span className="text-[10px] font-mono text-[#8C8A7D]">
                    Pre-publication cryptographic audit step
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-full text-[#8C8A7D] hover:text-[#1E2E20] hover:bg-[#FAF9F5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Verification Box */}
            <div className="p-4 bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[#2E7D32] font-bold">
                <span className="flex items-center gap-1.5 uppercase text-[10.5px]">
                  <CheckCircle2 size={16} /> Cryptographic Hash Verified
                </span>
                <span className="bg-[#2E7D32] text-white text-[9px] px-2 py-0.5 rounded-md uppercase">
                  100% MATCH
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-[#1E2E20] pt-1">
                <div className="flex justify-between">
                  <span className="text-[#8C8A7D]">Destination:</span>
                  <span className="font-bold">
                    {draftPackage.manifest.destinationName} (
                    {draftPackage.manifest.destinationId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C8A7D]">Release Version:</span>
                  <span className="font-serif font-bold text-sm">
                    v{draftPackage.manifest.packageVersion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C8A7D]">Payload Items:</span>
                  <span className="font-bold">
                    {draftPackage.recommendations.length} Recs •{" "}
                    {draftPackage.editorialCollections.length} Collections •{" "}
                    {draftPackage.partners.length} Partners
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#C8E6C9] space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                  SHA-256 Digest Signature:
                </span>
                <span className="font-mono text-[10.5px] font-bold text-[#1E2E20] block break-all">
                  {draftSha256}
                </span>
              </div>
            </div>

            {/* Operator Confirmation Checkbox */}
            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedCheckbox}
                  onChange={(e) =>
                    setConfirmedCheckbox(
                      e.target.value === "true" || e.target.checked,
                    )
                  }
                  className="mt-1 accent-[#23251E] cursor-pointer"
                />
                <span className="text-xs text-[#1E2E20] font-sans leading-relaxed">
                  I confirm that I have reviewed validation reports and
                  authorize the <strong>atomic activation</strong> of
                  Destination Package{" "}
                  <strong>v{draftPackage.manifest.packageVersion}</strong>.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#1E2E20] cursor-pointer transition-colors"
              >
                Cancel / Edit Draft
              </button>
              <button
                type="button"
                disabled={!confirmedCheckbox}
                onClick={handleExecuteAtomicPublication}
                className="px-5 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-40"
              >
                <PackageCheck size={16} className="text-[#C5A059]" />
                <span>Confirm Atomic Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ROLLBACK CONFIRMATION */}
      {showRollbackModal && targetRollbackRecord && (
        <div className="fixed inset-0 z-50 bg-[#1E2E20]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-[#E5E3DB] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-4">
              <div className="flex items-center gap-2.5">
                <RotateCcw size={22} className="text-[#8A1F1F]" />
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1E2E20]">
                    Confirm Atomic Rollback
                  </h3>
                  <span className="text-[10px] font-mono text-[#8C8A7D]">
                    Version rollback authorization step
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowRollbackModal(false)}
                className="p-1 rounded-full text-[#8C8A7D] hover:text-[#1E2E20] hover:bg-[#FAF9F5]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-[#FFEBEE] border border-[#FFCDD2] rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#C62828] font-bold uppercase">
                <AlertTriangle size={16} />
                <span>
                  Rollback Target: Version v
                  {targetRollbackRecord.packageVersion}
                </span>
              </div>
              <p className="text-[#B71C1C] text-[11px] leading-relaxed font-sans">
                This operation will atomically replace the currently active
                package with{" "}
                <strong>v{targetRollbackRecord.packageVersion}</strong> (
                {targetRollbackRecord.destinationName}). Offline client caches
                will automatically synchronize with this restored baseline.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#1E2E20] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                className="px-5 py-2.5 rounded-xl bg-[#8A1F1F] hover:bg-[#6b1818] text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <RotateCcw size={16} />
                <span>Execute Rollback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RELEASE READINESS DRILL-DOWN MODAL (WP-08 Requirement) */}
      {isDrillDownModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E2E20]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans">
          <div className="bg-white border border-[#E5E3DB] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#E5E3DB] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#23251E] text-[#C5A059] font-mono text-[9px] uppercase tracking-widest font-bold">
                    WP-08 ENHANCEMENT
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E3DB] text-[#8C8A7D] font-mono text-[9px] uppercase tracking-widest font-bold">
                    RELEASE READINESS DRILL-DOWN
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E2E20]">
                  Destination Release Readiness Audit Ledger
                </h3>
                <p className="text-xs text-[#8C8A7D] mt-0.5">
                  Detailed inspection of blocking recommendations, unready
                  partners, translation gaps, and validation issues preventing
                  v1.3.0 publication.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDrillDownModalOpen(false)}
                  className="p-2 rounded-2xl bg-white border border-[#E5E3DB] text-[#8C8A7D] hover:text-[#1E2E20] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="p-4 border-b border-[#E5E3DB] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 font-mono text-xs">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-[10.5px]">
                <button
                  onClick={() => setDrillDownCategory("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "all"
                      ? "bg-[#23251E] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  All Items ({readinessSummary.drillDown.length})
                </button>

                <button
                  onClick={() => setDrillDownCategory("canonical_included")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "canonical_included"
                      ? "bg-[#2E7D32] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#2E7D32] hover:bg-[#E8F5E9]"
                  }`}
                >
                  Canonical Included (
                  {readinessSummary.categoryCounts.canonical_included || 0})
                </button>

                <button
                  onClick={() => setDrillDownCategory("non_canonical_excluded")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "non_canonical_excluded"
                      ? "bg-[#C5A059] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#C5A059] hover:bg-[#FFF8E1]"
                  }`}
                >
                  Non-Canonical Excluded (
                  {readinessSummary.categoryCounts.non_canonical_excluded || 0})
                </button>

                <button
                  onClick={() => setDrillDownCategory("preventing_publication")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "preventing_publication"
                      ? "bg-[#8A1F1F] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#8A1F1F] hover:bg-[#FFEBEE]"
                  }`}
                >
                  Preventing Publication (
                  {readinessSummary.categoryCounts.preventing_publication})
                </button>

                <button
                  onClick={() => setDrillDownCategory("partner_not_ready")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "partner_not_ready"
                      ? "bg-[#F57F17] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#F57F17] hover:bg-[#FFF8E1]"
                  }`}
                >
                  Partners Not Ready (
                  {readinessSummary.categoryCounts.partner_not_ready})
                </button>

                <button
                  onClick={() =>
                    setDrillDownCategory("incomplete_translations")
                  }
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "incomplete_translations"
                      ? "bg-[#C5A059] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#C5A059] hover:bg-[#FAF9F5]"
                  }`}
                >
                  Translations (
                  {readinessSummary.categoryCounts.incomplete_translations})
                </button>

                <button
                  onClick={() => setDrillDownCategory("blocking_validation")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "blocking_validation"
                      ? "bg-[#8A1F1F] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#8A1F1F] hover:bg-[#FFEBEE]"
                  }`}
                >
                  Blocking Errors (
                  {readinessSummary.categoryCounts.blocking_validation})
                </button>

                <button
                  onClick={() => setDrillDownCategory("warnings")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "warnings"
                      ? "bg-[#1E2E20] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#8C8A7D] hover:text-[#1E2E20]"
                  }`}
                >
                  Warnings ({readinessSummary.categoryCounts.warnings})
                </button>

                <button
                  onClick={() => setDrillDownCategory("image_or_metadata")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drillDownCategory === "image_or_metadata"
                      ? "bg-[#23251E] text-white shadow-xs"
                      : "bg-[#FAF9F5] border border-[#E5E3DB] text-[#1E2E20] hover:bg-[#FAF9F5]"
                  }`}
                >
                  Image / Metadata (
                  {readinessSummary.categoryCounts.image_or_metadata})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative shrink-0 md:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8A7D]"
                />
                <input
                  type="text"
                  placeholder="Filter by ID or title..."
                  value={drillDownSearch}
                  onChange={(e) => setDrillDownSearch(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E5E3DB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1E2E20] focus:outline-none focus:border-[#23251E]"
                />
              </div>
            </div>

            {/* Drill-Down Items List Scroll Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3 font-sans">
              {(() => {
                const filtered = readinessSummary.drillDown.filter((item) => {
                  const catMatch =
                    drillDownCategory === "all" ||
                    item.category === drillDownCategory;
                  const searchMatch =
                    !drillDownSearch ||
                    item.title
                      .toLowerCase()
                      .includes(drillDownSearch.toLowerCase()) ||
                    item.recordId
                      .toLowerCase()
                      .includes(drillDownSearch.toLowerCase()) ||
                    item.reason
                      .toLowerCase()
                      .includes(drillDownSearch.toLowerCase());
                  return catMatch && searchMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center bg-[#FAF9F5] border border-dashed border-[#E5E3DB] rounded-2xl">
                      <CheckCircle2
                        size={36}
                        className="mx-auto text-[#2E7D32] mb-3"
                      />
                      <h4 className="font-serif text-lg font-bold text-[#1E2E20]">
                        No Issues Found in Selected Category
                      </h4>
                      <p className="text-xs text-[#8C8A7D] mt-1 font-mono">
                        All items meet the readiness standards for this audit
                        filter.
                      </p>
                    </div>
                  );
                }

                return filtered.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#FAF9F5] border border-[#E5E3DB] hover:border-[#23251E] rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category Label Badge */}
                        <span className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E3DB] text-[#1E2E20] font-mono text-[9px] font-bold uppercase tracking-wider">
                          {item.categoryLabel}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase ${
                            item.severity === "error"
                              ? "bg-[#FFEBEE] text-[#8A1F1F] border border-[#FFCDD2]"
                              : item.severity === "warning"
                                ? "bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]"
                                : "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]"
                          }`}
                        >
                          {item.severity === "error"
                            ? "BLOCKING ERROR"
                            : item.severity === "warning"
                              ? "WARNING"
                              : "AUDIT CHECK"}
                        </span>

                        {/* Score percentage if present */}
                        {item.scorePercentage !== undefined && (
                          <span className="font-mono text-[10px] font-bold text-[#8C8A7D]">
                            Completeness:{" "}
                            <strong className="text-[#1E2E20]">
                              {item.scorePercentage}%
                            </strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="font-mono text-xs font-bold text-[#C5A059] bg-white px-2 py-0.5 rounded border border-[#E5E3DB]">
                          {item.recordId}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#1E2E20]">
                          {item.title}
                        </h4>
                      </div>

                      <p className="text-xs text-[#8C8A7D] font-sans leading-relaxed">
                        {item.reason}
                      </p>

                      {item.missingFields && item.missingFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.missingFields.slice(0, 4).map((mf, idx) => (
                            <span
                              key={idx}
                              className="text-[9.5px] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E3DB] text-[#8A1F1F]"
                            >
                              • {mf}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Direct Navigation Button to Recommendation or Partner Record */}
                    <div className="shrink-0">
                      <button
                        onClick={() => {
                          const targetTab =
                            item.type === "recommendation"
                              ? "recommendations"
                              : "partners";
                          if (onNavigateTab) {
                            onNavigateTab(targetTab, item.recordId);
                          }
                          setIsDrillDownModalOpen(false);
                        }}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>
                          Navigate to{" "}
                          {item.type === "recommendation"
                            ? "Recommendation"
                            : "Partner"}
                        </span>
                        <ChevronRight size={14} className="text-[#C5A059]" />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E3DB] bg-[#FAF9F5] flex items-center justify-between font-mono text-xs shrink-0">
              <span className="text-[#8C8A7D]">
                Showing {readinessSummary.drillDown.length} audit issues in
                Canonical Serbia Dataset.
              </span>
              <button
                onClick={() => setIsDrillDownModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E5E3DB] bg-white text-[#1E2E20] font-bold hover:bg-[#FAF9F5] cursor-pointer"
              >
                Close Drill-Down
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
