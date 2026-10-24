import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './EarthLoader.css';
import TallyConnectLogo from './TallyConnectLogo';

/**
 * EarthLoader: Cinematic photorealistic 3D Earth loading animation.
 * Features:
 * - NASA Blue Marble Day Texture + Golden Night City Lights matching reference image
 * - Dynamic Day/Night Terminator Shader with realistic twilight Rayleigh scattering
 * - Electric-blue atmospheric Fresnel rim and soft outer corona on the sunlit crescent
 * - Ocean specular reflection (sun glint) and deep space starfield with circular pinpricks
 * - Real 23.4° axial tilt and smooth continuous rotation
 * - Elegant luxury loading status & glowing progress bar
 * - Smooth cinematic fadeout and complete WebGL memory disposal on complete
 */
export const EarthLoader = ({
  isReady = false,
  minDuration = 1800,
  onComplete,
  brandTitle = 'TALLY CONNECT'
}) => {
  const containerRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(20);
  const [statusText, setStatusText] = useState('Initializing workspace...');
  const [useFallback, setUseFallback] = useState(false);

  // Realistic status and progress progression scaled to minDuration
  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(50);
      setStatusText('Synchronizing workspace...');
    }, Math.round(minDuration * 0.25));

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Establishing secure connection...');
    }, Math.round(minDuration * 0.60));

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace Ready');
    }, Math.round(minDuration * 0.88));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [minDuration]);

  // Smooth fade-out trigger once minDuration has passed
  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const endTimer = setTimeout(() => {
        setFinished(true);
        if (onComplete) onComplete();
      }, 450);
      return () => clearTimeout(endTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  // Three.js Scene Setup & Animation Loop
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Elevated camera framing looking slightly down to match reference angle
    camera.position.set(0, 0.50, 3.60);
    camera.lookAt(0, -0.05, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.30;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL not available for EarthLoader, enabling photorealistic CSS fallback:", e?.message || e);
      setUseFallback(true);
      return;
    }

    // 2. Texture Loader with local textures
    const textureLoader = new THREE.TextureLoader();
    const dayMap = textureLoader.load('/earth/earth_day_2048.jpg');
    const nightMap = textureLoader.load('/earth/earth_lights_2048.png');

    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;

    // 3. Earth Group with 23.4° Axial Tilt
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (23.4 * Math.PI) / 180;
    scene.add(earthGroup);

    // Direction of sunlight: from upper left (illuminating daytime crescent on left)
    const sunDirection = new THREE.Vector3(-1.45, 0.40, 0.65).normalize();

    // 4. Custom Earth Shader Material (Day + Night City Lights + Specular + Atmosphere Rim)
    const earthVertexShader = `
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const earthFragmentShader = `
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vPosition;

      uniform sampler2D uDayMap;
      uniform sampler2D uNightMap;
      uniform vec3 uSunDirection;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vPosition);
        vec3 sunDir = normalize(uSunDirection);

        float sunDot = dot(normal, sunDir);
        float dayFactor = smoothstep(-0.06, 0.22, sunDot);

        vec4 dayColor = texture2D(uDayMap, vUv);
        vec4 nightColor = texture2D(uNightMap, vUv);

        // Ocean mask
        float isOcean = clamp((dayColor.b - dayColor.r * 0.72) * 2.8, 0.0, 1.0);

        // Ocean sun glint (specular highlight)
        vec3 halfDir = normalize(sunDir + viewDir);
        float specAngle = max(dot(normal, halfDir), 0.0);
        float specular = pow(specAngle, 36.0) * isOcean * max(sunDot, 0.0) * 1.15;

        // Day surface: rich blues, vibrant land, sun glint
        vec3 dayDiffuse = (dayColor.rgb * 1.28 + vec3(specular)) * max(sunDot + 0.06, 0.0);

        // Golden amber night city lights (matching reference photo)
        vec3 goldenCityColor = vec3(2.85, 1.95, 0.90);
        float nightLuma = max(max(nightColor.r, nightColor.g), nightColor.b);
        vec3 cityLights = pow(nightLuma, 1.15) * goldenCityColor * 5.2 * (1.0 - dayFactor);

        // Deep ocean night ambient
        vec3 nightAmbient = dayColor.rgb * 0.07 + vec3(0.006, 0.015, 0.032);

        // Electric cyan Rayleigh atmosphere on lit crescent rim
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
        float sunAlign = smoothstep(-0.25, 0.65, sunDot);
        vec3 limbColor = mix(vec3(0.06, 0.38, 0.96), vec3(0.32, 0.82, 1.0), sunAlign);
        vec3 innerAtmosphere = limbColor * fresnel * (sunAlign * 3.4 + 0.04);

        // Sunset twilight line
        float twilight = smoothstep(-0.08, 0.02, sunDot) * (1.0 - smoothstep(0.02, 0.16, sunDot));
        vec3 twilightScatter = vec3(0.92, 0.40, 0.10) * twilight * fresnel * 0.9;

        vec3 surface = mix(nightAmbient + cityLights, dayDiffuse, dayFactor);
        gl_FragColor = vec4(surface + innerAtmosphere + twilightScatter, 1.0);
      }
    `;

    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uDayMap: { value: dayMap },
        uNightMap: { value: nightMap },
        uSunDirection: { value: sunDirection }
      }
    });

    const earthGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const earthMesh = new THREE.Mesh(earthGeo, earthMaterial);
    // Initial rotation showing Americas with golden night lights in view
    earthMesh.rotation.y = 0.08;
    earthGroup.add(earthMesh);

    // 5. Atmospheric Outer Corona (Soft exponential falloff halo)
    const haloVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const haloFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uSunDirection;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vPosition);
        vec3 sunDir = normalize(uSunDirection);

        float rim = max(dot(normal, viewDir), 0.0);
        float corona = pow(rim, 3.2);

        float sunAlign = dot(normal, -sunDir);
        float sunFactor = smoothstep(-0.20, 0.70, sunAlign);

        vec3 coronaColor = mix(vec3(0.06, 0.42, 0.98), vec3(0.35, 0.85, 1.0), sunFactor);
        float alpha = corona * (sunFactor * 2.3 + 0.04);

        gl_FragColor = vec4(coronaColor * alpha, alpha);
      }
    `;

    const haloMaterial = new THREE.ShaderMaterial({
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      uniforms: {
        uSunDirection: { value: sunDirection }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    const haloGeo = new THREE.SphereGeometry(1.15, 64, 64);
    const haloMesh = new THREE.Mesh(haloGeo, haloMaterial);
    earthGroup.add(haloMesh);

    // 6. Twinkling Circular Starfield
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const ctx = starCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(210, 235, 255, 0.85)');
    grad.addColorStop(0.6, 'rgba(60, 140, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const starTexture = new THREE.CanvasTexture(starCanvas);

    const starsCount = 1400;
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const r = 35 + Math.random() * 65;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.4 + Math.random() * 0.6;
      starColors[i * 3] = brightness * 0.9;
      starColors[i * 3 + 1] = brightness * 0.95;
      starColors[i * 3 + 2] = brightness;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.1,
      map: starTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 7. Responsive Resize & Camera Distance
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      if (w < 480) {
        camera.position.z = 4.3;
        camera.position.y = 0.60;
      } else if (w < 768) {
        camera.position.z = 4.0;
        camera.position.y = 0.55;
      } else {
        camera.position.z = 3.60;
        camera.position.y = 0.50;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 8. Subtle mouse and touch parallax
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotationY = normX * 0.12;
      targetRotationX = normY * 0.08;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 9. Continuous Animation Loop
    let animId;
    const rotationSpeed = 0.0022;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth continuous Earth rotation
      earthMesh.rotation.y += rotationSpeed;

      // Slow starfield cosmic drift
      starField.rotation.y += 0.00008;

      // Smooth camera damping on pointer interaction
      camera.position.x += (targetRotationY - camera.position.x) * 0.04;
      camera.position.y += ((0.50 + targetRotationX) - camera.position.y) * 0.04;
      camera.lookAt(0, -0.05, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 10. Complete Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      earthGeo.dispose();
      haloGeo.dispose();
      starGeo.dispose();
      earthMaterial.dispose();
      haloMaterial.dispose();
      starMat.dispose();
      starTexture.dispose();
      dayMap.dispose();
      nightMap.dispose();
      renderer.dispose();
    };
  }, []);

  if (finished) return null;

  return (
    <div
      className={`earth-loader-overlay ${fading ? 'fade-out' : ''}`}
      aria-label="Loading workspace..."
      role="progressbar"
      aria-valuenow={progress}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div className="earth-canvas-container" ref={containerRef}>
        {useFallback && (
          <div className="earth-fallback-viewport">
            <div className="earth-fallback-sphere">
              <div className="earth-fallback-glow" />
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Vignette */}
      <div className="earth-loader-vignette" />

      {/* Modern Luxury Branding Overlay */}
      <div className="earth-loader-ui">
        <div className="earth-loader-logo-wrap">
          <TallyConnectLogo height={32} isDarkMode={true} />
        </div>

        <div className="earth-loader-status-wrap">
          <div className="earth-loader-bar-bg">
            <div
              className="earth-loader-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="earth-loader-status-text">
            <span className="earth-loader-pulse-dot" />
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarthLoader;
