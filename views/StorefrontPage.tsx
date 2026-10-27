'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Copy,
  UserCheck,
  UserPlus,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { getUserByUsername } from '@/lib/user-service';
import { getSellerProducts } from '@/lib/product-service';
import {
  isFollowingUser,
  followUser,
  unfollowUser,
  getFollowerCount,
  getSellerPublishedProductCount,
} from '@/lib/social-service';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import { SaveAccountModal } from '@/components/auth/SaveAccountModal';
import { featureFlags } from '@/src/config/features';
import { brandConfig } from '@/src/config/brand';
import type { UserProfile, ProductItem } from '@/types';

export function StorefrontPage() {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, isGuest, isAuthenticated } = useSession();

  const isPermanentUser = isAuthenticated && !isGuest;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

  // Real Counts & Social State
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);

  // Require Login Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchStorefrontData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const userDoc = await getUserByUsername(username);

      if (!active) return;

      if (userDoc) {
        setProfile(userDoc);
        document.title = `${userDoc.sellerProfile?.brandName || userDoc.displayName || username} | ${brandConfig.name}`;

        // Fetch real seller counts & products concurrently
        getFollowerCount(userDoc.uid).then((cnt) => {
          if (active) setFollowerCount(cnt);
        });
        getSellerPublishedProductCount(userDoc.uid).then((cnt) => {
          if (active) setPublishedCount(cnt);
        });

        // Load published products
        getSellerProducts(userDoc.uid).then((prods) => {
          if (active) {
            // Visitors only see published products; seller sees their own
            const isOwner = currentUser?.uid === userDoc.uid;
            const filtered = isOwner
              ? prods
              : prods.filter((p) => p.status === 'published');
            setProducts(filtered);
          }
        });

        // Check if currently authenticated permanent user is following this seller
        if (currentUser && currentUser.uid !== userDoc.uid && isPermanentUser) {
          isFollowingUser(currentUser.uid, userDoc.uid).then((res) => {
            if (active) setIsFollowing(res);
          });
        }
      } else {
        setProfile(null);
        document.title = `${t('storefront.notFound')} | ${brandConfig.name}`;
      }
      setLoading(false);
    };

    fetchStorefrontData();
    return () => {
      active = false;
    };
  }, [username, currentUser, isPermanentUser, t]);

  const isOwner = Boolean(
    currentUser &&
      profile &&
      (currentUser.uid === profile.uid ||
        currentUser.username?.toLowerCase() === username?.toLowerCase())
  );

  const seller = profile?.sellerProfile;

  const handleFollowToggle = async () => {
    if (!profile) return;
    if (!isPermanentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isFollowProcessing || isOwner || !currentUser) return;

    setIsFollowProcessing(true);
    const nextFollowing = !isFollowing;
    const nextCount = nextFollowing ? followerCount + 1 : Math.max(0, followerCount - 1);

    // Optimistic UI
    setIsFollowing(nextFollowing);
    setFollowerCount(nextCount);

    try {
      if (nextFollowing) {
        await followUser(currentUser.uid, profile.uid);
        toast({
          title: 'Following',
          message: `You are now following ${seller?.brandName || profile.displayName}.`,
          type: 'success',
        });
      } else {
        await unfollowUser(currentUser.uid, profile.uid);
      }
    } catch {
      // Rollback
      setIsFollowing(!nextFollowing);
      setFollowerCount(followerCount);
      toast({
        title: 'Error',
        message: 'Could not update follow status.',
        type: 'error',
      });
    } finally {
      setIsFollowProcessing(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: seller?.brandName || profile.displayName || 'Storefront',
          text: seller?.headline || profile.bio,
          url,
        });
        return;
      } catch {
        // Fallback
      }
    }
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      message: 'Storefront link copied to clipboard.',
      type: 'success',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" color="text-[var(--primary-coral)]" />
        <p className="text-xs text-[var(--text-muted)] font-medium">Loading storefront...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card padding="lg">
          <EmptyState
            icon={<Store className="w-8 h-8 text-[var(--text-muted)]" />}
            badge="404"
            title={t('storefront.notFound')}
            description={t('storefront.notFoundDesc', { username })}
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
    <>
      <div className="max-w-5xl mx-auto py-4 sm:py-6 pb-20 flex flex-col gap-6">
        {/* Back navigation & Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
            className="min-h-[44px]"
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
              onClick={handleShare}
              className="min-h-[44px]"
            >
              {t('storefront.shareProfile')}
            </Button>

            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => navigate('/settings?tab=seller')}
                className="min-h-[44px]"
              >
                {t('storefront.editProfile')}
              </Button>
            )}

            {/* Chat button behind feature flag */}
            {featureFlags.chat && !isOwner && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[var(--primary-coral)]" />}
                onClick={() => navigate(`/messages?to=${profile.uid}`)}
                className="min-h-[44px]"
              >
                Message
              </Button>
            )}
          </div>
        </div>

        {/* Storefront Header Card */}
        <Card padding="none" className="overflow-hidden">
          {/* Cover Banner */}
          <div className="relative h-44 sm:h-64 w-full bg-gradient-to-r from-[var(--brand-indigo)] via-[#1B1838] to-[#0F0E1E] flex items-center justify-center overflow-hidden">
            {seller?.coverUrl ? (
              <Image
                src={seller.coverUrl}
                alt="Storefront Cover"
                fill
                unoptimized
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,var(--lilac-accent),transparent_70%)]" />
            )}
          </div>

          {/* Profile Identity Bar */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              <div className="flex items-end gap-4">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[var(--bg-card)] shadow-lg overflow-hidden bg-[var(--lilac-surface)] shrink-0">
                  <Avatar
                    src={seller?.avatarUrl || profile.photoURL}
                    alt={seller?.brandName || profile.displayName || 'Seller'}
                    name={seller?.brandName || profile.displayName || 'Seller'}
                    size="xl"
                    className="w-full h-full"
                  />
                </div>

                <div className="mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                      {seller?.brandName || profile.displayName}
                    </h1>
                    {profile.role === 'seller' && (
                      <Badge variant="mint" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                        Verified Creator
                      </Badge>
                    )}
                    {profile.role === 'admin' && (
                      <Badge variant="coral" size="sm">
                        Admin
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-mono text-[var(--text-muted)] mt-0.5">
                    @{profile.username || username}
                  </p>
                </div>
              </div>

              {/* Follow Button (Guests trigger save account modal) */}
              {!isOwner && (
                <div className="sm:mb-2">
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    leftIcon={
                      isFollowing ? (
                        <UserCheck className="w-4 h-4 text-[var(--mint-success)]" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )
                    }
                    onClick={handleFollowToggle}
                    isLoading={isFollowProcessing}
                    className={`min-h-[44px] font-bold px-6 ${
                      isFollowing ? 'border-[var(--mint-success)]/40 text-[var(--mint-success)]' : ''
                    }`}
                  >
                    {isFollowing ? t('storefront.following') : t('storefront.follow')}
                  </Button>
                </div>
              )}
            </div>

            {/* Headline */}
            {seller?.headline && (
              <p className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3">
                {seller.headline}
              </p>
            )}

            {/* Real Stats Bar: Followers & Published Products */}
            <div className="flex items-center gap-6 py-3 border-y border-[var(--border-default)] mb-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[var(--text-primary)]">
                  {publishedCount}
                </span>
                <span className="text-[var(--text-muted)]">{t('storefront.products')}</span>
              </div>

              <div className="h-4 w-px bg-[var(--border-default)]" />

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[var(--text-primary)]">
                  {followerCount}
                </span>
                <span className="text-[var(--text-muted)]">
                  {followerCount === 1 ? t('storefront.follower') : t('storefront.followers')}
                </span>
              </div>

              <div className="h-4 w-px bg-[var(--border-default)]" />

              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {t('storefront.memberSince')}{' '}
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '2026'}
                </span>
              </div>
            </div>

            {/* Bio text */}
            {(seller?.bio || profile.bio) && (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line mb-4">
                {seller?.bio || profile.bio}
              </p>
            )}

            {/* Location & Social Links */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] pt-2">
              <div className="flex flex-wrap items-center gap-4">
                {seller?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
                    <span>{seller.location}</span>
                  </span>
                )}

                {seller?.languages && seller.languages.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-[var(--mint-success)]" />
                    <span>{seller.languages.join(', ')}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
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
          </div>
        </Card>

        {/* Storefront Tabs: Products & About */}
        <div className="flex items-center gap-3 border-b border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-sm font-bold transition-colors cursor-pointer relative ${
              activeTab === 'products'
                ? 'text-[var(--primary-coral)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{t('storefront.tabProducts')}</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)]">
              {products.length}
            </span>
            {activeTab === 'products' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-coral)] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-3 text-sm font-bold transition-colors cursor-pointer relative ${
              activeTab === 'about'
                ? 'text-[var(--primary-coral)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{t('storefront.tabAbout')}</span>
            {activeTab === 'about' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-coral)] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Products Grid */}
        {activeTab === 'products' && (
          <div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} isOwner={isOwner} />
                ))}
              </div>
            ) : (
              <Card padding="lg" className="border-dashed">
                <EmptyState
                  icon={<PackageOpen className="w-8 h-8 text-[var(--text-muted)]" />}
                  badge="0 Products"
                  title={t('storefront.noProducts')}
                  description={
                    isOwner
                      ? "You haven't listed any software projects yet. Click below to create your first software project listing!"
                      : t('storefront.noProductsDesc')
                  }
                  actionLabel={isOwner ? t('dashboard.newProductBtn') : 'Explore Marketplace'}
                  onAction={() => navigate(isOwner ? '/dashboard' : '/explore')}
                />
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: About Creator */}
        {activeTab === 'about' && (
          <Card padding="lg" className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                About {seller?.brandName || profile.displayName}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                {seller?.bio || profile.bio || 'No extended bio provided.'}
              </p>
            </div>

            {seller?.skills && seller.skills.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-default)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2.5">
                  {t('storefront.skillsTitle')}
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
          </Card>
        )}
      </div>

      {/* Require Login Upgrade Modal */}
      <SaveAccountModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        customReason="Save your permanent account or sign in to follow this software creator."
        onSuccess={handleFollowToggle}
      />
    </>
  );
}
