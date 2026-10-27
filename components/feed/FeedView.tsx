'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Users,
  Compass,
  RotateCcw,
  LogIn,
  AlertCircle,
  Package,
} from 'lucide-react';
import { FeedCard } from './FeedCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSession } from '@/hooks/use-session';
import { getPublishedProducts, getFollowingProducts } from '@/lib/product-service';
import { getFollowingSellerIds } from '@/lib/social-service';
import type { ProductItem } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export type FeedTab = 'latest' | 'following';

interface FeedViewProps {
  initialTab?: FeedTab;
}

export function FeedView({ initialTab = 'latest' }: FeedViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest, isAuthenticated } = useSession();

  const isPermanentUser = isAuthenticated && !isGuest;

  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Following list
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);
  const [hasLoadedFollows, setHasLoadedFollows] = useState(false);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load user's followed sellers
  const loadFollowedSellers = useCallback(async () => {
    if (!user || !isPermanentUser) {
      setFollowedSellerIds([]);
      setHasLoadedFollows(true);
      return;
    }
    try {
      const ids = await getFollowingSellerIds(user.uid);
      setFollowedSellerIds(ids);
    } catch (err) {
      console.warn('loadFollowedSellers err:', err);
    } finally {
      setHasLoadedFollows(true);
    }
  }, [user, isPermanentUser]);

  useEffect(() => {
    loadFollowedSellers();
  }, [loadFollowedSellers]);

  // Fetch feed items
  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'latest') {
        const res = await getPublishedProducts({}, 10, null);
        setProducts(res.products);
        setLastDoc(res.lastVisibleDoc);
        setHasMore(res.hasMore);
      } else {
        // Following tab
        if (!isPermanentUser) {
          setProducts([]);
          setIsLoading(false);
          return;
        }

        const ids = await getFollowingSellerIds(user!.uid);
        setFollowedSellerIds(ids);

        if (ids.length === 0) {
          setProducts([]);
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const res = await getFollowingProducts(ids, 10, null);
        setProducts(res.products);
        setLastDoc(res.lastVisibleDoc);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      console.error('fetchFeed error:', err);
      setError('Could not load feed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, isPermanentUser, user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Load more pagination
  const handleLoadMore = useCallback(async () => {
    if (!lastDoc || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      if (activeTab === 'latest') {
        const res = await getPublishedProducts({}, 10, lastDoc);
        setProducts((prev) => [...prev, ...res.products]);
        setLastDoc(res.lastVisibleDoc);
        setHasMore(res.hasMore);
      } else {
        if (!user || followedSellerIds.length === 0) return;
        const res = await getFollowingProducts(followedSellerIds, 10, lastDoc);
        setProducts((prev) => [...prev, ...res.products]);
        setLastDoc(res.lastVisibleDoc);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      console.error('handleLoadMore error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTab, followedSellerIds, hasMore, isLoadingMore, lastDoc, user]);

  // Sentinel intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = sentinelRef.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [handleLoadMore, hasMore, isLoading, isLoadingMore]);

  // Handle follow toggle callback
  const handleFollowToggled = (sellerId: string, isNowFollowing: boolean) => {
    if (isNowFollowing) {
      setFollowedSellerIds((prev) => (prev.includes(sellerId) ? prev : [...prev, sellerId]));
    } else {
      setFollowedSellerIds((prev) => prev.filter((id) => id !== sellerId));
      if (activeTab === 'following') {
        setProducts((prev) => prev.filter((p) => p.sellerId !== sellerId));
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Feed Tabs: Latest & Following */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('latest')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'latest'
                ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('feed.tabLatest')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'following'
                ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('feed.tabFollowing')}</span>
          </button>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="w-full flex flex-col gap-6">
        {/* Error State with Retry */}
        {error ? (
          <div className="max-w-[620px] mx-auto w-full p-6 rounded-3xl bg-[var(--bg-card)] border border-rose-500/30 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={fetchFeed}
            >
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          /* Skeletons */
          <div className="w-full max-w-[620px] mx-auto flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-4 flex flex-col gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="w-32 h-4 rounded-md" />
                    <Skeleton className="w-20 h-3 rounded-md" />
                  </div>
                  <Skeleton className="w-20 h-8 rounded-xl" />
                </div>
                <Skeleton className="w-full aspect-video rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="w-3/4 h-5 rounded-md" />
                  <Skeleton className="w-full h-3.5 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'following' && !isPermanentUser ? (
          /* Guest prompt on Following tab */
          <div className="max-w-[620px] mx-auto w-full">
            <Card padding="lg" className="border-dashed">
              <EmptyState
                icon={<Users className="w-8 h-8 text-[var(--lilac-accent)]" />}
                badge="Personalized Stream"
                title={t('feed.loginPromptTitle')}
                description={t('feed.loginPromptDesc')}
                actionLabel={t('feed.signInBtn')}
                onAction={() => navigate('/login')}
                secondaryActionLabel={t('feed.exploreBtn')}
                onSecondaryAction={() => navigate('/explore')}
              />
            </Card>
          </div>
        ) : activeTab === 'following' && followedSellerIds.length === 0 ? (
          /* Empty Following state */
          <div className="max-w-[620px] mx-auto w-full">
            <Card padding="lg" className="border-dashed">
              <EmptyState
                icon={<Users className="w-8 h-8 text-[var(--mint-success)]" />}
                badge="0 Creators Followed"
                title={t('feed.emptyFollowingTitle')}
                description={t('feed.emptyFollowingDesc')}
                actionLabel={t('feed.exploreBtn')}
                onAction={() => navigate('/explore')}
              />
            </Card>
          </div>
        ) : products.length === 0 ? (
          /* Empty Latest Feed state */
          <div className="max-w-[620px] mx-auto w-full">
            <Card padding="lg" className="border-dashed">
              <EmptyState
                icon={<Package className="w-8 h-8 text-[var(--primary-coral)]" />}
                badge="Feed Ready"
                title={t('feed.emptyLatestTitle')}
                description={t('feed.emptyLatestDesc')}
                actionLabel={t('dashboard.newProductBtn')}
                onAction={() => navigate('/dashboard')}
                secondaryActionLabel={t('feed.exploreBtn')}
                onSecondaryAction={() => navigate('/explore')}
              />
            </Card>
          </div>
        ) : (
          /* Real Feed List */
          <div className="w-full flex flex-col gap-6">
            {products.map((product) => (
              <FeedCard
                key={product.id}
                product={product}
                onFollowToggled={handleFollowToggled}
              />
            ))}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4 w-full" />

            {/* Fallback Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-2 pb-6">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
                  className="min-h-[44px] px-6 font-bold"
                >
                  {t('feed.loadMore')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
