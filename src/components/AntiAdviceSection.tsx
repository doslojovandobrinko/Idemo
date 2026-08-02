/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "framer-motion";
import { Recommendation } from "../types";
import { getTruthCurationForRecommendation } from "../lib/antiAdviceEngine";
import {
  Compass,
  ShieldAlert,
  CheckCircle2,
  Lightbulb,
  UserCheck,
  UserX,
  BookOpen,
  Quote,
} from "lucide-react";

interface AntiAdviceSectionProps {
  recommendation: Recommendation;
  language: string;
}

export function AntiAdviceSection({
  recommendation,
  language,
}: AntiAdviceSectionProps) {
  const data = React.useMemo(() => {
    return getTruthCurationForRecommendation(recommendation, language);
  }, [recommendation, language]);

  const lKey = language === "sr" ? "sr" : language === "zh" ? "zh" : "en";

  const labels: Record<
    string,
    {
      curationHeader: string;
      shortRecLabel: string;
      worthTimeLabel: string;
      unlearnLabel: string;
      unlearnSubtitle: string;
      worthKnowingLabel: string;
      worthKnowingSubtitle: string;
      idealForLabel: string;
      notIdealForLabel: string;
      titleSuffix: string;
    }
  > = {
    en: {
      curationHeader: "MASTER CURATION REPORT",
      shortRecLabel: "The Curation",
      worthTimeLabel: "Why It Is Worth Your Time",
      unlearnLabel: "What to Unlearn",
      unlearnSubtitle: "Challenge your assumptions to shift your perspective.",
      worthKnowingLabel: "To Get the Most From This Experience",
      worthKnowingSubtitle:
        "Actionable local wisdom to protect your investment of presence.",
      idealForLabel: "Ideal For",
      notIdealForLabel: "Not Ideal For",
      titleSuffix: "Truth Curation",
    },
    sr: {
      curationHeader: "PREMIJUM KUSTOSKI IZVEŠTAJ",
      shortRecLabel: "Kustoska srž",
      worthTimeLabel: "Zašto je ovo vredno vašeg vremena",
      unlearnLabel: "Zablude koje treba odbaciti",
      unlearnSubtitle:
        "Preispitajte uobičajene pretpostavke i promenite perspektivu.",
      worthKnowingLabel: "Kako da izvučete maksimum iz ovog iskustva",
      worthKnowingSubtitle:
        "Praktični saveti lokalnih čuvara koji štite kvalitet vašeg doživljaja.",
      idealForLabel: "Idealno za",
      notIdealForLabel: "Nije idealno za",
      titleSuffix: "Kustoska analiza",
    },
    zh: {
      curationHeader: "大师甄选特调报告",
      shortRecLabel: "大师特调摘要",
      worthTimeLabel: "为什么它值得倾注时间",
      unlearnLabel: "入场前需要做出的“卸载” (UNLEARN)",
      unlearnSubtitle: "打破固化的游客偏见，重构感官认知切面。",
      worthKnowingLabel: "如何最大化您的感官体验 (WORTH KNOWING)",
      worthKnowingSubtitle: "本地管家守望之核心诫律，旨在捍卫您的专注力投资。",
      idealForLabel: "完美匹配主人群",
      notIdealForLabel: "不建议涉足之人群",
      titleSuffix: "真实本原甄选",
    },
  };

  const l = labels[lKey];

  // Resolve recommendation title
  let recTitle = "";
  if (recommendation && recommendation.title) {
    if (typeof recommendation.title === "object") {
      recTitle =
        (recommendation.title as any)[lKey] ||
        (recommendation.title as any)["en"] ||
        "";
    } else {
      recTitle = String(recommendation.title);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      id={`truth-curation-${recommendation.id}`}
      className="bg-white border border-border-main rounded-[40px] p-6 lg:p-10 space-y-10 text-brand-charcoal overflow-hidden shadow-tactile relative mt-8"
    >
      {/* Decorative subtle header line pattern */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-accent-red/40 via-accent-teal/40 to-accent-red/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#2d3025_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-[0.015] pointer-events-none" />

      {/* 1. Header Metadata Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border-main/50 gap-4 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-pearl text-accent-teal flex items-center justify-center border border-border-main shadow-sm shrink-0">
            <Compass size={22} className="text-brand-sage animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#8C8A7D] font-extrabold leading-none">
              {l.curationHeader}
            </h4>
            <h2 className="text-2xl md:text-3xl font-serif text-brand-sage font-semibold leading-tight mt-2 tracking-tight">
              {recTitle}
            </h2>
          </div>
        </div>
        <div className="flex items-center self-start md:self-center gap-2 px-4 py-2 bg-brand-pearl/50 border border-border-main rounded-2xl text-[10px] font-mono tracking-wider text-brand-sage font-bold uppercase select-none">
          <div className="w-1.5 h-1.5 bg-accent-red rounded-full animate-pulse" />
          {l.titleSuffix}
        </div>
      </div>

      {/* 2. Short Recommendation Card (40-60 words) */}
      {data.shortRecommendation && (
        <div className="bg-brand-pearl/20 border border-border-main/30 rounded-3xl p-6 relative z-10 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Quote size={18} className="text-[#8A1F1F] shrink-0" />
            <span className="text-[13px] font-mono tracking-[0.15em] text-[#8A1F1F] font-black uppercase">
              {l.shortRecLabel}
            </span>
          </div>
          <p className="text-base md:text-lg font-serif text-brand-charcoal italic leading-relaxed tracking-wide pl-2 border-l-2 border-[#8A1F1F] font-medium">
            &ldquo;{data.shortRecommendation}&rdquo;
          </p>
        </div>
      )}

      {/* 4/5 split: Why Its Worth Your Time (150-250 words) */}
      {data.whyItsWorthYourTime && (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-brand-charcoal">
            <BookOpen size={18} className="text-accent-teal" />
            <h3 className="text-[13px] uppercase tracking-[0.18em] text-accent-teal font-black">
              {l.worthTimeLabel}
            </h3>
          </div>
          <div className="text-base md:text-lg leading-relaxed text-brand-charcoal font-sans tracking-wide space-y-4 font-semibold">
            <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:text-[#8A1F1F]">
              {data.whyItsWorthYourTime}
            </p>
          </div>
        </div>
      )}

      {/* 4. Twin Towers of Actionable Advice: UNLEARN & WORTH KNOWING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 relative z-10">
        {/* Pillar A: UNLEARN */}
        {data.unlearn && data.unlearn.length > 0 && (
          <div className="bg-brand-pearl/10 border border-border-main/40 rounded-3xl p-6 space-y-5">
            <div className="flex items-start gap-3 border-b border-border-main/40 pb-4">
              <div className="w-9 h-9 rounded-xl bg-accent-red/10 text-accent-red border border-accent-red/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-base uppercase tracking-[0.12em] text-[#8A1F1F] font-black font-serif">
                  {l.unlearnLabel}
                </h3>
                <p className="text-[12px] text-brand-charcoal/70 font-sans mt-1 font-bold">
                  {l.unlearnSubtitle}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.unlearn.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="text-[13px] font-mono font-black text-[#8A1F1F] shrink-0 mt-0.5 select-none">
                    [0{idx + 1}]
                  </div>
                  <p className="text-base leading-relaxed text-brand-charcoal font-sans font-semibold">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pillar B: WORTH KNOWING / OUTCOME PROTECTION */}
        {data.worthKnowing && data.worthKnowing.length > 0 && (
          <div className="bg-brand-pearl/15 border border-border-main/60 rounded-3xl p-6 space-y-5">
            <div className="flex items-start gap-3 border-b border-border-main/40 pb-4">
              <div className="w-9 h-9 rounded-xl bg-accent-teal/10 text-accent-teal border border-accent-teal/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-base uppercase tracking-[0.12em] text-accent-teal font-black font-serif">
                  {l.worthKnowingLabel}
                </h3>
                <p className="text-[12px] text-brand-charcoal/70 font-sans mt-1 font-bold">
                  {l.worthKnowingSubtitle}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.worthKnowing.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-accent-teal/10 text-accent-teal flex items-center justify-center shrink-0 font-mono text-[10px] font-black border border-accent-teal/20 select-none mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-base leading-relaxed text-brand-charcoal font-sans font-semibold">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. The Demographic Alignment Quadrant: IDEAL FOR & NOT IDEAL FOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border-main/40 relative z-10">
        {/* Alignment Left: Ideal For */}
        {data.idealFor && (
          <div className="flex items-start gap-4 bg-brand-pearl/5 border border-border-main/30 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-teal/5 text-accent-teal border border-accent-teal/10 flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="space-y-1">
              <h5 className="text-[12px] uppercase tracking-[0.15em] text-accent-teal font-black">
                {l.idealForLabel}
              </h5>
              <p className="text-base leading-relaxed text-brand-charcoal font-sans font-semibold">
                {data.idealFor}
              </p>
            </div>
          </div>
        )}

        {/* Alignment Right: Not Ideal For */}
        {data.notIdealFor && (
          <div className="flex items-start gap-4 bg-brand-pearl/5 border border-border-main/30 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-red/5 text-accent-red border border-accent-red/10 flex items-center justify-center shrink-0">
              <UserX size={18} />
            </div>
            <div className="space-y-1">
              <h5 className="text-[12px] uppercase tracking-[0.15em] text-[#8A1F1F] font-black">
                {l.notIdealForLabel}
              </h5>
              <p className="text-base leading-relaxed text-brand-charcoal font-sans font-semibold">
                {data.notIdealFor}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
