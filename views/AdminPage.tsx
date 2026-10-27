'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertTriangle, UserX, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useSession } from '@/hooks/use-session';

export function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useSession();

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Admin & Moderation Console
            </h1>
            <Badge variant="coral" size="sm">
              Restricted
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Product approvals, community reports, malware scans, and user moderation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/admin/review')}
          >
            Pending Review Queue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            Return Home
          </Button>
        </div>
      </div>

      {/* Admin Verification status */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--mint-surface)] text-[var(--mint-success)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">Admin Security Clearance</p>
            <p className="text-xs text-[var(--text-muted)]">
              Authenticated Operator: {user?.displayName || user?.email || user?.uid || 'Admin Operator'}
            </p>
          </div>
        </div>
        <Badge variant={isAdmin ? 'mint' : 'neutral'} size="sm">
          {isAdmin ? 'Admin Operator' : 'Guest Operator'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          padding="md"
          className="cursor-pointer hover:border-[var(--primary-coral)] transition-colors"
          onClick={() => navigate('/admin/review')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--mint-success)]" />
              <span>Pending Approvals</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm font-bold text-[var(--primary-coral)] mt-2">Open Review Queue →</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Reported Items</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">0</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <UserX className="w-4 h-4 text-[var(--primary-coral)]" />
            <span>Active Bans</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">0</p>
        </Card>
      </div>

      <Card padding="lg">
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-[var(--mint-success)]" />}
          badge="Product Approvals Live"
          title="Review Pending Submissions"
          description="Sellers submit software products to the pending approval queue. Inspect previews, media, and approve or reject with detailed seller feedback."
          actionLabel="Open Pending Approvals Queue"
          onAction={() => navigate('/admin/review')}
        />
      </Card>
    </div>
  );
}
