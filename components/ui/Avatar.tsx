'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  pulseOnline?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  isOnline = false,
  pulseOnline = false,
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  const indicatorSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  }[size];

  const getInitials = (n?: string) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const showFallback = !src || imageError;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold tracking-wider select-none bg-[var(--lilac-surface)] text-[var(--lilac-accent)] border border-[var(--border-default)] ${sizeClasses}`}
      >
        {!showFallback ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="64px"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="object-cover"
          />
        ) : (
          <span>{getInitials(name || alt)}</span>
        )}
      </div>

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-[var(--mint-success)] border-2 border-[var(--bg-card)] ${indicatorSize} ${
            pulseOnline ? 'deal-pulse' : ''
          }`}
          title="Online now"
        />
      )}
    </div>
  );
}
