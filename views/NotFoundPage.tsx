'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { brandConfig } from '@/src/config/brand';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto py-12 pb-16 flex items-center justify-center">
      <Card padding="lg" className="w-full">
        <EmptyState
          icon={<HelpCircle className="w-8 h-8 text-[var(--primary-coral)]" />}
          badge="404 Error"
          title="Page Not Found"
          description={`The software listing, profile, or Deal Room you are looking for does not exist on ${brandConfig.name} or may have moved.`}
          actionLabel="Back to Home"
          onAction={() => navigate('/')}
          secondaryActionLabel="Explore Software"
          onSecondaryAction={() => navigate('/explore')}
        />
      </Card>
    </div>
  );
}
