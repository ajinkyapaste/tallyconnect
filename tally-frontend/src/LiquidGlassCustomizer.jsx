import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Sparkles, Sun, Moon, RotateCcw, X, Check, Eye, Image as ImageIcon, Upload } from 'lucide-react';

/* ---------------- Wallpaper Presets ---------------- */
export const CUSTOM_WALLPAPERS = [
  { id: 'beach', name: 'Coastal Beach', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2800&q=80', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
  { id: 'mountain', name: 'Mountain Lake', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2800&q=80', thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' },
  { id: 'liquid', name: 'Abstract Liquid', value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2800&q=80', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80' },
  { id: 'space', name: 'Dark Space', value: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2800&q=80', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80' },
  { id: 'violet', name: 'Cosmic Violet', value: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2800&q=80', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80' },
  { id: 'white', name: 'Clean White', value: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #edf2f7 100%)', thumbnail: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #edf2f7 100%)' },
  { id: 'sunset', name: 'Sunset Aura', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'midnight', name: 'Midnight Deep', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #030712 100%)', thumbnail: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #030712 100%)' }
];

/* ---------------- Default Glass Configuration ---------------- */
export const DEFAULT_GLASS_SETTINGS = {
  opacity: 0.68,
  blur: 24,
  border: 0.25,
  shadow: 'medium' // 'soft' | 'medium' | 'deep'
};

/* ---------------- Presets ---------------- */
export const GLASS_PRESETS = [
  {
    id: 'crystal',
    name: 'Crystal Clear',
    icon: '💎',
    desc: 'Ultra transparent & subtle',
    opacity: 0.42,
    blur: 16,
    border: 0.18,
    shadow: 'soft'
  },
  {
    id: 'liquid',
    name: 'Liquid Glass',
    icon: '🌊',
    desc: 'Signature balanced frosted glass',
    opacity: 0.68,
    blur: 24,
    border: 0.28,
    shadow: 'medium'
  },
  {
    id: 'frosted',
    name: 'Frosted Ice',
    icon: '❄️',
    desc: 'Dense diffusion with glowing edges',
    opacity: 0.82,
    blur: 32,
    border: 0.38,
    shadow: 'deep'
  },
  {
    id: 'opaque',
    name: 'Opaque Shield',
    icon: '🛡️',
    desc: 'High contrast & maximum legibility',
    opacity: 0.94,
    blur: 18,
    border: 0.45,
    shadow: 'deep'
  }
];

/* ---------------- Apply CSS Variables ---------------- */
export const applyGlassSettings = (settings, isDarkMode = false) => {
  if (typeof document === 'undefined') return;

  const opacity = Math.min(Math.max(Number(settings?.opacity ?? DEFAULT_GLASS_SETTINGS.opacity), 0.25), 0.98);
  const blur = Math.min(Math.max(Number(settings?.blur ?? DEFAULT_GLASS_SETTINGS.blur), 4), 48);
  const border = Math.min(Math.max(Number(settings?.border ?? DEFAULT_GLASS_SETTINGS.border), 0.08), 0.6);
  const shadowMode = settings?.shadow || 'medium';

  let shadowCss = '0 8px 24px 0 rgba(15, 23, 42, 0.08)';
  if (shadowMode === 'soft') {
    shadowCss = isDarkMode
      ? '0 4px 16px 0 rgba(0, 0, 0, 0.35)'
      : '0 4px 16px 0 rgba(15, 23, 42, 0.04)';
  } else if (shadowMode === 'deep') {
    shadowCss = isDarkMode
      ? '0 24px 56px 0 rgba(0, 0, 0, 0.65), 0 4px 12px 0 rgba(0, 0, 0, 0.35)'
      : '0 20px 48px 0 rgba(15, 23, 42, 0.16), 0 4px 12px 0 rgba(15, 23, 42, 0.06)';
  } else {
    // medium default
    shadowCss = isDarkMode
      ? '0 12px 36px 0 rgba(0, 0, 0, 0.48), 0 2px 6px 0 rgba(0, 0, 0, 0.25)'
      : '0 10px 30px 0 rgba(15, 23, 42, 0.09), 0 1px 3px 0 rgba(15, 23, 42, 0.04)';
  }

  const root = document.documentElement;

  // 1. Primitive tokens
  root.style.setProperty('--glass-opacity', String(opacity));
  root.style.setProperty('--glass-blur', `${blur}px`);
  root.style.setProperty('--glass-border-opacity', String(border));
  root.style.setProperty('--glass-shadow', shadowCss);

  // 2. Adaptive Backgrounds
  if (isDarkMode) {
    root.style.setProperty('--glass-bg', `rgba(20, 24, 33, ${opacity})`);
    root.style.setProperty(
      '--glass-card-bg',
      `linear-gradient(135deg, rgba(30, 41, 59, ${opacity}) 0%, rgba(15, 23, 42, ${Math.max(0.35, opacity - 0.12)}) 100%)`
    );
    root.style.setProperty('--glass-border', `rgba(255, 255, 255, ${border * 0.7})`);
    root.style.setProperty('--glass-inset-highlight', 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)');
    root.style.setProperty('--glass-hover', 'rgba(255, 255, 255, 0.10)');
  } else {
    root.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${opacity})`);
    root.style.setProperty(
      '--glass-card-bg',
      `linear-gradient(135deg, rgba(255, 255, 255, ${opacity}) 0%, rgba(255, 255, 255, ${Math.max(0.3, opacity - 0.18)}) 100%)`
    );
    root.style.setProperty('--glass-border', `rgba(255, 255, 255, ${border})`);
    root.style.setProperty('--glass-inset-highlight', 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.88)');
    root.style.setProperty('--glass-hover', 'rgba(0, 0, 0, 0.05)');
  }

  // 3. Save to localStorage
  try {
    localStorage.setItem('tc_glass_opacity', String(opacity));
    localStorage.setItem('tc_glass_blur', String(blur));
    localStorage.setItem('tc_glass_border', String(border));
    localStorage.setItem('tc_glass_shadow', shadowMode);
    localStorage.setItem('tc_glass', String(opacity)); // sync backward compatibility
  } catch {}

  // 4. Notify all components
  window.dispatchEvent(new CustomEvent('tc-glass-changed', { detail: { opacity, blur, border, shadow: shadowMode } }));
};

/* ---------------- Load Saved Settings ---------------- */
export const getSavedGlassSettings = () => {
  try {
    const opacity = parseFloat(localStorage.getItem('tc_glass_opacity') || localStorage.getItem('tc_glass'));
    const blur = parseInt(localStorage.getItem('tc_glass_blur'), 10);
    const border = parseFloat(localStorage.getItem('tc_glass_border'));
    const shadow = localStorage.getItem('tc_glass_shadow');

    return {
      opacity: Number.isFinite(opacity) ? opacity : DEFAULT_GLASS_SETTINGS.opacity,
      blur: Number.isFinite(blur) ? blur : DEFAULT_GLASS_SETTINGS.blur,
      border: Number.isFinite(border) ? border : DEFAULT_GLASS_SETTINGS.border,
      shadow: shadow || DEFAULT_GLASS_SETTINGS.shadow
    };
  } catch {
    return { ...DEFAULT_GLASS_SETTINGS };
  }
};

/* ---------------- Interactive Controls UI ---------------- */
export const LiquidGlassControls = ({ isDarkMode = false, onSettingsChanged }) => {
  const [settings, setSettings] = useState(() => getSavedGlassSettings());
  const [currentBg, setCurrentBg] = useState(() => localStorage.getItem('tc_bg') || CUSTOM_WALLPAPERS[0].value);
  const fileUploadRef = useRef(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const applyWallpaper = (bgVal) => {
    setCurrentBg(bgVal);
    let bgCss = `url('${bgVal}')`;
    const s = String(bgVal || '').trim().toLowerCase();
    if (s.startsWith('linear-gradient') || s.startsWith('radial-gradient')) {
      bgCss = bgVal;
    } else if (s.startsWith('#') || s.startsWith('rgb')) {
      bgCss = `linear-gradient(0deg, ${bgVal}, ${bgVal})`;
    } else if (s.startsWith('data:image/svg')) {
      bgCss = `url("${bgVal.replace(/"/g, '\\"')}")`;
    }

    document.documentElement.style.setProperty('--bg-image', bgCss);
    try {
      if (bgVal && (!bgVal.startsWith('data:') || bgVal.length < 500000)) {
        localStorage.setItem('tc_bg', bgVal);
      }
    } catch {}
    window.dispatchEvent(new CustomEvent('tc-bg-changed', { detail: { bgImage: bgVal } }));
  };

  const handleDeviceUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploadBusy(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX_WIDTH = 1600;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          applyWallpaper(compressed);
        } catch {} finally {
          setUploadBusy(false);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const updateSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    applyGlassSettings(next, isDarkMode);
    if (onSettingsChanged) onSettingsChanged(next);
  };

  const handleApplyPreset = (preset) => {
    const next = {
      opacity: preset.opacity,
      blur: preset.blur,
      border: preset.border,
      shadow: preset.shadow
    };
    setSettings(next);
    applyGlassSettings(next, isDarkMode);
    if (onSettingsChanged) onSettingsChanged(next);
  };

  const handleReset = () => {
    setSettings(DEFAULT_GLASS_SETTINGS);
    applyGlassSettings(DEFAULT_GLASS_SETTINGS, isDarkMode);
    if (onSettingsChanged) onSettingsChanged(DEFAULT_GLASS_SETTINGS);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Presets Row */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Glass Presets
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {GLASS_PRESETS.map((p) => {
            const isSelected = Math.abs(settings.opacity - p.opacity) < 0.05 && Math.abs(settings.blur - p.blur) < 4;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid var(--primary-color, #007aff)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(0, 122, 255, 0.12)' : 'var(--glass-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '16px' }}>{p.icon}</span>
                  {isSelected && <Check size={14} color="var(--primary-color, #007aff)" />}
                </div>
                <strong style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{p.name}</strong>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.2' }}>{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opacity Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
            Transparency / Opacity
          </label>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-color, #007aff)' }}>
            {Math.round(settings.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="95"
          value={Math.round(settings.opacity * 100)}
          onChange={(e) => updateSetting('opacity', Number(e.target.value) / 100)}
          style={{ width: '100%', accentColor: 'var(--primary-color, #007aff)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>Sheer (30%)</span>
          <span>Balanced</span>
          <span>Solid (95%)</span>
        </div>
      </div>

      {/* Blur Intensity Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
            Frosted Blur Intensity
          </label>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-color, #007aff)' }}>
            {settings.blur}px
          </span>
        </div>
        <input
          type="range"
          min="8"
          max="40"
          step="2"
          value={settings.blur}
          onChange={(e) => updateSetting('blur', Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary-color, #007aff)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>Sharp (8px)</span>
          <span>Frosted (24px)</span>
          <span>Deep Mist (40px)</span>
        </div>
      </div>

      {/* Border Highlight Clarity */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
            Glass Border Highlight
          </label>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-color, #007aff)' }}>
            {Math.round(settings.border * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="50"
          value={Math.round(settings.border * 100)}
          onChange={(e) => updateSetting('border', Number(e.target.value) / 100)}
          style={{ width: '100%', accentColor: 'var(--primary-color, #007aff)', cursor: 'pointer' }}
        />
      </div>

      {/* Shadow Elevation */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>
          Shadow Elevation
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'soft', label: 'Soft Depth' },
            { id: 'medium', label: 'Balanced' },
            { id: 'deep', label: 'Deep Floating' }
          ].map((sh) => (
            <button
              key={sh.id}
              type="button"
              onClick={() => updateSetting('shadow', sh.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '12px',
                border: settings.shadow === sh.id ? '2px solid var(--primary-color, #007aff)' : '1px solid var(--glass-border)',
                background: settings.shadow === sh.id ? 'rgba(0, 122, 255, 0.12)' : 'var(--glass-bg)',
                color: settings.shadow === sh.id ? 'var(--primary-color, #007aff)' : 'var(--text-dark)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {sh.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background Wallpaper Section */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
            Background Wallpaper & Ambience
          </label>
          <button
            type="button"
            onClick={() => fileUploadRef.current?.click()}
            disabled={uploadBusy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--primary-color, #007aff)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Upload size={12} /> {uploadBusy ? 'Compressing…' : 'Upload Image'}
          </button>
          <input
            ref={fileUploadRef}
            type="file"
            accept="image/*"
            onChange={handleDeviceUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Wallpaper Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
          {CUSTOM_WALLPAPERS.map((wp) => {
            const isSelected = currentBg === wp.value;
            const bgThumb = wp.value.startsWith('linear-gradient') ? wp.value : `url('${wp.thumbnail || wp.value}')`;
            return (
              <div
                key={wp.id}
                onClick={() => applyWallpaper(wp.value)}
                style={{
                  height: '62px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: bgThumb,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: isSelected ? '2.5px solid var(--primary-color, #007aff)' : '1px solid var(--glass-border)',
                  boxShadow: isSelected ? '0 0 0 2px rgba(0, 122, 255, 0.3), 0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease'
                }}
                title={wp.name}
              >
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--primary-color, #007aff)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2px 4px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: wp.value.includes('ffffff') ? '#0f172a' : '#ffffff',
                    background: wp.value.includes('ffffff') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {wp.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        type="button"
        onClick={handleReset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: '6px'
        }}
      >
        <RotateCcw size={14} /> Reset Glass to Default
      </button>
    </div>
  );
};

/* ---------------- Header Popover Trigger & Modal ---------------- */
export const LiquidGlassModal = ({ isOpen, onClose, isDarkMode = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fade-in modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '92vh',
          background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.94))',
          borderRadius: '26px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #007aff, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>
                Liquid Glass Customizer
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Adjust transparency, blur, borders &amp; depth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.05)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 22px 24px', overflowY: 'auto' }}>
          <LiquidGlassControls isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};
