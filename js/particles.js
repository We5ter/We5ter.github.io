/**
 * YOYO Theme - Starry Sky Particle System
 * A calm, twinkling starfield background.
 * Stars gently twinkle at their own pace, and softly react to the mouse cursor.
 *
 * Dark mode: Vibrant cyan/purple/pink stars
 * Light mode: Soft indigo/violet stars (subtle)
 */

(function() {
  'use strict';

  // =========================================================================
  //  Theme Configurations
  // =========================================================================
  const THEMES = {
    dark: {
      starCount: 120,
      mouseRadius: 140,
      repelForce: 1.8,
      friction: 0.96,
      returnSpeed: 0.012,
      starSize: { min: 0.6, max: 2.8 },
      colors: ['#00f0ff', '#7b2ff7', '#ff2d75', '#22d3ee', '#c084fc', '#ffffff'],
      glowIntensity: 1.0,
      trailAlpha: 'rgba(10, 10, 15, 0.25)',
      twinkleSpeedMin: 0.4,
      twinkleSpeedMax: 2.5,
      twinkleDepthMin: 0.25,
      twinkleDepthMax: 0.85,
    },
    light: {
      starCount: 80,
      mouseRadius: 160,
      repelForce: 1.2,
      friction: 0.97,
      returnSpeed: 0.015,
      starSize: { min: 0.5, max: 2.2 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#a78bfa', '#818cf8', '#c7d2fe'],
      glowIntensity: 0.4,
      trailAlpha: 'rgba(248, 249, 252, 0.30)',
      twinkleSpeedMin: 0.5,
      twinkleSpeedMax: 2.0,
      twinkleDepthMin: 0.3,
      twinkleDepthMax: 0.75,
    }
  };

  let currentTheme = 'dark';
  let CONFIG = THEMES.dark;

  // =========================================================================
  //  Star System
  // =========================================================================
  class StarSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.stars = [];
      this.mouse = { x: -9999, y: -9999 };
      this.animationId = null;
      this.time = 0;

      this.resize();
      this.init();
      this.bindEvents();
      this.animate();
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    init() {
      this.stars = [];
      const count = CONFIG.starCount;
      for (let i = 0; i < count; i++) {
        this.stars.push(new Star(this));
      }
    }

    switchTheme(theme) {
      if (theme === currentTheme) return;
      currentTheme = theme;
      CONFIG = THEMES[theme];
      this.init();
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.resize();
        this.init();
      });

      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      window.addEventListener('mouseout', () => {
        this.mouse.x = -9999;
        this.mouse.y = -9999;
      });

      window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          this.mouse.x = e.touches[0].clientX;
          this.mouse.y = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        this.mouse.x = -9999;
        this.mouse.y = -9999;
      });
    }

    animate() {
      // Semi-transparent clear for smooth trails
      this.ctx.fillStyle = CONFIG.trailAlpha;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.time += 0.016; // ~60fps time step

      // Update & draw all stars
      for (let i = 0; i < this.stars.length; i++) {
        this.stars[i].update(this.time);
      }
      for (let i = 0; i < this.stars.length; i++) {
        this.stars[i].draw(this.time);
      }

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  // =========================================================================
  //  Individual Star
  // =========================================================================
  class Star {
    constructor(system) {
      this.system = system;

      // Random position across the entire canvas
      this.originX = Math.random() * system.canvas.width;
      this.originY = Math.random() * system.canvas.height;
      this.x = this.originX;
      this.y = this.originY;

      // Velocity
      this.vx = 0;
      this.vy = 0;

      // Appearance — most stars are small, a few are larger/brighter
      const sizeRange = CONFIG.starSize;
      // Bias toward smaller sizes for a natural starfield look
      const sizeRand = Math.pow(Math.random(), 1.8);
      this.baseSize = sizeRange.min + sizeRand * (sizeRange.max - sizeRange.min);
      this.size = this.baseSize;

      // Color from theme palette
      this.colorIndex = Math.floor(Math.random() * CONFIG.colors.length);

      // Twinkle parameters — each star has its own rhythm
      this.twinklePhase = Math.random() * Math.PI * 2;
      this.twinkleSpeed = CONFIG.twinkleSpeedMin +
        Math.random() * (CONFIG.twinkleSpeedMax - CONFIG.twinkleSpeedMin);
      this.twinkleDepth = CONFIG.twinkleDepthMin +
        Math.random() * (CONFIG.twinkleDepthMax - CONFIG.twinkleDepthMin);

      // Gentle drift
      this.driftPhase = Math.random() * Math.PI * 2;
      this.driftSpeed = 0.002 + Math.random() * 0.008;
      this.driftRadius = 2 + Math.random() * 6;
    }

    update(time) {
      const mouse = this.system.mouse;
      const config = CONFIG;

      // --- Mouse repulsion (gentle push away) ---
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < config.mouseRadius && dist > 0.1) {
        const force = (config.mouseRadius - dist) / config.mouseRadius;
        const angle = Math.atan2(dy, dx);
        const repel = force * force * config.repelForce;

        this.vx -= Math.cos(angle) * repel;
        this.vy -= Math.sin(angle) * repel;

        // Slightly brighten near mouse
        this.size = this.baseSize + force * 1.5 * config.glowIntensity;
      } else {
        this.size += (this.baseSize - this.size) * 0.08;
      }

      // --- Return-to-origin with gentle drift ---
      const homeX = this.originX + Math.sin(this.driftPhase) * this.driftRadius;
      const homeY = this.originY + Math.cos(this.driftPhase * 1.3) * this.driftRadius * 0.6;

      this.vx += (homeX - this.x) * config.returnSpeed;
      this.vy += (homeY - this.y) * config.returnSpeed;

      // Apply friction
      this.vx *= config.friction;
      this.vy *= config.friction;

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Advance phases
      this.driftPhase += this.driftSpeed;
    }

    draw(time) {
      const ctx = this.system.ctx;
      const color = CONFIG.colors[this.colorIndex];
      const intensity = CONFIG.glowIntensity;
      const size = Math.max(0.3, this.size);

      // Calculate twinkle brightness
      // Combine two sine waves of different frequencies for organic shimmer
      const t1 = Math.sin(time * this.twinkleSpeed + this.twinklePhase);
      const t2 = Math.sin(time * this.twinkleSpeed * 0.7 + this.twinklePhase * 2.3);
      const twinkle = (t1 * 0.6 + t2 * 0.4); // -1 to 1 range
      // Map from [-1, 1] to [depthMin, 1]
      const brightness = this.twinkleDepth + (1 - this.twinkleDepth) * ((twinkle + 1) / 2);

      // Outer glow (subtle halo)
      if (currentTheme === 'dark' && size > 1.2) {
        const glowRadius = size * 4;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glow.addColorStop(0, this.system.hexToRgba(color, 0.15 * brightness * intensity));
        glow.addColorStop(0.5, this.system.hexToRgba(color, 0.05 * brightness * intensity));
        glow.addColorStop(1, this.system.hexToRgba(color, 0));

        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core star dot
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = brightness * (currentTheme === 'dark' ? 0.9 : 0.6);
      if (currentTheme === 'dark') {
        ctx.shadowColor = color;
        ctx.shadowBlur = 3 * brightness * intensity;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // =========================================================================
  //  Initialization
  // =========================================================================
  function init() {
    try {
      const canvas = document.getElementById('particle-canvas');
      if (!canvas) {
        console.warn('[YOJO] Particle canvas not found');
        return;
      }

      // Detect initial theme
      currentTheme =
        document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      CONFIG = THEMES[currentTheme];

      console.log(`[YOJO] Starry sky particle system init (mode: ${currentTheme})...`);

      // Set canvas styles
      canvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 0 !important;
        pointer-events: auto !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      `;

      const system = new StarSystem(canvas);
      console.log('[YOJO] Starry sky ready! ✨');

      // Listen for theme changes via MutationObserver
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            system.switchTheme(newTheme);
            console.log(`[YOJO] Theme switched to: ${newTheme}`);
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });

      // Fallback: detect theme toggle button clicks
      document.addEventListener('click', () => {
        setTimeout(() => {
          const t = document.documentElement.getAttribute('data-theme') || 'dark';
          if (t !== currentTheme) system.switchTheme(t);
        }, 50);
      });

      system.resize();
    } catch (error) {
      console.error('[YOJO] Star system error:', error);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
