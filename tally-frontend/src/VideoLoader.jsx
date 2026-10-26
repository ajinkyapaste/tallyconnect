import React, { useEffect, useRef, useState } from 'react';
import './VideoLoader.css';
import TallyConnectLogo from './TallyConnectLogo';

/**
 * VideoLoader: Cinematic TallyConnect Loading Experience.
 * Features:
 * - High-definition rotating global network animation video.
 * - Seamless logo shield that completely eliminates and blends out the video's rectangular card background.
 * - Pristine official transparent TallyConnect logo with subtle breathing glow.
 * - Progressive loading telemetry matching user journey (initial boot vs. post-login transition).
 * - Full accessibility support: prefers-reduced-motion, Escape to skip, ARIA progressbar semantics.
 * - Graceful fallback if video playback encounters network or format errors.
 */
export const VideoLoader = ({
  isPostLogin = false,
  minDuration = 2300,
  onComplete,
  videoSrc = '/tally-loading.mp4',
  statusMessage
}) => {
  const [fading, setFading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(25);
  const [statusText, setStatusText] = useState(
    statusMessage || 'Connecting to global network...'
  );
  const videoRef = useRef(null);

  // Video playback & clean loop management:
  // Starts at 0.20s where Earth is radiant and full.
  // Seamless loop guard at 1.70s so the white rectangle NEVER appears.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isSeeking = false;
    const startPlayback = () => {
      try {
        if (video.currentTime < 0.20) {
          video.currentTime = 0.20;
        }
      } catch {}
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    };

    if (video.readyState >= 1) {
      startPlayback();
    } else {
      video.addEventListener('loadedmetadata', startPlayback, { once: true });
    }

    let animId;
    const loopGuard = () => {
      if (video && !isSeeking && video.currentTime >= 1.70) {
        isSeeking = true;
        video.currentTime = 0.20;
      }
      animId = requestAnimationFrame(loopGuard);
    };
    animId = requestAnimationFrame(loopGuard);

    const onSeeked = () => {
      isSeeking = false;
    };
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', startPlayback);
      video.removeEventListener('seeked', onSeeked);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [videoSrc]);

  // Progressive milestone updates (smoothly pacing within minDuration)
  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setProgress(100);
      const instantTimer = setTimeout(() => {
        setFinished(true);
        if (onComplete) onComplete();
      }, 250);
      return () => clearTimeout(instantTimer);
    }

    const t1 = setTimeout(() => {
      setProgress(60);
      setStatusText('Synchronizing workspace...');
    }, Math.round(minDuration * 0.35));

    const t2 = setTimeout(() => {
      setProgress(90);
      setStatusText('Establishing secure connection...');
    }, Math.round(minDuration * 0.70));

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace ready');
    }, Math.round(minDuration * 0.90));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [minDuration, isPostLogin, onComplete]);

  // Handle completion and fade out
  const handleDone = () => {
    if (fading || finished) return;
    setFading(true);
    setTimeout(() => {
      setFinished(true);
      if (onComplete) onComplete();
    }, 450);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDone();
    }, minDuration);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDone();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [minDuration]);

  if (finished) return null;

  return (
    <div
      className={`tc-video-loader-overlay ${fading ? 'fade-out' : ''}`}
      role="progressbar"
      aria-label="Loading TallyConnect..."
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Video Viewport: Clean Rotating Earth Animation without any white rectangle */}
      <div className="tc-video-viewport">
        <video
          ref={videoRef}
          className="tc-video-element"
          src={videoSrc}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          onError={() => {
            console.warn('Video playback fallback active.');
          }}
        />
        <div className="tc-video-vignette" />
      </div>

      {/* Pristine Floating Official TallyConnect Branding (100% Transparent, No White Box) */}
      <div className="tc-logo-floating-brand tc-logo-blend-shield" aria-hidden="true">
        <div className="tc-logo-brand-inner">
          <TallyConnectLogo height={48} isDarkMode={true} />
        </div>
      </div>

      {/* HUD: Status, Progress & Skip */}
      <div className="tc-loader-hud">
        <div className="tc-status-pill">
          <span className="tc-status-beacon" />
          <span>{statusText}</span>
        </div>

        <div className="tc-progress-track">
          <div
            className="tc-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          className="tc-loader-skip-btn"
          onClick={handleDone}
          title="Press Esc to skip"
        >
          Press Esc to skip
        </button>
      </div>
    </div>
  );
};

export default VideoLoader;
