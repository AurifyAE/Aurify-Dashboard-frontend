'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LiveClock from '@/components/LiveClock';
import Theme1Layout from '@/components/live-screen/theme1/Theme1Layout';
import Theme2Layout from '@/components/live-screen/theme2/Theme2Layout';
import Theme3Layout from '@/components/live-screen/theme3/Theme3Layout';
import {
  marketplaceApi,
  type Merchant,
  type MerchantTheme,
  type ScreenLayout,
} from '@/lib/api/marketplace';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  Monitor,
  Palette,
  Rocket,
  Save,
  Settings2,
  Trash2,
  Tv,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/loader/loader';

const WIDGETS = ['Spot Rates', 'Commodity Table', 'News', 'Clock', 'Date'];

const LAYOUTS = [
  {
    id: 'theme1',
    label: 'Theme 1 (Classic)',
    colors: [
      { key: 'primary', label: 'Primary', default: '#d4a017' },
      { key: 'secondary', label: 'Secondary', default: '#111827' },
      { key: 'accent', label: 'Accent', default: '#38bdf8' },
      { key: 'backgroundColor', label: 'Background', default: '#140b10' },
      { key: 'tableHeaderBg', label: 'Table Header Bg', default: '#280f05' },
      { key: 'tableRowBg', label: 'Table Row Bg', default: '#140802' },
      { key: 'tableText', label: 'Table Text', default: '#ffffff' },
      { key: 'buyBg', label: 'Buy Box Bg', default: '#280f05' },
      { key: 'buyText', label: 'Buy Text', default: '#20c997' },
      { key: 'sellBg', label: 'Sell Box Bg', default: '#280f05' },
      { key: 'sellText', label: 'Sell Text', default: '#ff4d4d' },
      { key: 'clockText', label: 'Clock Text', default: '#000000' },
      { key: 'newsBg', label: 'News Bg', default: '#111827' },
      { key: 'newsText', label: 'News Text', default: '#ffffff' },
      { key: 'poweredByText', label: 'Powered By Text', default: '#000000' },
    ],
  },
  {
    id: 'theme2',
    label: 'Theme 2 (Modern)',
    colors: [
      { key: 'primary', label: 'Primary', default: '#d4a017' },
      { key: 'secondary', label: 'Secondary', default: '#111827' },
      { key: 'accent', label: 'Accent', default: '#38bdf8' },
      { key: 'poweredByText', label: 'Powered By Text', default: '#ffffff' },
    ],
  },
  {
    id: 'theme3',
    label: 'Theme 3 (Premium)',
    colors: [
      { key: 'primary', label: 'Primary', default: '#d4a017' },
      { key: 'secondary', label: 'Secondary', default: '#111827' },
      { key: 'accent', label: 'Accent', default: '#38bdf8' },
      { key: 'poweredByText', label: 'Powered By Text', default: '#FFC983' },
    ],
  },
];

const SECTIONS = [
  { id: 'header', label: 'Header' },
  { id: 'spotRates', label: 'Spot Rates' },
  { id: 'commodities', label: 'Commodity Table' },
  { id: 'news', label: 'News Ticker' },
];

import { Newspaper } from 'lucide-react';
import NewsManagementTab from './NewsManagementTab';

const STEPS = [
  { id: 1, label: 'Setup & Theme', icon: Settings2 },
  { id: 2, label: 'Customize', icon: Palette },
  { id: 3, label: 'News & Content', icon: Newspaper },
  { id: 4, label: 'Go Live', icon: Monitor },
];

type DraftState = {
  layoutId: string;
  name: string;
  screenSlug: string;
  selectedLayout: string;
  themeId: string;
  widgets: string[];
  sectionOrder: string[];
  assignedDevices: string;
  colorOverride: Record<string, string>;
  showLogo: boolean;
  showName: boolean;
  logoUrl?: string;
  backgroundUrl?: string;
  newsHeading?: string;
  selectedClocks: string[];
};

