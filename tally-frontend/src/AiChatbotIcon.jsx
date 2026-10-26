import React from 'react';

/**
 * AiChatbotIcon - Authentic, professional Generative AI Star icon
 * Features the industry-standard curved AI neural sparkles (Google Gemini / Apple Intelligence style).
 * Clean, executive, modern, and instantly recognizable as an intelligent AI Assistant.
 */
export default function AiChatbotIcon({ size = 26, className = '', color = '#ffffff', glow = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`tc-ai-chatbot-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="TallyConnect AI"
    >
      <defs>
        <linearGradient id="tcAiStarGlow" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <filter id="tcAiDropGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(255,255,255,0.45)" />
        </filter>
      </defs>

      {/* Primary Iconic AI Curved Star (Gemini / Generative AI Star) */}
      <path
        d="M12 2.2C12 7.2 7.8 11.4 2.8 11.4C7.8 11.4 12 15.6 12 20.6C12 15.6 16.2 11.4 21.2 11.4C16.2 11.4 12 7.2 12 2.2Z"
        fill={color === '#ffffff' ? 'url(#tcAiStarGlow)' : color}
        stroke={color}
        strokeWidth="0.6"
        strokeLinejoin="round"
        filter={glow ? 'url(#tcAiDropGlow)' : 'none'}
      />

      {/* Companion Secondary AI Sparkle (Top-Right) */}
      <path
        d="M19 2C19 4.3 17.3 6 15 6C17.3 6 19 7.7 19 10C19 7.7 20.7 6 23 6C20.7 6 19 4.3 19 2Z"
        fill={color === '#ffffff' ? '#ffffff' : color}
        opacity="0.95"
      />

      {/* Tertiary Ambient Micro-Sparkle (Bottom-Left) */}
      <path
        d="M5 16C5 17.4 4 18.4 2.6 18.4C4 18.4 5 19.4 5 20.8C5 19.4 6 18.4 7.4 18.4C6 18.4 5 17.4 5 16Z"
        fill={color === '#ffffff' ? '#ffffff' : color}
        opacity="0.85"
      />
    </svg>
  );
}
