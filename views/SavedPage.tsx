'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bookmark, ArrowLeft, Trash2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { getUserSavedProducts, unsaveProduct } from '@/lib/social-service';
import { brandConfig } from '@/src/config/brand';
import type { ProductItem } from '@/types';

export function SavedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSession();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('saved.title')} | ${brandConfig.name}`;
  }, [t]);

  const fetchSaved = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const items = await getUserSavedProducts(user.uid);
      setProducts(items);
    } catch (err) {
      console.warn('fetchSaved error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleUnsave = async (productId: string) => {
    if (!user) return;
    try {
      await unsaveProduct(user.uid, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast({
        title: 'Removed',
        message: 'Project removed from your saved items.',
        type: 'info',
      });
    } catch {
      toast({
        title: 'Error',
        message: 'Could not remove product from saved items.',
        type: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(-1)}
              className="p-1 h-auto"
            >
              Back
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-[var(--mint-success)]" />
            <span>{t('saved.title')}</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t('saved.subtitle')}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Compass className="w-4 h-4" />}
          onClick={() => navigate('/explore')}
          className="self-start sm:self-auto min-h-[44px]"
        >
          {t('saved.exploreBtn')}
        </Button>
      </div>

      {/* Grid of Saved Products */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-4"
            >
              <Skeleton className="w-full aspect-video rounded-2xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <div key={product.id} className="relative group/saved flex flex-col">
              <ProductCard product={product} />
              {/* Unsave action button overlay */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={() => handleUnsave(product.id)}
                  className="text-xs text-rose-500 hover:bg-rose-500/10 min-h-[40px]"
                >
                  {t('saved.unsave')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="border-dashed">
          <EmptyState
            icon={<Bookmark className="w-8 h-8 text-[var(--mint-success)]" />}
            badge="0 Bookmarked"
            title={t('saved.emptyTitle')}
            description={t('saved.emptyDesc')}
            actionLabel={t('saved.exploreBtn')}
            onAction={() => navigate('/explore')}
          />
        </Card>
      )}
    </div>
  );
}
