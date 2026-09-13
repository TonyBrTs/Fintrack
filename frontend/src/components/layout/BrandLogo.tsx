import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

export function BrandLogo({ className = '', size = 36, priority = false }: BrandLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="FinTrack Logo"
        width={size * 2}
        height={size * 2}
        priority={priority}
        className="w-full h-full object-contain drop-shadow-md"
      />
    </div>
  );
}
