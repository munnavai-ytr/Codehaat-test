'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Eye,
  MessageSquare,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useSession } from '@/hooks/use-session';
import { brandConfig } from '@/src/config/brand';

export function HomePage() {
  const navigate = useNavigate();
  const { user, isGuest } = useSession();

  return (
    <div className="flex flex-col gap-10 md:gap-14 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[var(--lilac-surface)]/60 via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-10 md:p-14 shadow-[var(--shadow-soft)]">
        <div className="max-w-3xl flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="coral" size="md">
              <Zap className="w-3.5 h-3.5 mr-1" />
              100% Free Marketplace
            </Badge>
            <Badge variant="mint" size="md">
              <span className="deal-pulse w-2 h-2 rounded-full bg-[var(--mint-success)] mr-1.5" />
              No Buyer Login Required
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.12]">
            Preview. Talk.{' '}
            <span className="bg-gradient-to-r from-[var(--primary-coral)] to-[var(--lilac-accent)] bg-clip-text text-transparent">
              Deal.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
            The free, software-only marketplace where developers sell apps, websites, boilerplates,
            and source-code projects. Test live interactive previews and chat directly with creators.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Compass className="w-5 h-5" />}
              onClick={() => navigate('/explore')}
            >
              Explore Software
            </Button>

            <Button
              variant="secondary"
              size="lg"
              leftIcon={<PlusCircle className="w-5 h-5 text-[var(--primary-coral)]" />}
              onClick={() => navigate('/dashboard')}
            >
              Publish a Project
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[var(--border-default)]/70">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--lilac-surface)] text-[var(--lilac-accent)] flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Live Interactive Previews</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Test real running code before starting conversations.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--mint-surface)] text-[var(--mint-success)] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Direct Deal Rooms</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Focused link views with real-time 1-on-1 seller chat.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-coral-surface)] text-[var(--primary-coral)] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">AI Sales Agents</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Custom Gemini AI reps answer buyer questions 24/7.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Zero Platform Fees</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Free forever. Deals are settled directly outside the app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Feed Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Discovery Feed
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Real-time software listings and developer releases.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/explore')}
          >
            View All
          </Button>
        </div>

        {/* Real Data Empty State */}
        <Card padding="lg" className="border-dashed">
          <EmptyState
            icon={<Code2 className="w-8 h-8 text-[var(--primary-coral)]" />}
            badge="Fresh Marketplace"
            title="No Software Projects Listed Yet"
            description={`Be the first developer to publish an app, SaaS template, boilerplate, or code bundle to the ${brandConfig.name} marketplace.`}
            actionLabel="List Your Software Project"
            onAction={() => navigate('/dashboard')}
            secondaryActionLabel="Explore Categories"
            onSecondaryAction={() => navigate('/explore')}
          />
        </Card>
      </section>

      {/* Signature Tilting Showcase Card */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              The {brandConfig.name} Engine
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Experience the signature tilting device-frame and instant Deal Room preview.
            </p>
          </div>
          <Badge variant="glass" size="sm">
            Prompt 2 Ready
          </Badge>
        </div>

        <GlassCard tiltOnHover padding="lg" className="border-[var(--lilac-border)]/50">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex-1 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-coral)]">
                Signature Device Frame
              </span>
              <h4 className="text-2xl font-bold text-[var(--text-primary)]">
                Interactive Live Previews & Deal Rooms
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Hover over this frame to see the 3D perspective tilt effect. Every product on {brandConfig.name} features an interactive responsive viewport switcher (Desktop, Tablet, Mobile) with seller presence pulse.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/deal/preview')}
                >
                  Enter Sample Deal Room
                </Button>
              </div>
            </div>

            <div className="w-full md:w-80 h-52 rounded-2xl bg-gradient-to-br from-[var(--brand-indigo)] to-[#0B091A] p-3 text-white flex flex-col justify-between shadow-lg border border-[var(--border-glass)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-[10px] font-mono text-white/50">{brandConfig.name.toLowerCase()}.app/preview</span>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 text-center p-3">
                <span className="deal-pulse w-3 h-3 rounded-full bg-[var(--mint-success)] mb-2" />
                <p className="text-xs font-semibold">Seller Online (Deal Pulse)</p>
                <p className="text-[10px] text-white/60 mt-0.5">Real-time buyer negotiation ready</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/10">
                <span>Viewport: Desktop 1080p</span>
                <span>Zero Latency</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
