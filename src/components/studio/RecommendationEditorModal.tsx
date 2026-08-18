/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon, 
  MapPin, 
  Compass, 
  Sparkles, 
  Globe, 
  Link as LinkIcon, 
  Layers,
  ShieldCheck,
  Building2,
  Check,
  Clock,
  Phone,
  Mail,
  DollarSign,
  Tag,
  Info,
  Sliders,
  Eye,
  Send,
  AlertCircle,
  Upload,
  RefreshCw,
  Trash2,
  Loader2,
  FileImage
} from 'lucide-react';
import { Recommendation, Category } from '../../types';
import { calculateRecommendationCompleteness } from './utils/scoring';
import { 
  submitCanonicalRecommendationCreate, 
  buildCanonicalRecommendationPayload,
  fetchAuthoritativeServiceAreas,
  ServiceAreaOption,
  saveRecommendationDraft,
  fetchLatestDraftForRecommendation
} from '../../lib/recommendationWorkflowService';
import {
  MediaWorkflowState,
  validateLocalMediaFile,
  reserveRecommendationDraft,
  authorizeRecommendationMediaUpload,
  uploadFileToSignedUrl,
  confirmRecommendationMediaUpload,
  updateRecommendationMediaMetadata,
  verifyRecommendationMediaAsset,
  attachRecommendationMediaAsset,
  abandonRecommendationMediaAsset,
  getCanonicalMediaReference,
} from '../../lib/recommendationMediaService';

interface RecommendationEditorModalProps {
  initialRecommendation?: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recommendation: Recommendation, status: 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'RETIRED') => void;
  currentStatus?: 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'RETIRED';
}

const EXPERTISE_OPTIONS = [
  { id: 'exp-gastronomy-fine', name: 'Fine Dining & Gastronomy' },
  { id: 'exp-gastronomy-wine', name: 'Wine Tasting & Estates' },
  { id: 'exp-heritage-medieval', name: 'Medieval Monasteries & Fortresses' },
  { id: 'exp-nature-hiking', name: 'National Parks & Hiking' },
  { id: 'exp-wellness-thermal', name: 'Thermal Spas & Wellness' },
  { id: 'exp-culture-museums', name: 'Museums & Contemporary Art' },
];

const CAPABILITY_OPTIONS = [
  { id: 'cap-english-fluent', name: 'English Speaking Staff' },
  { id: 'cap-wheelchair-accessible', name: 'Wheelchair Accessible' },
  { id: 'cap-private-transfer', name: 'Private Concierge Transfer' },
  { id: 'cap-card-payment', name: 'Credit Card Payment' },
  { id: 'cap-family-friendly', name: 'Family & Child Friendly' },
];

const MOOD_OPTIONS = ['Serene', 'Vibrant', 'Cultural', 'Gastronomic', 'Historic', 'Scenic', 'Active', 'Romantic', 'Family'];

