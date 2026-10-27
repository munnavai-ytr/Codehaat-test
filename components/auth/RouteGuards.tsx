'use client';

import React from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, Store, LogIn, Lock } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { brandConfig } from '@/src/config/brand';

interface GuardProps {
  children: React.ReactNode;
}

export function RequireUser({ children }: GuardProps) {
  const { status, isLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" color="text-[var(--primary-coral)]" />
      </div>
    );
  }

  if (status !== 'user') {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card padding="lg">
          <EmptyState
            icon={<LogIn className="w-8 h-8 text-[var(--primary-coral)]" />}
            badge="Authentication Required"
            title="Sign in to Continue"
            description={`This feature requires a permanent ${brandConfig.name} account. Guests can browse and test software, but must sign in or save their account to proceed.`}
            actionLabel="Sign In / Save Account"
            onAction={() =>
              navigate(`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`)
            }
            secondaryActionLabel="Explore Software"
            onSecondaryAction={() => navigate('/explore')}
          />
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireSeller({ children }: GuardProps) {
  const { isSeller, isLoading, status } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" color="text-[var(--primary-coral)]" />
      </div>
    );
  }

  if (status !== 'user') {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isSeller) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card padding="lg">
          <EmptyState
            icon={<Store className="w-8 h-8 text-[var(--primary-coral)]" />}
            badge="Seller Privileges Required"
            title="Activate Your Seller Storefront"
            description="You need a registered seller profile to access the seller dashboard, publish software, and configure AI sales agents."
            actionLabel="Become a Seller"
            onAction={() => navigate('/settings?tab=seller')}
            secondaryActionLabel="Return Home"
            onSecondaryAction={() => navigate('/')}
          />
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: GuardProps) {
  const { isAdmin, isLoading } = useSession();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" color="text-[var(--primary-coral)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card padding="lg">
          <EmptyState
            icon={<Lock className="w-8 h-8 text-rose-500" />}
            badge="Admin Restricted"
            title="Access Restricted"
            description="This console is strictly restricted to platform administrators. To grant admin rights to your account, refer to /docs/ADMIN_SETUP.md."
            actionLabel="Back to Safety"
            onAction={() => navigate('/')}
          />
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
