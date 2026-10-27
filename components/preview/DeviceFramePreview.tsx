'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  RefreshCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceOrientation = 'portrait' | 'landscape';

interface DeviceDimensions {
  width: number;
  height: number;
}

const BASE_DIMENSIONS: Record<DeviceType, DeviceDimensions> = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 },
};

interface DeviceFramePreviewProps {
  previewUrl?: string;
  apkDownloadUrl?: string;
  productTitle: string;
  initialDevice?: DeviceType;
  className?: string;
  onCloseFullscreen?: () => void;
}

export function DeviceFramePreview({
  previewUrl,
  apkDownloadUrl,
  productTitle,
  initialDevice = 'mobile',
  className = '',
}: DeviceFramePreviewProps) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<DeviceType>(initialDevice);
  const [orientation, setOrientation] = useState<DeviceOrientation>('portrait');
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [showEmbeddingNotice, setShowEmbeddingNotice] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const frameWrapperRef = useRef<HTMLDivElement>(null);

  // Validate HTTPS
  const isValidHttps = Boolean(
    previewUrl &&
      previewUrl.startsWith('https://') &&
      !previewUrl.includes('localhost') &&
      !previewUrl.includes('127.0.0.1')
  );

  // Compute active dimensions considering orientation
  const baseDim = BASE_DIMENSIONS[device];
  const frameWidth = orientation === 'portrait' ? baseDim.width : baseDim.height;
  const frameHeight = orientation === 'portrait' ? baseDim.height : baseDim.width;

  // Fit frame inside container via ResizeObserver and transform scale
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const padding = 32; // breathing room
    const availableWidth = containerRef.current.clientWidth - padding;
    const availableHeight = containerRef.current.clientHeight - padding;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const scaleX = availableWidth / frameWidth;
    const scaleY = availableHeight / frameHeight;
    const nextScale = Math.min(1, Math.min(scaleX, scaleY));
    setScale(nextScale);
  }, [frameWidth, frameHeight]);

  useEffect(() => {
    updateScale();
    const obs = new ResizeObserver(updateScale);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateScale]);

  // 8-second timer for iframe embedding notice
  useEffect(() => {
    if (!isValidHttps || !isLoading) return;
    setShowEmbeddingNotice(false);

    const timer = setTimeout(() => {
      setShowEmbeddingNotice(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isValidHttps, isLoading, iframeKey]);

  // Toggle fullscreen with Fullscreen API + fallback modal
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else {
          // Fallback (e.g. iOS Safari)
          setIsFullscreen((prev) => !prev);
        }
      } catch {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setShowEmbeddingNotice(false);
    setIframeKey((k) => k + 1);
  };

  const handleToggleOrientation = () => {
    setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'));
  };

  if (!previewUrl) {
    return (
      <div className={`w-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-8 text-center flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-[var(--lilac-surface)] text-[var(--lilac-accent)] flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div className="max-w-md">
          <h3 className="font-bold text-base text-[var(--text-primary)]">
            {t('preview.noPreviewAdded')}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            {apkDownloadUrl
              ? 'An Android APK build is available for download below to test this application on a physical device.'
              : 'You can contact the creator directly through CodeHaat to request a live demo walkthrough.'}
          </p>
        </div>
      </div>
    );
  }

  if (!isValidHttps) {
    return (
      <div className={`w-full rounded-3xl bg-[var(--bg-card)] border border-rose-500/30 p-8 text-center flex flex-col items-center justify-center gap-3 ${className}`}>
        <ShieldAlert className="w-8 h-8 text-rose-500" />
        <h3 className="font-bold text-sm text-[var(--text-primary)]">
          {t('preview.invalidPreviewUrl')}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
          Live previews require a valid public HTTPS address to safeguard user security.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] overflow-hidden shadow-[var(--shadow-soft)] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none bg-black/95' : 'w-full h-[640px] sm:h-[720px]'
      } ${className}`}
    >
      {/* Control Toolbar */}
      <div className="shrink-0 h-14 bg-[var(--bg-card-subtle)]/80 backdrop-blur-md border-b border-[var(--border-default)] px-4 flex items-center justify-between gap-3 text-xs z-20">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all font-semibold ${
              device === 'mobile'
                ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={t('preview.mobileFrame')}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all font-semibold ${
              device === 'tablet'
                ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={t('preview.tabletFrame')}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all font-semibold ${
              device === 'desktop'
                ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={t('preview.desktopFrame')}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {device !== 'desktop' && (
            <button
              type="button"
              onClick={handleToggleOrientation}
              className="p-2 min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
              title={t('preview.rotate')}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleReload}
            className="p-2 min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
            title={t('preview.reload')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-xl bg-[var(--bg-card)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] font-semibold text-[var(--text-primary)] transition-colors"
            title={t('preview.openNewTab')}
          >
            <span className="hidden sm:inline text-xs">{t('preview.openNewTab')}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--primary-coral)]" />
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
            title={isFullscreen ? t('preview.exitFullscreen') : t('preview.fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Frame Viewport Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-4 bg-[var(--bg-canvas)]">
        {/* Scaled Hardware Frame */}
        <div
          ref={frameWrapperRef}
          style={{
            width: frameWidth,
            height: frameHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className={`shrink-0 transition-transform duration-200 relative rounded-[32px] p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] border-4 border-neutral-800 dark:border-neutral-700 bg-neutral-900 ${
            device === 'desktop' ? 'rounded-2xl p-2' : ''
          }`}
        >
          {/* Hardware Notch / Camera Pill on Mobile & Tablet */}
          {device === 'mobile' && orientation === 'portrait' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30" />
          )}

          {/* Iframe Viewport */}
          <div className="w-full h-full rounded-[24px] overflow-hidden bg-white relative">
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Spinner size="lg" />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t('preview.loadingIframe')}
                </span>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={previewUrl}
              title={`${productTitle} Live Interactive Preview`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        </div>

        {/* 8-Second Embedding Notice (Honest message, no fake detection) */}
        {showEmbeddingNotice && isLoading && (
          <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto z-40 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md shadow-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="flex-1">
              <p className="leading-relaxed font-medium">
                {t('preview.blockingNotice')}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-white font-bold text-[11px] shadow-xs hover:bg-amber-600 transition-colors"
                >
                  {t('preview.openNewTab')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
