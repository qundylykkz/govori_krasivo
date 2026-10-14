/**
 * Интерактивный фоновый холст с плавающими символами языка и реакцией на мышь
 */

class InteractiveBackground {
  constructor(canvasId = 'bg-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, radius: 140 };
    this.symbols = ['А', 'Б', 'В', 'Я', 'Ё', 'Ъ', '́', '?', '!', '« »', '📖', '💬', '✎', '★', 'О', 'И'];
    this.colors = ['rgba(59, 130, 246, 0.16)', 'rgba(16, 185, 129, 0.16)', 'rgba(245, 158, 11, 0.16)', 'rgba(139, 92, 246, 0.16)', 'rgba(236, 72, 153, 0.14)'];

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  createParticles() {
    this.particles = [];
    const count = Math.min(Math.floor((this.width * this.height) / 28000), 45);

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        originX: Math.random() * this.width,
        originY: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        symbol: this.symbols[Math.floor(Math.random() * this.symbols.length)],
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        fontSize: Math.floor(Math.random() * 16 + 18),
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.005,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    // Touch support for mobile devices
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
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Natural floating
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.wobble += p.wobbleSpeed;

      const floatY = Math.sin(p.wobble) * 0.5;

      // Mouse repulsion (interactivity)
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        const angle = Math.atan2(dy, dx);
        p.x -= Math.cos(angle) * force * 4.5;
        p.y -= Math.sin(angle) * force * 4.5;
      }

      // Screen wrap
      if (p.x < -40) p.x = this.width + 40;
      if (p.x > this.width + 40) p.x = -40;
      if (p.y < -40) p.y = this.height + 40;
      if (p.y > this.height + 40) p.y = -40;

      // Draw particle
      this.ctx.save();
      this.ctx.translate(p.x, p.y + floatY);
      this.ctx.rotate(p.rotation);
      this.ctx.font = `600 ${p.fontSize}px 'Nunito', 'Segoe UI', sans-serif`;
      this.ctx.fillStyle = p.color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.symbol, 0, 0);
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new InteractiveBackground('bg-canvas'));
} else {
  new InteractiveBackground('bg-canvas');
}

