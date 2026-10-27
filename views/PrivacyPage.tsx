'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { brandConfig } from '@/src/config/brand';

export function PrivacyPage() {
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
        <div className="w-10 h-10 rounded-2xl bg-[var(--mint-surface)] text-[var(--mint-success)] flex items-center justify-center">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Version 1.0 • Privacy by Design</p>
        </div>
      </div>

      <Card padding="lg" className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6 text-[var(--text-secondary)]">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">1. Anonymous Guest Data</h3>
          <p>
            When you visit {brandConfig.name} without logging in, we generate an anonymous client identifier stored locally on your device (<code className="font-mono">localStorage</code>). No personal data, email, or phone number is collected to browse, test live previews, or chat with creators.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">2. Authenticated Account Data</h3>
          <p>
            If you sign in with Google or Email via Firebase Authentication, we store only your public display name and avatar URL to maintain your seller storefront and synchronize your saved projects.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">3. Chat & Messaging Privacy</h3>
          <p>
            Messages sent within Deal Rooms and product threads are transmitted securely via Firestore. Sellers can configure AI sales agents that process messages through server-side Gemini models solely to provide relevant project answers.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">4. No Ad Trackers or Third-Party Brokers</h3>
          <p>
            {brandConfig.name} does not sell user data, install invasive advertising trackers, or share information with data brokers.
          </p>
        </div>
      </Card>
    </div>
  );
}
