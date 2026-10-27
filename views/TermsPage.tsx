'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { brandConfig } from '@/src/config/brand';

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 pb-16 flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate(-1)}
        className="self-start"
      >
        Back
      </Button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--lilac-surface)] text-[var(--lilac-accent)] flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Terms of Service
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Version 1.0 • Effective October 2026</p>
        </div>
      </div>

      <Card padding="lg" className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6 text-[var(--text-secondary)]">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">1. The {brandConfig.name} Platform</h3>
          <p>
            {brandConfig.name} is a free, software-only discovery and negotiation platform. Developers and creators publish apps, websites, boilerplates, templates, and source code for discovery and direct deal-making.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">2. Zero In-App Payments & External Settlement</h3>
          <p>
            {brandConfig.name} does <strong>not</strong> process, collect, or escrow any payments in Version 1. All financial transactions, code handovers, licensing agreements, and payments are settled directly between the buyer and seller outside of {brandConfig.name} (via wire transfer, crypto, PayPal, or independent escrow). {brandConfig.name} charges 0% fees and accepts no liability for transactions completed outside the platform.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">3. Seller Warranties & Code Integrity</h3>
          <p>
            Sellers guarantee that all published source code, software, and intellectual property are either owned by them or properly licensed for resale. Publishing malicious scripts, keyloggers, pirated code, or unauthorized forks is strictly prohibited and results in immediate permanent bans.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">4. Guest Access & Conduct</h3>
          <p>
            Guests receive an automatic anonymous identity to browse and communicate in good faith. Harassment, spamming, unsolicited scraping, or abuse of the real-time chat or AI sales agent system is prohibited.
          </p>
        </div>
      </Card>
    </div>
  );
}
