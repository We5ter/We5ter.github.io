/**
 * YOYO Theme - AI Era Particle System
 * Mouse-following 3D DNA/Neural Network Animation
 * Inspired by Google Gemini's interactive effects
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    particleCount: 80,
    connectionDistance: 150,
    mouseRadius: 200,
    particleSize: { min: 1, max: 3 },
    speed: 0.3,
    colors: {
      primary: '#00f0ff',
      secondary: '#7b2ff7',
      tertiary: '#ff2d75',
      glow: 'rgba(0, 240, 255, 0.15)'
    },
    dnaMode: true,
    trailLength: 0.92
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

      // Touch support
      window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          this.mouse.x = e.touches[0].clientX;
          this.mouse.y = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
      });
    }

    animate() {
      this.ctx.fillStyle = `rgba(10, 10, 15, ${CONFIG.trailLength})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.time += 0.01;

      // Update and draw particles
      this.particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections (DNA helix style)
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
            const opacity = 1 - distance / CONFIG.connectionDistance;
            
            // Create gradient line
            const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, this.hexToRgba(CONFIG.colors.primary, opacity * 0.5));
            gradient.addColorStop(0.5, this.hexToRgba(CONFIG.colors.secondary, opacity * 0.3));
            gradient.addColorStop(1, this.hexToRgba(CONFIG.colors.primary, opacity * 0.5));

            this.ctx.beginPath();
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = opacity * 1.5;
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }
    }

    drawMouseGlow() {
      if (this.mouse.x < 0) return;

      const gradient = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, this.mouse.radius
      );
      
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
      gradient.addColorStop(0.5, 'rgba(123, 47, 247, 0.04)');
      gradient.addColorStop(1, 'rgba(123, 47, 247, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, this.mouse.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw orbiting particles around mouse
      for (let i = 0; i < 3; i++) {
        const angle = this.time * 2 + (i * Math.PI * 2 / 3);
        const orbitRadius = 30 + i * 20;
        const x = this.mouse.x + Math.cos(angle) * orbitRadius;
        const y = this.mouse.y + Math.sin(angle) * orbitRadius;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 2 - i * 0.5, 0, Math.PI * 2);
        this.ctx.fillStyle = i === 0 ? CONFIG.colors.primary : 
                             i === 1 ? CONFIG.colors.secondary : CONFIG.colors.tertiary;
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
      this.orbitSpeed = 0.005 + Math.random() * 0.01;
      this.orbitRadius = 20 + Math.random() * 40;
    }

    update() {
      // DNA-like orbital motion
      this.angle += this.orbitSpeed;
      
      // Base movement with sine wave for organic feel
      this.baseX += this.speedX;
      this.baseY += this.speedY + Math.sin(this.angle) * 0.3;

      // Boundary check with wrapping
      if (this.baseX < -50) this.baseX = this.system.canvas.width + 50;
      if (this.baseX > this.system.canvas.width + 50) this.baseX = -50;
      if (this.baseY < -50) this.baseY = this.system.canvas.height + 50;
      if (this.baseY > this.system.canvas.height + 50) this.baseY = -50;

      // Apply DNA helix offset
      const helixOffset = Math.sin(this.angle + this.x * 0.01) * this.orbitRadius;
      this.x = this.baseX + helixOffset * 0.5;
      this.y = this.baseY + Math.cos(this.angle) * this.orbitRadius * 0.3;

      // Mouse interaction - attraction/repulsion
      const dx = this.system.mouse.x - this.x;
      const dy = this.system.mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.system.mouse.radius) {
        const force = (this.system.mouse.radius - distance) / this.system.mouse.radius;
        const angle = Math.atan2(dy, dx);
        
        // Gentle attraction towards mouse
        this.x += Math.cos(angle) * force * 2;
        this.y += Math.sin(angle) * force * 2;
        
        // Increase size when near mouse
        this.currentSize = this.size + force * 2;
      } else {
        this.currentSize = this.size;
      }
    }

    draw() {
      const ctx = this.system.ctx;
      const colors = [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.tertiary];
      const color = colors[this.colorIndex];

      // Glow effect
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.currentSize * 3
      );
      gradient.addColorStop(0, this.system.hexToRgba(color, 0.6));
      gradient.addColorStop(0.5, this.system.hexToRgba(color, 0.2));
      gradient.addColorStop(1, this.system.hexToRgba(color, 0));

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(this.x, this.y, this.currentSize * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(this.x, this.y, this.currentSize || this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize when DOM is ready
  function init() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    
    // Set canvas as background
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';

    new ParticleSystem(canvas);
  }

  // Start when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
