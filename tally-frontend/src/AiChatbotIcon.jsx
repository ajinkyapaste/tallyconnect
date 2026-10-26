import React from 'react';

/**
 * AiChatbotIcon - A recognizable, professional AI chatbot icon
 * Features a modern robot assistant head with antenna, glowing eyes, and neural smile.
 */
export default function AiChatbotIcon({ size = 24, className = '', color = 'currentColor', glow = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`tc-ai-chatbot-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="TallyConnect AI Chatbot"
    >
      <defs>
        <linearGradient id="tcAiBotGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="tcAiBotGlow" x1="6" y1="7" x2="18" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Antenna with pulsing signal tip */}
      <circle cx="12" cy="2.8" r="1.8" fill={glow ? 'url(#tcAiBotGradient)' : color} />
      <line x1="12" y1="4.6" x2="12" y2="7.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />

      {/* Robot Ears / Side nodes */}
      <rect x="2" y="10" width="1.6" height="4" rx="0.8" fill={color} opacity="0.8" />
      <rect x="20.4" y="10" width="1.6" height="4" rx="0.8" fill={color} opacity="0.8" />

      {/* Main Bot Head Container */}
      <rect
        x="3.6"
        y="7.2"
        width="16.8"
        height="12"
        rx="4.2"
        stroke={color}
        strokeWidth="1.8"
        fill="rgba(255, 255, 255, 0.08)"
      />

      {/* Robot Eyes (Intelligent, friendly, recognizable) */}
      <circle cx="8.5" cy="12.2" r="1.6" fill={glow ? 'url(#tcAiBotGradient)' : color} />
      <circle cx="15.5" cy="12.2" r="1.6" fill={glow ? 'url(#tcAiBotGradient)' : color} />
      {/* Eye catchlights */}
      <circle cx="9" cy="11.7" r="0.5" fill="#ffffff" />
      <circle cx="16" cy="11.7" r="0.5" fill="#ffffff" />

      {/* Chatbot Smile / Voice Wave */}
      <path
        d="M9.2 15.6C10 16.5 14 16.5 14.8 15.6"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* AI Neural Sparkle badge at top right */}
      <path
        d="M19.5 2.5L20.2 4.2L21.9 4.9L20.2 5.6L19.5 7.3L18.8 5.6L17.1 4.9L18.8 4.2L19.5 2.5Z"
        fill={glow ? 'url(#tcAiBotGradient)' : color}
      />
    </svg>
  );
}
