import React from "react";

interface MiniMoodGridProps {
  coordinateX?: number | null;
  coordinateY?: number | null;
  className?: string;
}

export default function MiniMoodGrid({
  coordinateX,
  coordinateY,
  className = "",
}: MiniMoodGridProps) {
  // Safely parse coordinates with fallback to 0 (Center) so a dot is ALWAYS rendered
  const numX =
    typeof coordinateX === "number" && !isNaN(coordinateX)
      ? coordinateX
      : Number(coordinateX);
  const numY =
    typeof coordinateY === "number" && !isNaN(coordinateY)
      ? coordinateY
      : Number(coordinateY);

  const xVal = !isNaN(numX) ? Math.max(-5, Math.min(5, numX)) : 0;
  const yVal = !isNaN(numY) ? Math.max(-5, Math.min(5, numY)) : 0;

  // Map coordinates [-5, +5] into SVG plot range [24, 76]
  // This ensures the prominent dot stays within the grid lines
  const plotX = 24 + ((xVal + 5) / 10) * 52;
  const plotY = 24 + ((5 - yVal) / 10) * 52;

  // Ultra-vivid, high-contrast sensory dot colors by Mood Orbit quadrant
  let coreColor = "#DC2626"; // Default Vivid Red
  let glowColor = "rgba(220, 38, 38, 0.45)";

  if (xVal < 0 && yVal > 0) {
    coreColor = "#DC2626"; // Top-Left: Urban Contemplative (Vivid Crimson Red)
    glowColor = "rgba(220, 38, 38, 0.5)";
  } else if (xVal >= 0 && yVal > 0) {
    coreColor = "#EA580C"; // Top-Right: Urban Active (Vivid Warm Orange)
    glowColor = "rgba(234, 88, 12, 0.5)";
  } else if (xVal < 0 && yVal <= 0) {
    coreColor = "#16A34A"; // Bottom-Left: Nature Quiet (Vivid Forest Green)
    glowColor = "rgba(22, 163, 74, 0.5)";
  } else if (xVal >= 0 && yVal <= 0) {
    coreColor = "#0284C7"; // Bottom-Right: Nature Adventure (Vivid Ocean Blue)
    glowColor = "rgba(2, 132, 199, 0.5)";
  }

  return (
    <div
      className={`w-[46px] h-[46px] bg-[#FAF9F6] border border-[#C8C4B0] rounded-xl relative overflow-hidden flex-shrink-0 select-none shadow-sm ${className}`}
      title={`IDEMO Mood Orbit Position: [X: ${xVal}, Y: ${yVal}]\nVertical: Dense Metropolitan (top) ↔ Remote Nature (bottom)\nHorizontal: Hedonist (left) ↔ Adventurer (right)`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full block"
        aria-label="IDEMO Mood Orbit 2D Coordinate Grid"
      >
        {/* Subtle Background Quadrant Tints for Spatial Context */}
        <rect
          x="22"
          y="22"
          width="28"
          height="28"
          fill="#DC2626"
          fillOpacity="0.04"
        />
        <rect
          x="50"
          y="22"
          width="28"
          height="28"
          fill="#EA580C"
          fillOpacity="0.04"
        />
        <rect
          x="22"
          y="50"
          width="28"
          height="28"
          fill="#16A34A"
          fillOpacity="0.04"
        />
        <rect
          x="50"
          y="50"
          width="28"
          height="28"
          fill="#0284C7"
          fillOpacity="0.04"
        />

        {/* Outer Reference Guideline */}
        <rect
          x="22"
          y="22"
          width="56"
          height="56"
          fill="none"
          stroke="#D1CEBD"
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />

        {/* Primary Axes Lines */}
        {/* Vertical Axis: Dense Metropolitan (top) ↔ Remote Nature (bottom) */}
        <line
          x1="50"
          y1="15"
          x2="50"
          y2="85"
          stroke="#44403C"
          strokeWidth="1.8"
        />

        {/* Horizontal Axis: Hedonist (left) ↔ Adventurer (right) */}
        <line
          x1="15"
          y1="50"
          x2="85"
          y2="50"
          stroke="#44403C"
          strokeWidth="1.8"
        />

        {/* Arrowheads for Axes */}
        {/* Top Arrowhead ↑ */}
        <polygon points="50,10 45,16 55,16" fill="#1C1917" />

        {/* Bottom Arrowhead ↓ */}
        <polygon points="50,90 45,84 55,84" fill="#1C1917" />

        {/* Left Arrowhead ← */}
        <polygon points="10,50 16,45 16,55" fill="#1C1917" />

        {/* Right Arrowhead → */}
        <polygon points="90,50 84,45 84,55" fill="#1C1917" />

        {/* Center Crosshair Ring */}
        <circle
          cx="50"
          cy="50"
          r="2.5"
          fill="#FAF9F6"
          stroke="#44403C"
          strokeWidth="1.2"
        />

        {/* Axis Labels - Micro-Editorial Typography */}
        {/* Top: Dense Metropolitan */}
        <text
          x="50"
          y="7.5"
          textAnchor="middle"
          fontSize="5.8"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fill="#1C1917"
          letterSpacing="0.2"
        >
          METRO
        </text>

        {/* Bottom: Remote Nature */}
        <text
          x="50"
          y="98"
          textAnchor="middle"
          fontSize="5.8"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fill="#1C1917"
          letterSpacing="0.2"
        >
          NATURE
        </text>

        {/* Left: Hedonist */}
        <text
          x="6"
          y="50"
          textAnchor="middle"
          transform="rotate(-90 6 50)"
          fontSize="5.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fill="#1C1917"
          letterSpacing="0.3"
        >
          HEDONIST
        </text>

        {/* Right: Adventurer */}
        <text
          x="94"
          y="50"
          textAnchor="middle"
          transform="rotate(90 94 50)"
          fontSize="5.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fill="#1C1917"
          letterSpacing="0.3"
        >
          ADVENTURER
        </text>

        {/* Plotted Sensory Orb Dot - BOLD, PROMINENT, UNMISSABLE */}
        <g className="transition-all duration-300">
          {/* Layer 1: Outer Pulse Glow */}
          <circle cx={plotX} cy={plotY} r="13" fill={glowColor} />

          {/* Layer 2: Dark High-Contrast Border Drop Shadow */}
          <circle cx={plotX} cy={plotY} r="9.5" fill="#1C1917" />

          {/* Layer 3: Solid Bright White Isolation Ring */}
          <circle cx={plotX} cy={plotY} r="8" fill="#FFFFFF" />

          {/* Layer 4: Solid Hyper-Vivid Core Color Circle */}
          <circle cx={plotX} cy={plotY} r="6" fill={coreColor} />

          {/* Layer 5: Specular White Highlight */}
          <circle
            cx={plotX - 1.8}
            cy={plotY - 1.8}
            r="2"
            fill="#FFFFFF"
            opacity="0.95"
          />
        </g>
      </svg>
    </div>
  );
}
