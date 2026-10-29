import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Check,
  ArrowLeft,
  Upload,
  AlertCircle,
  Palette,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import './AppearanceSettings.css';

/**
 * Unified Wallpaper & Theme Presets:
 * Includes all Bitrix24-style reference visual themes (Vibecoding, Space, Zen, Gravity, Gradient)
 * along with ALL existing TallyConnect presets so no background is removed or replaced.
 */
export const ALL_THEMES_PRESETS = [
  // --- Bitrix24 Reference Themes ---
  {
    id: 'vibecoding',
    name: 'Vibecoding',
    value: 'linear-gradient(135deg, #2e0854 0%, #4a00e0 40%, #8e2de2 70%, #00d2ff 100%)',
    thumbnail: 'linear-gradient(135deg, #2e0854 0%, #4a00e0 40%, #8e2de2 70%, #00d2ff 100%)',
    category: 'bitrix'
  },
  {
    id: 'space-bitrix',
    name: 'Space',
    value: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
    category: 'bitrix'
  },
  {
    id: 'zen',
    name: 'Zen',
    value: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=400&q=80',
    category: 'bitrix'
  },
  {
    id: 'gravity',
    name: 'Gravity',
    value: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
    category: 'bitrix'
  },
  {
    id: 'gradient',
    name: 'Gradient',
    value: 'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 60%, #e0c3fc 100%)',
    thumbnail: 'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 60%, #e0c3fc 100%)',
    category: 'bitrix'
  },

  // --- Existing TallyConnect Wallpapers (100% Preserved) ---
  {
    id: 'beach',
    name: 'Coastal Beach',
    value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    category: 'classic'
  },
  {
    id: 'mountain',
    name: 'Mountain Lake',
    value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    category: 'classic'
  },
  {
    id: 'liquid',
    name: 'Abstract Liquid',
    value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    category: 'classic'
  },
  {
    id: 'space',
    name: 'Dark Space',
    value: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    category: 'classic'
  },
  {
    id: 'violet',
    name: 'Cosmic Violet',
    value: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    category: 'classic'
  },
  {
    id: 'white',
    name: 'Clean White',
    value: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #edf2f7 100%)',
    thumbnail: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #edf2f7 100%)',
    category: 'classic'
  },
  {
    id: 'sunset',
    name: 'Sunset Aura',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    category: 'classic'
  },
  {
    id: 'midnight',
    name: 'Midnight Deep',
    value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #030712 100%)',
    thumbnail: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #030712 100%)',
    category: 'classic'
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    value: 'linear-gradient(135deg, #09090e 0%, #131722 50%, #0d273d 100%)',
    thumbnail: 'linear-gradient(135deg, #09090e 0%, #131722 50%, #0d273d 100%)',
    category: 'classic'
  }
];

