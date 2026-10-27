'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Store,
  KeyRound,
  Globe,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  ShieldAlert,
} from 'lucide-react';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type AuthError,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { compressImage, saveSellerProfile } from '@/lib/user-service';
import { changeLanguage } from '@/lib/i18n';
import type { SellerProfile } from '@/types';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isSeller, reloadUser, refreshProfile, logout } = useSession();

  const rawTab = searchParams.get('tab') || 'profile';
  const activeTab: 'profile' | 'seller' | 'security' | 'language' | 'danger' =
    ['profile', 'seller', 'security', 'language', 'danger'].includes(rawTab)
      ? (rawTab as 'profile' | 'seller' | 'security' | 'language' | 'danger')
      : 'profile';

  const handleTabChange = (tab: typeof activeTab) => {
    setSearchParams({ tab });
  };

  // Profile Edit State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Seller Profile State
  const existingSeller = user?.sellerProfile;
  const [sellerBrandName, setSellerBrandName] = useState(existingSeller?.brandName || user?.displayName || '');
  const [sellerHeadline, setSellerHeadline] = useState(existingSeller?.headline || '');
  const [sellerBio, setSellerBio] = useState(existingSeller?.bio || user?.bio || '');
  const [skills, setSkills] = useState<string[]>(existingSeller?.skills || ['Next.js', 'React', 'TypeScript']);
  const [skillInput, setSkillInput] = useState('');
  const [location, setLocation] = useState(existingSeller?.location || '');
  const [languages, setLanguages] = useState(existingSeller?.languages?.join(', ') || 'English, Bengali');
  const [websiteUrl, setWebsiteUrl] = useState(existingSeller?.websiteUrl || '');
  const [githubUrl, setGithubUrl] = useState(existingSeller?.githubUrl || '');
  const [xUrl, setXUrl] = useState(existingSeller?.xUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(existingSeller?.avatarUrl || user?.photoURL || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(existingSeller?.coverUrl || null);
  const [isSavingSeller, setIsSavingSeller] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account State
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setIsSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      toast({ title: 'Success', message: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      toast({ title: 'Error', message: err instanceof Error ? err.message : 'Could not save profile', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Avatar / Cover selection with compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressImage(file, type === 'avatar' ? 400 : 1600, type === 'avatar' ? 400 : 600);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/webp' });
      const objectUrl = URL.createObjectURL(compressedBlob);

      if (type === 'avatar') {
        setAvatarFile(compressedFile);
        setAvatarPreview(objectUrl);
      } else {
        setCoverFile(compressedFile);
        setCoverPreview(objectUrl);
      }
    } catch (err) {
      toast({ title: 'Image Error', message: err instanceof Error ? err.message : 'Invalid image', type: 'error' });
    }
  };

  // Add / Remove Skill tag
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const clean = skillInput.trim();
      if (!skills.includes(clean) && skills.length < 15) {
        setSkills([...skills, clean]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Seller Profile Save
  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingSeller(true);

    try {
      let finalAvatarUrl = existingSeller?.avatarUrl || user.photoURL || '';
      let finalCoverUrl = existingSeller?.coverUrl || '';

      // Upload Avatar if changed
      if (avatarFile && storage) {
        const avatarRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}.webp`);
        await uploadBytes(avatarRef, avatarFile);
        finalAvatarUrl = await getDownloadURL(avatarRef);
      }

      // Upload Cover if changed
      if (coverFile && storage) {
        const coverRef = ref(storage, `users/${user.uid}/cover_${Date.now()}.webp`);
        await uploadBytes(coverRef, coverFile);
        finalCoverUrl = await getDownloadURL(coverRef);
      }

      const sellerPayload: SellerProfile = {
        brandName: sellerBrandName.trim() || user.displayName || 'Creator',
        headline: sellerHeadline.trim(),
        bio: sellerBio.trim(),
        skills,
        location: location.trim() || undefined,
        languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
        websiteUrl: websiteUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        xUrl: xUrl.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
        coverUrl: finalCoverUrl || undefined,
        updatedAt: new Date().toISOString(),
      };

      await saveSellerProfile(user.uid, sellerPayload);
      await refreshProfile();
      toast({
        title: 'Seller Storefront Activated!',
        message: 'Your seller profile is now live. You can now access the seller dashboard.',
        type: 'success',
      });
      navigate(`/u/${user.username || user.uid}`);
    } catch (err) {
      toast({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to save seller profile.',
        type: 'error',
      });
    } finally {
      setIsSavingSeller(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !user?.email) return;

    if (newPassword.length < 6) {
      toast({ title: 'Error', message: t('errors.passwordTooShort'), type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', message: t('errors.passwordsDoNotMatch'), type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: 'Success', message: 'Password updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as AuthError;
      toast({
        title: 'Error',
        message: error.code === 'auth/wrong-password' ? t('errors.wrongPassword') : error.message,
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !user) return;

    setIsDeleting(true);
    try {
      // Re-authenticate if email/password
      if (user.email && deleteConfirmPassword) {
        const cred = EmailAuthProvider.credential(user.email, deleteConfirmPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }

      // Cleanup user documents in Firestore
      if (db) {
        if (user.usernameLower) {
          try {
            await deleteDoc(doc(db, 'usernames', user.usernameLower));
          } catch (err) {
            console.warn('Username cleanup notice:', err);
          }
        }
        try {
          await deleteDoc(doc(db, 'users', user.uid));
        } catch (err) {
          console.warn('User document cleanup notice:', err);
        }
      }

      // Delete Firebase auth user
      await deleteUser(auth.currentUser);
      await logout();
      toast({
        title: 'Account Deleted',
        message: 'Your account and profile records have been permanently removed.',
        type: 'info',
      });
      navigate('/');
    } catch (err) {
      const error = err as AuthError;
      toast({
        title: 'Deletion Failed',
        message:
          error.code === 'auth/requires-recent-login'
            ? t('errors.reauthRequired')
            : error.message || 'Failed to delete account.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.editProfileTab'), icon: <User className="w-4 h-4" /> },
    { id: 'seller', label: t('settings.sellerProfileTab'), icon: <Store className="w-4 h-4" /> },
    { id: 'security', label: t('settings.securityTab'), icon: <KeyRound className="w-4 h-4" /> },
    { id: 'language', label: t('settings.preferencesTab'), icon: <Globe className="w-4 h-4" /> },
    { id: 'danger', label: t('settings.dangerTab'), icon: <Trash2 className="w-4 h-4 text-rose-500" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 pb-20 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your identity, seller storefront, security credentials, and preferences.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--border-default)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shrink-0 transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-[var(--primary-coral)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Edit Profile */}
      {activeTab === 'profile' && (
        <Card padding="lg">
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-default)]">
              <Avatar
                src={user?.photoURL}
                alt={user?.displayName || 'User'}
                name={user?.displayName || 'User'}
                size="lg"
              />
              <div>
                <p className="font-bold text-[var(--text-primary)]">{user?.displayName}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {user?.username ? `@${user.username}` : 'No username set'}
                </p>
              </div>
            </div>

            <Input
              label={t('auth.displayNameLabel')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              required
            />

            <Textarea
              label="Bio & About"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell buyers and developers about yourself..."
              rows={3}
            />

            <Button type="submit" variant="primary" size="md" isLoading={isSavingProfile} className="self-end mt-2">
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 2: Seller Profile */}
      {activeTab === 'seller' && (
        <Card padding="lg" className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-default)]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {t('seller.becomeSellerTitle')}
                </h3>
                {isSeller && <Badge variant="mint" size="sm">{t('seller.sellerBadge')}</Badge>}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t('seller.becomeSellerDesc')}
              </p>
            </div>
            {user?.username && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/u/${user.username}`)}
              >
                View Public Storefront
              </Button>
            )}
          </div>

          <form onSubmit={handleSaveSeller} className="flex flex-col gap-4">
            {/* Visual Cover & Avatar Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[var(--brand-indigo)] to-[#151329] border border-[var(--border-default)] p-4 text-white">
              {coverPreview && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
                  style={{ backgroundImage: `url(${coverPreview})` }}
                />
              )}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 bg-[var(--lilac-surface)]">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar"
                        fill
                        unoptimized
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--lilac-accent)]">
                        {sellerBrandName.slice(0, 2).toUpperCase() || 'DW'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-base">{sellerBrandName || 'Your Brand Name'}</p>
                    <p className="text-xs text-white/70">{sellerHeadline || 'Software Engineer & Creator'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold cursor-pointer transition-colors">
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'avatar')}
                      className="hidden"
                    />
                  </label>
                  <label className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold cursor-pointer transition-colors">
                    Upload Cover
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'cover')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <Input
              label={t('seller.brandNameLabel')}
              value={sellerBrandName}
              onChange={(e) => setSellerBrandName(e.target.value)}
              placeholder="e.g. Acme Software Studio"
              required
            />

            <Input
              label={t('seller.headlineLabel')}
              value={sellerHeadline}
              onChange={(e) => setSellerHeadline(e.target.value)}
              placeholder={t('seller.headlinePlaceholder')}
              required
            />

            <Textarea
              label={t('seller.bioLabel')}
              value={sellerBio}
              onChange={(e) => setSellerBio(e.target.value)}
              placeholder={t('seller.bioPlaceholder')}
              rows={4}
              required
            />

            {/* Skills & Tech Stack Chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('seller.skillsLabel')}
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] min-h-[50px] items-center">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--lilac-surface)] text-[var(--lilac-accent)] text-xs font-bold border border-[var(--lilac-border)]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder={skills.length === 0 ? t('seller.skillsPlaceholder') : 'Add more...'}
                  className="bg-transparent border-none text-xs focus:outline-none flex-1 min-w-[120px] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('seller.locationLabel')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('seller.locationPlaceholder')}
              />
              <Input
                label={t('seller.languagesLabel')}
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, Bengali, etc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t('seller.websiteLabel')}
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://mysite.com"
              />
              <Input
                label={t('seller.githubLabel')}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
              <Input
                label={t('seller.xLabel')}
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSavingSeller}
              className="mt-3 font-bold"
            >
              {t('seller.submitSeller')}
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <Card padding="lg">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {t('settings.changePasswordTitle')}
            </h3>

            <Input
              label={t('settings.currentPasswordLabel')}
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label={t('settings.newPasswordLabel')}
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 6 characters"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword} className="mt-2">
              {t('settings.updatePasswordBtn')}
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 4: Preferences & Language */}
      {activeTab === 'language' && (
        <Card padding="lg" className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {t('settings.languageTitle')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {t('settings.languageDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mt-2">
            <button
              type="button"
              onClick={() => {
                changeLanguage('en');
                toast({ title: 'Language Changed', message: 'Switched to English.', type: 'info' });
              }}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                i18n.language === 'en'
                  ? 'border-[var(--primary-coral)] bg-[var(--primary-coral-surface)]'
                  : 'border-[var(--border-default)] hover:bg-[var(--bg-card-subtle)]'
              }`}
            >
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">English (US)</p>
                <p className="text-xs text-[var(--text-secondary)]">Default marketplace language</p>
              </div>
              {i18n.language === 'en' && <CheckCircle2 className="w-5 h-5 text-[var(--primary-coral)]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                changeLanguage('bn');
                toast({ title: 'ভাষা পরিবর্তিত', message: 'বাংলা ভাষা নির্বাচন করা হয়েছে।', type: 'info' });
              }}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                i18n.language === 'bn'
                  ? 'border-[var(--primary-coral)] bg-[var(--primary-coral-surface)]'
                  : 'border-[var(--border-default)] hover:bg-[var(--bg-card-subtle)]'
              }`}
            >
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)] font-sans">বাংলা (Bengali)</p>
                <p className="text-xs text-[var(--text-secondary)] font-sans">হিন্দ শিলিগুড়ি ফন্ট সাপোর্ট</p>
              </div>
              {i18n.language === 'bn' && <CheckCircle2 className="w-5 h-5 text-[var(--primary-coral)]" />}
            </button>
          </div>
        </Card>
      )}

      {/* Tab 5: Danger Zone */}
      {activeTab === 'danger' && (
        <Card padding="lg" className="border-rose-500/40 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base">{t('settings.deleteAccountTitle')}</h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('settings.deleteAccountWarning')}
          </p>

          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3 max-w-md pt-2">
            {user?.email && (
              <Input
                label="Confirm Your Password to Delete"
                type="password"
                placeholder="••••••••"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                required
              />
            )}

            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isDeleting}
              className="mt-2"
            >
              {t('settings.deleteConfirmBtn')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
