'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Theme tokens ──────────────────────────────────────────

const THEMES = {
  light: {
    bg:               '#F5F0E8',
    ink:              '#1C1510',
    canvasRgb:        '55,42,30',
    navBorder:        'rgba(28,21,16,0.1)',
    linkColor:        'rgba(55,42,30,0.45)',
    taglineColor:     'rgba(55,42,30,0.4)',
    inputBg:          'rgba(255,255,255,0.55)',
    inputBgFocus:     'rgba(255,255,255,0.85)',
    inputBorder:      'rgba(55,42,30,0.15)',
    inputBorderFocus: 'rgba(55,42,30,0.35)',
    footnoteColor:    'rgba(55,42,30,0.25)',
  },
  dark: {
    bg:               '#080608',
    ink:              '#EDE8DF',
    canvasRgb:        '205,195,178',
    navBorder:        'rgba(255,255,255,0.07)',
    linkColor:        'rgba(205,195,178,0.4)',
    taglineColor:     'rgba(205,195,178,0.38)',
    inputBg:          'rgba(255,255,255,0.05)',
    inputBgFocus:     'rgba(255,255,255,0.08)',
    inputBorder:      'rgba(255,255,255,0.1)',
    inputBorderFocus: 'rgba(205,195,178,0.4)',
    footnoteColor:    'rgba(205,195,178,0.2)',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// ── Labels ────────────────────────────────────────────────

const LABELS = [
  'quit my job',        'move abroad',          'start a company',
  'go back to school',  'switch careers',        'take a gap year',
  'have kids now',      'move to a new city',    'invest everything',
  'turn down the offer','say yes to the risk',   'stay where you are',
  'propose',            'sell the house',         'go freelance',
  'write the book',     'take the sabbatical',   'end the relationship',
  'apply for the visa', 'quit the PhD',           'move back home',
  'retire early',       'start over',             'take the leap',
  'ask for the raise',  'buy the one-way ticket', 'walk away',
];

// ── Galaxy canvas ─────────────────────────────────────────

const COUNT = 80;
const DEPTH = 1400;
const SPEED = 2.8;
const FOV   = 380;
const MONO  = "'Space Mono', 'Courier New', monospace";

interface Star { x: number; y: number; z: number; label: string; }

function randomStar(W: number, H: number, idx: number, randomZ = true): Star {
  return {
    x: (Math.random() - 0.5) * W * 2.2,
    y: (Math.random() - 0.5) * H * 2.2,
    z: randomZ ? -Math.random() * DEPTH : -DEPTH,
    label: LABELS[idx % LABELS.length],
  };
}

function GalaxyCanvas({ themeRef }: { themeRef: React.RefObject<ThemeKey> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, rafId: number;
    let stars: Star[] = [];

    const resize = () => {
      const dpr = devicePixelRatio || 1;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: COUNT }, (_, i) => randomStar(W, H, i));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const rgb = THEMES[themeRef.current ?? 'light'].canvasRgb;

      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z += SPEED;

        if (s.z >= 0) {
          stars[i] = randomStar(W, H, i, false);
          continue;
        }

        const scale = FOV / (FOV - s.z);
        const sx = cx + s.x * scale;
        const sy = cy + s.y * scale;

        if (sx < -160 || sx > W + 160 || sy < -40 || sy > H + 40) continue;

        const t          = 1 - Math.abs(s.z) / DEPTH;
        const alpha      = Math.pow(t, 1.6);
        const dist       = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
        const centerFade = Math.min(1, (dist - 80) / 120);
        if (centerFade <= 0) continue;

        const finalAlpha = alpha * centerFade;
        if (finalAlpha < 0.02) continue;

        const fontSize = Math.max(9, Math.round(14 * scale));
        ctx.font      = `400 ${fontSize}px 'Space Mono', 'Courier New', monospace`;
        ctx.fillStyle = `rgba(${rgb}, ${finalAlpha})`;
        ctx.fillText(s.label, sx, sy);
      }

      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

// ── Sun / Moon icons ──────────────────────────────────────

function SunIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3.2" stroke={color} strokeWidth="1.4"/>
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const r = Math.PI * deg / 180;
        const x1 = 8 + Math.cos(r) * 5.2;
        const y1 = 8 + Math.sin(r) * 5.2;
        const x2 = 8 + Math.cos(r) * 7;
        const y2 = 8 + Math.sin(r) * 7;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.4" strokeLinecap="round"/>;
      })}
    </svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 10.5A6 6 0 0 1 5.5 3a6 6 0 1 0 7.5 7.5z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function Home() {
  const router   = useRouter();
  const [theme, setTheme]       = useState<ThemeKey>('light');
  const [text, setText]         = useState('');
  const [focused, setFocused]   = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  // ref so the canvas draw loop reads the latest theme without restarting
  const themeRef = useRef<ThemeKey>(theme);
  themeRef.current = theme;

  const t = THEMES[theme];

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    router.push('/simulate');
  };

  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: t.bg,
      fontFamily: MONO,
      overflow: 'hidden',
      position: 'relative',
      transition: 'background 0.35s ease',
    }}>

      {/* ── Galaxy background ──────────────────────────── */}
      <GalaxyCanvas themeRef={themeRef} />

      {/* ── Nav ────────────────────────────────────────── */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: '52px',
        borderBottom: `1px solid ${t.navBorder}`,
      }}>
        {/* logo */}
        <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '-0.01em', color: t.ink, fontFamily: MONO }}>
          altlife
        </span>

        {/* right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* theme toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px',
              background: 'transparent',
              border: `1px solid ${t.navBorder}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
              flexShrink: 0,
            }}
          >
            {theme === 'light'
              ? <MoonIcon  color={t.linkColor} />
              : <SunIcon   color={t.linkColor} />
            }
          </button>

          {/* simulator link */}
          <Link href="/simulate" style={{
            fontSize: '11px', color: t.linkColor,
            textDecoration: 'none', letterSpacing: '0.05em', fontFamily: MONO,
          }}>
            open simulator →
          </Link>
        </div>
      </nav>

      {/* ── Centered form ──────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: '360px',
          padding: '0 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <p style={{
            fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: t.taglineColor, marginBottom: '28px', textAlign: 'center',
            fontFamily: MONO,
          }}>
            simulate your life
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="type your scenario..."
              style={{
                width: '100%', padding: '13px 16px',
                fontSize: '13px', fontFamily: MONO,
                background: focused ? t.inputBgFocus : t.inputBg,
                border: `1px solid ${focused ? t.inputBorderFocus : t.inputBorder}`,
                borderRadius: '6px', color: t.ink, outline: 'none',
                letterSpacing: '0.01em',
                transition: 'background 0.2s, border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%', padding: '13px',
                fontSize: '12px', fontFamily: MONO, fontWeight: 700,
                background: t.ink,
                color: t.bg,
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                letterSpacing: '0.06em',
                opacity: btnHover ? 0.82 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              simulate my life →
            </button>
          </form>

          <p style={{
            fontSize: '9px', color: t.footnoteColor,
            textAlign: 'center', marginTop: '18px',
            letterSpacing: '0.05em', lineHeight: 1.7, fontFamily: MONO,
          }}>
            every decision, a different future.
          </p>
        </div>
      </div>

    </main>
  );
}
