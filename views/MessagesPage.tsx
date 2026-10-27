'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useSession } from '@/hooks/use-session';
import { brandConfig } from '@/src/config/brand';

export function MessagesPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useSession();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {brandConfig.name} Messenger
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real-time direct chat between buyers (guests or users) and software creators.
          </p>
        </div>

        <Badge variant="mint" size="md">
          <span className="deal-pulse w-2 h-2 rounded-full bg-[var(--mint-success)] mr-1.5" />
          Direct Channel Ready
        </Badge>
      </div>

      <Card padding="lg">
        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-[var(--primary-coral)]" />}
          badge="Direct Messaging"
          title="No Active Conversations Yet"
          description="Initiate chat from any software product detail page or Deal Room to talk directly with the developer."
          actionLabel="Browse Software Marketplace"
          onAction={() => navigate('/explore')}
        />
      </Card>
    </div>
  );
}
