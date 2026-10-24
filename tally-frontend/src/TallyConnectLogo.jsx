import React from 'react';

/**
 * TallyConnectLogo component
 * Renders the official Tally CONNECT branding with high-res crisp assets,
 * adaptive dark/light mode presentation, seamless transparency, and proper proportions.
 */
export const TallyConnectLogo = ({
  height = 32,
  isDarkMode = false,
  className = '',
  style = {},
  showText = false
}) => {
  // Infer dark mode from prop or environment
  const effectiveDark = isDarkMode || (typeof document !== 'undefined' && (
    document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark-theme') ||
    localStorage.getItem('tc_dark') === '1'
  ));

  // High-contrast, transparent logos:
  // Dark mode: crisp white "Tally" with neon red brush stroke and crisp white "CONNECT"
  // Light mode: classic black "Tally" with red stroke and slate "CONNECT"
  const logoSrc = effectiveDark ? '/tally-connect-logo-dark.png' : '/tally-connect-logo.png';

  return (
    <div
      className={`tally-connect-branding ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        userSelect: 'none',
        background: 'transparent',
        ...style
      }}
    >
      <img
        src={logoSrc}
        alt="Tally CONNECT"
        height={height}
        style={{
          height: `${height}px`,
          width: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          background: 'transparent',
          imageRendering: '-webkit-optimize-contrast',
          filter: effectiveDark ? 'drop-shadow(0 1px 4px rgba(0,0,0,0.45))' : 'none'
        }}
        onError={(e) => {
          if (e.target.src.includes('-dark')) {
            e.target.src = '/tally-connect-logo.png';
          }
        }}
      />
    </div>
  );
};

export default TallyConnectLogo;
