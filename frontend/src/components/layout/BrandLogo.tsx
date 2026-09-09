import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export function BrandLogo({ className = '', size = 36 }: BrandLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Main Background Gradient */}
          <linearGradient id="ft-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Trend Glow Gradient */}
          <linearGradient id="ft-trend-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Spark Gradient */}
          <radialGradient id="ft-spark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Squircle App Icon Container */}
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill="url(#ft-bg-grad)"
        />

        {/* Subtle Inner Highlight Border */}
        <rect
          x="1.5"
          y="1.5"
          width="37"
          height="37"
          rx="10.5"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1"
        />

        {/* Stylized Finance Growth Bars */}
        {/* Bar 1 (Short) */}
        <rect
          x="9.5"
          y="21"
          width="4"
          height="9"
          rx="2"
          fill="rgba(255, 255, 255, 0.45)"
        />

        {/* Bar 2 (Medium) */}
        <rect
          x="16"
          y="16"
          width="4"
          height="14"
          rx="2"
          fill="rgba(255, 255, 255, 0.75)"
        />

        {/* Bar 3 (Tall) */}
        <rect
          x="22.5"
          y="11"
          width="4"
          height="19"
          rx="2"
          fill="rgba(255, 255, 255, 0.95)"
        />

        {/* Trending Growth Arrow Line cutting dynamically */}
        <path
          d="M 8 23 C 14 21, 18 15, 28 10.5"
          stroke="url(#ft-trend-grad)"
          strokeWidth="2.75"
          strokeLinecap="round"
        />

        {/* Arrow Tip */}
        <path
          d="M 23.5 10 L 28.5 10.5 L 27.5 15"
          stroke="url(#ft-trend-grad)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top-Right Glowing Spark */}
        <circle cx="31" cy="9" r="3" fill="url(#ft-spark)" />
        <path
          d="M 31 6 L 31 12 M 28 9 L 34 9"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
