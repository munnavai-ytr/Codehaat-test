'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserPlus,
  Eye,
  X,
  Globe,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SaveAccountModal } from '@/components/auth/SaveAccountModal';
import { DeviceFramePreview } from '@/components/preview/DeviceFramePreview';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import {
  hasUserLikedProduct,
  likeProduct,
  unlikeProduct,
  getProductLikeCount,
  hasUserSavedProduct,
  saveProduct,
  unsaveProduct,
  isFollowingUser,
  followUser,
  unfollowUser,
} from '@/lib/social-service';
import type { ProductItem, ProductPlatform } from '@/types';

interface FeedCardProps {
  product: ProductItem;
  onFollowToggled?: (sellerId: string, isNowFollowing: boolean) => void;
}

export function FeedCard({ product, onFollowToggled }: FeedCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isGuest, isAuthenticated } = useSession();

  const isPermanentUser = isAuthenticated && !isGuest;
  const isOwner = Boolean(user && user.uid === product.sellerId);

  // States
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Social States
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [isSaveProcessing, setIsSaveProcessing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);

  const allImages = [product.coverImage, ...(product.images || [])].filter(Boolean);

  // Lazy load social statuses when visible
  const cardRef = useRef<HTMLDivElement>(null);
  const hasLoadedStatus = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasLoadedStatus.current) {
          hasLoadedStatus.current = true;
          // Load counts
          getProductLikeCount(product.id).then(setLikeCount);

          if (user && isPermanentUser) {
            hasUserLikedProduct(user.uid, product.id).then(setLiked);
            hasUserSavedProduct(user.uid, product.id).then(setSaved);
            if (!isOwner) {
              isFollowingUser(user.uid, product.sellerId).then(setFollowing);
            }
          }
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, [product.id, product.sellerId, user, isPermanentUser, isOwner]);

  // Touch Swipe for Feed Image Carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || allImages.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveMediaIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      } else {
        setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      }
    }
    setTouchStartX(null);
  };

  // Require Login Interceptor
  const executeWithAuth = (action: () => Promise<void>) => {
    if (!isPermanentUser) {
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
      return;
    }
    action();
  };

  const handleAuthSuccess = async () => {
    setIsAuthModalOpen(false);
    if (pendingAction) {
      const act = pendingAction;
      setPendingAction(null);
      await act();
    }
  };

  // Like with optimistic UI & rollback
  const handleLikeToggle = () => {
    executeWithAuth(async () => {
      if (isLikeProcessing || !user) return;
      setIsLikeProcessing(true);

      const nextLiked = !liked;
      const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

      // Optimistic update
      setLiked(nextLiked);
      setLikeCount(nextCount);

      try {
        if (nextLiked) {
          await likeProduct(user.uid, product.id, product.sellerId);
        } else {
          await unlikeProduct(user.uid, product.id);
        }
      } catch (err) {
        // Rollback on error
        setLiked(!nextLiked);
        setLikeCount(likeCount);
        toast({
          title: 'Error',
          message: 'Could not update like. Please try again.',
          type: 'error',
        });
      } finally {
        setIsLikeProcessing(false);
      }
    });
  };

  // Save with optimistic UI & rollback
  const handleSaveToggle = () => {
    executeWithAuth(async () => {
      if (isSaveProcessing || !user) return;
      setIsSaveProcessing(true);

      const nextSaved = !saved;
      setSaved(nextSaved);

      try {
        if (nextSaved) {
          await saveProduct(user.uid, product.id);
          toast({
            title: 'Saved',
            message: 'Project added to your saved software.',
            type: 'success',
          });
        } else {
          await unsaveProduct(user.uid, product.id);
          toast({
            title: 'Removed',
            message: 'Project removed from saved items.',
            type: 'info',
          });
        }
      } catch (err) {
        setSaved(!nextSaved);
        toast({
          title: 'Error',
          message: 'Could not update saved state.',
          type: 'error',
        });
      } finally {
        setIsSaveProcessing(false);
      }
    });
  };

  // Follow with optimistic UI & rollback
  const handleFollowToggle = () => {
    executeWithAuth(async () => {
      if (isFollowProcessing || !user || isOwner) return;
      setIsFollowProcessing(true);

      const nextFollowing = !following;
      setFollowing(nextFollowing);

      try {
        if (nextFollowing) {
          await followUser(user.uid, product.sellerId);
          toast({
            title: 'Following',
            message: `You are now following ${product.sellerBrandName || `@${product.sellerUsername}`}.`,
            type: 'success',
          });
        } else {
          await unfollowUser(user.uid, product.sellerId);
        }
        onFollowToggled?.(product.sellerId, nextFollowing);
      } catch (err) {
        setFollowing(!nextFollowing);
        toast({
          title: 'Error',
          message: 'Could not update follow status.',
          type: 'error',
        });
      } finally {
        setIsFollowProcessing(false);
      }
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.summary,
          url,
        });
      } catch {
        // Fallback
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link Copied', message: 'Product URL copied to clipboard.', type: 'success' });
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied', message: 'Product URL copied to clipboard.', type: 'success' });
    }
  };

  const lowestPrice =
    product.packages && product.packages.length > 0
      ? Math.min(...product.packages.map((p) => p.priceAmount))
      : 0;

  const renderPlatformIcon = (platform: ProductPlatform) => {
    switch (platform) {
      case 'web':
        return (
          <span key={platform} title="Web" className="inline-flex">
            <Globe className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
          </span>
        );
      case 'android':
      case 'ios':
        return (
          <span key={platform} title={platform} className="inline-flex">
            <Smartphone className="w-3.5 h-3.5 text-[var(--mint-success)]" />
          </span>
        );
      case 'desktop':
        return (
          <span key={platform} title="Desktop" className="inline-flex">
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
          </span>
        );
    }
  };

  return (
    <>
      <article
        ref={cardRef}
        className="w-full max-w-[620px] mx-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-float)] transition-all duration-300 flex flex-col overflow-hidden text-[var(--text-primary)] relative"
      >
        {/* Feed Header: Seller Profile & Follow Action */}
        <div className="p-4 flex items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--bg-card-subtle)]/50">
          <div
            onClick={() => product.sellerUsername && navigate(`/u/${product.sellerUsername}`)}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <Avatar
              src={product.sellerAvatarUrl}
              alt={product.sellerBrandName || product.sellerUsername}
              name={product.sellerBrandName || product.sellerUsername}
              size="md"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-coral)] transition-colors truncate">
                {product.sellerBrandName || `@${product.sellerUsername}`}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                @{product.sellerUsername}
              </span>
            </div>
          </div>

          {!isOwner && (
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={
                following ? (
                  <UserCheck className="w-3.5 h-3.5 text-[var(--mint-success)]" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )
              }
              onClick={handleFollowToggle}
              isLoading={isFollowProcessing}
              className={`min-h-[44px] text-xs font-bold px-3.5 ${
                following ? 'border-[var(--mint-success)]/40 text-[var(--mint-success)]' : ''
              }`}
            >
              {following ? t('storefront.following') : t('storefront.follow')}
            </Button>
          )}
        </div>

        {/* Media Carousel with swipe & 16:9 reserved aspect ratio */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-video bg-neutral-900 overflow-hidden cursor-pointer group"
          onClick={() => navigate(`/p/${product.id}`)}
        >
          {allImages.length > 0 ? (
            <Image
              src={allImages[activeMediaIndex]}
              alt={`${product.title} Showcase`}
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-cover group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
              {product.title}
            </div>
          )}

          {/* Carousel Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-full bg-black/50 backdrop-blur-md">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      activeMediaIndex === i ? 'bg-white w-3' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Platform icons in bottom right */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-10 pointer-events-none">
            {product.platforms.map(renderPlatformIcon)}
          </div>
        </div>

        {/* Action Bar (Like, Save, Quick Preview, Open, Share) */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                liked
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                  : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10'
              }`}
              title={t('feed.likeBtn')}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likeCount}</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                saved
                  ? 'bg-[var(--mint-surface)] text-[var(--mint-success)] border border-[var(--mint-success)]/40'
                  : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--mint-success)]'
              }`}
              title={saved ? t('feed.savedBtn') : t('feed.saveBtn')}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-[var(--mint-success)] text-[var(--mint-success)]' : ''}`} />
              <span className="hidden sm:inline">{saved ? t('feed.savedBtn') : t('feed.saveBtn')}</span>
            </button>

            {/* Quick Live Preview Trigger */}
            {product.previewUrl && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-2xl bg-[var(--lilac-surface)] hover:bg-[var(--lilac-surface)]/80 text-[var(--lilac-accent)] border border-[var(--lilac-border)] text-xs font-bold transition-all cursor-pointer"
                title={t('feed.quickPreview')}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{t('feed.quickPreview')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 min-h-[44px] min-w-[44px] rounded-2xl hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate(`/p/${product.id}`)}
              className="p-2.5 min-h-[44px] min-w-[44px] rounded-2xl hover:bg-[var(--bg-card-subtle)] text-[var(--primary-coral)] transition-colors flex items-center justify-center cursor-pointer"
              title={t('feed.openProduct')}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Title, Summary, Tags & Price */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3
              onClick={() => navigate(`/p/${product.id}`)}
              className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] hover:text-[var(--primary-coral)] transition-colors cursor-pointer line-clamp-1"
            >
              {product.title}
            </h3>

            <div className="text-right shrink-0">
              <span className="font-black text-sm text-[var(--mint-success)]">
                {lowestPrice === 0 ? 'Free' : `$${lowestPrice}`}
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {product.summary}
          </p>

          {/* Tech Stack Chips */}
          {product.techStack && product.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.techStack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Quick Preview Modal */}
      {isPreviewOpen && product.previewUrl && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`${product.title} • Live Preview`}
          maxWidth="2xl"
        >
          <div className="pt-2">
            <DeviceFramePreview
              previewUrl={product.previewUrl}
              apkDownloadUrl={product.apk?.downloadUrl}
              productTitle={product.title}
              initialDevice="mobile"
            />
          </div>
        </Modal>
      )}

      {/* Require Login Upgrade Modal */}
      <SaveAccountModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        customReason={t('feed.guestActionNotice')}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
