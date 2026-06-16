// @ts-nocheck
import { useEffect, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

class LiquidGlass {
  bg: any;
  opt: any;
  _lut: Float32Array | null;
  _lutKey: string;

  constructor(bgEl: any, options: any = {}) {
    this.bg = bgEl;
    this.opt = Object.assign({
      size: 120, shape: 'circle', rx: null,
      distort: 0.06, edgeCurl: 0.04, brightness: 0.06,
      specular: 0.20, border: 0.18, borderWidth: 1,
      sceneW: null, sceneH: null,
    }, options);
    this._lut = null;
    this._lutKey = '';
  }

  _getLUT(D: number) {
    const key = `${D}:${this.opt.distort}:${this.opt.edgeCurl}`;
    if (this._lut && this._lutKey === key) return this._lut;
    this._lutKey = key;
    const lut = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const r = i / 255;
      if (r < 0.7) {
        lut[i] = r * (1.0 - this.opt.distort * (1 - r));
      } else {
        const t = (r - 0.7) / 0.3;
        lut[i] = Math.min(0.985, r * (1 - this.opt.distort * (1 - r)) + t * t * this.opt.edgeCurl);
      }
    }
    return (this._lut = lut);
  }

  _inShape(nx: number, ny: number, D: number) {
    const { shape, rx, size } = this.opt;
    if (shape === 'circle') return nx * nx + ny * ny < 1.0;
    const r = (rx != null ? rx : size * 0.3) / (size / 2);
    const ax = Math.abs(nx), ay = Math.abs(ny), lim = 1 - r;
    if (ax > 1 || ay > 1) return false;
    if (ax <= lim || ay <= lim) return true;
    return (ax - lim) ** 2 + (ay - lim) ** 2 <= r * r;
  }

  _normR(nx: number, ny: number, D: number) {
    const { shape, rx, size } = this.opt;
    if (shape === 'circle') return Math.sqrt(nx * nx + ny * ny);
    const r = (rx != null ? rx : size * 0.3) / (size / 2);
    const ax = Math.abs(nx), ay = Math.abs(ny), lim = 1 - r;
    const dx = Math.max(0, ax - lim), dy = Math.max(0, ay - lim);
    const dr = Math.sqrt(dx * dx + dy * dy);
    return (dr > 0 ? (lim + dr) : Math.max(ax, ay));
  }

  _cropBackground(cx: number, cy: number, D: number, sW: number, sH: number) {
    if (!this.bg) return null;
    const bw = this.bg.naturalWidth || this.bg.videoWidth;
    const bh = this.bg.naturalHeight || this.bg.videoHeight;
    if (!bw || !bh) return null;
    const R = D / 2;
    const off = document.createElement('canvas');
    off.width = D; off.height = D;
    const octx = off.getContext('2d')!;
    octx.drawImage(this.bg,
      Math.max(0, (cx - R) * (bw / sW)), Math.max(0, (cy - R) * (bh / sH)),
      D * (bw / sW), D * (bh / sH),
      0, 0, D, D
    );
    return octx.getImageData(0, 0, D, D).data;
  }

  _bilinear(sd: Uint8ClampedArray, x: number, y: number, D: number): [number, number, number] {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(D - 1, x0 + 1), y1 = Math.min(D - 1, y0 + 1);
    const fx = x - x0, fy = y - y0;
    const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
    const a = (y0 * D + x0) * 4, b = (y0 * D + x1) * 4, c = (y1 * D + x0) * 4, d = (y1 * D + x1) * 4;
    return [
      sd[a] * w00 + sd[b] * w10 + sd[c] * w01 + sd[d] * w11,
      sd[a + 1] * w00 + sd[b + 1] * w10 + sd[c + 1] * w01 + sd[d + 1] * w11,
      sd[a + 2] * w00 + sd[b + 2] * w10 + sd[c + 2] * w01 + sd[d + 2] * w11,
    ];
  }

  _drawOverlays(ctx: CanvasRenderingContext2D, D: number, R: number) {
    const { shape, rx, size, specular, border, borderWidth } = this.opt;
    const RX = rx != null ? rx : size * 0.3;
    ctx.save();
    ctx.beginPath();
    shape === 'circle' ? ctx.arc(R, R, R, 0, Math.PI * 2) : ctx.roundRect(0, 0, D, D, RX);
    ctx.clip();
    if (specular > 0) {
      const grd = ctx.createRadialGradient(R * 0.5, R * 0.28, 0, R * 0.5, R * 0.38, R * 0.45);
      grd.addColorStop(0, `rgba(255,255,255,${specular})`);
      grd.addColorStop(0.6, `rgba(255,255,255,${+(specular * 0.2).toFixed(3)})`);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, D, D);
    }
    ctx.restore();
    if (border > 0) {
      const h = borderWidth / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${border})`;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      shape === 'circle' ? ctx.arc(R, R, R - h, 0, Math.PI * 2)
        : ctx.roundRect(h, h, D - borderWidth, D - borderWidth, RX);
      ctx.stroke(); ctx.restore();
    }
  }

  render(canvas: HTMLCanvasElement, cx: number, cy: number, sW: number, sH: number) {
    const D = this.opt.size, R = D / 2;
    if (canvas.width !== D || canvas.height !== D) {
      canvas.width = D; canvas.height = D;
    }
    const sd = this._cropBackground(cx, cy, D, sW, sH);
    if (!sd) return false;
    const lut = this._getLUT(D);
    const ctx = canvas.getContext('2d')!;
    const out = ctx.createImageData(D, D);
    const od = out.data;
    const boost = this.opt.brightness;
    for (let py = 0; py < D; py++) {
      for (let px = 0; px < D; px++) {
        const nx = (px / R) - 1, ny = (py / R) - 1;
        if (!this._inShape(nx, ny, D)) {
          const i = (py * D + px) * 4; od[i] = od[i + 1] = od[i + 2] = od[i + 3] = 0; continue;
        }
        const normR = this._normR(nx, ny, D);
        const alpha = normR > 0.93 ? Math.max(0, (1 - normR) / 0.07) : 1.0;
        const theta = Math.atan2(ny, nx);
        const bend = lut[Math.min(255, Math.round(normR * 255))];
        const sx = Math.min(D - 1.001, Math.max(0, bend * Math.cos(theta) * R + R));
        const sy = Math.min(D - 1.001, Math.max(0, bend * Math.sin(theta) * R + R));
        const [rv, gv, bv] = this._bilinear(sd, sx, sy, D);
        const b = (1 + boost * Math.max(0, 1 - normR * 1.6)) * 0.75;
        const oi = (py * D + px) * 4;
        od[oi] = Math.min(255, rv * b); od[oi + 1] = Math.min(255, gv * b);
        od[oi + 2] = Math.min(255, bv * b); od[oi + 3] = Math.round(alpha * 255);
      }
    }
    ctx.clearRect(0, 0, D, D);
    ctx.putImageData(out, 0, 0);
    this._drawOverlays(ctx, D, R);
    return true;
  }
}

const GLASS_OPTIONS = {
  shape: 'roundedrect' as const,
  rx: 16,
  distort: 0.06,
  edgeCurl: 0.04,
  brightness: 0.06,
  specular: 0.20,
  border: 0.18,
  borderWidth: 1,
};

interface LiquidGlassCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sceneRef: React.RefObject<HTMLDivElement | null>;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export default function LiquidGlassCanvas({ videoRef, sceneRef, cardRef }: LiquidGlassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let glass: LiquidGlass | null = null;
    let rafId: number | null = null;
    let isRunning = false;

    const BG_VIDEO = videoRef.current;
    const SCENE_EL = sceneRef.current;
    const CARD_EL = cardRef.current;
    const GLASS_CV = canvasRef.current;

    if (!BG_VIDEO || !SCENE_EL || !CARD_EL || !GLASS_CV) return;

    function setupGlass() {
      const sceneR = SCENE_EL!.getBoundingClientRect();
      const cardR = CARD_EL!.getBoundingClientRect();
      const W = Math.round(cardR.width);
      const H = Math.round(cardR.height);
      const isMobile = W < 640;
      const D = isMobile ? W : Math.max(W, H);

      GLASS_CV!.width = D;
      GLASS_CV!.height = D;

      glass = new LiquidGlass(BG_VIDEO, Object.assign({}, GLASS_OPTIONS, {
        size: D,
        sceneW: sceneR.width,
        sceneH: sceneR.height,
      }));
    }

    function renderLoop() {
      if (!glass) return;
      const sceneR = SCENE_EL!.getBoundingClientRect();
      const cardR = CARD_EL!.getBoundingClientRect();
      const cx = cardR.left - sceneR.left + cardR.width / 2;
      const cy = cardR.top - sceneR.top + cardR.height / 2;
      glass.opt.sceneW = sceneR.width;
      glass.opt.sceneH = sceneR.height;
      glass.render(GLASS_CV!, cx, cy, sceneR.width, sceneR.height);
      rafId = requestAnimationFrame(renderLoop);
    }

    function startGlass() {
      if (isRunning) return;
      isRunning = true;
      setupGlass();
      renderLoop();
    }

    function stopGlass() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      isRunning = false;
    }

    function handleResize() {
      stopGlass();
      setupGlass();
      renderLoop();
      isRunning = true;
    }

    BG_VIDEO.addEventListener('canplay', startGlass);
    BG_VIDEO.addEventListener('playing', startGlass);

    if (BG_VIDEO.readyState >= 3) startGlass();

    window.addEventListener('resize', handleResize);

    return () => {
      stopGlass();
      BG_VIDEO.removeEventListener('canplay', startGlass);
      BG_VIDEO.removeEventListener('playing', startGlass);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, sceneRef, cardRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
      }}
    />
  );
}
