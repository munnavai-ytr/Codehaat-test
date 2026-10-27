'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Share2,
  Copy,
  Flag,
  Globe,
  Smartphone,
  Monitor,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  MessageSquare,
  ShieldAlert,
  Clock,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import { DeviceFramePreview } from '@/components/preview/DeviceFramePreview';
import {
  getProductById,
  getSellerPublishedProducts,
  getSimilarPublishedProducts,
  hasUserReportedProduct,
  submitProductReport,
} from '@/lib/product-service';
import { PRODUCT_CATEGORIES, PLATFORM_OPTIONS, LICENSE_OPTIONS } from '@/config/products';
import { featureFlags } from '@/src/config/features';
import { brandConfig } from '@/src/config/brand';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import type { ProductItem } from '@/types';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, isAdmin } = useSession();
  const isBn = i18n.language?.startsWith('bn');

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Recommendations
  const [sellerProducts, setSellerProducts] = useState<ProductItem[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductItem[]>([]);

  // Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  // Touch swipe handling
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Load product data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!productId) return;
      setIsLoading(true);

      const item = await getProductById(productId);
      if (!isMounted) return;

      setProduct(item);
      setIsLoading(false);

      if (item) {
        document.title = `${item.title} | ${brandConfig.name}`;

        // Fetch seller and similar recommendations concurrently
        if (item.status === 'published') {
          getSellerPublishedProducts(item.sellerId, item.id, 4).then((res) => {
            if (isMounted) setSellerProducts(res);
          });
          getSimilarPublishedProducts(item.category, item.tags, item.id, 4).then((res) => {
            if (isMounted) setSimilarProducts(res);
          });
        }
      } else {
        document.title = `Product Not Found | ${brandConfig.name}`;
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Check report status
  useEffect(() => {
    if (user && product) {
      hasUserReportedProduct(user.uid, product.id).then(setHasReported);
    }
  }, [user, product]);

  const allImages = product
    ? [product.coverImage, ...(product.images || [])].filter(Boolean)
    : [];

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (allImages.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveMediaIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allImages.length, isLightboxOpen]);

  // Touch Swipe for Gallery
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || allImages.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped Left -> Next Image
        setActiveMediaIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      } else {
        // Swiped Right -> Prev Image
        setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      }
    }
    setTouchStartX(null);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Copied',
        message: t('productDetail.linkCopied'),
        type: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        message: 'Could not copy link to clipboard.',
        type: 'error',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.summary,
          url: window.location.href,
        });
      } catch {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleReportSubmit = async () => {
    if (!user || !product) return;
    if (hasReported) {
      toast({
        title: 'Already Reported',
        message: t('productDetail.alreadyReported'),
        type: 'info',
      });
      setIsReportOpen(false);
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitProductReport(user.uid, product.id, reportReason, reportDetails);
      setHasReported(true);
      setIsReportOpen(false);
      toast({
        title: 'Report Submitted',
        message: t('productDetail.reportSubmitted'),
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Report Failed',
        message: err instanceof Error ? err.message : 'Error submitting report.',
        type: 'error',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Loading product details...
        </p>
      </div>
    );
  }

  // Check if product is available or authorized
  const isOwner = Boolean(user && product && user.uid === product.sellerId);
  const isAuthorizedToView = product && (product.status === 'published' || isOwner || isAdmin);

  if (!product || !isAuthorizedToView) {
    return (
      <div className="max-w-xl mx-auto py-12 pb-16">
        <Card padding="lg">
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8 text-[var(--primary-coral)]" />}
            badge="404"
            title={t('productDetail.notFoundTitle')}
            description={t('productDetail.notFoundDesc')}
            actionLabel={t('productDetail.backToExplore')}
            onAction={() => navigate('/explore')}
            secondaryActionLabel="Return Home"
            onSecondaryAction={() => navigate('/')}
          />
        </Card>
      </div>
    );
  }

  const categoryObj = PRODUCT_CATEGORIES.find((c) => c.id === product.category);
  const categoryLabel = categoryObj ? (isBn ? categoryObj.labelBn : categoryObj.labelEn) : product.category;
  const licenseObj = LICENSE_OPTIONS.find((l) => l.id === product.licenseType);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20">
      {/* Non-Public Warning Banner for Owner & Admin */}
      {product.status !== 'published' && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-semibold">{t('productDetail.notPublicBanner')}</span>
          </div>
          <Badge variant="outline" size="sm" className="capitalize font-bold border-amber-500 text-amber-600 dark:text-amber-300">
            {t(`status.${product.status}`)}
          </Badge>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/explore')}
          className="min-h-[44px]"
        >
          {t('productDetail.backToExplore')}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Copy className="w-4 h-4" />}
            onClick={handleCopyLink}
            className="min-h-[44px]"
          >
            {t('productDetail.copyLink')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={handleShare}
            className="min-h-[44px]"
          >
            {t('productDetail.shareBtn')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Flag className="w-4 h-4 text-rose-500" />}
            onClick={() => setIsReportOpen(true)}
            className="min-h-[44px] text-xs text-rose-500 hover:bg-rose-500/10"
          >
            {t('productDetail.reportBtn')}
          </Button>
        </div>
      </div>

      {/* Main Grid: Gallery + Core Info & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery & Description (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Gallery Viewport with reserved 16:9 aspect ratio */}
          <div className="flex flex-col gap-3">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => allImages.length > 0 && setIsLightboxOpen(true)}
              className="relative w-full aspect-video rounded-3xl bg-neutral-900 overflow-hidden border border-[var(--border-default)] cursor-pointer group shadow-[var(--shadow-soft)]"
            >
              {allImages.length > 0 ? (
                <Image
                  src={allImages[activeMediaIndex]}
                  alt={`${product.title} Screenshot ${activeMediaIndex + 1}`}
                  fill
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover group-hover:scale-102 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                  No Screenshots Uploaded
                </div>
              )}

              {/* Lightbox Trigger Overlay */}
              <div className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4" />
              </div>

              {/* Prev / Next Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-20 aspect-video rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeMediaIndex === idx
                        ? 'border-[var(--primary-coral)] scale-105 shadow-xs'
                        : 'border-[var(--border-default)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      unoptimized
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Details */}
          <Card padding="lg" className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
                About this Software
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                {product.description || product.summary}
              </p>
            </div>

            {/* Key Features */}
            {product.features && product.features.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-default)]">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                  {t('productDetail.keyFeatures')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--mint-success)] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack & Platforms */}
            <div className="pt-4 border-t border-[var(--border-default)] flex flex-col gap-3">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {t('productDetail.techStackPlatforms')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {product.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--lilac-surface)] text-[var(--lilac-accent)] border border-[var(--lilac-border)]"
                  >
                    {tech}
                  </span>
                ))}
                {product.platforms.map((plat) => (
                  <span
                    key={plat}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--mint-surface)] text-[var(--mint-success)] border border-[var(--mint-success)]/30 capitalize"
                  >
                    {plat}
                  </span>
                ))}
              </div>
            </div>

            {/* Demo Access Note */}
            {product.demoAccessNote && (
              <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex items-start gap-3 text-xs">
                <Clock className="w-4 h-4 text-[var(--lilac-accent)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--text-primary)] block">
                    {t('productDetail.demoAccess')}
                  </span>
                  <p className="mt-1 text-[var(--text-secondary)] whitespace-pre-line font-mono text-[11px]">
                    {product.demoAccessNote}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Pricing Packages, Seller Card & Direct Actions (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-20">
          {/* Main Title & Category Header */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="glass" size="sm" className="font-bold">
                {categoryLabel}
              </Badge>
              {licenseObj && (
                <Badge variant="outline" size="sm">
                  {isBn ? licenseObj.labelBn : licenseObj.labelEn}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {product.title}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {product.summary}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-3">
            {product.previewUrl && (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Globe className="w-5 h-5" />}
                onClick={() => setShowLivePreview((prev) => !prev)}
                className="w-full min-h-[48px] font-bold text-sm"
              >
                {showLivePreview ? 'Hide Live Preview' : t('productDetail.livePreviewBtn')}
              </Button>
            )}

            {product.apk && (
              <div className="flex flex-col gap-1.5">
                <a
                  href={product.apk.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[var(--mint-surface)] hover:bg-[var(--mint-surface)]/80 text-[var(--mint-success)] border border-[var(--mint-success)]/40 font-bold text-sm transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>{t('productDetail.downloadApkBtn')}</span>
                  <span className="text-xs opacity-75 ml-1">
                    (v{product.apk.versionName} • {(product.apk.sizeBytes / (1024 * 1024)).toFixed(1)}MB)
                  </span>
                </a>
                <p className="text-[10px] text-[var(--text-muted)] text-center px-2">
                  {t('productDetail.apkNotice')}
                </p>
              </div>
            )}

            {/* Chat Button (Rendered ONLY if featureFlags.chat is true) */}
            {featureFlags.chat && (
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<MessageSquare className="w-5 h-5 text-[var(--primary-coral)]" />}
                onClick={() => navigate(`/messages?to=${product.sellerId}&product=${product.id}`)}
                className="w-full min-h-[48px]"
              >
                {t('productDetail.chatBtn')}
              </Button>
            )}
          </div>

          {/* Pricing Packages */}
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {t('productDetail.selectPackage')}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {product.packages?.length || 0} Package(s)
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {(product.packages && product.packages.length > 0
                ? product.packages
                : [
                    {
                      id: 'pkg_def',
                      name: 'Standard License',
                      description: 'Direct code handover and baseline documentation.',
                      priceAmount: 0,
                      currency: 'USD',
                      deliveryDays: 1,
                      includes: ['Full Source Code', 'Setup Guide'],
                    },
                  ]
              ).map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {pkg.name}
                    </span>
                    <span className="font-extrabold text-base text-[var(--mint-success)]">
                      {pkg.priceAmount === 0 ? 'Free' : `${pkg.currency} $${pkg.priceAmount}`}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('productDetail.deliveryInDays', { days: pkg.deliveryDays })}</span>
                  </div>

                  {pkg.includes && pkg.includes.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-default)] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                        {t('productDetail.includes')}
                      </span>
                      {pkg.includes.map((inc, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <CheckCircle2 className="w-3 h-3 text-[var(--mint-success)] shrink-0" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mandatory Non-Payment Disclaimer */}
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)] pt-2 border-t border-[var(--border-default)]">
              {t('productDetail.priceNotice')}
            </p>
          </Card>

          {/* Seller Card */}
          <Card padding="md" className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('productDetail.sellerProfile')}
            </span>

            <div className="flex items-center gap-3">
              <Avatar
                src={product.sellerAvatarUrl}
                alt={product.sellerBrandName || product.sellerUsername}
                name={product.sellerBrandName || product.sellerUsername}
                size="md"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {product.sellerBrandName || `@${product.sellerUsername}`}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate">
                  @{product.sellerUsername}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/u/${product.sellerUsername}`)}
              className="w-full min-h-[44px] text-xs font-semibold"
            >
              {t('productDetail.visitStorefront')}
            </Button>
          </Card>
        </div>
      </div>

      {/* Interactive Device Preview Frame Section (Toggled via Live Preview Button) */}
      {showLivePreview && product.previewUrl && (
        <section className="flex flex-col gap-4 pt-4 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Live Interactive Preview
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Interact with the live application directly in standard responsive device viewports.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X className="w-4 h-4" />}
              onClick={() => setShowLivePreview(false)}
            >
              Close Preview
            </Button>
          </div>

          <DeviceFramePreview
            previewUrl={product.previewUrl}
            apkDownloadUrl={product.apk?.downloadUrl}
            productTitle={product.title}
            initialDevice="desktop"
          />
        </section>
      )}

      {/* More From This Seller Section (Real data only, hidden when empty) */}
      {sellerProducts.length > 0 && (
        <section className="flex flex-col gap-4 pt-8 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              {t('productDetail.moreFromSeller')}
            </h3>
            <button
              type="button"
              onClick={() => navigate(`/u/${product.sellerUsername}`)}
              className="text-xs font-bold text-[var(--primary-coral)] hover:underline cursor-pointer"
            >
              View Storefront →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sellerProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Similar Products Section (Real data only, hidden when empty) */}
      {similarProducts.length > 0 && (
        <section className="flex flex-col gap-4 pt-8 border-t border-[var(--border-default)]">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            {t('productDetail.similarProducts')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal for Gallery */}
      {isLightboxOpen && allImages.length > 0 && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer z-50"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full h-[70vh]"
          >
            <Image
              src={allImages[activeMediaIndex]}
              alt={`${product.title} Fullscreen`}
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-contain"
            />
          </div>

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Report Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title={t('productDetail.reportModalTitle')}
        maxWidth="md"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('productDetail.reportModalDesc')}
          </p>

          <Select
            label={t('productDetail.reportReasonLabel')}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            options={[
              { value: 'malware', label: t('productDetail.reasons.malware') },
              { value: 'copyright', label: t('productDetail.reasons.copyright') },
              { value: 'misleading', label: t('productDetail.reasons.misleading') },
              { value: 'spam', label: t('productDetail.reasons.spam') },
              { value: 'other', label: t('productDetail.reasons.other') },
            ]}
          />

          <Textarea
            label={t('productDetail.reportDetailsLabel')}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder={t('productDetail.reportDetailsPlaceholder')}
            rows={3}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsReportOpen(false)}
              disabled={isSubmittingReport}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleReportSubmit}
              isLoading={isSubmittingReport}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {t('productDetail.submitReport')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
