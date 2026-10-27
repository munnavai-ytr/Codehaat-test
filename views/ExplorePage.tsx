'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  X,
  Plus,
  Compass,
  Layers,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import {
  PRODUCT_CATEGORIES,
  PLATFORM_OPTIONS,
  LICENSE_OPTIONS,
  TECH_STACK_SUGGESTIONS,
} from '@/config/products';
import { getPublishedProducts, type ExploreFilters } from '@/lib/product-service';
import { brandConfig } from '@/src/config/brand';
import type { ProductItem } from '@/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export function ExplorePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isBn = i18n.language?.startsWith('bn');

  // Read URL filter parameters
  const currentQuery = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || 'all';
  const currentPlatform = searchParams.get('platform') || 'all';
  const currentTech = searchParams.get('tech') || 'all';
  const currentLicense = searchParams.get('license') || 'all';

  const [queryInput, setQueryInput] = useState(currentQuery);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Sync title
  useEffect(() => {
    document.title = `${t('explore.title')} | ${brandConfig.name}`;
  }, [t]);

  // Sync local query input if URL changes
  useEffect(() => {
    setQueryInput(currentQuery);
  }, [currentQuery]);

  const hasActiveFilters =
    Boolean(currentQuery) ||
    currentCategory !== 'all' ||
    currentPlatform !== 'all' ||
    currentTech !== 'all' ||
    currentLicense !== 'all';

  // Fetch initial batch
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const filters: ExploreFilters = {
      searchQuery: currentQuery,
      category: currentCategory,
      platform: currentPlatform,
      techStack: currentTech,
      licenseType: currentLicense,
    };

    const res = await getPublishedProducts(filters, 12, null);
    setProducts(res.products);
    setLastDoc(res.lastVisibleDoc);
    setHasMore(res.hasMore);
    setIsLoading(false);

    // If no filters are active, track total catalog baseline count
    if (!hasActiveFilters) {
      setTotalCatalogCount(res.products.length);
    }
  }, [currentQuery, currentCategory, currentPlatform, currentTech, currentLicense, hasActiveFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load more pagination
  const handleLoadMore = async () => {
    if (!lastDoc || isLoadingMore) return;
    setIsLoadingMore(true);

    const filters: ExploreFilters = {
      searchQuery: currentQuery,
      category: currentCategory,
      platform: currentPlatform,
      techStack: currentTech,
      licenseType: currentLicense,
    };

    const res = await getPublishedProducts(filters, 12, lastDoc);
    setProducts((prev) => [...prev, ...res.products]);
    setLastDoc(res.lastVisibleDoc);
    setHasMore(res.hasMore);
    setIsLoadingMore(false);
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', queryInput.trim());
  };

  const handleClearAll = () => {
    setQueryInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('explore.title')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            {t('explore.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/dashboard')}
          className="self-start sm:self-auto min-h-[44px]"
        >
          {t('dashboard.newProductBtn')}
        </Button>
      </div>

      {/* Search Bar & Filter Controls */}
      <Card padding="md" className="flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={t('explore.searchPlaceholder')}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
          <Button variant="secondary" type="submit" className="min-h-[44px] shrink-0">
            Search
          </Button>
        </form>

        {/* Primary Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => updateParam('category', 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer min-h-[44px] flex items-center ${
              currentCategory === 'all'
                ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)]'
            }`}
          >
            {t('explore.allCategories')}
          </button>

          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam('category', cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer min-h-[44px] flex items-center ${
                  isSelected
                    ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)]'
                }`}
              >
                {isBn ? cat.labelBn : cat.labelEn}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Dropdowns (Platform, Tech Stack, License) */}
        <div className="pt-3 border-t border-[var(--border-default)] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label={t('explore.filterPlatform')}
            value={currentPlatform}
            onChange={(e) => updateParam('platform', e.target.value)}
            options={[
              { value: 'all', label: t('explore.allPlatforms') },
              ...PLATFORM_OPTIONS.map((p) => ({ value: p.id, label: isBn ? p.labelBn : p.labelEn })),
            ]}
          />

          <Select
            label={t('explore.filterTech')}
            value={currentTech}
            onChange={(e) => updateParam('tech', e.target.value)}
            options={[
              { value: 'all', label: 'All Technologies' },
              ...TECH_STACK_SUGGESTIONS.map((t) => ({ value: t, label: t })),
            ]}
          />

          <Select
            label={t('explore.filterLicense')}
            value={currentLicense}
            onChange={(e) => updateParam('license', e.target.value)}
            options={[
              { value: 'all', label: t('explore.allLicenses') },
              ...LICENSE_OPTIONS.map((l) => ({ value: l.id, label: isBn ? l.labelBn : l.labelEn })),
            ]}
          />
        </div>

        {/* Active Filter Chips & Clear All */}
        {hasActiveFilters && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-muted)] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              {t('explore.activeFilters')}:
            </span>

            {currentQuery && (
              <Badge variant="coral" size="sm" className="flex items-center gap-1">
                <span>&quot;{currentQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => updateParam('q', '')}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {currentCategory !== 'all' && (
              <Badge variant="lilac" size="sm" className="flex items-center gap-1">
                <span>{PRODUCT_CATEGORIES.find((c) => c.id === currentCategory)?.labelEn || currentCategory}</span>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'all')}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {currentPlatform !== 'all' && (
              <Badge variant="mint" size="sm" className="flex items-center gap-1">
                <span>{(() => {
                  const opt = PLATFORM_OPTIONS.find((p) => p.id === currentPlatform);
                  return opt ? (isBn ? opt.labelBn : opt.labelEn) : currentPlatform;
                })()}</span>
                <button
                  type="button"
                  onClick={() => updateParam('platform', 'all')}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove platform filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {currentTech !== 'all' && (
              <Badge variant="neutral" size="sm" className="flex items-center gap-1">
                <span>{currentTech}</span>
                <button
                  type="button"
                  onClick={() => updateParam('tech', 'all')}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove tech filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {currentLicense !== 'all' && (
              <Badge variant="outline" size="sm" className="flex items-center gap-1">
                <span>{(() => {
                  const opt = LICENSE_OPTIONS.find((l) => l.id === currentLicense);
                  return opt ? (isBn ? opt.labelBn : opt.labelEn) : currentLicense;
                })()}</span>
                <button
                  type="button"
                  onClick={() => updateParam('license', 'all')}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Remove license filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleClearAll}
              className="text-xs text-[var(--primary-coral)] hover:bg-[var(--coral-surface)]"
            >
              {t('explore.clearAll')}
            </Button>
          </div>
        )}
      </Card>

      {/* Grid of Published Products */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
          <span>
            {isLoading
              ? t('explore.loadingProducts')
              : `${products.length} product(s) available`}
          </span>
          <span className="font-semibold text-[var(--mint-success)]">
            ● Real Database Listings
          </span>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
                <Skeleton className="w-full aspect-video rounded-2xl" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
                <div className="flex justify-between items-center pt-3 border-t border-[var(--border-default)]">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Responsive Grid: 1 col on phones, 2 on small tablets, 3 on laptops, 4 on wide screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
                  className="min-h-[44px] px-8 font-bold"
                >
                  {t('explore.loadMore')}
                </Button>
              </div>
            )}
          </>
        ) : hasActiveFilters ? (
          /* Empty State 1: Active filters yielded no results */
          <Card padding="lg" className="border-dashed">
            <EmptyState
              icon={<Search className="w-8 h-8 text-[var(--primary-coral)]" />}
              badge="0 Results"
              title={t('explore.emptySearchTitle')}
              description={t('explore.emptySearchDesc')}
              actionLabel={t('explore.clearAll')}
              onAction={handleClearAll}
            />
          </Card>
        ) : (
          /* Empty State 2: No published products on platform yet */
          <Card padding="lg" className="border-dashed">
            <EmptyState
              icon={<Compass className="w-8 h-8 text-[var(--lilac-accent)]" />}
              badge="Catalog Open"
              title={t('explore.emptyCatalogTitle')}
              description={t('explore.emptyCatalogDesc')}
              actionLabel={t('dashboard.newProductBtn')}
              onAction={() => navigate('/dashboard')}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
