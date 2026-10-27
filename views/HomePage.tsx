'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  PlusCircle,
  Eye,
  MessageSquare,
  ShieldCheck,
  Code2,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import { PRODUCT_CATEGORIES } from '@/config/products';
import { getLatestPublishedProducts } from '@/lib/product-service';
import { brandConfig } from '@/src/config/brand';
import type { ProductItem } from '@/types';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isBn = i18n.language?.startsWith('bn');

  const [latestProducts, setLatestProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLatest() {
      const items = await getLatestPublishedProducts(8);
      if (isMounted) {
        setLatestProducts(items);
        setIsLoading(false);
      }
    }
    loadLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-10 md:gap-14 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[var(--lilac-surface)]/60 via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-10 md:p-12 shadow-[var(--shadow-soft)]">
        <div className="max-w-3xl flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="coral" size="md">
              <Zap className="w-3.5 h-3.5 mr-1" />
              100% Free Software Marketplace
            </Badge>
            <Badge variant="mint" size="md">
              <span className="deal-pulse w-2 h-2 rounded-full bg-[var(--mint-success)] mr-1.5" />
              Instant Interactive Previews
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)] leading-[1.12]">
            {isBn ? (
              <>
                প্রিভিউ দেখুন। কথা বলুন।{' '}
                <span className="bg-gradient-to-r from-[var(--primary-coral)] to-[var(--lilac-accent)] bg-clip-text text-transparent">
                  ডিল করুন।
                </span>
              </>
            ) : (
              <>
                Preview. Talk.{' '}
                <span className="bg-gradient-to-r from-[var(--primary-coral)] to-[var(--lilac-accent)] bg-clip-text text-transparent">
                  Deal.
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            {brandConfig.description} Test live running code, inspect architecture, and deal directly with software developers.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Compass className="w-5 h-5" />}
              onClick={() => navigate('/explore')}
              className="min-h-[48px] px-6 font-bold"
            >
              {t('explore.title')}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              leftIcon={<PlusCircle className="w-5 h-5 text-[var(--primary-coral)]" />}
              onClick={() => navigate('/dashboard')}
              className="min-h-[48px] px-6 font-bold"
            >
              {t('dashboard.newProductBtn')}
            </Button>
          </div>
        </div>

        {/* Core Platform Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 pt-8 border-t border-[var(--border-default)]/70">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--lilac-surface)] text-[var(--lilac-accent)] flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Live Interactive Previews</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Test real running apps in standard responsive viewports.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--mint-surface)] text-[var(--mint-success)] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Direct Deal-Making</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Direct communication between software buyers and creators.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--coral-surface)] text-[var(--primary-coral)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Zero Platform Fees</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">100% free discovery platform. Transactions are settled outside.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {t('explore.categoryShortcutsTitle')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/explore')}
          >
            {t('explore.allCategories')}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/explore?category=${cat.id}`)}
              className="p-4 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] hover:border-[var(--lilac-border)] transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer shadow-xs min-h-[90px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-subtle)] group-hover:bg-[var(--primary-coral)] text-[var(--text-secondary)] group-hover:text-white transition-colors flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">
                {isBn ? cat.labelBn : cat.labelEn}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Latest Products Section (Hidden when there are no published products) */}
      {!isLoading && latestProducts.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {t('explore.latestProductsTitle')}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Recently published software projects ready for live preview and direct deals.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/explore')}
            >
              View Catalog
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
