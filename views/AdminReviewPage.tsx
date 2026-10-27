'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  Package,
  AlertCircle,
  Layers,
} from 'lucide-react';
import {
  getPendingProductsForAdmin,
  adminApproveProduct,
  adminRejectProduct,
} from '@/lib/product-service';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import type { ProductItem } from '@/types';

export function AdminReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useSession();

  const [pendingProducts, setPendingProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingProduct, setRejectingProduct] = useState<ProductItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshPending = useCallback(async () => {
    setLoading(true);
    const list = await getPendingProductsForAdmin();
    setPendingProducts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    getPendingProductsForAdmin().then((list) => {
      if (active) {
        setPendingProducts(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleApprove = async (p: ProductItem) => {
    try {
      await adminApproveProduct(p.id);
      toast({
        title: 'Product Published!',
        message: `"${p.title}" is now published and live in the public marketplace.`,
        type: 'success',
      });
      await refreshPending();
    } catch (err) {
      toast({
        title: 'Approval Error',
        message: err instanceof Error ? err.message : 'Failed to approve product.',
        type: 'error',
      });
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProduct) return;

    if (!rejectReason.trim()) {
      toast({ title: 'Error', message: t('adminReview.rejectReasonRequired'), type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminRejectProduct(rejectingProduct.id, rejectReason.trim());
      toast({
        title: 'Submission Rejected',
        message: `"${rejectingProduct.title}" was rejected and feedback was delivered to the seller.`,
        type: 'info',
      });
      setRejectingProduct(null);
      setRejectReason('');
      await refreshPending();
    } catch (err) {
      toast({
        title: 'Rejection Error',
        message: err instanceof Error ? err.message : 'Failed to reject product.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 pb-16 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {t('adminReview.title')}
            </h1>
            <Badge variant="coral" size="sm">
              Admin Only
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t('adminReview.subtitle')}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/admin')}
        >
          Return to Admin Console
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="lg" color="text-[var(--primary-coral)]" />
        </div>
      ) : pendingProducts.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-[var(--mint-success)]" />}
            badge="Queue Clear"
            title={t('adminReview.noPendingTitle')}
            description={t('adminReview.noPendingDesc')}
            actionLabel="Return to Admin Console"
            onAction={() => navigate('/admin')}
            secondaryActionLabel="Explore Marketplace"
            onSecondaryAction={() => navigate('/explore')}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{pendingProducts.length} product(s) pending review</span>
            <span>Ordered newest first</span>
          </div>

          {pendingProducts.map((product) => (
            <Card key={product.id} padding="lg" className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Preview Card */}
                <div className="w-full md:w-80 shrink-0">
                  <ProductCard product={product} />
                </div>

                {/* Right Details Breakdown */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="coral" size="md">
                      Pending Approval
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      ID: {product.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{product.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      Seller: @{product.sellerUsername} ({product.sellerBrandName || 'No Brand'})
                    </p>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {product.summary}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-xs space-y-2">
                    <p className="font-bold text-[var(--text-primary)]">Full Description:</p>
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                      {product.description}
                    </p>
                  </div>

                  {product.previewUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[var(--text-primary)]">Live Preview URL:</span>
                      <a
                        href={product.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary-coral)] hover:underline font-mono truncate"
                      >
                        {product.previewUrl}
                      </a>
                    </div>
                  )}

                  {product.apk && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
                      <div>
                        <p className="font-bold">Android APK Attached ({product.apk.versionName})</p>
                        <p className="text-[10px] opacity-80">{(product.apk.sizeBytes / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <a
                        href={product.apk.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px]"
                      >
                        Inspect APK
                      </a>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-[var(--border-default)] flex items-center gap-3">
                    <Button
                      variant="mint"
                      size="md"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => handleApprove(product)}
                    >
                      {t('adminReview.approveBtn')}
                    </Button>

                    <Button
                      variant="danger"
                      size="md"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => {
                        setRejectingProduct(product);
                        setRejectReason('');
                      }}
                    >
                      {t('adminReview.rejectBtn')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectingProduct)}
        onClose={() => setRejectingProduct(null)}
        title={t('adminReview.rejectModalTitle')}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmReject} className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Rejecting <strong>&quot;{rejectingProduct?.title}&quot;</strong>. Please provide a clear explanation for the seller.
          </p>

          <Textarea
            label={t('adminReview.rejectReasonLabel')}
            placeholder={t('adminReview.rejectReasonPlaceholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            required
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setRejectingProduct(null)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
