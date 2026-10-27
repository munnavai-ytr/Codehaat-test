'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Github,
  Twitter,
  MapPin,
  Languages,
  Store,
  Edit3,
  Calendar,
  CheckCircle2,
  PackageOpen,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { getUserByUsername } from '@/lib/user-service';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { brandConfig } from '@/src/config/brand';
import type { UserProfile } from '@/types';

export function StorefrontPage() {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await getUserByUsername(username);
      if (active) {
        if (res) {
          setProfile(res);
        } else if (currentUser?.username?.toLowerCase() === username.toLowerCase()) {
          // Fallback to currently authenticated user
          setProfile(currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    };

    fetchUser();
    return () => {
      active = false;
    };
  }, [username, currentUser]);

  const isOwner = Boolean(
    currentUser &&
      (currentUser.uid === profile?.uid ||
        currentUser.username?.toLowerCase() === username?.toLowerCase())
  );

  const seller = profile?.sellerProfile;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        message: 'Storefront link copied to clipboard.',
        type: 'success',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" color="text-[var(--primary-coral)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card padding="lg">
          <EmptyState
            icon={<Store className="w-8 h-8 text-[var(--text-muted)]" />}
            badge="User Not Found"
            title={`No profile found for @${username}`}
            description={`The requested user profile or storefront does not exist on ${brandConfig.name} or may have been deleted.`}
            actionLabel="Explore Marketplace"
            onAction={() => navigate('/explore')}
            secondaryActionLabel="Return Home"
            onSecondaryAction={() => navigate('/')}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 pb-20 flex flex-col gap-6">
      {/* Back button & quick action */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            onClick={handleShare}
          >
            Share Storefront
          </Button>

          {isOwner && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => navigate('/settings?tab=seller')}
            >
              Edit Storefront
            </Button>
          )}
        </div>
      </div>

      {/* Hero Banner & Storefront Card */}
      <Card padding="none" className="overflow-hidden">
        {/* Cover Image Banner */}
        <div className="relative h-44 sm:h-64 w-full bg-gradient-to-r from-[var(--brand-indigo)] via-[#1B1838] to-[#0F0E1E] flex items-center justify-center overflow-hidden">
          {seller?.coverUrl ? (
            <Image
              src={seller.coverUrl}
              alt="Cover"
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,var(--lilac-accent),transparent_70%)]" />
          )}
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            <div className="flex items-end gap-4">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[var(--bg-card)] shadow-lg overflow-hidden bg-[var(--lilac-surface)] shrink-0">
                <Avatar
                  src={seller?.avatarUrl || profile.photoURL}
                  alt={profile.displayName || 'Seller'}
                  name={profile.displayName || 'Seller'}
                  size="xl"
                  className="w-full h-full"
                />
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                    {seller?.brandName || profile.displayName}
                  </h1>
                  {profile.role === 'seller' && (
                    <Badge variant="mint" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                      Verified Seller
                    </Badge>
                  )}
                  {profile.role === 'admin' && (
                    <Badge variant="coral" size="sm">
                      Admin Operator
                    </Badge>
                  )}
                </div>

                <p className="text-sm font-mono text-[var(--text-muted)] mt-0.5">
                  @{profile.username || username}
                </p>
              </div>
            </div>
          </div>

          {/* Headline & Bio */}
          {seller?.headline && (
            <p className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-2">
              {seller.headline}
            </p>
          )}

          <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-3xl whitespace-pre-line mb-6">
            {seller?.bio || profile.bio || `Software developer and creator on ${brandConfig.name}.`}
          </p>

          {/* Meta Details Row: Location, Languages, Socials */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border-default)]">
            {seller?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
                {seller.location}
              </span>
            )}

            {seller?.languages && seller.languages.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-[var(--mint-success)]" />
                {seller.languages.join(', ')}
              </span>
            )}

            {profile.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 ml-auto">
              {seller?.websiteUrl && (
                <a
                  href={seller.websiteUrl.startsWith('http') ? seller.websiteUrl : `https://${seller.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--primary-coral)] hover:underline font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
              {seller?.githubUrl && (
                <a
                  href={seller.githubUrl.startsWith('http') ? seller.githubUrl : `https://${seller.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </a>
              )}
              {seller?.xUrl && (
                <a
                  href={seller.xUrl.startsWith('http') ? seller.xUrl : `https://${seller.xUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  X
                </a>
              )}
            </div>
          </div>

          {/* Skills Chips */}
          {seller?.skills && seller.skills.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--border-default)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                Tech Stack & Core Expertise
              </span>
              <div className="flex flex-wrap gap-2">
                {seller.skills.map((skill) => (
                  <Badge key={skill} variant="lilac" size="sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Software Projects Catalog Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            Published Software Projects
          </h3>
          <span className="text-xs text-[var(--text-muted)]">0 listed</span>
        </div>

        <Card padding="lg" className="border-dashed">
          <EmptyState
            icon={<PackageOpen className="w-8 h-8 text-[var(--primary-coral)]" />}
            badge="Prompt 3 & 5 Roadmap"
            title="No Published Software Projects Yet"
            description={
              isOwner
                ? "You haven't listed any software products yet. Multi-step software project upload, live interactive previews, and deal tracking unlock in Prompt 3."
                : `@${profile.username || username} hasn't published any public software products to their storefront yet. Check back soon!`
            }
            actionLabel={isOwner ? 'Go to Seller Dashboard' : 'Explore Marketplace'}
            onAction={() => navigate(isOwner ? '/dashboard' : '/explore')}
          />
        </Card>
      </div>
    </div>
  );
}
