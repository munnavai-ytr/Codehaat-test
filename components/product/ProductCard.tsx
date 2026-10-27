'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Copy,
  Trash2,
  EyeOff,
  Send,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PRODUCT_CATEGORIES } from '@/config/products';
import type { ProductItem, ProductPlatform } from '@/types';

interface ProductCardProps {
  product: ProductItem;
  isOwner?: boolean;
  onEdit?: (product: ProductItem) => void;
  onDuplicate?: (product: ProductItem) => void;
  onUnpublish?: (product: ProductItem) => void;
  onDelete?: (product: ProductItem) => void;
  onSubmitForReview?: (product: ProductItem) => void;
}

export function ProductCard({
  product,
  isOwner,
  onEdit,
  onDuplicate,
  onUnpublish,
  onDelete,
  onSubmitForReview,
}: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language?.startsWith('bn');

  const categoryObj = PRODUCT_CATEGORIES.find((c) => c.id === product.category);
  const categoryLabel = categoryObj ? (isBn ? categoryObj.labelBn : categoryObj.labelEn) : product.category;

  const lowestPrice =
    product.packages && product.packages.length > 0
      ? Math.min(...product.packages.map((p) => p.priceAmount))
      : 0;

  const statusVariant = {
    draft: 'neutral',
    pending: 'coral',
    published: 'mint',
    rejected: 'outline',
    unpublished: 'neutral',
  }[product.status] as 'neutral' | 'coral' | 'mint' | 'outline';

  const renderPlatformIcon = (platform: ProductPlatform) => {
    switch (platform) {
      case 'web':
        return (
          <span key={platform} title="Web">
            <Globe className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
          </span>
        );
      case 'android':
      case 'ios':
        return (
          <span key={platform} title={platform}>
            <Smartphone className="w-3.5 h-3.5 text-[var(--mint-success)]" />
          </span>
        );
      case 'desktop':
        return (
          <span key={platform} title="Desktop">
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
          </span>
        );
    }
  };

  return (
    <div className="group rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--border-glass-hover)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-float)] transition-all duration-300 flex flex-col overflow-hidden text-[var(--text-primary)] relative">
      {/* Media Header */}
      <div className="relative w-full h-48 bg-gradient-to-br from-[var(--brand-indigo)] to-[#0D0B1A] overflow-hidden">
        {product.coverImage ? (
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            unoptimized
            referrerPolicy="no-referrer"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[var(--text-muted)] p-4 text-center">
            {product.title || 'Untitled Software'}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
          <Badge variant="glass" size="sm" className="backdrop-blur-md">
            {categoryLabel}
          </Badge>

          {isOwner && (
            <Badge variant={statusVariant} size="sm" className="font-bold">
              {t(`status.${product.status}`)}
            </Badge>
          )}
        </div>

        {/* Platform Icons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-10">
          {product.platforms.map(renderPlatformIcon)}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--primary-coral)] transition-colors">
              {product.title || 'Untitled Draft'}
            </h4>
          </div>

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {product.summary || 'No summary provided.'}
          </p>

          {/* Tech Stack Chips */}
          {product.techStack && product.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.techStack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[var(--lilac-surface)] text-[var(--lilac-accent)] border border-[var(--lilac-border)]"
                >
                  {tech}
                </span>
              ))}
              {product.techStack.length > 4 && (
                <span className="text-[10px] text-[var(--text-muted)] self-center font-medium">
                  +{product.techStack.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rejection Reason Notice */}
        {isOwner && product.status === 'rejected' && product.rejectionReason && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold">{t('product.rejectionReasonTitle')}:</p>
              <p className="mt-0.5 leading-relaxed">{product.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Footer Info & Pricing */}
        <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              src={product.sellerAvatarUrl}
              alt={product.sellerBrandName || product.sellerUsername}
              name={product.sellerBrandName || product.sellerUsername}
              size="xs"
            />
            <span className="font-semibold text-[var(--text-secondary)] truncate text-[11px]">
              {product.sellerBrandName || `@${product.sellerUsername}`}
            </span>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-[var(--text-muted)] block">Informational</span>
            <span className="font-black text-sm text-[var(--mint-success)]">
              {lowestPrice === 0 ? 'Free' : `$${lowestPrice}`}
            </span>
          </div>
        </div>

        {/* Owner Actions Toolbar */}
        {isOwner && (
          <div className="pt-3 border-t border-[var(--border-default)] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => onEdit(product)}
                >
                  {t('dashboard.editBtn')}
                </Button>
              )}

              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => onDuplicate(product)}
                  title={t('dashboard.duplicateBtn')}
                />
              )}

              {onUnpublish && product.status === 'published' && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<EyeOff className="w-3.5 h-3.5 text-amber-500" />}
                  onClick={() => onUnpublish(product)}
                >
                  {t('dashboard.unpublishBtn')}
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={() => onDelete(product)}
                  title={t('dashboard.deleteBtn')}
                />
              )}
            </div>

            {(product.status === 'draft' || product.status === 'rejected' || product.status === 'unpublished') &&
              onSubmitForReview && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => onSubmitForReview(product)}
                >
                  Submit
                </Button>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