const CANONICAL_LANGUAGES = [
  { code: 'en', name: 'English (Primary)' },
  { code: 'sr', name: 'Serbian (Cyrillic/Latin)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'zh', name: 'Chinese (中文)' },
] as const;

export function RecommendationEditorModal({
  initialRecommendation,
  isOpen,
  onClose,
  onSave,
  currentStatus = 'CANDIDATE'
}: RecommendationEditorModalProps) {
  const isEditing = !!initialRecommendation;

  // Form State
  const [form, setForm] = useState<Partial<Recommendation>>({});
  const [selectedStatus, setSelectedStatus] = useState<'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'RETIRED'>(currentStatus);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'sr' | 'de' | 'ru' | 'es' | 'zh'>('en');
  
  // Dynamic Service Areas State
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaOption[]>([]);
  const [isLoadingServiceAreas, setIsLoadingServiceAreas] = useState<boolean>(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // WP-14C5D Primary Recommendation Media State
  const [mediaState, setMediaState] = useState<MediaWorkflowState>('empty');
  const reservationIdempotencyKeyRef = useRef<string>(`res_key_${crypto.randomUUID()}`);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileLocalPreview, setFileLocalPreview] = useState<string | null>(null);
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaStepStatus, setMediaStepStatus] = useState<{
    localValidation: 'idle' | 'pending' | 'success' | 'error';
    authorize: 'idle' | 'pending' | 'success' | 'error';
    upload: 'idle' | 'pending' | 'success' | 'error';
    confirm: 'idle' | 'pending' | 'success' | 'error';
    metadata: 'idle' | 'pending' | 'success' | 'error';
    verify: 'idle' | 'pending' | 'success' | 'error';
    attach: 'idle' | 'pending' | 'success' | 'error';
  }>({
    localValidation: 'idle',
    authorize: 'idle',
    upload: 'idle',
    confirm: 'idle',
    metadata: 'idle',
    verify: 'idle',
    attach: 'idle',
  });

  // Handle local image file selection
  const handleSelectFile = (file: File) => {
    setMediaError(null);
    const valResult = validateLocalMediaFile(file);
    if (!valResult.valid) {
      setMediaError(valResult.error || 'Invalid file selection.');
      setMediaState('error');
      setSelectedFile(null);
      setFileLocalPreview(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFileLocalPreview(objectUrl);
    setMediaState('selected');
    setMediaStepStatus({
      localValidation: 'success',
      authorize: 'idle',
      upload: 'idle',
      confirm: 'idle',
      metadata: 'idle',
      verify: 'idle',
      attach: 'idle',
    });
  };

  // Handle execution of the 6-step governed media upload pipeline
  const handleStartMediaPipeline = async () => {
    if (!selectedFile) {
      setMediaError('Please select a valid image file first.');
      return;
    }

    setMediaError(null);

    const destId = form.serviceAreaId || serviceAreas[0]?.id;
    if (!destId || !destId.trim()) {
      setMediaError('Canonical Service Area (Destination ID) is required in Step 1 before uploading media.');
      return;
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let reservedRecId = (form.id && UUID_REGEX.test(form.id)) ? form.id : '';

    if (!reservedRecId) {
      setMediaState('authorizing');
      setMediaStepStatus(s => ({ ...s, authorize: 'pending' }));
      const reserveRes = await reserveRecommendationDraft(destId, reservationIdempotencyKeyRef.current);
      if (!reserveRes.success || !reserveRes.reserved_recommendation_id) {
        if (reserveRes.error === 'MEDIA_AUTH_REQUIRED' || reserveRes.error === 'UNAUTHORIZED') {
          setMediaError('MEDIA_AUTH_REQUIRED: Valid Studio user session access token is required to reserve a draft.');
        } else {
          setMediaError(reserveRes.message || reserveRes.error || 'Server draft reservation failed.');
        }
        setMediaState('error');
        setMediaStepStatus(s => ({ ...s, authorize: 'error' }));
        return;
      }
      reservedRecId = reserveRes.reserved_recommendation_id;
      setForm(prev => ({ ...prev, id: reservedRecId }));
    }

    // 1. Local Validation
    setMediaStepStatus(s => ({ ...s, localValidation: 'pending' }));
    const valResult = validateLocalMediaFile(selectedFile);
    if (!valResult.valid) {
      setMediaError(valResult.error || 'Validation failed');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, localValidation: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, localValidation: 'success' }));

    // 2. Authorize Upload
    setMediaState('authorizing');
    setMediaStepStatus(s => ({ ...s, authorize: 'pending' }));

    const authRes = await authorizeRecommendationMediaUpload({
      destination_id: destId,
      reserved_recommendation_id: reservedRecId,
      mime_type: selectedFile.type,
      file_size_bytes: selectedFile.size,
      original_filename: selectedFile.name,
      replacement_asset_id: currentAssetId || undefined,
    });

    if (!authRes.success) {
      if (authRes.error === 'MEDIA_AUTH_REQUIRED' || authRes.error === 'UNAUTHORIZED') {
        setMediaError('MEDIA_AUTH_REQUIRED: Valid Studio user session access token is required to perform media operations.');
      } else if (authRes.error === 'MEDIA_SERVICE_UNAVAILABLE' || authRes.error === 'NO_SUPABASE' || authRes.error === 'NO_SUPABASE_CLIENT') {
        setMediaError('MEDIA_SERVICE_UNAVAILABLE: Editorial workflow engine backend is unavailable. Selected file preserved for retry.');
      } else if (authRes.error === 'MEDIA_AUTHORIZATION_INVALID') {
        setMediaError('MEDIA_AUTHORIZATION_INVALID: Upload authorization response is missing required fields or invalid.');
      } else {
        setMediaError(authRes.message || authRes.error || 'Upload authorization failed.');
      }
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, authorize: 'error' }));
      return;
    }

    setMediaStepStatus(s => ({ ...s, authorize: 'success' }));
    setCurrentAssetId(authRes.asset_id!);

    // 3. Signed Storage Upload
    setMediaState('uploading');
    setMediaStepStatus(s => ({ ...s, upload: 'pending' }));

    const uploadBucket = authRes.bucket!;
    const uploadPath = (authRes.object_path || authRes.path)!;
    const uploadToken = authRes.token!;

    const uploadRes = await uploadFileToSignedUrl(
      selectedFile,
      uploadBucket,
      uploadPath,
      uploadToken,
      authRes.signed_upload_url
    );

    if (!uploadRes.success) {
      setMediaError(uploadRes.error || 'Failed to upload image file to storage bucket.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, upload: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, upload: 'success' }));

    // 4. Confirm Upload
    setMediaState('confirming');
    setMediaStepStatus(s => ({ ...s, confirm: 'pending' }));

    const confirmRes = await confirmRecommendationMediaUpload(authRes.asset_id!);
    if (!confirmRes.success) {
      setMediaError(confirmRes.message || confirmRes.error || 'Failed to confirm upload object in storage.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, confirm: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, confirm: 'success' }));

    // 5. Update Metadata & Provenance
    setMediaState('updating_metadata');
    setMediaStepStatus(s => ({ ...s, metadata: 'pending' }));

    const metaRes = await updateRecommendationMediaMetadata(authRes.asset_id!, {
      altText: {
        en: form.title || selectedFile.name,
        sr: form.titleSr || form.title || selectedFile.name,
      },
      provenanceSource: form.provenance?.source || 'Studio Verified Upload',
      acquisitionMethod: form.provenance?.method === 'Direct Curation' || form.provenance?.method === 'Direct Inspection' || form.provenance?.method === 'Direct Verification' ? 'original' : (form.provenance?.method || 'original'),
      licenceType: form.provenance?.license === 'CC-BY 4.0' ? 'CC-BY-4.0' : (form.provenance?.license || 'CC-BY-4.0'),
      attributionRequired: form.provenance?.attributionRequired || false,
      attributionText: form.provenance?.attributionText || '',
    });

    if (!metaRes.success) {
      setMediaError(metaRes.message || metaRes.error || 'Failed to register provenance metadata.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, metadata: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, metadata: 'success' }));

    // 6. Verify Asset
    setMediaState('verifying');
    setMediaStepStatus(s => ({ ...s, verify: 'pending' }));

    const verifyRes = await verifyRecommendationMediaAsset(authRes.asset_id!);
    if (!verifyRes.success) {
      setMediaError(verifyRes.message || verifyRes.error || 'Media asset verification failed.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, verify: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, verify: 'success' }));

    // 7. Attach Asset
    setMediaState('attaching');
    setMediaStepStatus(s => ({ ...s, attach: 'pending' }));

    const attachRes = await attachRecommendationMediaAsset(authRes.asset_id!);
    if (!attachRes.success) {
      setMediaError(attachRes.message || attachRes.error || 'Failed to attach media asset to recommendation workflow.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, attach: 'error' }));
      return;
    }

    setMediaStepStatus(s => ({ ...s, attach: 'success' }));

    const canonicalRef = attachRes.canonical_url || (attachRes.object_path ? getCanonicalMediaReference(attachRes.object_path) : (authRes.object_path ? getCanonicalMediaReference(authRes.object_path) : ''));

    setForm(prev => ({
      ...prev,
      id: reservedRecId,
      image: canonicalRef,
      provenance: {
        ...prev.provenance,
        source: prev.provenance?.source || 'Studio Verified Upload',
        method: prev.provenance?.method || 'original',
        license: prev.provenance?.license || 'CC-BY-4.0',
      }
    }));

    setMediaState('attached');
  };

  // Handle replace or abandon media
  const handleAbandonOrReplace = async () => {
    if (currentAssetId) {
      setMediaState('abandoning');
      await abandonRecommendationMediaAsset(currentAssetId, 'User requested image replacement in Studio');
    }
    setSelectedFile(null);
    setFileLocalPreview(null);
    setCurrentAssetId(null);
    setMediaError(null);
    setMediaState('empty');
    setForm(prev => ({ ...prev, image: '' }));
    setMediaStepStatus({
      localValidation: 'idle',
      authorize: 'idle',
      upload: 'idle',
      confirm: 'idle',
      metadata: 'idle',
      verify: 'idle',
      attach: 'idle',
    });
  };

  // Load service areas from public.service_areas
  useEffect(() => {
    let mounted = true;
    async function loadServiceAreas() {
      setIsLoadingServiceAreas(true);
      const areas = await fetchAuthoritativeServiceAreas();
      if (mounted) {
        setServiceAreas(areas);
        setIsLoadingServiceAreas(false);
      }
    }
    loadServiceAreas();
    return () => { mounted = false; };
  }, [isOpen]);

  // Initialize or reset form state
  useEffect(() => {
    if (initialRecommendation) {
      const existingTranslations = initialRecommendation.translations || {};
      setForm({
        ...initialRecommendation,
        serviceAreaId: initialRecommendation.serviceAreaId || '',
        categories: initialRecommendation.categories || [String(initialRecommendation.category || Category.GASTRONOMY)],
        expertiseIds: initialRecommendation.expertiseIds || [],
        capabilityIds: initialRecommendation.capabilityIds || [],
        moods: initialRecommendation.moods || ['Serene'],
        titleSr: initialRecommendation.titleSr || existingTranslations.sr?.title || '',
        shortDescriptionSr: initialRecommendation.shortDescriptionSr || existingTranslations.sr?.shortDescription || '',
        longDescriptionSr: initialRecommendation.longDescriptionSr || existingTranslations.sr?.longDescription || '',
        locationSr: initialRecommendation.locationSr || existingTranslations.sr?.location || '',
        practicalInfo: {
          opening_hours: initialRecommendation.practicalInfo?.opening_hours || '',
          contact_phone: initialRecommendation.practicalInfo?.contact_phone || initialRecommendation.phone || '',
          contact_email: initialRecommendation.practicalInfo?.contact_email || '',
          website: initialRecommendation.practicalInfo?.website || initialRecommendation.website || '',
          admission_fee: initialRecommendation.practicalInfo?.admission_fee || initialRecommendation.estimatedCost || '',
        },
        provenance: {
          source: initialRecommendation.provenance?.source || 'Curator Archive',
          method: initialRecommendation.provenance?.method || 'original',
          license: initialRecommendation.provenance?.license || 'CC-BY-4.0',
          attributionRequired: initialRecommendation.provenance?.attributionRequired ?? false,
          attributionText: initialRecommendation.provenance?.attributionText || '',
          verificationStatus: initialRecommendation.provenance?.verificationStatus || 'Verified',
          altText: initialRecommendation.provenance?.altText || initialRecommendation.title || '',
        },
        translations: {
          en: {
            title: existingTranslations.en?.title || initialRecommendation.title || '',
            shortDescription: existingTranslations.en?.shortDescription || initialRecommendation.shortDescription || '',
            longDescription: existingTranslations.en?.longDescription || initialRecommendation.longDescription || '',
            location: existingTranslations.en?.location || initialRecommendation.location || '',
            bestTimeToVisit: existingTranslations.en?.bestTimeToVisit || initialRecommendation.bestTimeToVisitEn || '',
            insiderTip: existingTranslations.en?.insiderTip || initialRecommendation.insiderTipEn || '',
          },
          sr: {
            title: existingTranslations.sr?.title || initialRecommendation.titleSr || '',
            shortDescription: existingTranslations.sr?.shortDescription || initialRecommendation.shortDescriptionSr || '',
            longDescription: existingTranslations.sr?.longDescription || initialRecommendation.longDescriptionSr || '',
            location: existingTranslations.sr?.location || initialRecommendation.locationSr || '',
            bestTimeToVisit: existingTranslations.sr?.bestTimeToVisit || initialRecommendation.bestTimeToVisitSr || '',
            insiderTip: existingTranslations.sr?.insiderTip || initialRecommendation.insiderTipSr || '',
          },
          de: existingTranslations.de || {},
          ru: existingTranslations.ru || {},
          es: existingTranslations.es || {},
          zh: existingTranslations.zh || {},
        },
      });
      setSelectedStatus(currentStatus);
    } else {
      // Default empty form for creation
      setForm({
        id: `rec-temp-${Date.now()}`,
        serviceAreaId: '',
        title: '',
        titleSr: '',
        category: Category.GASTRONOMY,
        categories: [Category.GASTRONOMY],
        expertiseIds: ['exp-gastronomy-fine'],
        capabilityIds: ['cap-english-fluent'],
        shortDescription: '',
        longDescription: '',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
        location: 'Belgrade, Serbia',
        locationSr: 'Београд, Србија',
        duration: '2-3 hours',
        travelTime: '15 mins',
        travelTimeMinutes: 15,
        estimatedCost: '€€',
        preferredTransport: 'Taxi / Walking',
        coordinateX: 0.5,
        coordinateY: 0.5,
        coordinates: { lat: 44.8176, lng: 20.4569 },
        energy: 0.5,
        social: 0.5,
        luxury: 0.5,
        urbanity: 0.5,
        nature: 0.5,
        weatherDependency: 0.2,
        seasonality: 'all',
        familySuitability: true,
        accessibility: true,
        premiumLevel: 'standard',
        budgetLevel: 'moderate',
        moods: ['Serene', 'Gastronomic'],
        website: '',
        phone: '',
        practicalInfo: {
          opening_hours: '09:00 - 22:00 Daily',
          contact_phone: '+381 11 328 1234',
          contact_email: 'concierge@experience.rs',
          website: 'https://experience.rs',
          admission_fee: 'Free entry / Ala carte',
        },
        provenance: {
          source: 'Studio Editorial Team',
          method: 'original',
          license: 'CC-BY-4.0',
          attributionRequired: false,
          attributionText: 'IDEMO Serbia Curations',
          verificationStatus: 'Verified',
          altText: 'Belgrade Gastronomy Experience',
        },
        translations: {
          en: { title: '', shortDescription: '', longDescription: '', location: 'Belgrade, Serbia' },
          sr: { title: '', shortDescription: '', longDescription: '', location: 'Београд, Србија' },
          de: { title: '', shortDescription: '', longDescription: '', location: '' },
          ru: { title: '', shortDescription: '', longDescription: '', location: '' },
          es: { title: '', shortDescription: '', longDescription: '', location: '' },
          zh: { title: '', shortDescription: '', longDescription: '', location: '' },
        }
      });
      setSelectedStatus('CANDIDATE');
    }
    setCurrentStep(1);
    setSubmissionFeedback(null);

    let mounted = true;
    async function checkForServerDraft() {
      if (!isOpen || !initialRecommendation) return;
      const recId = initialRecommendation.dbId || initialRecommendation.id;
      if (!recId) return;

      const draft = await fetchLatestDraftForRecommendation(recId);
      if (draft && mounted) {
        setForm(prev => {
          const draftTranslations = draft.translations || {};
          return {
            ...prev,
            ...draft,
            title: draft.title || prev.title,
            shortDescription: draft.shortDescription || prev.shortDescription,
            longDescription: draft.longDescription || prev.longDescription,
            location: draft.location || prev.location,
            titleSr: draft.titleSr || prev.titleSr || draftTranslations.sr?.title || '',
            shortDescriptionSr: draft.shortDescriptionSr || prev.shortDescriptionSr || draftTranslations.sr?.shortDescription || '',
            longDescriptionSr: draft.longDescriptionSr || prev.longDescriptionSr || draftTranslations.sr?.longDescription || '',
            locationSr: draft.locationSr || prev.locationSr || draftTranslations.sr?.location || '',
            translations: {
              ...prev.translations,
              ...draftTranslations,
            },
          };
        });
      }
    }

    if (isOpen && initialRecommendation) {
      checkForServerDraft();
    }

    return () => { mounted = false; };
  }, [initialRecommendation, currentStatus, isOpen]);

  // Synchronization helper for EN/SR direct fields and translations object
  const updateFieldWithSync = (field: string, val: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };

      // Keep title synced
      if (field === 'title') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, title: val }
        };
      } else if (field === 'titleSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, title: val }
        };
      } else if (field === 'shortDescription') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, shortDescription: val }
        };
      } else if (field === 'shortDescriptionSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, shortDescription: val }
        };
      } else if (field === 'longDescription') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, longDescription: val }
        };
      } else if (field === 'longDescriptionSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, longDescription: val }
        };
      } else if (field === 'location') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, location: val }
        };
      } else if (field === 'locationSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, location: val }
        };
      }

      return next;
    });
  };

  // Update translation for specific language
  const updateTranslationField = (lang: 'en' | 'sr' | 'de' | 'ru' | 'es' | 'zh', key: string, val: string) => {
    setForm(prev => {
      const langObj = prev.translations?.[lang] || {};
      const updatedLang = { ...langObj, [key]: val };
      const updatedTrans = { ...prev.translations, [lang]: updatedLang };

      const next = { ...prev, translations: updatedTrans };

      // Sync EN/SR back to direct fields if editing EN/SR tab
      if (lang === 'en') {
        if (key === 'title') next.title = val;
        if (key === 'shortDescription') next.shortDescription = val;
        if (key === 'longDescription') next.longDescription = val;
        if (key === 'location') next.location = val;
      } else if (lang === 'sr') {
        if (key === 'title') next.titleSr = val;
        if (key === 'shortDescription') next.shortDescriptionSr = val;
        if (key === 'longDescription') next.longDescriptionSr = val;
        if (key === 'location') next.locationSr = val;
      }

      return next;
    });
  };

  // Validation checks & completeness
  const completeness = calculateRecommendationCompleteness(form, selectedStatus);

  // Field validation errors
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.serviceAreaId || !form.serviceAreaId.trim()) {
      errors.push('Destination service area selection is required.');
    }
    if (!form.title || form.title.trim().length === 0) {
      errors.push('English Title is required.');
    } else if (form.title.length > 255) {
      errors.push('Title exceeds maximum allowed length of 255 characters.');
    }

    if (form.shortDescription && form.shortDescription.length > 500) {
      errors.push('Short description exceeds maximum allowed length of 500 characters.');
    }

    if (form.longDescription && form.longDescription.length > 5000) {
      errors.push('Long description exceeds maximum allowed length of 5000 characters.');
    }

    if (form.coordinates?.lat !== undefined) {
      if (isNaN(form.coordinates.lat) || form.coordinates.lat < -90 || form.coordinates.lat > 90) {
        errors.push('Latitude must be a valid number between -90 and 90.');
      }
    }

    if (form.coordinates?.lng !== undefined) {
      if (isNaN(form.coordinates.lng) || form.coordinates.lng < -180 || form.coordinates.lng > 180) {
        errors.push('Longitude must be a valid number between -180 and 180.');
      }
    }

    if (form.travelTimeMinutes !== undefined && form.travelTimeMinutes < 0) {
      errors.push('Travel time in minutes cannot be negative.');
    }

    if (form.practicalInfo?.contact_email && form.practicalInfo.contact_email.trim().length > 0) {
      if (!form.practicalInfo.contact_email.includes('@')) {
        errors.push('Contact email format is invalid.');
      }
    }

    // Defect 5: Submission Gate - Media Validation Rules
    if (selectedFile || fileLocalPreview || mediaState !== 'empty') {
      if (mediaState !== 'attached') {
        errors.push('Media upload pipeline must complete backend verification and attachment before submission.');
      }
    }

    if (form.image) {
      if (form.image.startsWith('blob:') || form.image.startsWith('data:')) {
        errors.push('Local preview images (blob URLs) cannot be submitted as permanent recommendation media.');
      }
      if (form.image.includes('/storage/v1/object/public/')) {
        errors.push('Recommendation media bucket is private and cannot be referenced via public storage URL.');
      }
      if (form.image.includes('token=') || form.image.includes('signed_upload_url')) {
        errors.push('Signed upload URLs or tokens cannot be persisted as permanent media references.');
      }
    }

    return errors;
  }, [form, selectedFile, fileLocalPreview, mediaState]);

  // Overall localization completeness percentage
  const localizationProgress = useMemo(() => {
    let completedCount = 0;
    CANONICAL_LANGUAGES.forEach(lang => {
      const trans = form.translations?.[lang.code];
      if (trans?.title && trans?.shortDescription) {
        completedCount++;
      }
    });
    return Math.round((completedCount / CANONICAL_LANGUAGES.length) * 100);
  }, [form.translations]);

  // Handle Form Submission via RPC / Handler
  const handleSubmitCanonical = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
      setSubmissionFeedback({
        type: 'error',
        message: `Cannot submit recommendation due to blocking errors: ${validationErrors.join(' ')}`
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback({ type: 'info', message: 'Validating canonical recommendation payload and submitting via RPC...' });

    try {
      const destinationId = form.serviceAreaId;
      if (!destinationId || !destinationId.trim()) {
        setSubmissionFeedback({
          type: 'error',
          message: 'A valid destination service area selection is strictly required before submission.'
        });
        setIsSubmitting(false);
        return;
      }
      const res = await submitCanonicalRecommendationCreate(form, destinationId);

      if (res.success) {
        setSubmissionFeedback({
          type: 'success',
          message: res.message || 'Canonical recommendation successfully submitted and verified!'
        });

        // Construct clean recommendation object for UI state
        const savedRec: Recommendation = {
          ...(form as Recommendation),
          id: form.id || `rec-${Date.now()}`,
          publicationStatus: selectedStatus === 'APPROVED' ? 'CANONICAL' : 'RESEARCH_CANDIDATE',
        };

        setTimeout(() => {
          onSave(savedRec, selectedStatus);
          onClose();
        }, 800);
      } else {
        setSubmissionFeedback({
          type: 'error',
          message: res.message || res.error || 'Failed to submit recommendation.'
        });
      }
    } catch (err: any) {
      setSubmissionFeedback({
        type: 'error',
        message: `Submission exception: ${err?.message || String(err)}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Draft durably to PostgreSQL backend via RPC
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setSubmissionFeedback({ type: 'info', message: 'Saving recommendation draft to authoritative backend...' });

    try {
      const res = await saveRecommendationDraft(form, form.serviceAreaId);

      if (res.success === true) {
        setSubmissionFeedback({
          type: 'success',
          message: res.message || 'Draft successfully persisted to authoritative server!'
        });

        const savedRec: Recommendation = {
          ...(form as Recommendation),
          id: res.proposed_recommendation_id || form.id || `rec-draft-${Date.now()}`,
        };

        setTimeout(() => {
          onSave(savedRec, selectedStatus);
          onClose();
        }, 600);
      } else {
        setSubmissionFeedback({
          type: 'error',
          message: res.message || res.error || 'Failed to save draft to backend.'
        });
      }
    } catch (err: any) {
      setSubmissionFeedback({
        type: 'error',
        message: `Draft save exception: ${err?.message || String(err)}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-5xl bg-white border border-[#E5E3DB] rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#23251E] text-white p-4 sm:p-5 px-6 flex items-center justify-between border-b border-[#32352B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#C5A059]">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold block">
                {isEditing ? `EDITING CANONICAL REC #${form.id}` : 'CREATE CANONICAL RECOMMENDATION (WP-14C5B)'}
              </span>
              <h2 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
                {isEditing ? `Edit: ${form.title || 'Untitled'}` : 'Create Recommendation'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 6-Step Governed Wizard Bar */}
        <div className="bg-[#FAF9F5] border-b border-[#E5E3DB] px-4 sm:px-6 py-2.5 flex items-center justify-between overflow-x-auto shrink-0 font-mono text-xs gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { step: 1, label: '1. Identity & Taxonomy' },
              { step: 2, label: '2. Content & Media' },
              { step: 3, label: '3. Practical & Geo' },
              { step: 4, label: '4. Mood Orbit' },
              { step: 5, label: '5. Localization' },
              { step: 6, label: '6. Review & Validate' },
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentStep === s.step 
                    ? 'bg-[#23251E] text-white shadow-xs' 
                    : 'bg-white/80 text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10.5px]">
            <span className="text-[#8C8A7D]">Lifecycle Status:</span>
            <span className="font-bold text-[#8A1F1F] uppercase">{selectedStatus}</span>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmitCanonical} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Feedback banner */}
          {submissionFeedback && (
            <div className={`p-4 rounded-2xl border font-mono text-xs flex items-center gap-3 ${
              submissionFeedback.type === 'error' ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]' :
              submissionFeedback.type === 'success' ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]' :
              'bg-[#E3F2FD] border-[#BBDEFB] text-[#1565C0]'
            }`}>
              <AlertCircle size={18} className="shrink-0" />
              <span>{submissionFeedback.message}</span>
            </div>
          )}

          {/* STEP 1: IDENTITY & TAXONOMY */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <Tag size={16} className="text-[#C5A059]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Canonical Service Area & Titles
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service Area UUID */}
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Canonical Service Area / Destination (UUID) *
                    </label>
                    {isLoadingServiceAreas ? (
                      <div className="h-11 px-3.5 bg-white border border-[#E5E3DB] rounded-xl flex items-center font-mono text-xs text-[#8C8A7D]">
                        Loading service areas from public.service_areas...
                      </div>
                    ) : serviceAreas.length === 0 ? (
                      <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs font-mono text-[#C62828] flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>No active service areas found in public.service_areas. Recommendation creation is blocked.</span>
                      </div>
                    ) : (
                      <select
                        value={form.serviceAreaId || ''}
                        onChange={(e) => setForm({ ...form, serviceAreaId: e.target.value })}
                        className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Select Authoritative Service Area --</option>
                        {serviceAreas.map((sa) => (
                          <option key={sa.id} value={sa.id}>
                            {sa.name_en} {sa.name_sr ? `(${sa.name_sr})` : ''} [{sa.id}]
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Title EN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        English Title (Primary) *
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.title || '').length}/255
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.title || ''}
                      onChange={(e) => updateFieldWithSync('title', e.target.value)}
                      placeholder="e.g., Kalemegdan Fortress Sunset Walk"
                      className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
                    />
                  </div>

                  {/* Title SR */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        Serbian Title (Cyrillic / Latin)
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.titleSr || '').length}/255
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={255}
                      value={form.titleSr || ''}
                      onChange={(e) => updateFieldWithSync('titleSr', e.target.value)}
                      placeholder="e.g., Залазак сунца на Калемегдану"
                      className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Category Selection */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#8A1F1F]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Multi-Category Taxonomy
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-[#8C8A7D]">
                    Primary: {form.category} | Total: {form.categories?.length || 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Primary Category *
                    </label>
                    <select
                      value={form.category || Category.GASTRONOMY}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const existingCats = form.categories || [];
                        const updatedCats = Array.from(new Set([newCat, ...existingCats]));
                        setForm({ ...form, category: newCat, categories: updatedCats });
                      }}
                      className="w-full h-11 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                    >
                      {Object.values(Category).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Additional Categories (Chips)
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-[#E5E3DB] rounded-xl min-h-[44px]">
                      {Object.values(Category).map((cat) => {
                        const isSelected = form.categories?.includes(cat);
                        const isPrimary = form.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              let nextCats = form.categories || [];
                              if (isSelected) {
                                if (isPrimary) return; // Cannot remove primary
                                nextCats = nextCats.filter(c => c !== cat);
                              } else {
                                if (nextCats.length >= 10) return;
                                nextCats = [...nextCats, cat];
                              }
                              setForm({ ...form, categories: nextCats });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              isPrimary ? 'bg-[#23251E] text-white cursor-not-allowed' :
                              isSelected ? 'bg-[#C5A059] text-white cursor-pointer' :
                              'bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20] cursor-pointer border border-[#E5E3DB]'
                            }`}
                          >
                            {cat} {isPrimary && '(Primary)'} {isSelected && !isPrimary && '×'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expertise & Capability Taxonomy Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expertise IDs */}
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Expertise Identifiers (`expertise_ids`)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 font-mono text-xs">
                    {EXPERTISE_OPTIONS.map((exp) => {
                      const isChecked = form.expertiseIds?.includes(exp.id);
                      return (
                        <label key={exp.id} className="flex items-center gap-2 cursor-pointer hover:text-[#1E2E20]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const curr = form.expertiseIds || [];
                              const next = e.target.checked ? [...curr, exp.id] : curr.filter(id => id !== exp.id);
                              setForm({ ...form, expertiseIds: next });
                            }}
                            className="accent-[#23251E]"
                          />
                          <span className="text-[11px] text-[#1E2E20]">{exp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Capability IDs */}
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Capability Identifiers (`capability_ids`)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 font-mono text-xs">
                    {CAPABILITY_OPTIONS.map((cap) => {
                      const isChecked = form.capabilityIds?.includes(cap.id);
                      return (
                        <label key={cap.id} className="flex items-center gap-2 cursor-pointer hover:text-[#1E2E20]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const curr = form.capabilityIds || [];
                              const next = e.target.checked ? [...curr, cap.id] : curr.filter(id => id !== cap.id);
                              setForm({ ...form, capabilityIds: next });
                            }}
                            className="accent-[#23251E]"
                          />
                          <span className="text-[11px] text-[#1E2E20]">{cap.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Location Strings */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    English Location Name *
                  </label>
                  <input
                    type="text"
                    value={form.location || ''}
                    onChange={(e) => updateFieldWithSync('location', e.target.value)}
                    placeholder="e.g., Belgrade Fortress, Belgrade"
                    className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Serbian Location Name
                  </label>
                  <input
                    type="text"
                    value={form.locationSr || ''}
                    onChange={(e) => updateFieldWithSync('locationSr', e.target.value)}
                    placeholder="e.g., Београдска тврђава, Београд"
                    className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDITORIAL CONTENT & PRIMARY MEDIA */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Descriptions */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-2">
                  Editorial Descriptions & Curator Notes
                </h3>

                {/* Short Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        English Short Overview (~50 words) *
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.shortDescription || '').length}/500
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={form.shortDescription || ''}
                      onChange={(e) => updateFieldWithSync('shortDescription', e.target.value)}
                      placeholder="Concise overview highlighting key traveler experience..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        Serbian Short Overview
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.shortDescriptionSr || '').length}/500
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={form.shortDescriptionSr || ''}
                      onChange={(e) => updateFieldWithSync('shortDescriptionSr', e.target.value)}
                      placeholder="Кратак преглед за српске посетиоце..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Long Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        English Long Story & Advice *
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.longDescription || '').length}/5000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={form.longDescription || ''}
                      onChange={(e) => updateFieldWithSync('longDescription', e.target.value)}
                      placeholder="Detailed background story, insider advice, best times to visit..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        Serbian Long Story & Advice
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.longDescriptionSr || '').length}/5000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={form.longDescriptionSr || ''}
                      onChange={(e) => updateFieldWithSync('longDescriptionSr', e.target.value)}
                      placeholder="Детаљна историја и савети куратора..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Best Time to Visit & Insider Tip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E3DB]">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Best Time To Visit (EN)
                    </label>
                    <input
                      type="text"
                      value={form.bestTimeToVisitEn || ''}
                      onChange={(e) => setForm({ ...form, bestTimeToVisitEn: e.target.value })}
                      placeholder="e.g., Late afternoon for sunset"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Insider Tip (EN)
                    </label>
                    <input
                      type="text"
                      value={form.insiderTipEn || ''}
                      onChange={(e) => setForm({ ...form, insiderTipEn: e.target.value })}
                      placeholder="e.g., Reserve a terrace table in advance"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Image & Governed Media Pipeline Workspace (WP-14C5D) */}
              <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-[#C5A059]" />
                    <div>
                      <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                        Primary Recommendation Media & Provenance
                      </h3>
                      <p className="font-mono text-[10px] text-[#8C8A7D]">
                        Governed Media Foundation (`recommendation-media` storage)
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="flex items-center gap-2">
                    {mediaState === 'empty' && !form.image && (
                      <span className="px-2.5 py-1 rounded-md bg-[#F0EFEA] text-[#8C8A7D] font-mono text-[9px] font-bold uppercase border border-[#E5E3DB]">
                        No Media Attached
                      </span>
                    )}
                    {mediaState === 'selected' && (
                      <span className="px-2.5 py-1 rounded-md bg-[#FFF8E1] text-[#F57F17] font-mono text-[9px] font-bold uppercase border border-[#FFE082]">
                        Ready to Process & Upload
                      </span>
                    )}
                    {['authorizing', 'uploading', 'confirming', 'updating_metadata', 'verifying', 'attaching'].includes(mediaState) && (
                      <span className="px-2.5 py-1 rounded-md bg-[#E3F2FD] text-[#1976D2] font-mono text-[9px] font-bold uppercase border border-[#90CAF9] flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin text-[#1976D2]" />
                        <span>Processing Pipeline ({mediaState})</span>
                      </span>
                    )}
                    {(form.image || mediaState === 'attached' || mediaState === 'verified') && (
                      <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#2E7D32] font-mono text-[9px] font-bold uppercase border border-[#A5D6A7] flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-[#2E7D32]" />
                        <span>Media Verified & Attached</span>
                      </span>
                    )}
                    {mediaState === 'error' && (
                      <span className="px-2.5 py-1 rounded-md bg-[#FFEBEE] text-[#C62828] font-mono text-[9px] font-bold uppercase border border-[#EF9A9A] flex items-center gap-1">
                        <AlertTriangle size={10} className="text-[#C62828]" />
                        <span>Pipeline Failure</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Media Error Message */}
                {mediaError && (
                  <div className="p-3 bg-[#FFEBEE] border border-[#EF9A9A] rounded-xl text-xs font-mono text-[#C62828] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{mediaError}</span>
                  </div>
                )}

                {/* State 1: File Upload Dropzone (When Empty or Error) */}
                {(mediaState === 'empty' || mediaState === 'error') && !form.image && (
                  <div className="border-2 border-dashed border-[#D4D1C7] hover:border-[#C5A059] rounded-2xl p-6 text-center bg-white transition-all">
                    <div className="w-12 h-12 rounded-full bg-[#FAF9F5] border border-[#E5E3DB] flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                      <Upload size={20} />
                    </div>
                    <p className="font-mono text-xs font-bold text-[#1E2E20] uppercase tracking-wide">
                      Select Primary Image
                    </p>
                    <p className="font-mono text-[10px] text-[#8C8A7D] mt-1 mb-4">
                      JPEG, PNG, or WebP up to 5 MB. Strictly governed storage contract.
                    </p>
                    <label className="px-4 py-2 bg-[#23251E] hover:bg-[#32352B] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-sm">
                      <FileImage size={14} className="text-[#C5A059]" />
                      <span>Browse Image File</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                )}

                {/* State 2: Selected File Inspection & Execution Button */}
                {mediaState === 'selected' && selectedFile && (
                  <div className="p-4 bg-white border border-[#E5E3DB] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {fileLocalPreview && (
                          <img src={fileLocalPreview} alt="Selected preview" className="w-14 h-14 object-cover rounded-lg border border-[#E5E3DB]" />
                        )}
                        <div>
                          <p className="font-mono text-xs font-bold text-[#1E2E20]">{selectedFile.name}</p>
                          <p className="font-mono text-[10px] text-[#8C8A7D]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setFileLocalPreview(null); setMediaState('empty'); }}
                          className="px-3 py-1.5 border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20] rounded-lg font-mono text-[10px] uppercase font-bold cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleStartMediaPipeline}
                          className="px-4 py-2 bg-[#23251E] hover:bg-[#32352B] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                          <Upload size={14} className="text-[#C5A059]" />
                          <span>Process & Upload Primary Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* State 3: Pipeline Processing Dashboard */}
                {['authorizing', 'uploading', 'confirming', 'updating_metadata', 'verifying', 'attaching'].includes(mediaState) && (
                  <div className="p-4 bg-white border border-[#E5E3DB] rounded-xl space-y-2 font-mono text-xs">
                    <p className="text-[10px] uppercase font-bold text-[#8C8A7D] mb-2">Executing Governed Media Upload Pipeline</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.localValidation === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        <CheckCircle2 size={12} />
                        <span>1. Validation</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.authorize === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : mediaStepStatus.authorize === 'pending' ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        {mediaStepStatus.authorize === 'pending' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        <span>2. Authorize</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.upload === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : mediaStepStatus.upload === 'pending' ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        {mediaStepStatus.upload === 'pending' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        <span>3. Storage Upload</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.confirm === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : mediaStepStatus.confirm === 'pending' ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        {mediaStepStatus.confirm === 'pending' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        <span>4. Confirm Object</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* State 4: Attached & Verified Primary Image Display */}
                {(form.image || mediaState === 'attached') && (
                  <div className="p-4 bg-white border border-[#E5E3DB] rounded-xl space-y-3">
                    <div className="relative h-48 rounded-xl overflow-hidden border border-[#E5E3DB] bg-black/5 group">
                      <img
                        src={form.image}
                        alt={form.provenance?.altText || 'Primary Recommendation Image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white font-mono text-[9px]">
                            Canonical Media Object Path
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#2E7D32]/80 backdrop-blur-xs text-white font-mono text-[9px] font-bold flex items-center gap-1">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleAbandonOrReplace}
                          className="px-2.5 py-1 bg-white/90 hover:bg-white text-[#C62828] font-mono text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <RefreshCw size={11} />
                          <span>Replace Image</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E5E3DB] font-mono text-[10px] text-[#1E2E20] break-all flex items-center justify-between">
                      <span className="text-[#8C8A7D]">Permanent Storage Reference:</span>
                      <span className="font-bold text-[#1E2E20]">{form.image}</span>
                    </div>
                  </div>
                )}

                {/* Provenance Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Provenance Source
                    </label>
                    <input
                      type="text"
                      value={form.provenance?.source || ''}
                      onChange={(e) => setForm({
                        ...form,
                        provenance: { ...form.provenance, source: e.target.value }
                      })}
                      placeholder="e.g. Unsplash Verified"
                      className="w-full h-9 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Acquisition Method
                    </label>
                    <input
                      type="text"
                      value={form.provenance?.method || ''}
                      onChange={(e) => setForm({
                        ...form,
                        provenance: { ...form.provenance, method: e.target.value }
                      })}
                      placeholder="e.g. original"
                      className="w-full h-9 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      License
                    </label>
                    <input
                      type="text"
                      value={form.provenance?.license || ''}
                      onChange={(e) => setForm({
                        ...form,
                        provenance: { ...form.provenance, license: e.target.value }
                      })}
                      placeholder="e.g. CC-BY-4.0"
                      className="w-full h-9 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRACTICAL INFORMATION & GEOLOCATION */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Practical Info JSON */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <Clock size={16} className="text-[#8A1F1F]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Practical Visitor Information (`practical_info`)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Opening Hours (`opening_hours`)
                    </label>
                    <input
                      type="text"
                      value={form.practicalInfo?.opening_hours || ''}
                      onChange={(e) => setForm({
                        ...form,
                        practicalInfo: { ...form.practicalInfo, opening_hours: e.target.value }
                      })}
                      placeholder="e.g. 09:00 - 22:00 Daily"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Contact Phone (`contact_phone`)
                    </label>
                    <input
                      type="tel"
                      value={form.practicalInfo?.contact_phone || ''}
                      onChange={(e) => setForm({
                        ...form,
                        phone: e.target.value,
                        practicalInfo: { ...form.practicalInfo, contact_phone: e.target.value }
                      })}
                      placeholder="e.g. +381 11 328 1234"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Contact Email (`contact_email`)
                    </label>
                    <input
                      type="email"
                      value={form.practicalInfo?.contact_email || ''}
                      onChange={(e) => setForm({
                        ...form,
                        practicalInfo: { ...form.practicalInfo, contact_email: e.target.value }
                      })}
                      placeholder="e.g. concierge@experience.rs"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Official Website (`website`)
                    </label>
                    <input
                      type="url"
                      value={form.practicalInfo?.website || ''}
                      onChange={(e) => setForm({
                        ...form,
                        website: e.target.value,
                        practicalInfo: { ...form.practicalInfo, website: e.target.value }
                      })}
                      placeholder="https://experience.rs"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Admission Fee (`admission_fee`)
                    </label>
                    <input
                      type="text"
                      value={form.practicalInfo?.admission_fee || ''}
                      onChange={(e) => setForm({
                        ...form,
                        estimatedCost: e.target.value,
                        practicalInfo: { ...form.practicalInfo, admission_fee: e.target.value }
                      })}
                      placeholder="e.g. Free entry / Ala carte"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Preferred Transport
                    </label>
                    <input
                      type="text"
                      value={form.preferredTransport || ''}
                      onChange={(e) => setForm({ ...form, preferredTransport: e.target.value })}
                      placeholder="e.g. Taxi / Walking"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E5E3DB]">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={form.duration || ''}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g., 2-3 hours"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Travel Time String
                    </label>
                    <input
                      type="text"
                      value={form.travelTime || ''}
                      onChange={(e) => setForm({ ...form, travelTime: e.target.value })}
                      placeholder="e.g., 15 mins"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Travel Time (`travel_time_minutes`)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.travelTimeMinutes ?? 15}
                      onChange={(e) => setForm({ ...form, travelTimeMinutes: parseInt(e.target.value, 10) || 0 })}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <MapPin size={16} className="text-[#C5A059]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Geographic Map Coordinates
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Latitude (-90.0 to 90.0) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={form.coordinates?.lat ?? 44.8176}
                      onChange={(e) => setForm({
                        ...form,
                        coordinates: { lat: parseFloat(e.target.value) || 0, lng: form.coordinates?.lng || 20.4569 }
                      })}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Longitude (-180.0 to 180.0) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={form.coordinates?.lng ?? 20.4569}
                      onChange={(e) => setForm({
                        ...form,
                        coordinates: { lat: form.coordinates?.lat || 44.8176, lng: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: MOOD ORBIT & RANKING INPUTS */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {/* Mood Orbit 2D Vector */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-[#C5A059]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Mood Orbit 2D Spatial Vector Calibration
                    </h3>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#1E2E20]">
                    X: {(form.coordinateX ?? 0.5).toFixed(2)}, Y: {(form.coordinateY ?? 0.5).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      X Axis (Serene 0.0 vs Vibrant 1.0)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.coordinateX ?? 0.5}
                      onChange={(e) => setForm({ ...form, coordinateX: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8C8A7D] mt-1">
                      <span>0.0 Serene Calm</span>
                      <span>1.0 High Vibrant</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Y Axis (Heritage/Nature 0.0 vs Urban/Social 1.0)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.coordinateY ?? 0.5}
                      onChange={(e) => setForm({ ...form, coordinateY: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8C8A7D] mt-1">
                      <span>0.0 Heritage/Nature</span>
                      <span>1.0 Urban/Social</span>
                    </div>
                  </div>
                </div>

                {/* Mood Tag Chips */}
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Mood Tags (`moods`)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOOD_OPTIONS.map((m) => {
                      const isSelected = form.moods?.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            const curr = form.moods || [];
                            const next = isSelected ? curr.filter(x => x !== m) : [...curr, m];
                            setForm({ ...form, moods: next });
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#23251E] text-white'
                              : 'bg-white text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-Sliders: Energy, Social, Luxury, Urbanity, Nature */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-2">
                  Dimensional Experience Attributes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Energy Level: {(form.energy ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.energy ?? 0.5}
                      onChange={(e) => setForm({ ...form, energy: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Social Level: {(form.social ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.social ?? 0.5}
                      onChange={(e) => setForm({ ...form, social: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Luxury Tier: {(form.luxury ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.luxury ?? 0.5}
                      onChange={(e) => setForm({ ...form, luxury: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Urbanity Level: {(form.urbanity ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.urbanity ?? 0.5}
                      onChange={(e) => setForm({ ...form, urbanity: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Nature Density: {(form.nature ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.nature ?? 0.5}
                      onChange={(e) => setForm({ ...form, nature: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Weather Dependency: {(form.weatherDependency ?? 0.2).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.weatherDependency ?? 0.2}
                      onChange={(e) => setForm({ ...form, weatherDependency: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Toggles & Options */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-[#E5E3DB]">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Seasonality
                    </label>
                    <select
                      value={form.seasonality || 'all'}
                      onChange={(e) => setForm({ ...form, seasonality: e.target.value as any })}
                      className="w-full h-10 px-2.5 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono font-bold"
                    >
                      <option value="all">Year-Round (All)</option>
                      <option value="summer">Summer Season</option>
                      <option value="winter">Winter Season</option>
                      <option value="spring-fall">Spring / Fall</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Premium Tier
                    </label>
                    <select
                      value={form.premiumLevel || 'standard'}
                      onChange={(e) => setForm({ ...form, premiumLevel: e.target.value as any })}
                      className="w-full h-10 px-2.5 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono font-bold"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="ultra">Ultra Luxury</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="fam-suit"
                      checked={Boolean(form.familySuitability)}
                      onChange={(e) => setForm({ ...form, familySuitability: e.target.checked })}
                      className="accent-[#23251E] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="fam-suit" className="font-mono text-xs font-bold text-[#1E2E20] cursor-pointer">
                      Family Suitable
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="acc-suit"
                      checked={Boolean(form.accessibility)}
                      onChange={(e) => setForm({ ...form, accessibility: e.target.checked })}
                      className="accent-[#23251E] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="acc-suit" className="font-mono text-xs font-bold text-[#1E2E20] cursor-pointer">
                      Wheelchair Accessible
                    </label>
                  </div>
                </div>

                {/* Server-derived ranking score notice */}
                <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs font-mono text-[#2E7D32] flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>
                    Ranking score (`ranking_score`) is server-derived by the IDEMO Ranking Engine and cannot be manually modified.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SIX-LANGUAGE LOCALIZATION */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-[#8A1F1F]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Six-Language Canonical Visitor Localization
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#2E7D32]">
                    Overall Completeness: {localizationProgress}%
                  </span>
                </div>

                {/* Sub-tabs for 6 languages */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5E3DB]">
                  {CANONICAL_LANGUAGES.map((lang) => {
                    const trans = form.translations?.[lang.code];
                    const isComplete = Boolean(trans?.title && trans?.shortDescription);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setActiveLangTab(lang.code as any)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeLangTab === lang.code
                            ? 'bg-[#23251E] text-white shadow-xs'
                            : 'bg-white text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                        }`}
                      >
                        <span>{lang.name}</span>
                        {isComplete ? (
                          <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Localized Form Fields for selected language */}
                {(() => {
                  const currentTrans = form.translations?.[activeLangTab] || {};
                  return (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                            Title ({activeLangTab.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={currentTrans.title || ''}
                            onChange={(e) => updateTranslationField(activeLangTab, 'title', e.target.value)}
                            placeholder={`Title in ${activeLangTab.toUpperCase()}...`}
                            className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                            Location Area ({activeLangTab.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={currentTrans.location || ''}
                            onChange={(e) => updateTranslationField(activeLangTab, 'location', e.target.value)}
                            placeholder={`Location in ${activeLangTab.toUpperCase()}...`}
                            className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Short Description ({activeLangTab.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={currentTrans.shortDescription || ''}
                          onChange={(e) => updateTranslationField(activeLangTab, 'shortDescription', e.target.value)}
                          placeholder={`Short overview in ${activeLangTab.toUpperCase()}...`}
                          className="w-full p-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Long Description ({activeLangTab.toUpperCase()})
                        </label>
                        <textarea
                          rows={3}
                          value={currentTrans.longDescription || ''}
                          onChange={(e) => updateTranslationField(activeLangTab, 'longDescription', e.target.value)}
                          placeholder={`Long story in ${activeLangTab.toUpperCase()}...`}
                          className="w-full p-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] outline-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & CANONICAL VALIDATION */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Visitor Style Preview */}
              <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <Eye size={16} className="text-[#C5A059]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Real Visitor Card Preview & Experience Inspection
                  </h3>
                </div>

                <div className="bg-white border border-[#E5E3DB] rounded-2xl overflow-hidden shadow-xs p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Image */}
                  <div className="relative h-48 md:h-full min-h-[160px] rounded-xl overflow-hidden bg-black/5">
                    <img
                      src={form.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200'}
                      alt={form.title || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#23251E] text-white font-mono text-[9px] font-bold rounded-md uppercase">
                      {form.category || 'Gastronomy'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          {form.location || 'Belgrade, Serbia'}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#1E2E20] leading-tight">
                          {form.title || 'Untitled Recommendation'}
                        </h4>
                      </div>
                      <span className="px-2 py-1 bg-[#FAF9F5] border border-[#E5E3DB] rounded-lg font-mono text-[10px] font-bold">
                        {form.estimatedCost || '€€'}
                      </span>
                    </div>

                    <p className="text-xs text-[#1E2E20] font-sans leading-relaxed line-clamp-3">
                      {form.shortDescription || 'No short overview provided.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E5E3DB] text-[10.5px] font-mono text-[#8C8A7D]">
                      <div>⏱ {form.duration || '2-3 hours'}</div>
                      <div>🚗 {form.travelTime || '15 mins'}</div>
                      <div>📍 Lat: {form.coordinates?.lat?.toFixed(2)}, Lng: {form.coordinates?.lng?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Audit */}
              <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                  <div>
                    <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                      Canonical Validation Audit & Quality Check
                    </span>
                    <span className="font-serif font-bold text-sm text-[#1E2E20]">
                      Payload Integrity Status
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase border ${
                    validationErrors.length === 0
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                      : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                  }`}>
                    {validationErrors.length === 0 ? 'READY FOR SUBMISSION' : 'BLOCKING ERRORS FOUND'}
                  </span>
                </div>

                {validationErrors.length > 0 ? (
                  <div className="p-3.5 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs font-mono text-[#C62828] space-y-1">
                    <span className="font-bold block uppercase">Blocking Validation Errors:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs font-mono text-[#2E7D32] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Payload complies with top-level whitelist, character limits, coordinate ranges, and canonical schema rules.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation & Submissions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E3DB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] text-xs font-mono uppercase font-bold text-[#8C8A7D] hover:text-[#1E2E20]"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep - 1) as any)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] bg-white text-[#1E2E20] font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Previous Step
                </button>
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep + 1) as any)}
                  className="px-5 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 rounded-xl border border-[#23251E] bg-[#FAF9F5] hover:bg-white text-[#1E2E20] font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || validationErrors.length > 0}
                    className="px-6 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Send size={14} className="text-[#C5A059]" />
                    <span>{isSubmitting ? 'Submitting RPC...' : 'Submit Canonical Recommendation'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