const defaultDraft: DraftState = {
  layoutId: '',
  name: 'Main Showroom Screen',
  screenSlug: 'main',
  selectedLayout: 'theme1',
  themeId: '',
  widgets: ['Spot Rates', 'Commodity Table', 'News', 'Clock', 'Date'],
  sectionOrder: ['header', 'spotRates', 'commodities', 'news'],
  assignedDevices: 'TV 1, TV 2',
  colorOverride: {
    primary: '#d4a017',
    secondary: '#111827',
    accent: '#38bdf8',
    backgroundColor: '#140b10',
    tableHeaderBg: '#280f05',
    tableRowBg: '#140802',
    tableText: '#ffffff',
    buyBg: '#280f05',
    buyText: '#20c997',
    sellBg: '#280f05',
    sellText: '#ff4d4d',
    clockText: '#ffffff',
    newsBg: '#111827',
    newsText: '#ffffff',
    poweredByText: '#ffffff',
    useBlackLogo: 'false',
  },
  showLogo: true,
  showName: true,
  logoUrl: '',
  backgroundUrl: '',
  selectedClocks: ['india', 'uae', 'london'],
};

interface ScreenBuilderTabProps {
  editingLayoutId?: string;
  setEditingLayoutId: (id: string | undefined) => void;
  setActiveTab: (tab: string) => void;
  onSaveSuccess?: () => void;
}

