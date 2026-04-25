/* ═══════════════════════════════════════════════════
   BIRTHDAY EXPERIENCE — SCRIPT.JS
   Orchestrates: Loader → Hero → Message → Final
═══════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────
   UTILITY: Wait helper
────────────────────────────────────────────────── */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


/* ══════════════════════════════════════════════════
   1. CANVAS PARTICLE SYSTEM
   Shared across sections — subtle floating sparks
══════════════════════════════════════════════════ */
class ParticleField {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.opts = {
      count:   options.count   || 55,
      color:   options.color   || '201,169,110',
      opacity: options.opacity || 0.35,
      speed:   options.speed   || 0.25,
      size:    options.size    || 1.5,
    };
    this.running = false;
    this.raf = null;
    this._resize = this._resize.bind(this);
    this._loop   = this._loop.bind(this);
  }

  start() {
    if (!this.canvas) return;
    this.running = true;
    this._resize();
    window.addEventListener('resize', this._resize);
    this._spawn();
    this._loop();
  }

  stop() {
    this.running = false;
    window.removeEventListener('resize', this._resize);
    cancelAnimationFrame(this.raf);
  }

  _resize() {
    this.canvas.width  = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  _spawn() {
    for (let i = 0; i < this.opts.count; i++) {
      this.particles.push(this._newParticle(true));
    }
  }

  _newParticle(random = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      x:  random ? Math.random() * w : Math.random() * w,
      y:  random ? Math.random() * h : h + 5,
      vx: (Math.random() - 0.5) * this.opts.speed * 0.6,
      vy: -(Math.random() * this.opts.speed + 0.08),
      r:  Math.random() * this.opts.size + 0.3,
      alpha: Math.random() * this.opts.opacity,
      life: 0,
      maxLife: 200 + Math.random() * 300,
    };
  }

  _loop() {
    if (!this.running) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.particles.forEach((p, i) => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.life++;

      // Fade in / out
      const progress = p.life / p.maxLife;
      const fade = progress < 0.15
        ? progress / 0.15
        : progress > 0.75
        ? 1 - (progress - 0.75) / 0.25
        : 1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.opts.color},${p.alpha * fade})`;
      ctx.fill();

      // Recycle
      if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > w + 10) {
        this.particles[i] = this._newParticle();
      }
    });

    this.raf = requestAnimationFrame(this._loop);
  }
}


/* ══════════════════════════════════════════════════
   2. LOADER PHASE
══════════════════════════════════════════════════ */
async function runLoader() {
  const loader = document.getElementById('loader');
  // Minimum display time for cinematic feel
  await wait(2200);

  loader.classList.add('fade-out');
  await wait(900); // match CSS transition
  loader.classList.add('hidden');
}


/* ══════════════════════════════════════════════════
   3. HERO PHASE
══════════════════════════════════════════════════ */
function showHero() {
  const hero = document.getElementById('hero');
  hero.classList.remove('hidden');

  // Start particle canvas
  const pHero = new ParticleField('hero-canvas', {
    count: 45,
    color: '201,169,110',
    opacity: 0.3,
    speed: 0.2,
  });
  pHero.start();

  return new Promise(resolve => {
    const btn = document.getElementById('enter-btn');
    btn.addEventListener('click', async () => {
      btn.disabled = true;

      // Button feedback
      btn.style.transform = 'scale(0.95)';
      await wait(150);
      btn.style.transform = '';

      // Play audio if available (user gesture = allowed)
      tryPlayAudio();

      // Cinematic hero exit
      hero.classList.add('exit');
      await wait(1000);
      hero.classList.add('hidden');
      pHero.stop();
      resolve();
    }, { once: true });
  });
}


/* ══════════════════════════════════════════════════
   4. MESSAGE PHASE
   Lines animate in sequentially using data-delay
══════════════════════════════════════════════════ */
function showMessage() {
  const section = document.getElementById('message');
  section.classList.remove('hidden');

  // Subtle canvas
  const pMsg = new ParticleField('msg-canvas', {
    count: 30,
    color: '225,143,164',
    opacity: 0.22,
    speed: 0.18,
  });
  pMsg.start();

  // Animate lines in order of data-delay
  const lines = section.querySelectorAll('.msg-line');
  lines.forEach(line => {
    const delay = parseInt(line.dataset.delay || 0, 10);
    setTimeout(() => {
      line.classList.add('visible');
    }, delay);
  });

  return new Promise(resolve => {
    const revealBtn = document.getElementById('reveal-btn');
    revealBtn.addEventListener('click', async () => {
      revealBtn.style.opacity = '0';
      section.classList.add('exit');
      await wait(900);
      section.classList.add('hidden');
      pMsg.stop();
      resolve();
    }, { once: true });
  });
}


/* ══════════════════════════════════════════════════
   5. FINAL REVEAL
   Animated headline + floating shapes
══════════════════════════════════════════════════ */
function showFinal() {
  const section = document.getElementById('final');
  section.classList.remove('hidden');

  // Particle canvas — warmer, more dense
  const pFinal = new ParticleField('final-canvas', {
    count: 70,
    color: '201,169,110',
    opacity: 0.4,
    speed: 0.22,
    size: 1.8,
  });
  pFinal.start();

  // Spawn decorative floating symbols
  spawnShapes();

  // Animated background gradient shift
  startGradientShift(section);
}


/* ──────────────────────────────────────────────────
   Floating Shapes (stars / crosses / circles)
────────────────────────────────────────────────── */
function spawnShapes() {
  const container = document.getElementById('shapes-container');
  const symbols   = ['✦', '✧', '·', '◦', '✶', '✸', '✹'];
  const colors    = ['var(--accent-a)', 'var(--accent-b)', 'var(--accent-c)'];
  const total     = 22;

  for (let i = 0; i < total; i++) {
    const el    = document.createElement('span');
    el.className = 'shape';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const size    = 0.7 + Math.random() * 1.5;
    const left    = Math.random() * 100;
    const top     = Math.random() * 100;
    const dur     = 4 + Math.random() * 6;
    const delay   = Math.random() * 2;
    const tx      = (Math.random() - 0.5) * 40;
    const ty      = -20 - Math.random() * 30;
    const rot     = (Math.random() - 0.5) * 30;
    const opa     = 0.15 + Math.random() * 0.35;
    const color   = colors[Math.floor(Math.random() * colors.length)];

    el.style.cssText = `
      left: ${left}%;
      top: ${top}%;
      --size: ${size}rem;
      --dur: ${dur}s;
      --delay: ${delay}s;
      --fade-delay: ${2.5 + delay}s;
      --tx: ${tx}px;
      --ty: ${ty}px;
      --rot: ${rot}deg;
      --max-opacity: ${opa};
      --shape-color: ${color};
    `;

    container.appendChild(el);
  }
}


/* ──────────────────────────────────────────────────
   Subtle moving gradient on final section
────────────────────────────────────────────────── */
function startGradientShift(el) {
  let t = 0;
  const tick = () => {
    t += 0.005;
    const hue1 = 35  + Math.sin(t)       * 15;
    const hue2 = 340 + Math.sin(t + 1.5) * 20;
    el.style.background = `radial-gradient(ellipse at 30% 40%,
      hsl(${hue1},55%,8%) 0%,
      hsl(230,30%,5%)     50%,
      hsl(${hue2},40%,7%) 100%)`;
    requestAnimationFrame(tick);
  };
  tick();
}


/* ══════════════════════════════════════════════════
   6. OPTIONAL: BACKGROUND AUDIO
   Place a file called 'music.mp3' next to index.html
   (user gesture via Enter button triggers this)
══════════════════════════════════════════════════ */
let audioCtx = null;

function tryPlayAudio() {
  // Try to load music.mp3 from same directory
  const audio = new Audio('music.mp3');
  audio.volume = 0.18;
  audio.loop   = true;

  audio.play().catch(() => {
    // No audio file or blocked — silently ignore
  });
}


/* ══════════════════════════════════════════════════
   7. MAIN ORCHESTRATION
══════════════════════════════════════════════════ */
async function main() {
  // Phase 1: Loader
  await runLoader();

  // Phase 2: Hero
  await showHero();

  // Phase 3: Message
  await showMessage();

  // Phase 4: Final
  showFinal();
}

// Kick off when DOM is ready
document.addEventListener('DOMContentLoaded', main);
