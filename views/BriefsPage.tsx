'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCode, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function BriefsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Project Briefs Board
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Buyers post custom software requests; creators submit proposals and source-code offers.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {}}
        >
          Post a Project Brief
        </Button>
      </div>

      <Card padding="lg">
        <EmptyState
          icon={<FileCode className="w-8 h-8 text-[var(--lilac-accent)]" />}
          badge="Prompt 9 Feature"
          title="No Project Briefs Currently Active"
          description="The community brief board, custom software bidding, and deal milestone tracking will be activated in Prompt 9. Check back soon or browse ready-made software in the explore feed."
          actionLabel="Explore Ready Software"
          onAction={() => navigate('/explore')}
        />
      </Card>
    </div>
  );
}
