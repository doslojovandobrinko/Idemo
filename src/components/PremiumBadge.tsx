/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "framer-motion";

interface PremiumBadgeProps {
  type: "silver" | "gold" | "platinum" | string;
  compact?: boolean;
  onClick?: () => void;
}

export default function PremiumBadge({
  type,
  compact = false,
  onClick,
}: PremiumBadgeProps) {
  const badgeType = (type || "").toLowerCase();

  // Return null if none or empty
  if (!badgeType || badgeType === "none") return null;

  // Set style values based on type
  let text = "";
  let containerStyles = "";
  let textStyles = "";
  let shineColor = "";

  if (badgeType === "silver") {
    text = compact ? "Silver Premium" : "Silver Curation";
    containerStyles =
      "bg-gradient-to-r from-[#CAD2C5] via-[#E2E8F0] to-[#94A3B8] border-[#94A3B8] shadow-[0_0_15px_rgba(148,163,184,0.45)]";
    textStyles = "text-[#0F172A] font-black tracking-wider";
    shineColor = "bg-white/60";
  } else if (badgeType === "gold") {
    text = compact ? "Gold Elite" : "Gold Selection";
    containerStyles =
      "bg-gradient-to-r from-[#FBBF24] via-[#FDE68A] to-[#D97706] border-[#B45309] shadow-[0_0_18px_rgba(245,158,11,0.55)]";
    textStyles = "text-[#451A03] font-black tracking-wider";
    shineColor = "bg-white/70";
  } else if (badgeType === "platinum") {
    text = compact ? "Platinum Royal" : "Platinum Exclusive";
    containerStyles =
      "bg-gradient-to-r from-[#C7D2FE] via-[#E0E7FF] to-[#818CF8] border-[#4338CA] shadow-[0_0_20px_rgba(99,102,241,0.65)] animate-pulse-subtle";
    textStyles = "text-[#1E1B4B] font-black tracking-wider";
    shineColor = "bg-white/80";
  } else {
    // Fallback if anything unrecognized gets added
    text = type.charAt(0).toUpperCase() + type.slice(1);
    containerStyles = "bg-white/90 border-slate-200";
    textStyles = "text-slate-800";
    shineColor = "bg-white/20";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-center rounded-xl border-2 select-none backdrop-blur-md transition-all duration-300 ${onClick ? "cursor-pointer active:scale-95" : ""} ${
        compact
          ? "px-3 py-1 text-[8px] font-black uppercase"
          : "px-4 py-2 text-[10px] font-black uppercase tracking-widest"
      } ${containerStyles}`}
    >
      {/* Premium subtle metallic sheen effect overlay */}
      <span
        className={`absolute -inset-y-12 w-6 -left-10 rotate-[25deg] filter blur-md animate-shine pointer-events-none ${shineColor}`}
      />

      <span
        className={`${textStyles} relative z-10 font-extrabold flex items-center gap-1.5`}
      >
        {badgeType === "silver" && (
          <span className="text-[12px] filter drop-shadow">🥈</span>
        )}
        {badgeType === "gold" && (
          <span className="text-[12px] filter drop-shadow">🥇</span>
        )}
        {badgeType === "platinum" && (
          <span className="text-[12px] filter drop-shadow">💎</span>
        )}
        <span>{text}</span>
      </span>
    </motion.div>
  );
}
