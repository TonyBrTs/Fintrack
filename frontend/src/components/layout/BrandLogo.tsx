import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
  variant?: 'icon' | 'full';
}

export function BrandLogo({
  className = '',
  size = 36,
  priority = false,
  variant = 'icon',
}: BrandLogoProps) {
  if (variant === 'full') {
    // 800 x 167 (aspect ratio ~4.79)
    const height = size;
    const width = Math.round(size * 4.79);

    return (
      <div
        className={`relative inline-flex items-center shrink-0 select-none ${className}`}
        style={{ height }}
      >
        {/* Dark Theme Full Logo */}
        <Image
          src="/logo-dark.png"
          alt="FinTrack"
          width={width * 2}
          height={height * 2}
          priority={priority}
          className="h-full w-auto object-contain hidden dark:block drop-shadow-sm"
        />
        {/* Light Theme Full Logo */}
        <Image
          src="/logo-light.png"
          alt="FinTrack"
          width={width * 2}
          height={height * 2}
          priority={priority}
          className="h-full w-auto object-contain block dark:hidden drop-shadow-sm"
        />
      </div>
    );
  }

  // Square Isotipo Mark (Theme-Aware)
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dark Theme Square Mark */}
      <Image
        src="/icon-dark.png"
        alt="FinTrack Logo"
        width={size * 2}
        height={size * 2}
        priority={priority}
        className="w-full h-full object-contain hidden dark:block drop-shadow-md"
      />
      {/* Light Theme Square Mark */}
      <Image
        src="/icon-light.png"
        alt="FinTrack Logo"
        width={size * 2}
        height={size * 2}
        priority={priority}
        className="w-full h-full object-contain block dark:hidden drop-shadow-md"
      />
    </div>
  );
}