const TVPreviewRenderer = ({ data }: { data: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Parent container width divided by 1920 to find the scale
        setScale(entry.contentRect.width / 1920);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const enhancedData = {
    ...data,
    layout: {
      ...data.layout,
      styles: {
        ...(data.layout?.styles || {}),
        colorOverride: data.layout?.colorOverride || data.layout?.styles?.colorOverride,
        showLogo: data.layout?.showLogo,
        showName: data.layout?.showName,
        selectedClocks: data.layout?.selectedClocks || data.layout?.styles?.selectedClocks,
      },
    },
    merchant: {
      ...data.merchant,
      logo: data.layout?.logoUrl || data.merchant?.logo,
      companyName: data.layout?.newsHeading || data.merchant?.companyName,
    },
    theme: {
      ...data.theme,
      customizations: {
        ...data.theme?.customizations,
        backgroundUrl: data.layout?.backgroundUrl || data.theme?.customizations?.backgroundUrl,
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '1920px',
          height: '1080px',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999,
            background: 'red',
            color: 'white',
            padding: '10px',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          SCREEN : {enhancedData?.layout?.selectedLayout}
        </div>
        {enhancedData?.layout?.selectedLayout === 'theme3' ? (
          <Theme3Layout data={enhancedData} isPreview={true} />
        ) : enhancedData?.layout?.selectedLayout === 'theme2' ? (
          <Theme2Layout data={enhancedData} isPreview={true} />
        ) : (
          <Theme1Layout data={enhancedData} isPreview={true} />
        )}
      </div>
    </div>
  );
};

const COLOR_CATEGORIES = [
  {
    title: 'Table Settings',
    colors: [
      { key: 'tableHeaderBg', label: 'Header Bg' },
      { key: 'tableRowBg', label: 'Row Bg' },
      { key: 'tableText', label: 'Text' },
    ],
  },
  {
    title: 'Spot Rate Settings',
    colors: [
      { key: 'panelBg', label: 'Panel Bg' },
      { key: 'panelText', label: 'Text Color' },
    ],
  },
  {
    title: 'News Settings',
    colors: [
      { key: 'newsBg', label: 'Background' },
      { key: 'newsText', label: 'Text' },
      { key: 'newsTitleText', label: 'Title Text' },
      { key: 'newsTitleBg', label: 'Title Bg' },
    ],
  },
  {
    title: 'Clock Settings',
    colors: [{ key: 'clockText', label: 'Clock Text' }],
  },
  {
    title: 'Footer Settings',
    colors: [
      { key: 'poweredByText', label: 'Powered By Text' },
      { key: 'useBlackLogo', label: 'Black Logo', type: 'checkbox' },
    ],
  },
];

const THEME_DEFAULTS: Record<string, Record<string, string>> = {
  theme1: {
    primary: '#d4a017',
    secondary: '#111827',
    accent: '#38bdf8',
    backgroundColor: '#140b10',
    tableHeaderBg: '#280f05',
    tableRowBg: '#140802',
    tableText: '#ffffff',
    buyBg: '#280f05',
    buyText: '#20c997',
    sellBg: '#280f05',
    sellText: '#ff4d4d',
    clockText: '#000000',
    poweredByText: '#000',
    newsBg: '#111827',
    newsText: '#ffffff',
  },
  theme2: {
    primary: '#d4a017',
    secondary: '#111827',
    accent: '#38bdf8',
    backgroundColor: '#000000',
    tableHeaderBg: '#1c170f',
    tableRowBg: '#0f0c08',
    tableText: '#ffffff',
    buyBg: '#000000',
    buyText: '#ffffff',
    sellBg: '#000000',
    sellText: '#ffffff',
    clockText: '#ffffff',
    newsBg: '#112251',
    newsText: '#ffffff',
  },
  theme3: {
    primary: '#d4a017',
    secondary: '#111827',
    accent: '#38bdf8',
    backgroundColor: '#000000',
    tableHeaderBg: '#280f05',
    tableRowBg: '#1a0903',
    tableText: '#ffffff',
    buyBg: '#000000',
    buyText: '#ffffff',
    sellBg: '#000000',
    sellText: '#ffffff',
    clockText: '#ffc983',
    newsBg: '#000000',
    newsText: '#d4a017',
  },
};

export default function ScreenBuilderTab({
  editingLayoutId,
  setEditingLayoutId,
  setActiveTab,
  onSaveSuccess,
}: ScreenBuilderTabProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>('Global Colors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '1', 10);
  const [step, setStepState] = useState(isNaN(initialStep) ? 1 : initialStep);

  const setStep = (newStep: number) => {
    setStepState(newStep);
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', newStep.toString());
    router.push(`?${params.toString()}`);
  };
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [themes, setThemes] = useState<MerchantTheme[]>([]);
  const [layouts, setLayouts] = useState<ScreenLayout[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [previewSize, setPreviewSize] = useState<'1920x1080' | '3840x2160'>('1920x1080');
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) return;
    localStorage.setItem('aurify-builder-draft', JSON.stringify(draft));
  }, [draft]);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'backgroundUrl'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showMessage = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    toast.dismiss();
    if (type === 'error') toast.error(text);
    else if (type === 'success') toast.success(text);
    else toast(text);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [m, installed, savedLayouts, newsItems] = await Promise.all([
        marketplaceApi.myMerchant(),
        marketplaceApi.installedThemes(),
        marketplaceApi.layouts(),
        marketplaceApi.news().catch(() => []),
      ]);
      setMerchant(m);
      setThemes(installed);
      setLayouts(savedLayouts);
      setNews(newsItems);

      const currentThemeId = installed[0]?.themeId || '';

      let localDraft: DraftState | null = null;
      try {
        const stored = localStorage.getItem('aurify-builder-draft');
        if (stored) localDraft = JSON.parse(stored);
      } catch (e) {}

      if (editingLayoutId) {
        const target = savedLayouts.find((l) => l.layoutId === editingLayoutId);
        if (target) {
          if (localDraft && localDraft.layoutId === editingLayoutId) {
            setDraft({
              ...defaultDraft,
              ...localDraft,
              selectedClocks: localDraft.selectedClocks?.length ? localDraft.selectedClocks : defaultDraft.selectedClocks,
            });
          } else {
            setDraft({
              layoutId: target.layoutId,
              name: target.name,
              screenSlug: target.screenSlug,
              selectedLayout: (target.header as any)?.layout || 'theme1',
              newsHeading: (target.header as any)?.newsHeading || '',
              themeId: target.themeId || currentThemeId,
              widgets: target.widgets?.length ? target.widgets : defaultDraft.widgets,
              sectionOrder: (target.body as any)?.sectionOrder || defaultDraft.sectionOrder,
              assignedDevices: Array.isArray(target.assignedDevices)
                ? target.assignedDevices.join(', ')
                : target.assignedDevices || '',
              colorOverride: (target.styles as any)?.colorOverride || defaultDraft.colorOverride,
              showLogo: (target.styles as any)?.showLogo ?? true,
              showName: (target.styles as any)?.showName ?? true,
              logoUrl: (target.styles as any)?.logoUrl || '',
              backgroundUrl: (target.styles as any)?.backgroundUrl || '',
              selectedClocks: (target.styles as any)?.selectedClocks?.length ? (target.styles as any).selectedClocks : defaultDraft.selectedClocks,
            });
          }
        }
      } else {
        if (localDraft && !localDraft.layoutId) {
          setDraft({
            ...defaultDraft,
            ...localDraft,
            selectedClocks: localDraft.selectedClocks?.length ? localDraft.selectedClocks : defaultDraft.selectedClocks,
          });
        } else {
          setDraft({
            ...defaultDraft,
            themeId: currentThemeId,
          });
        }
      }
      isFirstLoad.current = false;
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to load builder', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [editingLayoutId]);

  const selectedTheme = themes.find((t) => t.themeId === draft.themeId);
  const themeColors = selectedTheme?.customizations as
    { colors?: { primary?: string; secondary?: string; accent?: string } } | undefined;

  const canGoLive = Boolean(
    merchant?.status === 'Active' && draft.selectedLayout && draft.name.trim()
  );

  const moveSection = (targetSection: string) => {
    if (!draggedSection || draggedSection === targetSection) return;
    setDraft((prev) => {
      const next = prev.sectionOrder.filter((s) => s !== draggedSection);
      const idx = next.indexOf(targetSection);
      next.splice(idx, 0, draggedSection);
      return { ...prev, sectionOrder: next };
    });
    setDraggedSection(null);
  };

  const shiftSection = (sectionId: string, direction: -1 | 1) => {
    setDraft((prev) => {
      const order = [...prev.sectionOrder];
      const index = order.indexOf(sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return prev;
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...prev, sectionOrder: order };
    });
  };

  const buildPayload = (themeId: string) => ({
    layoutId: draft.layoutId,
    name: draft.name,
    screenSlug: draft.screenSlug,
    themeId,
    header: {
      company: merchant?.companyName,
      layout: draft.selectedLayout,
      newsHeading: draft.newsHeading,
    },
    body: { previewSize, sectionOrder: draft.sectionOrder },
    sidebar: {},
    footer: { ticker: 'enabled' },
    widgets: draft.widgets,
    styles: {
      ...((selectedTheme?.customizations as Record<string, unknown>) || {}),
      colorOverride: draft.colorOverride,
      showLogo: draft.showLogo,
      showName: draft.showName,
      logoUrl: draft.logoUrl,
      backgroundUrl: draft.backgroundUrl,
      selectedClocks: draft.selectedClocks,
    },
  });

  const save = async () => {
    if (!draft.name.trim()) {
      showMessage('Give your screen a name first.', 'error');
      setStep(1);
      return;
    }
    const themeId = draft.themeId || themes[0]?.themeId || 'default';
    setSaving(true);
    try {
      const saved = await marketplaceApi.saveLayout(buildPayload(themeId));
      setDraft((prev) => ({ ...prev, layoutId: saved.layoutId, themeId }));
      setEditingLayoutId(saved.layoutId);
      await load();
      showMessage('Draft saved successfully.', 'success');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      showMessage(err instanceof Error ? err.message : err?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!canGoLive) {
      showMessage(
        merchant?.status !== 'Active'
          ? 'Your account must be approved before going live.'
          : 'Select a theme and screen name first.',
        'error'
      );
      return;
    }
    setSaving(true);
    try {
      // Always save the latest draft state before publishing
      const saved = await marketplaceApi.saveLayout(buildPayload(draft.themeId));
      let layoutId = saved.layoutId;
      setEditingLayoutId(layoutId);

      const result = await marketplaceApi.publishLayout(layoutId, {
        assignedDevices: draft.assignedDevices
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
      });
      setDraft((prev) => ({ ...prev, layoutId }));
      showMessage(`🎉 Screen is live: ${result.liveUrl}`, 'success');
      await load();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      showMessage(err instanceof Error ? err.message : err?.message || 'Publish failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingLayoutId(undefined);
    setDraft(defaultDraft);
    setStep(1);
    localStorage.removeItem('aurify-builder-draft');
    showMessage('Form reset. Creating a new screen config.', 'info');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';

  if (loading)
    return (
      <div className="py-20">
        <Loader />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {draft.layoutId ? `Edit Screen: ${draft.name}` : 'Create New Screen'}
          </h2>
          <p className="text-sm text-slate-500">
            Customize and publish your live showroom TV rate boards.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('my-screens')}
            className="btn-secondary hidden sm:flex"
          >
            <Monitor className="h-4 w-4" />
            My Screens
          </button>
          {draft.layoutId && (
            <button type="button" onClick={resetForm} className="btn-secondary">
              Start New Screen
            </button>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-secondary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!canGoLive || saving}
            className="btn-primary"
          >
            <Rocket className="h-4 w-4" />
            Go Live
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-1">
        {STEPS.map((s) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                step === s.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : step > s.id
                    ? 'text-emerald-600'
                    : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === s.id
                    ? 'bg-blue-600 text-white'
                    : step > s.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.id ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sticky top-6 h-fit max-h-[80dvh] overflow-y-auto">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Screen Details</h3>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Screen Name
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. Main Showroom"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  URL Slug
                </label>
                <input
                  className={inputClass}
                  placeholder="main"
                  value={draft.screenSlug}
                  onChange={(e) => setDraft({ ...draft, screenSlug: e.target.value })}
                />
              </div>

              {/* Theme Selection */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Select Layout Theme</h3>
                <div className="space-y-3">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        const defaultColors = THEME_DEFAULTS[l.id] || THEME_DEFAULTS.theme1;
                        setDraft({ ...draft, selectedLayout: l.id, colorOverride: defaultColors });
                      }}
                      className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                        draft.selectedLayout === l.id
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-800 block text-sm">{l.label}</span>
                        <span className="text-xs text-slate-500">
                          {l.id === 'theme1'
                            ? 'Classic layout with gradients'
                            : l.id === 'theme2'
                              ? 'Modern layout with glassmorphism'
                              : 'Premium dark themed layout'}
                        </span>
                      </div>
                      {draft.selectedLayout === l.id && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full mt-4">
                Next: Customize Screen <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Customize Details</h3>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                  Branding & Assets
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logoUrl')}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {draft.logoUrl && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold">Current:</span>
                        <img
                          src={draft.logoUrl}
                          alt="logo"
                          className="h-8 w-auto rounded border border-slate-200 bg-slate-50 object-contain p-0.5"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Background Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'backgroundUrl')}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {draft.backgroundUrl && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold">Current:</span>
                        <img
                          src={draft.backgroundUrl}
                          alt="background"
                          className="h-8 w-12 rounded border border-slate-200 bg-slate-50 object-cover p-0.5"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Advanced Colors
                  </label>
                  <div className="flex flex-col gap-2">
                    {COLOR_CATEGORIES.map((category) => (
                      <div
                        key={category.title}
                        className="border border-slate-200 rounded-xl bg-white overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenAccordion(
                              openAccordion === category.title ? null : category.title
                            )
                          }
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-sm font-semibold text-slate-700">
                            {category.title}
                          </span>
                          {openAccordion === category.title ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          )}
                        </button>

                        {openAccordion === category.title && (
                          <div className="p-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-3 flex-wrap">
                              {category.colors.map((color) => {
                                const activeDefault =
                                  THEME_DEFAULTS[draft.selectedLayout]?.[color.key] ||
                                  THEME_DEFAULTS.theme1[color.key];
                                return (
                                  <div
                                    key={color.key}
                                    className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col gap-1 w-[120px]"
                                  >
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 truncate">
                                      {color.label}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      {color.type === 'checkbox' ? (
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                          checked={draft.colorOverride[color.key] === 'true'}
                                          onChange={(e) =>
                                            setDraft({
                                              ...draft,
                                              colorOverride: {
                                                ...draft.colorOverride,
                                                [color.key]: e.target.checked ? 'true' : 'false',
                                              },
                                            })
                                          }
                                        />
                                      ) : (
                                        <>
                                          <input
                                            type="color"
                                            className="h-8 w-8 cursor-pointer rounded bg-transparent border-0 p-0"
                                            value={draft.colorOverride[color.key] || activeDefault}
                                            onChange={(e) =>
                                              setDraft({
                                                ...draft,
                                                colorOverride: {
                                                  ...draft.colorOverride,
                                                  [color.key]: e.target.value,
                                                },
                                              })
                                            }
                                          />
                                          <span className="text-xs font-mono text-slate-600">
                                            {draft.colorOverride[color.key] || activeDefault}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elements Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Visible Elements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {WIDGETS.map((widget) => (
                    <label
                      key={widget}
                      className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={draft.widgets.includes(widget)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setDraft({ ...draft, widgets: [...draft.widgets, widget] });
                          else
                            setDraft({
                              ...draft,
                              widgets: draft.widgets.filter((w) => w !== widget),
                            });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                      />
                      {widget}
                    </label>
                  ))}
                </div>
              </div>

              {/* Clocks Section */}
              {draft.widgets.includes('Clock') && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm mb-3">World Clocks</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'india', label: 'India' },
                      { id: 'uae', label: 'UAE' },
                      { id: 'london', label: 'London' },
                      { id: 'usa', label: 'USA (New York)' },
                      { id: 'singapore', label: 'Singapore' },
                      { id: 'saudi', label: 'Saudi Arabia' },
                      { id: 'qatar', label: 'Qatar' },
                      { id: 'bahrain', label: 'Bahrain' },
                      { id: 'kuwait', label: 'Kuwait' },
                      { id: 'oman', label: 'Oman' },
                    ].map((clock) => {
                      const activeClocks = draft.selectedClocks || ['india', 'uae', 'london'];
                      return (
                      <label
                        key={clock.id}
                        className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={activeClocks.includes(clock.id)}
                          onChange={(e) => {
                            const current = draft.selectedClocks || ['india', 'uae', 'london'];
                            if (e.target.checked) {
                              setDraft({ ...draft, selectedClocks: [...current, clock.id] });
                            } else {
                              setDraft({
                                ...draft,
                                selectedClocks: current.filter((c) => c !== clock.id),
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                        />
                        {clock.label}
                      </label>
                    )})}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                  Next: News & Content <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">News & Content</h3>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Page Content Title (News Heading)
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. Live Updates"
                  value={draft.newsHeading || ''}
                  onChange={(e) => setDraft({ ...draft, newsHeading: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <NewsManagementTab
                  isEmbedded={true}
                  onUpdate={() =>
                    marketplaceApi
                      .news()
                      .then(setNews)
                      .catch(() => [])
                  }
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">
                  Next: Preview & Go Live <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Go Live</h3>

              {/* Resolution Toggle */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Resolution
                </h4>
                <div className="flex gap-2">
                  {(['1920x1080', '3840x2160'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setPreviewSize(res)}
                      className={`flex-1 rounded-xl border-2 py-2 text-xs font-bold transition-all ${
                        previewSize === res
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {res === '1920x1080' ? 'Full HD' : '4K UHD'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Checklist */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-800 mb-3">Publish Checklist</p>
                {[
                  { label: 'Screen name set', done: Boolean(draft.name.trim()) },
                  { label: 'Theme selected', done: Boolean(draft.selectedLayout) },
                  { label: 'Custom logo selected', done: Boolean(draft.logoUrl) },
                  { label: 'Custom background selected', done: Boolean(draft.backgroundUrl) },
                  { label: 'Custom news added', done: Boolean(news && news.length > 0) },
                  { label: 'Merchant approved', done: merchant?.status === 'Active' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={item.done ? 'text-slate-700' : 'text-slate-400'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={publish}
                  disabled={saving || !canGoLive}
                  className="btn-primary flex-1"
                >
                  <Rocket className="h-4 w-4" /> Go Live
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right: TV Preview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm  h-fit">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Monitor className="h-5 w-5 text-blue-600" />
              Live TV Preview
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {previewSize === '1920x1080' ? 'Full HD · 1080p' : '4K UHD · 2160p'}
            </div>
          </div>

          {/* TV Screen */}
          {/* @ts-ignore */}
          <TVPreviewRenderer
            data={{
              merchant,
              theme: selectedTheme,
              layout: draft,
              commodities: (merchant as any)?.commodities || [],
              news: news,
            }}
          />

          {/* Saved Drafts */}
          {layouts.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Saved Screen Configs</h4>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                {layouts.map((layout) => (
                  <button
                    key={layout.layoutId}
                    type="button"
                    onClick={() => setEditingLayoutId(layout.layoutId)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all ${
                      editingLayoutId === layout.layoutId
                        ? 'border-blue-500 bg-blue-50/30'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {layout.name}
                      </span>
                      <span className="text-[10px] text-slate-400">/{layout.screenSlug}</span>
                    </div>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase flex-shrink-0 ${
                        layout.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {layout.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
