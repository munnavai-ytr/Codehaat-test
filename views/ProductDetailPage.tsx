'use client';

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/explore')}
        >
          Back to Explore
        </Button>
        <span className="text-xs text-[var(--text-muted)]">/</span>
        <Badge variant="glass" size="sm">
          Product ID: {productId || 'Unknown'}
        </Badge>
      </div>

      <Card padding="lg">
        <EmptyState
          icon={<Eye className="w-8 h-8 text-[var(--primary-coral)]" />}
          badge="Prompt 4 Architecture"
          title={`Product Listing #${productId}`}
          description="Dedicated product view with live interactive iframe preview, multi-viewport responsive testing (Desktop, Tablet, Mobile), tech stack breakdown, and direct seller chat triggers is arriving in Prompt 4."
          actionLabel="Browse Available Software"
          onAction={() => navigate('/explore')}
          secondaryActionLabel="Return Home"
          onSecondaryAction={() => navigate('/')}
        />
      </Card>
    </div>
  );
}
