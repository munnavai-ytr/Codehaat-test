'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangle' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangle',
  width,
  height,
}: SkeletonProps) {
  const variantClass = {
    rectangle: 'rounded-2xl',
    circle: 'rounded-full shrink-0',
    text: 'rounded-lg h-4 w-full',
  }[variant];

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-[var(--border-default)]/70 ${variantClass} ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}
