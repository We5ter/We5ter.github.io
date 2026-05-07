/**
 * YOYO Theme - Antigravity Particle System
 * Inspired by Google Antigravity: particles float gently and
 * interact with mouse cursor — repelling when nearby, creating
 * a satisfying "anti-gravity" floating effect.
 *
 * Dark mode: Vibrant cyan/purple/pink particles
 * Light mode: Soft indigo/violet particles (subtle)
 */

(function() {
  'use strict';

  // =========================================================================
  //  Theme Configurations
  // =========================================================================
  const THEMES = {
    dark: {
      particleCount: 280,
      mouseRadius: 160,
      repelForce: 3.2,
      friction: 0.955,
      returnSpeed: 0.008,
      particleSize: { min: 1.5, max: 4 },
      colors: ['#00f0ff', '#7b2ff7', '#ff2d75', '#22d3ee', '#c084fc'],
      connectionColor: (opacity) => `rgba(0, 240, 255, ${opacity})`,
      glowIntensity: 1.0,
      trailAlpha: 'rgba(10, 10, 15, 0.18)',
      showConnections: true,
      connectionDistance: 100,
    },
    light: {
      particleCount: 200,
      mouseRadius: 180,
      repelForce: 2.2,
      friction: 0.96,
      returnSpeed: 0.01,
      particleSize: { min: 1.2, max: 3 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#a78bfa', '#818cf8'],
      connectionColor: (opacity) => `rgba(99, 102, 241, ${opacity * 0.35})`,
      glowIntensity: 0.45,
      trailAlpha: 'rgba(248, 249, 252, 0.20)',
      showConnections: true,
      connectionDistance: 90,
    }
  };

  let currentTheme = 'dark';
  let CONFIG = THEMES.dark;

  // =========================================================================
  //  Particle System
  // =========================================================================
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
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
      this.particles = [];
      const count = CONFIG.particleCount;
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this, i, count));
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

      // Touch support
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
      // Semi-transparent clear for motion trail
      this.ctx.fillStyle = CONFIG.trailAlpha;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.time += 0.006;

      // Update & draw all particles
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update();
      }
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].draw();
      }

      // Draw connections between nearby particles
      if (CONFIG.showConnections) {
        this.drawConnections();
      }

      // Mouse glow aura
      this.drawMouseGlow();

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
      const dist = CONFIG.connectionDistance;
      const ctx = this.ctx;
      const len = this.particles.length;

      // Only check a subset for performance (skip distant pairs)
      for (let i = 0; i < len; i++) {
        const p1 = this.particles[i];
        // Only check next ~30 particles (spatial-ish optimization)
        const limit = Math.min(i + 40, len);
        for (let j = i + 1; j < limit; j++) {
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const d2 = dx * dx + dy * dy;

          if (d2 < dist * dist) {
            const distance = Math.sqrt(d2);
            const opacity = (1 - distance / dist) * (currentTheme === 'dark' ? 0.25 : 0.12);
            ctx.beginPath();
            ctx.strokeStyle = CONFIG.connectionColor(opacity);
            ctx.lineWidth = currentTheme === 'dark' ? 0.6 : 0.4;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    }

    drawMouseGlow() {
      if (this.mouse.x < -1000) return;

      const ctx = this.ctx;
      const r = CONFIG.mouseRadius * 1.3;
      const intensity = CONFIG.glowIntensity;

      const gradient = ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, r
      );

      if (currentTheme === 'dark') {
        gradient.addColorStop(0, `rgba(0, 240, 255, ${0.10 * intensity})`);
        gradient.addColorStop(0.3, `rgba(123, 47, 247, ${0.06 * intensity})`);
        gradient.addColorStop(1, 'rgba(123, 47, 247, 0)');
      } else {
        gradient.addColorStop(0, `rgba(99, 102, 241, ${0.06 * intensity})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.03 * intensity})`);
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  // =========================================================================
  //  Individual Particle
  // =========================================================================
  class Particle {
    constructor(system, index, total) {
      this.system = system;
      this.index = index;
      this.total = total;

      // Position — distribute in a grid-like pattern with randomness (like Antigravity)
      const cols = Math.ceil(Math.sqrt(total * (system.canvas.width / system.canvas.height)));
      const cellW = system.canvas.width / cols;
      const cellH = system.canvas.height / Math.ceil(total / cols);

      const col = index % cols;
      const row = Math.floor(index / cols);

      // Base position (home) — where the particle wants to return to
      this.originX = cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.6;
      this.originY = cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.6;

      // Current position
      this.x = this.originX;
      this.y = this.originY;

      // Velocity
      this.vx = 0;
      this.vy = 0;

      // Appearance
      const sizeRange = CONFIG.particleSize;
      this.baseSize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
      this.size = this.baseSize;

      // Color from theme palette
      this.colorIndex = Math.floor(Math.random() * CONFIG.colors.length);

      // Gentle floating parameters
      this.floatPhase = Math.random() * Math.PI * 2;
      this.floatSpeed = 0.005 + Math.random() * 0.015;
      this.floatRadius = 3 + Math.random() * 8;
    }

    update() {
      const mouse = this.system.mouse;
      const config = CONFIG;

      // --- Mouse repulsion force (the core "antigravity" interaction) ---
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < config.mouseRadius && dist > 0.1) {
        // Repel: push AWAY from mouse
        const force = (config.mouseRadius - dist) / config.mouseRadius;
        const angle = Math.atan2(dy, dx);
        const repel = force * force * config.repelForce;

        this.vx -= Math.cos(angle) * repel;
        this.vy -= Math.sin(angle) * repel;

        // Slightly enlarge near mouse
        this.size = this.baseSize + force * 2.5 * config.glowIntensity;
      } else {
        // Gradually return to base size
        this.size += (this.baseSize - this.size) * 0.1;
      }

      // --- Return-to-origin spring force ---
      const homeX = this.originX + Math.sin(this.floatPhase) * this.floatRadius;
      const homeY = this.originY + Math.cos(this.floatPhase * 1.3) * this.floatRadius * 0.7;

      this.vx += (homeX - this.x) * config.returnSpeed;
      this.vy += (homeY - this.y) * config.returnSpeed;

      // Apply friction (damping)
      this.vx *= config.friction;
      this.vy *= config.friction;

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Advance float phase
      this.floatPhase += this.floatSpeed;
    }

    draw() {
      const ctx = this.system.ctx;
      const color = CONFIG.colors[this.colorIndex];
      const intensity = CONFIG.glowIntensity;
      const size = Math.max(0.3, this.size);

      // Outer soft glow
      const glowRadius = size * (currentTheme === 'dark' ? 5 : 4);
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
      glow.addColorStop(0, this.system.hexToRgba(color, 0.25 * intensity));
      glow.addColorStop(0.4, this.system.hexToRgba(color, 0.08 * intensity));
      glow.addColorStop(1, this.system.hexToRgba(color, 0));

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = currentTheme === 'dark' ? 0.9 : 0.65;
      ctx.shadowColor = color;
      ctx.shadowBlur = currentTheme === 'dark' ? 6 : 3;
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
        (window.matchMedia('(prefers-color-scheme: light').matches ? 'light' : 'dark');
      CONFIG = THEMES[currentTheme];

      console.log(`[YOJO] Antigravity particle system init (mode: ${currentTheme})...`);

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

      const system = new ParticleSystem(canvas);
      console.log('[YOJO] Antigravity particle system ready! ✨');

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
      console.error('[YOJO] Particle system error:', error);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
