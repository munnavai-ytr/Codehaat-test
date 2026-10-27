'use client';

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Layers, Code2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { brandConfig } from '@/src/config/brand';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentQuery = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || 'all';

  const [queryInput, setQueryInput] = useState(currentQuery);

  const categories = [
    { id: 'all', label: 'All Software' },
    { id: 'web-app', label: 'Full-Stack Apps' },
    { id: 'boilerplate', label: 'Boilerplates & Starters' },
    { id: 'template', label: 'UI Templates' },
    { id: 'mobile-app', label: 'Mobile Apps' },
    { id: 'api-backend', label: 'Backend & APIs' },
    { id: 'component', label: 'UI Components' },
  ];

  const handleCategorySelect = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') {
      next.delete('category');
    } else {
      next.set('category', id);
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (queryInput.trim()) {
      next.set('q', queryInput.trim());
    } else {
      next.delete('q');
    }
    setSearchParams(next);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Explore Software Projects
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Discover production-ready apps, boilerplates, and templates directly from builders.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/dashboard')}
        >
          Publish Software
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card padding="md" className="flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search by keywords, tags (e.g. Next.js, Supabase, Tailwind, AI)..."
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
          <Button variant="secondary" type="submit">
            Search
          </Button>
        </form>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[var(--text-muted)] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = (currentCategory === cat.id) || (cat.id === 'all' && !searchParams.get('category'));
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:bg-[var(--lilac-surface)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Listings Container: Honest Real Data Empty State */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>0 listings found</span>
          <span>Showing real database listings</span>
        </div>

        <Card padding="lg" className="border-dashed">
          <EmptyState
            icon={<Code2 className="w-8 h-8 text-[var(--lilac-accent)]" />}
            badge="Backend Ready"
            title={currentQuery ? `No listings matching "${currentQuery}"` : 'Marketplace Catalog is Open'}
            description={
              currentQuery
                ? 'Try refining your keywords or browse all categories.'
                : 'No projects have been published to this category yet. Be the first creator to list your source-code project!'
            }
            actionLabel={`List Software on ${brandConfig.name}`}
            onAction={() => navigate('/dashboard')}
            secondaryActionLabel={currentQuery ? 'Clear Filters' : undefined}
            onSecondaryAction={
              currentQuery
                ? () => {
                    setQueryInput('');
                    setSearchParams({});
                  }
                : undefined
            }
          />
        </Card>
      </div>
    </div>
  );
}
