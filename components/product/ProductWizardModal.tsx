'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Sliders,
  Image as ImageIcon,
  Globe,
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Upload,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import {
  PRODUCT_CATEGORIES,
  PLATFORM_OPTIONS,
  LICENSE_OPTIONS,
  TECH_STACK_SUGGESTIONS,
  CURRENCY_OPTIONS,
  validatePreviewUrl,
} from '@/config/products';
import { saveProductDraft, submitProductForReview, checkPublishingRequirements } from '@/lib/product-service';
import { uploadProductImage, uploadProductApk } from '@/lib/storage-service';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import type { ProductItem, ProductCategory, ProductPlatform, LicenseType, ProductPackage, ApkInfo } from '@/types';

interface ProductWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: ProductItem | null;
  onSuccess?: () => void;
}

export function ProductWizardModal({
  isOpen,
  onClose,
  initialProduct,
  onSuccess,
}: ProductWizardModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const { toast } = useToast();
  const isBn = i18n.language?.startsWith('bn');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [productId, setProductId] = useState<string>(initialProduct?.id || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [summary, setSummary] = useState(initialProduct?.summary || '');
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category || 'web-apps');
  const [platforms, setPlatforms] = useState<ProductPlatform[]>(initialProduct?.platforms || ['web']);
  const [licenseType, setLicenseType] = useState<LicenseType>(initialProduct?.licenseType || 'personal');

  const [description, setDescription] = useState(initialProduct?.description || '');
  const [techStack, setTechStack] = useState<string[]>(initialProduct?.techStack || ['React', 'Next.js']);
  const [techInput, setTechInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || ['boilerplate']);
  const [tagInput, setTagInput] = useState('');
  const [features, setFeatures] = useState<string[]>(initialProduct?.features || ['Responsive UI', 'Authentication Ready']);
  const [featureInput, setFeatureInput] = useState('');
  const [demoAccessNote, setDemoAccessNote] = useState(initialProduct?.demoAccessNote || '');

  const [coverImage, setCoverImage] = useState<string>(initialProduct?.coverImage || '');
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [apk, setApk] = useState<ApkInfo | undefined>(initialProduct?.apk);
  const [apkVersion, setApkVersion] = useState('1.0.0');
  const [ownershipConfirmed, setOwnershipConfirmed] = useState<boolean>(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingApk, setIsUploadingApk] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [previewUrl, setPreviewUrl] = useState(initialProduct?.previewUrl || '');
  const [previewUrlError, setPreviewUrlError] = useState<string | null>(null);

  const [packages, setPackages] = useState<ProductPackage[]>(
    initialProduct?.packages && initialProduct.packages.length > 0
      ? initialProduct.packages
      : [
          {
            id: 'pkg_standard',
            name: 'Standard Package',
            description: 'Full source code access and baseline documentation.',
            priceAmount: 49,
            currency: 'USD',
            deliveryDays: 1,
            includes: ['Source code repository', 'Documentation', '1 month support'],
          },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [prevInitialProduct, setPrevInitialProduct] = useState<ProductItem | null>(null);

  // Sync initialProduct during render if prop changes
  if (initialProduct !== prevInitialProduct) {
    setPrevInitialProduct(initialProduct ?? null);
    if (initialProduct) {
      setProductId(initialProduct.id);
      setTitle(initialProduct.title || '');
      setSummary(initialProduct.summary || '');
      setCategory(initialProduct.category || 'web-apps');
      setPlatforms(initialProduct.platforms || ['web']);
      setLicenseType(initialProduct.licenseType || 'personal');
      setDescription(initialProduct.description || '');
      setTechStack(initialProduct.techStack || []);
      setTags(initialProduct.tags || []);
      setFeatures(initialProduct.features || []);
      setDemoAccessNote(initialProduct.demoAccessNote || '');
      setCoverImage(initialProduct.coverImage || '');
      setImages(initialProduct.images || []);
      setApk(initialProduct.apk);
      setPreviewUrl(initialProduct.previewUrl || '');
      setPackages(initialProduct.packages || []);
    }
  }

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your product listing.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Construct current product item snapshot
  const getProductSnapshot = (): Partial<ProductItem> => ({
    id: productId,
    sellerId: user?.uid,
    title,
    summary,
    description,
    category,
    platforms,
    techStack,
    tags,
    features,
    previewUrl,
    coverImage,
    images,
    apk,
    packages,
    licenseType,
    demoAccessNote,
    status: initialProduct?.status === 'pending' ? 'pending' : 'draft',
  });

  // Autosave Draft
  const handleSaveDraft = async () => {
    if (!user) return;
    setIsAutosaving(true);
    setValidationError(null);

    try {
      const savedId = await saveProductDraft(user, getProductSnapshot(), productId);
      setProductId(savedId);
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date().toLocaleTimeString());
      toast({
        title: 'Draft Saved',
        message: t('product.draftSaved'),
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Draft Error',
        message: err instanceof Error ? err.message : 'Failed to save draft',
        type: 'error',
      });
    } finally {
      setIsAutosaving(false);
    }
  };

  // Preview URL Validation
  const handlePreviewUrlChange = (val: string) => {
    setPreviewUrl(val);
    setHasUnsavedChanges(true);
    if (!val.trim()) {
      setPreviewUrlError(null);
      return;
    }
    const check = validatePreviewUrl(val);
    if (!check.valid) {
      setPreviewUrlError(check.errorKey ? t(`errors.${check.errorKey}`) : check.message || 'Invalid preview URL');
    } else {
      setPreviewUrlError(null);
    }
  };

  // Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingCover(true);
    try {
      const tempId = productId || `draft_${Date.now()}`;
      const url = await uploadProductImage(user.uid, tempId, file, 'cover', setUploadProgress);
      setCoverImage(url);
      setHasUnsavedChanges(true);
      toast({ title: 'Cover Uploaded', message: 'Cover banner uploaded successfully.', type: 'success' });
    } catch (err) {
      toast({ title: 'Upload Failed', message: err instanceof Error ? err.message : 'Image error', type: 'error' });
    } finally {
      setIsUploadingCover(false);
      setUploadProgress(0);
    }
  };

  // Screenshots Upload
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    if (images.length + files.length > 8) {
      toast({ title: 'Limit Exceeded', message: 'Maximum 8 product screenshots allowed.', type: 'error' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const tempId = productId || `draft_${Date.now()}`;
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadProductImage(
          user.uid,
          tempId,
          files[i],
          `screenshot_${images.length + i + 1}`,
          setUploadProgress
        );
        newUrls.push(url);
      }
      setImages([...images, ...newUrls]);
      setHasUnsavedChanges(true);
      toast({ title: 'Uploaded', message: `${files.length} screenshot(s) uploaded.`, type: 'success' });
    } catch (err) {
      toast({ title: 'Upload Failed', message: err instanceof Error ? err.message : 'Error uploading images', type: 'error' });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // APK Upload
  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ownershipConfirmed) {
      toast({ title: 'Ownership Check Required', message: t('errors.ownershipRequired'), type: 'error' });
      return;
    }

    setIsUploadingApk(true);
    try {
      const tempId = productId || `draft_${Date.now()}`;
      const info = await uploadProductApk(user.uid, tempId, file, apkVersion, setUploadProgress);
      setApk(info);
      setHasUnsavedChanges(true);
      toast({ title: 'APK Uploaded', message: 'Android preview build attached.', type: 'success' });
    } catch (err) {
      toast({ title: 'APK Error', message: err instanceof Error ? err.message : 'APK upload error', type: 'error' });
    } finally {
      setIsUploadingApk(false);
      setUploadProgress(0);
    }
  };

  // Step Validation Check
  const validateCurrentStep = (): boolean => {
    setValidationError(null);

    if (currentStep === 1) {
      if (title.trim().length < 5 || title.trim().length > 90) {
        setValidationError(t('errors.titleLength'));
        return false;
      }
      if (summary.trim().length < 20 || summary.trim().length > 200) {
        setValidationError(t('errors.summaryLength'));
        return false;
      }
      if (platforms.length === 0) {
        setValidationError('Select at least one supported platform.');
        return false;
      }
    } else if (currentStep === 2) {
      if (description.trim().length < 20) {
        setValidationError('Please provide a descriptive breakdown of your software (at least 20 chars).');
        return false;
      }
    } else if (currentStep === 3) {
      if (!coverImage) {
        setValidationError('A cover image banner is required.');
        return false;
      }
    } else if (currentStep === 4) {
      if (previewUrl && previewUrlError) {
        setValidationError(previewUrlError);
        return false;
      }
    } else if (currentStep === 5) {
      if (packages.length === 0) {
        setValidationError('Please configure at least 1 pricing package.');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submit for Review
  const handleSubmitReview = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setValidationError(null);

    const check = checkPublishingRequirements(user);
    if (!check.canPublish) {
      setValidationError(`Publishing blocked: ${check.missingRequirements.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const savedId = await saveProductDraft(user, getProductSnapshot(), productId);
      await submitProductForReview(savedId, user);
      toast({
        title: 'Submitted for Review',
        message: 'Your product submission is now pending admin approval.',
        type: 'success',
      });
      setHasUnsavedChanges(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pubCheck = checkPublishingRequirements(user);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (hasUnsavedChanges) {
          if (confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose();
          }
        } else {
          onClose();
        }
      }}
      title={initialProduct ? 'Edit Software Listing' : 'Create Software Listing'}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-6 pt-2">
        {/* Wizard Steps Header Bar */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 border-b border-[var(--border-default)] text-xs font-bold gap-2">
          {[
            { step: 1, label: 'Basics' },
            { step: 2, label: 'Details' },
            { step: 3, label: 'Media' },
            { step: 4, label: 'Preview' },
            { step: 5, label: 'Packages' },
            { step: 6, label: 'Review' },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[var(--primary-coral)] text-white'
                    : isCompleted
                    ? 'bg-[var(--mint-surface)] text-[var(--mint-success)]'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <span>{item.step}.</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status & Autosave Bar */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5 text-[var(--lilac-accent)]" />
            {isAutosaving ? t('product.savingDraft') : lastSavedTime ? `Draft saved at ${lastSavedTime}` : 'Unsaved Draft'}
          </span>

          <Button variant="ghost" size="sm" onClick={handleSaveDraft} isLoading={isAutosaving}>
            Save Draft
          </Button>
        </div>

        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: BASICS */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <Input
              label={t('product.titleLabel')}
              placeholder={t('product.titlePlaceholder')}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              helperText={t('product.titleHelper')}
              required
            />

            <Textarea
              label={t('product.summaryLabel')}
              placeholder={t('product.summaryPlaceholder')}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setHasUnsavedChanges(true);
              }}
              helperText={t('product.summaryHelper')}
              rows={2}
              required
            />

            <Select
              label={t('product.categoryLabel')}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ProductCategory);
                setHasUnsavedChanges(true);
              }}
              options={PRODUCT_CATEGORIES.map((c) => ({
                value: c.id,
                label: isBn ? c.labelBn : c.labelEn,
              }))}
            />

            {/* Platform Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('product.platformsLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => {
                  const selected = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          if (platforms.length > 1) {
                            setPlatforms(platforms.filter((x) => x !== p.id));
                          }
                        } else {
                          setPlatforms([...platforms, p.id]);
                        }
                        setHasUnsavedChanges(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        selected
                          ? 'bg-[var(--primary-coral)] text-white border-[var(--primary-coral)]'
                          : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]'
                      }`}
                    >
                      {isBn ? p.labelBn : p.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* License Type */}
            <Select
              label={t('product.licenseLabel')}
              value={licenseType}
              onChange={(e) => {
                setLicenseType(e.target.value as LicenseType);
                setHasUnsavedChanges(true);
              }}
              options={LICENSE_OPTIONS.map((l) => ({
                value: l.id,
                label: `${isBn ? l.labelBn : l.labelEn} - ${l.descEn}`,
              }))}
            />
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <Textarea
              label={t('product.descriptionLabel')}
              placeholder={t('product.descriptionPlaceholder')}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasUnsavedChanges(true);
              }}
              rows={5}
              required
            />

            {/* Tech Stack Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('product.techStackLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {TECH_STACK_SUGGESTIONS.slice(0, 10).map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => {
                      if (!techStack.includes(sugg)) {
                        setTechStack([...techStack, sugg]);
                        setHasUnsavedChanges(true);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[var(--bg-card-subtle)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] text-[var(--text-secondary)]"
                  >
                    + {sugg}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] items-center">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--lilac-surface)] text-[var(--lilac-accent)] text-xs font-bold border border-[var(--lilac-border)]"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTechStack(techStack.filter((t) => t !== tech));
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && techInput.trim()) {
                      e.preventDefault();
                      setTechStack([...techStack, techInput.trim()]);
                      setTechInput('');
                      setHasUnsavedChanges(true);
                    }
                  }}
                  placeholder="Type tech and press Enter..."
                  className="bg-transparent border-none text-xs focus:outline-none flex-1 min-w-[120px]"
                />
              </div>
            </div>

            <Textarea
              label={t('product.demoAccessLabel')}
              placeholder={t('product.demoAccessPlaceholder')}
              value={demoAccessNote}
              onChange={(e) => {
                setDemoAccessNote(e.target.value);
                setHasUnsavedChanges(true);
              }}
              rows={2}
            />
          </div>
        )}

        {/* STEP 3: MEDIA */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-5">
            {/* Cover Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('product.coverImageLabel')}
              </label>
              {coverImage ? (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[var(--border-default)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage('');
                      setHasUnsavedChanges(true);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="p-6 rounded-2xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--primary-coral)] bg-[var(--bg-card-subtle)] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-[var(--primary-coral)]" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Upload Cover Banner (Compressed to WebP)
                  </span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Screenshots */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('product.screenshotsLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <div key={imgUrl} className="relative h-24 rounded-xl overflow-hidden border border-[var(--border-default)] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImages(images.filter((_, i) => i !== idx));
                        setHasUnsavedChanges(true);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {images.length < 8 && (
                  <label className="h-24 rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--primary-coral)] bg-[var(--bg-card-subtle)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                    <Plus className="w-5 h-5 text-[var(--primary-coral)]" />
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">Add Image</span>
                    <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* APK Upload (Android Build) */}
            <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex flex-col gap-3">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                {t('product.apkUploadLabel')}
              </label>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-400">
                {t('scope.apkDisclaimer')}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={ownershipConfirmed}
                  onChange={(e) => setOwnershipConfirmed(e.target.checked)}
                  className="rounded border-[var(--border-default)] text-[var(--primary-coral)] focus:ring-[var(--primary-coral)]"
                />
                <span>{t('scope.apkOwnershipCheck')}</span>
              </label>

              {apk ? (
                <div className="p-3 rounded-xl bg-[var(--mint-surface)] border border-[var(--mint-success)]/30 text-xs text-[var(--mint-success)] flex items-center justify-between">
                  <div>
                    <p className="font-bold">APK Attached ({apk.versionName})</p>
                    <p className="text-[10px] opacity-80">{(apk.sizeBytes / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setApk(undefined)}>
                    Remove APK
                  </Button>
                </div>
              ) : (
                <label className={`p-3 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  ownershipConfirmed ? 'border-[var(--primary-coral)] bg-[var(--bg-card)]' : 'border-[var(--border-default)] opacity-50 cursor-not-allowed'
                }`}>
                  <Upload className="w-4 h-4 text-[var(--primary-coral)]" />
                  <span className="text-xs font-semibold">Select .APK File (Max 100MB)</span>
                  <input
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    disabled={!ownershipConfirmed}
                    onChange={handleApkUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW URL */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-4">
            <Input
              label={t('product.previewUrlLabel')}
              placeholder={t('product.previewUrlPlaceholder')}
              value={previewUrl}
              onChange={(e) => handlePreviewUrlChange(e.target.value)}
              error={previewUrlError || undefined}
            />

            <div className="p-4 rounded-2xl bg-[var(--lilac-surface)] border border-[var(--lilac-border)] text-xs text-[var(--text-secondary)] space-y-2">
              <p className="font-bold text-[var(--text-primary)]">About Live Previews</p>
              <p className="leading-relaxed">{t('product.previewUrlNote')}</p>
            </div>
          </div>
        )}

        {/* STEP 5: PACKAGES */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
              {t('scope.noPaymentsNote')}
            </div>

            {packages.map((pkg, idx) => (
              <div key={pkg.id || idx} className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-coral)]">
                    Package {idx + 1}
                  </span>
                  {packages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPackages(packages.filter((_, i) => i !== idx));
                        setHasUnsavedChanges(true);
                      }}
                    >
                      {t('product.removePackageBtn')}
                    </Button>
                  )}
                </div>

                <Input
                  label={t('product.packageNameLabel')}
                  value={pkg.name}
                  onChange={(e) => {
                    const updated = [...packages];
                    updated[idx].name = e.target.value;
                    setPackages(updated);
                    setHasUnsavedChanges(true);
                  }}
                  required
                />

                <Textarea
                  label={t('product.packageDescLabel')}
                  value={pkg.description}
                  onChange={(e) => {
                    const updated = [...packages];
                    updated[idx].description = e.target.value;
                    setPackages(updated);
                    setHasUnsavedChanges(true);
                  }}
                  rows={2}
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label={t('product.priceLabel')}
                    type="number"
                    value={pkg.priceAmount}
                    onChange={(e) => {
                      const updated = [...packages];
                      updated[idx].priceAmount = parseFloat(e.target.value) || 0;
                      setPackages(updated);
                      setHasUnsavedChanges(true);
                    }}
                  />

                  <Select
                    label={t('product.currencyLabel')}
                    value={pkg.currency}
                    onChange={(e) => {
                      const updated = [...packages];
                      updated[idx].currency = e.target.value;
                      setPackages(updated);
                      setHasUnsavedChanges(true);
                    }}
                    options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))}
                  />

                  <Input
                    label={t('product.deliveryDaysLabel')}
                    type="number"
                    value={pkg.deliveryDays}
                    onChange={(e) => {
                      const updated = [...packages];
                      updated[idx].deliveryDays = parseInt(e.target.value) || 1;
                      setPackages(updated);
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
              </div>
            ))}

            {packages.length < 3 && (
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setPackages([
                    ...packages,
                    {
                      id: `pkg_${Date.now()}`,
                      name: `Extended Package ${packages.length + 1}`,
                      description: 'Includes full commercial license and extended support.',
                      priceAmount: 149,
                      currency: 'USD',
                      deliveryDays: 3,
                      includes: ['Commercial license', 'Priority support'],
                    },
                  ]);
                  setHasUnsavedChanges(true);
                }}
              >
                {t('product.addPackageBtn')}
              </Button>
            )}
          </div>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-6">
            {/* Checklist */}
            <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Publishing Requirements Checklist
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${user && !user.isAnonymous ? 'text-[var(--mint-success)]' : 'text-rose-500'}`} />
                  <span>Permanent Account (Non-guest)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${user?.emailVerified ? 'text-[var(--mint-success)]' : 'text-rose-500'}`} />
                  <span>Verified Email Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${user?.sellerProfile?.brandName ? 'text-[var(--mint-success)]' : 'text-rose-500'}`} />
                  <span>Completed Seller Storefront Profile</span>
                </div>
              </div>
            </div>

            {/* Buyer Live Preview Card */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                {t('product.previewCardTitle')}
              </span>
              <ProductCard
                product={{
                  id: productId || 'preview',
                  sellerId: user?.uid || 'seller',
                  sellerUsername: user?.username || 'seller',
                  sellerBrandName: user?.sellerProfile?.brandName || user?.displayName || 'Creator',
                  sellerAvatarUrl: user?.sellerProfile?.avatarUrl || user?.photoURL || undefined,
                  title: title || 'Untitled Software',
                  summary: summary || 'No summary provided',
                  description: description || '',
                  category,
                  platforms,
                  techStack,
                  tags,
                  features,
                  previewUrl,
                  coverImage,
                  images,
                  packages,
                  licenseType,
                  demoAccessNote,
                  status: 'pending',
                  searchTokens: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
              />
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)] mt-2">
          {currentStep > 1 ? (
            <Button variant="ghost" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={handlePrevStep}>
              Back
            </Button>
          ) : <div />}

          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={handleNextStep}>
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={!pubCheck.canPublish}
                leftIcon={<Send className="w-4 h-4" />}
                onClick={handleSubmitReview}
              >
                {t('product.submitForReview')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
