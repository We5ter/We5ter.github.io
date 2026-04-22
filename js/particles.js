/**
 * YOYO Theme - Dual-mode Particle System
 * Dark mode: Cyber neon particles (original style)
 * Light mode: Soft starry ocean / gentle floating orbs
 */

(function() {
  'use strict';

  // Theme-specific configurations
  const THEMES = {
    dark: {
      particleCount: 55,
      connectionDistance: 120,
      mouseRadius: 180,
      particleSize: { min: 1.5, max: 3 },
      speed: 0.4,
      trailAlpha: 'rgba(10, 10, 15, 0.15)',
      colors: {
        primary: '#00f0ff',
        secondary: '#7b2ff7',
        tertiary: '#ff2d75'
      },
      connectionColor: (opacity) => `rgba(0, 240, 255, ${opacity})`,
      glowIntensity: 1.0,
      particleOpacity: { outer: [0.35, 0.1], core: 1 }
    },
    light: {
      particleCount: 40,
      connectionDistance: 140,
      mouseRadius: 200,
      particleSize: { min: 1.2, max: 2.8 },
      speed: 0.25,
      trailAlpha: 'rgba(248, 249, 252, 0.12)',
      colors: {
        primary: '#6366f1',     // indigo
        secondary: '#8b5cf6',   // violet
        tertiary: '#ec4899'     // pink
      },
      connectionColor: (opacity) => `rgba(99, 102, 241, ${opacity * 0.5})`,
      glowIntensity: 0.4,
      particleOpacity: { outer: [0.18, 0.05], core: 0.7 }
    }
  };

  let currentTheme = 'dark';
  let CONFIG = THEMES.dark;

  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: -1000, y: -1000, radius: CONFIG.mouseRadius };
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
      for (let i = 0; i < CONFIG.particleCount; i++) {
        this.particles.push(new Particle(this));
      }
    }

    switchTheme(theme) {
      if (theme === currentTheme) return;
      currentTheme = theme;
      CONFIG = THEMES[theme];
      this.mouse.radius = CONFIG.mouseRadius;
      // Control canvas visibility based on theme (CSS handles the rest)
      if (theme === 'light') {
        this.canvas.style.opacity = '0';
        this.canvas.style.zIndex = '-1';
      } else {
        this.canvas.style.opacity = '';
        this.canvas.style.zIndex = '';
      }
      // Re-init particles with new config
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
        this.mouse.x = -1000;
        this.mouse.y = -1000;
      });
    }

    animate() {
      // Clear with semi-transparent background for trail effect
      this.ctx.fillStyle = CONFIG.trailAlpha;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.time += currentTheme === 'dark' ? 0.008 : 0.005;

      // Update and draw particles
      this.particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      this.drawConnections();

      // Draw mouse glow (subtle in light mode)
      this.drawMouseGlow();

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.connectionDistance) {
            const opacity = (1 - distance / CONFIG.connectionDistance) *
              (currentTheme === 'dark' ? 0.4 : 0.25);

            this.ctx.beginPath();
            this.ctx.strokeStyle = CONFIG.connectionColor(opacity);
            this.ctx.lineWidth = currentTheme === 'dark' ? 0.8 : 0.5;
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }
    }

    drawMouseGlow() {
      if (this.mouse.x < 0) return;

      const intensity = CONFIG.glowIntensity;
      const gradient = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, this.mouse.radius
      );

      if (currentTheme === 'dark') {
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        gradient.addColorStop(0.4, 'rgba(123, 47, 247, 0.06)');
        gradient.addColorStop(1, 'rgba(123, 47, 247, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.06)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      }

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, this.mouse.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Orbiting particles around mouse (fewer & smaller in light mode)
      const orbitCount = currentTheme === 'dark' ? 4 : 2;
      for (let i = 0; i < orbitCount; i++) {
        const angle = this.time * 2.5 + (i * Math.PI * 2 / orbitCount);
        const orbitRadius = 25 + i * 18;
        const x = this.mouse.x + Math.cos(angle) * orbitRadius;
        const y = this.mouse.y + Math.sin(angle) * orbitRadius;

        const size = (2.5 - i * 0.4) * intensity;
        if (size < 0.3) continue;

        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);

        if (i % 3 === 0) this.ctx.fillStyle = CONFIG.colors.primary;
        else if (i % 3 === 1) this.ctx.fillStyle = CONFIG.colors.secondary;
        else this.ctx.fillStyle = CONFIG.colors.tertiary;

        this.ctx.globalAlpha = intensity;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Subtle glow for orbiting particles
        if (currentTheme === 'dark') {
          const orbGlow = this.ctx.createRadialGradient(x, y, 0, x, y, 10);
          orbGlow.addColorStop(0, this.ctx.fillStyle.replace(')', ', 0.3)').replace('rgb', 'rgba'));
          orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.ctx.fillStyle = orbGlow;
          this.ctx.beginPath();
          this.ctx.arc(x, y, 10, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  class Particle {
    constructor(system) {
      this.system = system;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.system.canvas.width;
      this.y = Math.random() * this.system.canvas.height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = CONFIG.particleSize.min +
        Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
      this.speedX = (Math.random() - 0.5) * CONFIG.speed;
      this.speedY = (Math.random() - 0.5) * CONFIG.speed;
      this.colorIndex = Math.floor(Math.random() * 3);
      this.angle = Math.random() * Math.PI * 2;
      this.orbitSpeed = 0.008 + Math.random() * 0.015;
      this.orbitRadius = 15 + Math.random() * 35;
      this.currentSize = this.size;
    }

    update() {
      this.angle += this.orbitSpeed;

      // Light mode: gentler movement, more floaty
      const waveAmp = currentTheme === 'dark' ? 0.25 : 0.15;
      this.baseX += this.speedX;
      this.baseY += this.speedY + Math.sin(this.angle) * waveAmp;

      // Boundary check with wrapping
      if (this.baseX < -50) this.baseX = this.system.canvas.width + 50;
      if (this.baseX > this.system.canvas.width + 50) this.baseX = -50;
      if (this.baseY < -50) this.baseY = this.system.canvas.height + 50;
      if (this.baseY > this.system.canvas.height + 50) this.baseY = -50;

      // Apply orbital offset
      const helixOffset = Math.sin(this.angle + this.x * 0.008) * this.orbitRadius;
      this.x = this.baseX + helixOffset * 0.4;
      this.y = this.baseY + Math.cos(this.angle) * this.orbitRadius * 0.25;

      // Mouse interaction
      const dx = this.system.mouse.x - this.x;
      const dy = this.system.mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.system.mouse.radius) {
        const force = (this.system.mouse.radius - distance) / this.system.mouse.radius;
        const angle = Math.atan2(dy, dx);

        const pushStrength = currentTheme === 'dark' ? 1.5 : 0.8;
        this.x += Math.cos(angle) * force * pushStrength;
        this.y += Math.sin(angle) * force * pushStrength;

        this.currentSize = this.size + force * (currentTheme === 'dark' ? 2.5 : 1.2);
      } else {
        this.currentSize = this.size;
      }
    }

    draw() {
      const ctx = this.system.ctx;
      const colors = [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.tertiary];
      const color = colors[this.colorIndex];
      const op = CONFIG.particleOpacity;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.currentSize * 4
      );
      glowGradient.addColorStop(0, this.system.hexToRgba(color, op.outer[0] * CONFIG.glowIntensity));
      glowGradient.addColorStop(0.5, this.system.hexToRgba(color, op.outer[1] * CONFIG.glowIntensity));
      glowGradient.addColorStop(1, this.system.hexToRgba(color, 0));

      ctx.beginPath();
      ctx.fillStyle = glowGradient;
      ctx.arc(this.x, this.y, this.currentSize * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = op.core;
      ctx.shadowColor = color;
      ctx.shadowBlur = currentTheme === 'dark' ? 8 : 4;
      ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // Initialize when DOM is ready
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

      console.log(`[YOJO] Particle system init (mode: ${currentTheme})...`);

      // Set canvas styles (note: z-index is controlled by CSS for light/dark mode switching)
      canvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        pointer-events: none !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      `;

      // If initial theme is light, hide canvas immediately
      if (currentTheme === 'light') {
        canvas.style.opacity = '0';
        canvas.style.zIndex = '-1';
      }

      const system = new ParticleSystem(canvas);
      console.log('[YOJO] Particle system ready!');

      // Listen for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            system.switchTheme(newTheme);
            console.log(`[YOJO] Particle theme switched to: ${newTheme}`);
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });

      // Also listen for toggle button clicks as fallback
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

  // Start when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
