/**
 * YOYO Theme - AI Era Particle System
 * Mouse-following 3D DNA/Neural Network Animation
 * Inspired by Google Gemini's interactive effects
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    particleCount: 60,
    connectionDistance: 120,
    mouseRadius: 180,
    particleSize: { min: 1.5, max: 3 },
    speed: 0.4,
    colors: {
      primary: '#00f0ff',
      secondary: '#7b2ff7',
      tertiary: '#ff2d75'
    }
  };

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
      this.ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.time += 0.008;

      // Update and draw particles
      this.particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections (neural network style)
      this.drawConnections();

      // Draw mouse glow effect
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
            const opacity = (1 - distance / CONFIG.connectionDistance) * 0.4;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }
    }

    drawMouseGlow() {
      if (this.mouse.x < 0) return;

      // Main glow
      const gradient = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, this.mouse.radius
      );
      
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
      gradient.addColorStop(0.4, 'rgba(123, 47, 247, 0.06)');
      gradient.addColorStop(1, 'rgba(123, 47, 247, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, this.mouse.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Orbiting particles around mouse
      for (let i = 0; i < 4; i++) {
        const angle = this.time * 2.5 + (i * Math.PI * 2 / 4);
        const orbitRadius = 25 + i * 18;
        const x = this.mouse.x + Math.cos(angle) * orbitRadius;
        const y = this.mouse.y + Math.sin(angle) * orbitRadius;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 2.5 - i * 0.4, 0, Math.PI * 2);
        
        if (i === 0) this.ctx.fillStyle = CONFIG.colors.primary;
        else if (i === 1) this.ctx.fillStyle = CONFIG.colors.secondary;
        else if (i === 2) this.ctx.fillStyle = CONFIG.colors.tertiary;
        else this.ctx.fillStyle = CONFIG.colors.primary;
        
        this.ctx.fill();

        // Glow for orbiting particles
        const orbGlow = this.ctx.createRadialGradient(x, y, 0, x, y, 10);
        orbGlow.addColorStop(0, this.ctx.fillStyle.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = orbGlow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fill();
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
      this.size = CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
      this.speedX = (Math.random() - 0.5) * CONFIG.speed;
      this.speedY = (Math.random() - 0.5) * CONFIG.speed;
      this.colorIndex = Math.floor(Math.random() * 3);
      this.angle = Math.random() * Math.PI * 2;
      this.orbitSpeed = 0.008 + Math.random() * 0.015;
      this.orbitRadius = 15 + Math.random() * 35;
      this.currentSize = this.size;
    }

    update() {
      // DNA-like orbital motion
      this.angle += this.orbitSpeed;
      
      // Base movement with sine wave for organic feel
      this.baseX += this.speedX;
      this.baseY += this.speedY + Math.sin(this.angle) * 0.25;

      // Boundary check with wrapping
      if (this.baseX < -50) this.baseX = this.system.canvas.width + 50;
      if (this.baseX > this.system.canvas.width + 50) this.baseX = -50;
      if (this.baseY < -50) this.baseY = this.system.canvas.height + 50;
      if (this.baseY > this.system.canvas.height + 50) this.baseY = -50;

      // Apply DNA helix offset
      const helixOffset = Math.sin(this.angle + this.x * 0.008) * this.orbitRadius;
      this.x = this.baseX + helixOffset * 0.4;
      this.y = this.baseY + Math.cos(this.angle) * this.orbitRadius * 0.25;

      // Mouse interaction - gentle attraction
      const dx = this.system.mouse.x - this.x;
      const dy = this.system.mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.system.mouse.radius) {
        const force = (this.system.mouse.radius - distance) / this.system.mouse.radius;
        const angle = Math.atan2(dy, dx);
        
        this.x += Math.cos(angle) * force * 1.5;
        this.y += Math.sin(angle) * force * 1.5;
        
        this.currentSize = this.size + force * 2.5;
      } else {
        this.currentSize = this.size;
      }
    }

    draw() {
      const ctx = this.system.ctx;
      const colors = [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.tertiary];
      const color = colors[this.colorIndex];

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.currentSize * 4
      );
      glowGradient.addColorStop(0, this.system.hexToRgba(color, 0.35));
      glowGradient.addColorStop(0.5, this.system.hexToRgba(color, 0.1));
      glowGradient.addColorStop(1, this.system.hexToRgba(color, 0));

      ctx.beginPath();
      ctx.fillStyle = glowGradient;
      ctx.arc(this.x, this.y, this.currentSize * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
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
      
      console.log('[YOJO] Initializing particle system...');
      
      // Set canvas styles
      canvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 0 !important;
        pointer-events: none !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      `;

      new ParticleSystem(canvas);
      console.log('[YOJO] Particle system ready!');
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
