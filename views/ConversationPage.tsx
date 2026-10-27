'use client';

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/messages')}
        >
          All Messages
        </Button>
        <span className="text-xs text-[var(--text-muted)]">/</span>
        <Badge variant="glass" size="sm">
          Thread #{conversationId}
        </Badge>
      </div>

      <Card padding="lg">
        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-[var(--mint-success)]" />}
          badge="Prompt 7 Architecture"
          title={`Conversation Thread #${conversationId}`}
          description="Synchronous Firestore chat streams, online presence indicators, and offline AI sales agent automated response handoff will be activated in Prompt 7 and Prompt 8."
          actionLabel="Back to Inbox"
          onAction={() => navigate('/messages')}
        />
      </Card>
    </div>
  );
}
