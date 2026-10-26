import React from 'react';

/**
 * AiChatbotIcon - Professional, enterprise-grade AI Chatbot icon (100% robot-free)
 * Features an elegant conversational chat bubble with 3 dialogue dots and
 * an intelligent AI sparkle star. Clean, executive, modern, and universally recognizable.
 */
export default function AiChatbotIcon({ size = 26, className = '', color = 'currentColor', glow = true }) {
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
        <linearGradient id="tcAiSparkleGrad" x1="16" y1="1" x2="23" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Main Conversational Chat Bubble Shell */}
      <path
        d="M12 3.5C6.75329 3.5 2.5 7.19365 2.5 11.75C2.5 14.1882 3.70425 16.3719 5.64259 17.8546C5.45269 18.7303 4.95726 19.8322 4.02013 20.8929C3.82112 21.1181 3.97825 21.5 4.28189 21.5C5.9723 21.5 7.73142 20.597 8.7844 19.6845C9.79979 19.9248 10.8794 20.05 12 20.05C17.2467 20.05 21.5 16.3563 21.5 11.75C21.5 7.19365 17.2467 3.5 12 3.5Z"
        fill={color === '#ffffff' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(99, 102, 241, 0.1)'}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3 Conversational Dialogue Dots */}
      <circle cx="7.75" cy="11.75" r="1.35" fill={color} />
      <circle cx="12" cy="11.75" r="1.35" fill={color} />
      <circle cx="16.25" cy="11.75" r="1.35" fill={color} />

      {/* AI Sparkle Star on Top Right */}
      <path
        d="M19.5 1.5L20.15 3.35L22 4L20.15 4.65L19.5 6.5L18.85 4.65L17 4L18.85 3.35L19.5 1.5Z"
        fill={glow ? 'url(#tcAiSparkleGrad)' : color}
        stroke={color === '#ffffff' ? '#ffffff' : 'none'}
        strokeWidth="0.4"
      />
    </svg>
  );
}
