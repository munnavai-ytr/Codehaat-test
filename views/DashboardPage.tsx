'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  EyeOff,
  Sparkles,
  Package,
  RefreshCw,
} from 'lucide-react';
import {
  getSellerProducts,
  duplicateProduct,
  unpublishProduct,
  deleteProduct,
  submitProductForReview,
} from '@/lib/product-service';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductWizardModal } from '@/components/product/ProductWizardModal';
import { brandConfig } from '@/src/config/brand';
import type { ProductItem, ProductStatus } from '@/types';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isGuest, isAuthenticated, isSeller } = useSession();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const refreshProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await getSellerProducts(user.uid);
    setProducts(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let active = true;
    if (user) {
      getSellerProducts(user.uid).then((list) => {
        if (active) {
          setProducts(list);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Counts by status
  const counts = {
    all: products.length,
    draft: products.filter((p) => p.status === 'draft').length,
    pending: products.filter((p) => p.status === 'pending').length,
    published: products.filter((p) => p.status === 'published').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
    unpublished: products.filter((p) => p.status === 'unpublished').length,
  };

  const filteredProducts =
    statusFilter === 'all'
      ? products
      : products.filter((p) => p.status === statusFilter);

  const handleEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setWizardOpen(true);
  };

  const handleDuplicate = async (p: ProductItem) => {
    if (!user) return;
    try {
      await duplicateProduct(p.id, user);
      toast({ title: 'Duplicated', message: `Created draft copy of "${p.title}"`, type: 'success' });
      await refreshProducts();
    } catch (err) {
      toast({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to duplicate', type: 'error' });
    }
  };

  const handleUnpublish = async (p: ProductItem) => {
    try {
      await unpublishProduct(p.id);
      toast({ title: 'Unpublished', message: `"${p.title}" is now unpublished.`, type: 'info' });
      await refreshProducts();
    } catch (err) {
      toast({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to unpublish', type: 'error' });
    }
  };

  const handleDelete = async (p: ProductItem) => {
    if (confirm(t('dashboard.deleteConfirm'))) {
      try {
        await deleteProduct(p.id);
        toast({ title: 'Deleted', message: `Listing "${p.title}" deleted permanently.`, type: 'success' });
        await refreshProducts();
      } catch (err) {
        toast({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to delete listing', type: 'error' });
      }
    }
  };

  const handleSubmitForReview = async (p: ProductItem) => {
    if (!user) return;
    try {
      await submitProductForReview(p.id, user);
      toast({ title: 'Submitted for Review', message: `"${p.title}" is now pending admin approval.`, type: 'success' });
      await refreshProducts();
    } catch (err) {
      toast({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to submit', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => {
            setEditingProduct(null);
            setWizardOpen(true);
          }}
        >
          {t('dashboard.newProductBtn')}
        </Button>
      </div>

      {/* V1 Scope Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-3">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <div className="leading-relaxed">
          <span className="font-bold">CodeHaat V1 Notice:</span> {t('scope.noPaymentsNote')} {t('scope.noArchiveNote')}
        </div>
      </div>

      {/* Real Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
            statusFilter === 'all'
              ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
              : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Total</span>
          <span className="text-xl font-extrabold mt-1 block">{counts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('draft')}
          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
            statusFilter === 'draft'
              ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
              : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Drafts</span>
          <span className="text-xl font-extrabold mt-1 block">{counts.draft}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
            statusFilter === 'pending'
              ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
              : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Pending</span>
          <span className="text-xl font-extrabold mt-1 block">{counts.pending}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('published')}
          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
            statusFilter === 'published'
              ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
              : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Published</span>
          <span className="text-xl font-extrabold mt-1 block">{counts.published}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
            statusFilter === 'rejected'
              ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
              : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Rejected</span>
          <span className="text-xl font-extrabold mt-1 block">{counts.rejected}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('unpublished')}
          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
            statusFilter === 'unpublished'
              ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
              : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Unpublished</span>
          <span className="text-xl font-extrabold mt-1 block">{counts.unpublished}</span>
        </button>
      </div>

      {/* Main List Container */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="lg" color="text-[var(--primary-coral)]" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card padding="lg" className="border-dashed">
          <EmptyState
            icon={<Package className="w-8 h-8 text-[var(--primary-coral)]" />}
            badge="Real Firestore Listings"
            title={statusFilter === 'all' ? t('dashboard.noProductsTitle') : `No ${statusFilter} software listings`}
            description={t('dashboard.noProductsDesc')}
            actionLabel={t('dashboard.newProductBtn')}
            onAction={() => {
              setEditingProduct(null);
              setWizardOpen(true);
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              isOwner
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
              onSubmitForReview={handleSubmitForReview}
            />
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      <ProductWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialProduct={editingProduct}
        onSuccess={refreshProducts}
      />
    </div>
  );
}
