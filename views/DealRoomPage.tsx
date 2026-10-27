'use client';

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, MessageSquare, ExternalLink, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function DealRoomPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/')}
        >
          Exit Deal Room
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="mint" size="sm">
            <span className="deal-pulse w-2 h-2 rounded-full bg-[var(--mint-success)] mr-1.5" />
            Live Deal Room
          </Badge>
          <Badge variant="neutral" size="sm">
            Target: #{productId || 'preview'}
          </Badge>
        </div>
      </div>

      <GlassCard padding="lg" className="border-[var(--mint-success)]/30">
        <EmptyState
          icon={<Zap className="w-8 h-8 text-[var(--mint-success)]" />}
          badge="Prompt 6 Architecture"
          title={`Dedicated Deal Room for Listing #${productId || 'preview'}`}
          description="The focused Smart Link Deal Room view — combining instant full-bleed live app preview with synchronous 1-on-1 seller chat and visitor telemetry — will be fully activated in Prompt 6."
          actionLabel="Explore Marketplace"
          onAction={() => navigate('/explore')}
          secondaryActionLabel="Open Messenger"
          onSecondaryAction={() => navigate('/messages')}
        />
      </GlassCard>
    </div>
  );
}