export default function AppearanceSettings({
  bgImage,
  setBgImage,
  themeMode: propThemeMode,
  setThemeMode: propSetThemeMode,
  textScale: propTextScale,
  setTextScale: propSetTextScale,
  onBack,
  showTitle = true,
}) {
  // Theme mode: 'light' | 'dark' | 'system'
  const [themeMode, setThemeModeState] = useState(() => {
    return propThemeMode || localStorage.getItem('tc_theme_mode') || (localStorage.getItem('tc_dark') === '1' ? 'dark' : 'light');
  });

  // Text size: '1' | '1.5' | '2'
  const [textScale, setTextScaleState] = useState(() => {
    return propTextScale || localStorage.getItem('tc_text_scale') || '1';
  });

  // Custom wallpaper controls
  const [showCustomBg, setShowCustomBg] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [bgBusy, setBgBusy] = useState(false);
  const [bgError, setBgError] = useState('');
  const [bgFit, setBgFit] = useState(() => {
    return typeof localStorage !== 'undefined' ? (localStorage.getItem('tc_bg_size') || 'cover') : 'cover';
  });
  const fileInputRef = useRef(null);

  const handleSelectBgFit = (fit) => {
    setBgFit(fit);
    try {
      localStorage.setItem('tc_bg_size', fit);
    } catch {}
    document.documentElement.style.setProperty('--bg-size', fit);
    window.dispatchEvent(new CustomEvent('tc-bg-size-changed', {
      detail: { bgSize: fit }
    }));
  };

  // Card & Component Customization State (for restoring hidden components across TallyConnect)
  const [hiddenStats, setHiddenStats] = useState({
    reports: 0,
    pnl: 0,
    balanceSheet: 0,
    expenses: 0,
    cashflow: 0,
    salesAnalytics: 0,
    users: 0,
  });
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');

  const loadHiddenStats = () => {
    try {
      const parse = (k) => {
        try {
          const val = JSON.parse(localStorage.getItem(k) || '[]');
          return Array.isArray(val) ? val.length : 0;
        } catch { return 0; }
      };
      setHiddenStats({
        reports: parse('tc_reports_hidden') + parse('tc_report_cards_hidden'),
        pnl: parse('tc_pnl_kpi_hidden'),
        balanceSheet: parse('tc_balance_sheet_kpi_hidden'),
        expenses: parse('tc_expenses_kpi_hidden'),
        cashflow: parse('tc_cashflow_statement_kpi_hidden'),
        salesAnalytics: parse('tc_sales_analytics_kpi_hidden'),
        users: parse('tc_users_hidden') + parse('tc_user_hidden')
      });
    } catch {}
  };

  useEffect(() => {
    loadHiddenStats();
    const handler = () => loadHiddenStats();
    window.addEventListener('tc-unhide-sync', handler);
    return () => window.removeEventListener('tc-unhide-sync', handler);
  }, []);

  const handleRestorePage = (pageKey) => {
    try {
      if (pageKey === 'reports') {
        localStorage.removeItem('tc_reports_hidden');
        localStorage.removeItem('tc_report_cards_hidden');
        localStorage.removeItem('tc_report_cards_order');
        localStorage.removeItem('tc_reports_order');
      } else if (pageKey === 'pnl') {
        localStorage.removeItem('tc_pnl_kpi_hidden');
        localStorage.removeItem('tc_pnl_kpi_order');
      } else if (pageKey === 'balanceSheet') {
        localStorage.removeItem('tc_balance_sheet_kpi_hidden');
        localStorage.removeItem('tc_balance_sheet_kpi_order');
      } else if (pageKey === 'expenses') {
        localStorage.removeItem('tc_expenses_kpi_hidden');
        localStorage.removeItem('tc_expenses_kpi_order');
      } else if (pageKey === 'cashflow') {
        localStorage.removeItem('tc_cashflow_statement_kpi_hidden');
        localStorage.removeItem('tc_cashflow_statement_kpi_order');
      } else if (pageKey === 'salesAnalytics') {
        localStorage.removeItem('tc_sales_analytics_kpi_hidden');
        localStorage.removeItem('tc_sales_analytics_kpi_order');
      } else if (pageKey === 'users') {
        localStorage.removeItem('tc_users_hidden');
        localStorage.removeItem('tc_user_hidden');
        localStorage.removeItem('tc_user_order');
      }
      window.dispatchEvent(new Event('tc-unhide-sync'));
      loadHiddenStats();
      setResetSuccessNotice(`Restored all hidden cards and reset layout for ${pageKey}`);
      setTimeout(() => setResetSuccessNotice(''), 3000);
    } catch (e) {
      console.warn('Error restoring page components', e);
    }
  };

  const handleRestoreAll = () => {
    try {
      const keysToClear = [
        'tc_reports_hidden', 'tc_reports_order', 'tc_reports_pinned', 'tc_reports_sizes',
        'tc_report_cards_hidden', 'tc_report_cards_order', 'tc_report_cards_pinned', 'tc_report_cards_sizes',
        'tc_pnl_kpi_hidden', 'tc_pnl_kpi_order', 'tc_pnl_kpi_pinned', 'tc_pnl_kpi_sizes',
        'tc_balance_sheet_kpi_hidden', 'tc_balance_sheet_kpi_order', 'tc_balance_sheet_kpi_pinned', 'tc_balance_sheet_kpi_sizes',
        'tc_expenses_kpi_hidden', 'tc_expenses_kpi_order', 'tc_expenses_kpi_pinned', 'tc_expenses_kpi_sizes',
        'tc_cashflow_statement_kpi_hidden', 'tc_cashflow_statement_kpi_order', 'tc_cashflow_statement_kpi_pinned', 'tc_cashflow_statement_kpi_sizes',
        'tc_sales_analytics_kpi_hidden', 'tc_sales_analytics_kpi_order', 'tc_sales_analytics_kpi_pinned', 'tc_sales_analytics_kpi_sizes',
        'tc_users_hidden', 'tc_user_hidden', 'tc_user_order', 'tc_user_pinned'
      ];
      keysToClear.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      window.dispatchEvent(new Event('tc-unhide-sync'));
      loadHiddenStats();
      setResetSuccessNotice('All hidden cards and components restored to default layout across TallyConnect!');
      setTimeout(() => setResetSuccessNotice(''), 4000);
    } catch (e) {
      console.warn('Error resetting all components', e);
    }
  };

  // Wallpaper view mode: 'grid' | 'carousel'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('tc_theme_view_mode') || 'grid';
  });
  const carouselRef = useRef(null);

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('tc_theme_view_mode', mode);
    } catch {}
  };

  const scrollCarousel = (offset) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Sync with prop changes if passed
  useEffect(() => {
    if (propThemeMode && propThemeMode !== themeMode) {
      setThemeModeState(propThemeMode);
    }
  }, [propThemeMode]);

  useEffect(() => {
    if (propTextScale && propTextScale !== textScale) {
      setTextScaleState(propTextScale);
    }
  }, [propTextScale]);

  // Handle Theme Selection (Light, Dark, System)
  const handleSelectThemeMode = (mode) => {
    setThemeModeState(mode);
    if (propSetThemeMode) propSetThemeMode(mode);
    try {
      localStorage.setItem('tc_theme_mode', mode);
    } catch {}

    let isDark = false;
    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'light') {
      isDark = false;
    } else if (mode === 'system') {
      isDark = typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    try {
      localStorage.setItem('tc_dark', isDark ? '1' : '0');
    } catch {}

    // Apply attributes on documentElement for instant reactivity
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-mode', mode);

    window.dispatchEvent(new CustomEvent('tc-theme-changed', {
      detail: { themeMode: mode, isDark }
    }));
  };

  // Handle Text Size Selection (1, 1.5, 2)
  const handleSelectTextScale = (scale) => {
    const scaleStr = String(scale);
    setTextScaleState(scaleStr);
    if (propSetTextScale) propSetTextScale(scaleStr);
    try {
      localStorage.setItem('tc_text_scale', scaleStr);
    } catch {}

    document.documentElement.setAttribute('data-text-scale', scaleStr);
    window.dispatchEvent(new CustomEvent('tc-text-scale-changed', {
      detail: { textScale: scaleStr }
    }));
  };

  // Handle Wallpaper Selection
  const handleSelectWallpaper = (val) => {
    if (setBgImage) setBgImage(val);
    try {
      localStorage.setItem('tc_bg', val);
    } catch {}

    window.dispatchEvent(new CustomEvent('tc-bg-changed', {
      detail: { bgImage: val }
    }));
  };

  // Upload custom wallpaper with crisp high-definition screen matching
  const handleBgUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\//.test(file.type)) {
      setBgError('Please choose an image file (PNG, JPG or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setBgError('Image must be under 15 MB.');
      return;
    }

    setBgError('');
    setBgBusy(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setBgBusy(false);
      setBgError('Could not read image.');
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        setBgBusy(false);
        setBgError('Could not load image.');
      };
      img.onload = () => {
        try {
          // Detect screen / viewport resolution for crisp 1:1 pixel rendering
          const screenW = typeof window !== 'undefined' ? (window.screen?.width || window.innerWidth || 1920) : 1920;
          const screenH = typeof window !== 'undefined' ? (window.screen?.height || window.innerHeight || 1080) : 1080;
          const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
          const maxDim = Math.max(2560, Math.round(Math.max(screenW, screenH) * dpr));

          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // WebP at 0.92 gives pristine quality with low storage size; fallback to JPEG 0.90
          let compressed = '';
          try {
            compressed = canvas.toDataURL('image/webp', 0.92);
          } catch {}
          if (!compressed || !compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', 0.90);
          }

          handleSelectWallpaper(compressed);
        } catch {
          setBgError('Could not process image.');
        } finally {
          setBgBusy(false);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const isCurrentBg = (val) => {
    if (!bgImage && !val) return true;
    return bgImage === val;
  };

  return (
    <div className="tc-appearance-hub bitrix-appearance-container">
      {/* Optional Top Header with Back button */}
      {showTitle && (
        <div className="tc-appearance-header">
          {onBack && (
            <button
              type="button"
              className="tc-appearance-back-btn"
              onClick={onBack}
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 className="tc-appearance-title">Appearance</h2>
        </div>
      )}

      {/* Bitrix24 Top Notification / Banner Card */}
      <div className="tc-appearance-banner">
        <div className="tc-appearance-banner-icon" aria-hidden="true">
          <Palette size={22} />
        </div>
        <div className="tc-appearance-banner-text">
          Select the theme according to your preference.
        </div>
      </div>

      {/* ---------------- Section 1: Theme (Wallpapers) ---------------- */}
      <div className="tc-appearance-section">
        <div className="tc-appearance-section-head">
          <div className="tc-appearance-title-group">
            <h3 className="tc-appearance-section-title">Theme</h3>
            <span className="tc-appearance-count-pill">{ALL_THEMES_PRESETS.length} presets</span>
          </div>
          <div className="tc-appearance-section-actions">
            <div className="tc-view-mode-toggle" role="tablist" aria-label="Theme view mode">
              <button
                type="button"
                className={`tc-view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => handleSetViewMode('grid')}
                title="Grid layout"
                aria-label="Grid layout"
                role="tab"
                aria-selected={viewMode === 'grid'}
              >
                <LayoutGrid size={13} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                className={`tc-view-mode-btn ${viewMode === 'carousel' ? 'active' : ''}`}
                onClick={() => handleSetViewMode('carousel')}
                title="Carousel scroll layout"
                aria-label="Carousel scroll layout"
                role="tab"
                aria-selected={viewMode === 'carousel'}
              >
                <List size={13} />
                <span>Scroll</span>
              </button>
            </div>
            {viewMode === 'carousel' && (
              <div className="tc-carousel-nav-arrows">
                <button
                  type="button"
                  className="tc-carousel-arrow-btn"
                  onClick={() => scrollCarousel(-240)}
                  title="Scroll left"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  className="tc-carousel-arrow-btn"
                  onClick={() => scrollCarousel(240)}
                  title="Scroll right"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={`tc-theme-carousel-wrap tc-theme-container-wrap ${viewMode === 'grid' ? 'is-grid' : 'is-carousel'}`}>
          <div
            ref={carouselRef}
            className={`tc-theme-viewport ${viewMode === 'grid' ? 'tc-theme-grid' : 'tc-theme-carousel'}`}
            role="region"
            aria-label="Wallpaper themes"
          >
            {ALL_THEMES_PRESETS.map((theme) => {
              const active = isCurrentBg(theme.value);
              const bgCss = theme.value.startsWith('linear-gradient') || theme.value.startsWith('radial-gradient')
                ? theme.value
                : `url('${theme.thumbnail || theme.value}')`;

              return (
                <div
                  key={theme.id}
                  className={`tc-theme-card ${active ? 'active' : ''}`}
                  onClick={() => handleSelectWallpaper(theme.value)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  title={`${theme.name} theme`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectWallpaper(theme.value);
                    }
                  }}
                >
                  <div
                    className="tc-theme-card-bg"
                    style={{ background: bgCss }}
                  />
                  {active && (
                    <div className="tc-theme-active-badge" aria-label="Active">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                  <div className="tc-theme-card-overlay">
                    <span className="tc-theme-card-title">{theme.name}</span>
                    <button
                      type="button"
                      className={`tc-theme-card-btn ${active ? 'active' : 'apply'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectWallpaper(theme.value);
                      }}
                    >
                      {active ? (
                        <>
                          <Check size={12} strokeWidth={2.5} />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom background drawer for URL / Upload */}
        <div className="tc-custom-bg-section">
          <button
            type="button"
            className="tc-custom-bg-toggle"
            onClick={() => setShowCustomBg(!showCustomBg)}
          >
            <ImageIcon size={14} />
            <span>Custom background URL or device upload</span>
            {showCustomBg ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCustomBg && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  placeholder="Paste direct image or wallpaper URL..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--glass-border, rgba(255,255,255,0.08))',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                    color: 'var(--text-dark, #fff)',
                    fontSize: '13px'
                  }}
                />
                {customUrl && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ marginTop: '8px', padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => {
                      if (customUrl.trim()) {
                        handleSelectWallpaper(customUrl.trim());
                      }
                    }}
                  >
                    Apply Custom URL
                  </button>
                )}
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  style={{ display: 'none' }}
                  onChange={handleBgUpload}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={bgBusy}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={14} />
                  <span>{bgBusy ? 'Processing...' : 'Upload Image from Device'}</span>
                </button>
                {bgError && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444' }}>
                    <AlertCircle size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                    {bgError}
                  </p>
                )}

                {/* Wallpaper Screen Fit Selector */}
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '6px' }}>
                    Wallpaper Screen Fit:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'cover', label: 'Fill Screen' },
                      { id: 'contain', label: 'Fit to Screen' },
                      { id: '100% 100%', label: 'Match Screen' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectBgFit(opt.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          border: bgFit === opt.id ? '1px solid var(--primary-color, #007aff)' : '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                          background: bgFit === opt.id ? 'rgba(0,122,255,0.15)' : 'transparent',
                          color: bgFit === opt.id ? 'var(--primary-color, #38bdf8)' : 'var(--text-dark, #fff)',
                          fontSize: '12px',
                          fontWeight: bgFit === opt.id ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Section 2: App theme (Light / Dark / System) ---------------- */}
      <div className="tc-appearance-section">
        <h3 className="tc-appearance-section-title">App theme</h3>

        <div className="tc-app-theme-grid" role="radiogroup" aria-label="App theme selection">
          {/* Light Mode Card */}
          <div
            className={`tc-app-theme-card ${themeMode === 'light' ? 'selected' : ''}`}
            data-theme-option="light"
            onClick={() => handleSelectThemeMode('light')}
            role="radio"
            aria-checked={themeMode === 'light'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectThemeMode('light');
              }
            }}
          >
            <div className="tc-app-theme-preview">
              {themeMode === 'light' && (
                <div className="tc-selected-badge" aria-label="Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <div className="tc-phone-mockup light" aria-hidden="true">
                <div className="tc-phone-notch" />
                <div className="tc-phone-bar" />
              </div>
            </div>
            <span className="tc-app-theme-label">Light</span>
          </div>

          {/* Dark Mode Card */}
          <div
            className={`tc-app-theme-card ${themeMode === 'dark' ? 'selected' : ''}`}
            data-theme-option="dark"
            onClick={() => handleSelectThemeMode('dark')}
            role="radio"
            aria-checked={themeMode === 'dark'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectThemeMode('dark');
              }
            }}
          >
            <div className="tc-app-theme-preview">
              {themeMode === 'dark' && (
                <div className="tc-selected-badge" aria-label="Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <div className="tc-phone-mockup dark" aria-hidden="true">
                <div className="tc-phone-notch" />
                <div className="tc-phone-bar" />
              </div>
            </div>
            <span className="tc-app-theme-label">Dark</span>
          </div>

          {/* System Mode Card */}
          <div
            className={`tc-app-theme-card ${themeMode === 'system' ? 'selected' : ''}`}
            data-theme-option="system"
            onClick={() => handleSelectThemeMode('system')}
            role="radio"
            aria-checked={themeMode === 'system'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectThemeMode('system');
              }
            }}
          >
            <div className="tc-app-theme-preview">
              {themeMode === 'system' && (
                <div className="tc-selected-badge" aria-label="Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <div className="tc-phone-mockup system" aria-hidden="true">
                <div className="tc-phone-notch" />
                <div className="tc-phone-bar" />
              </div>
            </div>
            <span className="tc-app-theme-label">System</span>
          </div>
        </div>
      </div>

      {/* ---------------- Section 3: Text size (×1, ×1.5, ×2) ---------------- */}
      <div className="tc-appearance-section">
        <h3 className="tc-appearance-section-title">Text size</h3>

        <div className="tc-text-size-grid" role="radiogroup" aria-label="Text size scale selection">
          {/* x1 Card */}
          <div
            className={`tc-text-size-card ${textScale === '1' ? 'selected' : ''}`}
            data-text-size-option="1"
            onClick={() => handleSelectTextScale('1')}
            role="radio"
            aria-checked={textScale === '1'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectTextScale('1');
              }
            }}
          >
            <div className="tc-text-size-preview">
              {textScale === '1' && (
                <div className="tc-selected-badge" aria-label="Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <span className="tc-text-size-aa size-1">Aa</span>
            </div>
            <span className="tc-text-size-label">×1</span>
          </div>

          {/* x1.5 Card */}
          <div
            className={`tc-text-size-card ${textScale === '1.5' ? 'selected' : ''}`}
            data-text-size-option="1.5"
            onClick={() => handleSelectTextScale('1.5')}
            role="radio"
            aria-checked={textScale === '1.5'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectTextScale('1.5');
              }
            }}
          >
            <div className="tc-text-size-preview">
              {textScale === '1.5' && (
                <div className="tc-selected-badge" aria-label="Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <span className="tc-text-size-aa size-1-5">Aa</span>
            </div>
            <span className="tc-text-size-label">×1.5</span>
          </div>

          {/* x2 Card */}
          <div
            className={`tc-text-size-card ${textScale === '2' ? 'selected' : ''}`}
            data-text-size-option="2"
            onClick={() => handleSelectTextScale('2')}
            role="radio"
            aria-checked={textScale === '2'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectTextScale('2');
              }
            }}
          >
            <div className="tc-text-size-preview">
              {textScale === '2' && (
                <div className="tc-selected-badge" aria-label="Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <span className="tc-text-size-aa size-2">Aa</span>
            </div>
            <span className="tc-text-size-label">×2</span>
          </div>
        </div>
      </div>

      <>
      {/* =========================================================================
          4. CARD & COMPONENT CUSTOMIZATION (Bitrix24 Persistence & Restore)
          ========================================================================= */}
      <div hidden className="tc-appearance-section" style={{ display: 'none', marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div>
            <h3 className="tc-appearance-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={18} color="var(--primary-color)" />
              Card & Component Customization
            </h3>
            <p className="tc-appearance-section-subtitle" style={{ margin: '4px 0 0' }}>
              Manage customized card grids, restore hidden components, and reset dashboard layouts to defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestoreAll}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}
            title="Reset all card ordering, pin states, sizes, and restore all hidden cards across all pages"
          >
            <RotateCcw size={14} /> Reset All Pages to Default
          </button>
        </div>

        {resetSuccessNotice && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '12.5px',
            fontWeight: 700,
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={15} />
            {resetSuccessNotice}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          marginTop: '14px'
        }}>
          {[
            { key: 'reports', label: 'Reports & Business Registers', hidden: hiddenStats.reports },
            { key: 'pnl', label: 'Profit & Loss Statement', hidden: hiddenStats.pnl },
            { key: 'balanceSheet', label: 'Balance Sheet View', hidden: hiddenStats.balanceSheet },
            { key: 'expenses', label: 'Expenses Analysis View', hidden: hiddenStats.expenses },
            { key: 'cashflow', label: 'Cash Flow Statement', hidden: hiddenStats.cashflow },
            { key: 'salesAnalytics', label: 'Sales Analytics Detail', hidden: hiddenStats.salesAnalytics },
            { key: 'users', label: 'User Management', hidden: hiddenStats.users },
          ].map(p => (
            <div
              key={p.key}
              className="glass-panel"
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '11.5px', color: p.hidden > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                  {p.hidden > 0 ? `${p.hidden} component(s) hidden` : 'All components visible'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRestorePage(p.key)}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
                title={`Restore hidden components and reset layout for ${p.label}`}
              >
                <RotateCcw size={12} /> Restore
              </button>
            </div>
          ))}
        </div>
      </div>
      </>
    </div>
  );
}
