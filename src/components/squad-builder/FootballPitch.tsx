import React from 'react';

interface FootballPitchProps {
  children?: React.ReactNode;
  className?: string;
}

export const FootballPitch: React.FC<FootballPitchProps> = ({
  children,
  className = '',
}) => {
  // Half-field view: GK at bottom (y=100), attackers at top (y=0)
  // ViewBox is 100x100 for easy percentage-based positioning
  return (
    <div
      className={`relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(to bottom, #228B22 0%, #2E8B2E 50%, #32A332 100%)',
      }}
    >
      {/* Grass stripes effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 10%,
            rgba(255,255,255,0.02) 10%,
            rgba(255,255,255,0.02) 20%
          )`,
        }}
      />

      {/* SVG Field markings - Half field */}
      {/* ViewBox 120x90 matches 4:3 aspect ratio for proper circle/arc rendering */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 120 90"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Field boundary */}
        <rect
          x="5"
          y="3"
          width="110"
          height="84"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />

        {/* Center line (top edge of our half) */}
        <line
          x1="5"
          y1="3"
          x2="115"
          y2="3"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />

        {/* Half center circle at top */}
        <path
          d="M 45 3 A 15 15 0 0 1 75 3"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />

        {/* Center spot at top */}
        <circle cx="60" cy="3" r="0.8" fill="rgba(255,255,255,0.8)" />

        {/* Penalty area (18-yard box) */}
        <rect
          x="24"
          y="62"
          width="72"
          height="25"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />

        {/* Goal area (6-yard box) */}
        <rect
          x="42"
          y="77"
          width="36"
          height="10"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />

        {/* Penalty spot */}
        <circle cx="60" cy="72" r="0.8" fill="rgba(255,255,255,0.9)" />

        {/* Penalty arc - curves upward into the field */}
        <path
          d="M 40 62 A 12 12 0 0 1 80 62"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />

        {/* Goal */}
        <rect
          x="48"
          y="87"
          width="24"
          height="3"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="0.4"
        />
      </svg>

      {/* Player positions container */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};

export default FootballPitch;
