/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface IdemoLogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  showBg?: boolean;
}

export default function IdemoLogo({
  className = "",
  width = "100%",
  height = "100%",
  showBg = true,
}: IdemoLogoProps) {
  return (
    <svg
      viewBox="48 44 754 212"
      width={width}
      height={height}
      className={`${className} overflow-visible`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {showBg && (
        <rect x="48" y="44" width="754" height="212" fill="#FFFFFF" rx="12" />
      )}

      {/* Letter I */}
      <rect x="50" y="70" width="36" height="160" fill="#000000" />

      {/* Letter D (Hero Oxblood Red Geometric Triangle pointing toward E) */}
      <path d="M 130 46 L 290 150 L 130 254 Z" fill="#800020" />
      {/* Mandatory perfectly centered WHITE triangular cut-out */}
      <path d="M 175 128.92 L 207.43 150 L 175 171.08 Z" fill="#FFFFFF" />

      {/* Letter E */}
      <path
        d="M 320 70 H 430 V 106 H 356 V 132 H 415 V 168 H 356 V 194 H 430 V 230 H 320 Z"
        fill="#000000"
      />

      {/* Letter M */}
      <path
        d="M 460 230 V 70 H 496 L 535 165 L 574 70 H 610 V 230 H 574 V 115 L 535 210 L 496 115 V 230 Z"
        fill="#000000"
      />

      {/* Letter O (Clean Elegant Ring) */}
      <circle
        cx="720"
        cy="150"
        r="62"
        stroke="#000000"
        strokeWidth="36"
        fill="none"
      />
    </svg>
  );
}
