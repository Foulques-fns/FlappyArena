import type { GameMap, Skin } from "./data";

type C = CanvasRenderingContext2D;

export function roundRect(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function eye(ctx: C, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + r * 0.28, y, r * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.beginPath();
  ctx.arc(x + r * 0.1, y - r * 0.32, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws the player creature centred at (x,y) with radius r. */
export function drawCreature(
  ctx: C,
  skin: Skin,
  x: number,
  y: number,
  r: number,
  rot: number,
  flap: number,
  dead = false,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (dead) ctx.globalAlpha = 0.85;
  const wingY = Math.sin(flap) * r * 0.42;
  const s = r / 16; // base unit

  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, skin.body);
  grad.addColorStop(1, skin.body2);

  switch (skin.shape) {
    case "bird": {
      // tail
      ctx.fillStyle = skin.body2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, -r * 0.1);
      ctx.lineTo(-r * 1.45, -r * 0.55);
      ctx.lineTo(-r * 1.3, r * 0.35);
      ctx.closePath();
      ctx.fill();
      // body
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.12, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      // belly
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(r * 0.1, r * 0.34, r * 0.72, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // wing
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, wingY, r * 0.62, r * 0.4, Math.sin(flap) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.14)";
      ctx.lineWidth = s;
      ctx.stroke();
      // beak
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.moveTo(r * 0.95, -r * 0.12);
      ctx.lineTo(r * 1.72, r * 0.06);
      ctx.lineTo(r * 0.95, r * 0.3);
      ctx.closePath();
      ctx.fill();
      eye(ctx, r * 0.5, -r * 0.3, r * 0.3, skin.eye);
      break;
    }
    case "round": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.ellipse(-r * 0.75, wingY * 0.7, r * 0.42, r * 0.28, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.75, wingY * 0.7, r * 0.42, r * 0.28, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.38, r * 0.6, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      eye(ctx, -r * 0.34, -r * 0.18, r * 0.24, skin.eye);
      eye(ctx, r * 0.42, -r * 0.18, r * 0.24, skin.eye);
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.moveTo(r * 0.02, r * 0.1);
      ctx.lineTo(r * 0.32, r * 0.26);
      ctx.lineTo(r * 0.02, r * 0.42);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "rocket": {
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.moveTo(-r * 1.05, 0);
      ctx.lineTo(-r * 1.9 - Math.random() * r * 0.5, -r * 0.18);
      ctx.lineTo(-r * 1.75, 0);
      ctx.lineTo(-r * 1.9 - Math.random() * r * 0.5, r * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.5);
      ctx.lineTo(-r * 1.2, -r * 1.0);
      ctx.lineTo(-r * 0.85, -r * 0.2);
      ctx.closePath();
      ctx.moveTo(-r * 0.3, r * 0.5);
      ctx.lineTo(-r * 1.2, r * 1.0);
      ctx.lineTo(-r * 0.85, r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.quadraticCurveTo(r * 0.2, -r * 0.78, -r * 1.0, -r * 0.5);
      ctx.lineTo(-r * 1.0, r * 0.5);
      ctx.quadraticCurveTo(r * 0.2, r * 0.78, r * 1.6, 0);
      ctx.fill();
      ctx.fillStyle = skin.eye;
      ctx.beginPath();
      ctx.arc(r * 0.45, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.beginPath();
      ctx.arc(r * 0.38, -r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ghost": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 1.05, Math.PI, 0);
      const waves = 4;
      for (let i = 0; i <= waves; i++) {
        const px = r * 1.05 - (i * (r * 2.1)) / waves;
        const py = r * 0.95 + (i % 2 === 0 ? 0 : -r * 0.3) + Math.sin(flap + i) * r * 0.1;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      eye(ctx, -r * 0.34, -r * 0.25, r * 0.26, skin.eye);
      eye(ctx, r * 0.42, -r * 0.25, r * 0.26, skin.eye);
      ctx.fillStyle = skin.eye;
      ctx.beginPath();
      ctx.ellipse(r * 0.05, r * 0.3, r * 0.2, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ufo": {
      ctx.fillStyle = "rgba(160,255,180,.25)";
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.3);
      ctx.lineTo(-r * 1.4, r * 2.2);
      ctx.lineTo(r * 1.4, r * 2.2);
      ctx.lineTo(r * 0.6, r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.35, r * 0.62, r * 0.55, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 1.3, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = i % 2 === 0 ? skin.beak : skin.belly;
        ctx.beginPath();
        ctx.arc(i * r * 0.45, r * 0.16, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      eye(ctx, 0, -r * 0.42, r * 0.2, skin.eye);
      break;
    }
    case "dragon": {
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.2);
      ctx.quadraticCurveTo(-r * 1.2, -r * 1.6 + wingY, -r * 1.7, -r * 0.2 + wingY);
      ctx.quadraticCurveTo(-r * 1.0, -r * 0.1, -r * 0.2, r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.body2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.lineTo(-r * 1.8, -r * 0.4);
      ctx.lineTo(-r * 1.55, r * 0.15);
      ctx.lineTo(-r * 1.9, r * 0.5);
      ctx.lineTo(-r * 0.75, r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.15, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(r * 0.15, r * 0.36, r * 0.68, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      // spikes
      ctx.fillStyle = skin.beak;
      for (let i = 0; i < 3; i++) {
        const sx = -r * 0.5 + i * r * 0.45;
        ctx.beginPath();
        ctx.moveTo(sx, -r * 0.78);
        ctx.lineTo(sx + r * 0.16, -r * 1.25);
        ctx.lineTo(sx + r * 0.34, -r * 0.72);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.moveTo(r * 1.0, -r * 0.05);
      ctx.lineTo(r * 1.75, r * 0.12);
      ctx.lineTo(r * 1.0, r * 0.35);
      ctx.closePath();
      ctx.fill();
      eye(ctx, r * 0.5, -r * 0.32, r * 0.27, skin.eye);
      break;
    }
    case "cube": {
      const q = r * 0.95;
      ctx.fillStyle = grad;
      ctx.fillRect(-q, -q, q * 2, q * 2);
      ctx.fillStyle = skin.belly;
      ctx.fillRect(-q, q * 0.3, q * 2, q * 0.7);
      ctx.fillStyle = skin.wing;
      ctx.fillRect(-q * 1.5, wingY - q * 0.2, q * 0.6, q * 0.5);
      ctx.fillStyle = skin.eye;
      ctx.fillRect(-q * 0.5, -q * 0.5, q * 0.35, q * 0.4);
      ctx.fillRect(q * 0.2, -q * 0.5, q * 0.35, q * 0.4);
      ctx.fillStyle = skin.beak;
      ctx.fillRect(q * 0.85, -q * 0.05, q * 0.6, q * 0.3);
      break;
    }
    case "star": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 1.35 : r * 0.6;
        ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
      eye(ctx, -r * 0.3, -r * 0.1, r * 0.2, skin.eye);
      eye(ctx, r * 0.34, -r * 0.1, r * 0.2, skin.eye);
      ctx.strokeStyle = skin.eye;
      ctx.lineWidth = s * 1.2;
      ctx.beginPath();
      ctx.arc(r * 0.02, r * 0.3, r * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }
    case "fish": {
      ctx.fillStyle = skin.body2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.lineTo(-r * 1.7, -r * 0.7 + wingY * 0.5);
      ctx.lineTo(-r * 1.7, r * 0.7 + wingY * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.3, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.33, r * 0.9, r * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.6);
      ctx.lineTo(r * 0.1, -r * 1.3);
      ctx.lineTo(r * 0.45, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      eye(ctx, r * 0.62, -r * 0.18, r * 0.24, skin.eye);
      break;
    }
    case "plane": {
      ctx.fillStyle = skin.body2;
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(-r * 1.2, r * 0.9);
      ctx.lineTo(-r * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(-r * 1.2, -r * 0.9);
      ctx.lineTo(-r * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "skull": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 1.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-r * 0.62, r * 0.35, r * 1.24, r * 0.55);
      ctx.fillStyle = skin.eye;
      ctx.beginPath();
      ctx.ellipse(-r * 0.42, -r * 0.2, r * 0.3, r * 0.34, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 0.42, -r * 0.2, r * 0.3, r * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.eye;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.08);
      ctx.lineTo(-r * 0.16, r * 0.34);
      ctx.lineTo(r * 0.16, r * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = skin.body2;
      ctx.lineWidth = s * 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.36, r * 0.35);
        ctx.lineTo(i * r * 0.36, r * 0.9);
        ctx.stroke();
      }
      break;
    }
    case "heart": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      const hs = r * 1.25;
      ctx.moveTo(0, hs * 0.75);
      ctx.bezierCurveTo(-hs * 1.3, -hs * 0.1, -hs * 0.55, -hs * 1.05, 0, -hs * 0.35);
      ctx.bezierCurveTo(hs * 0.55, -hs * 1.05, hs * 1.3, -hs * 0.1, 0, hs * 0.75);
      ctx.fill();
      eye(ctx, -r * 0.36, -r * 0.2, r * 0.2, skin.eye);
      eye(ctx, r * 0.36, -r * 0.2, r * 0.2, skin.eye);
      break;
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------
function hills(ctx: C, W: number, H: number, ox: number, color: string, base: number, amp: number, step: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, H);
  for (let x = -10; x <= W + 10; x += 8) {
    const y = base + Math.sin((x + ox) / step) * amp + Math.sin((x + ox) / (step * 0.37)) * amp * 0.35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 10, H);
  ctx.closePath();
  ctx.fill();
}

export function drawBackground(
  ctx: C,
  map: GameMap,
  W: number,
  H: number,
  scroll: number,
  t: number,
  parallax: boolean,
) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, map.sky[0]);
  g.addColorStop(0.55, map.sky[1]);
  g.addColorStop(1, map.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (!parallax) return;
  const s1 = scroll * 0.12;
  const s2 = scroll * 0.26;
  const s3 = scroll * 0.45;

  switch (map.back) {
    case "hills": {
      // sun
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.arc(W * 0.78, H * 0.16, 34, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 190 - s1) % (W + 240)) - 120 + 120;
        cloud(ctx, cx, 70 + ((i * 53) % 90), 26 + (i % 3) * 8, "rgba(255,255,255,.7)");
      }
      hills(ctx, W, H, s2, "rgba(255,255,255,.25)", H * 0.62, 22, 110);
      hills(ctx, W, H, s3, "rgba(0,0,0,.10)", H * 0.74, 16, 70);
      break;
    }
    case "city": {
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath();
      ctx.arc(W * 0.75, 80, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = map.sky[0];
      ctx.beginPath();
      ctx.arc(W * 0.79, 72, 24, 0, Math.PI * 2);
      ctx.fill();
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer === 0 ? s2 : s3;
        const alpha = layer === 0 ? 0.35 : 0.6;
        const bh = layer === 0 ? 150 : 220;
        for (let i = 0; i < 14; i++) {
          const bw = 40 + ((i * 37) % 40);
          const x = ((i * 76 - sp) % (W + 200)) - 100;
          const hh = bh * (0.5 + (((i * 13) % 10) / 20));
          ctx.fillStyle = `rgba(2,6,23,${alpha})`;
          ctx.fillRect(x, H - 120 - hh, bw, hh + 120);
          if (layer === 1) {
            for (let wy = 0; wy < Math.floor(hh / 26); wy++) {
              for (let wx = 0; wx < 3; wx++) {
                if ((i * 7 + wy * 3 + wx) % 3 === 0) {
                  ctx.fillStyle = `rgba(253,224,71,${0.35 + 0.3 * Math.sin(t + i + wy)})`;
                  ctx.fillRect(x + 8 + wx * 12, H - 108 - hh + wy * 26, 7, 11);
                }
              }
            }
          }
        }
      }
      break;
    }
    case "mountains": {
      ctx.fillStyle = "rgba(255,255,255,.4)";
      ctx.beginPath();
      ctx.arc(W * 0.22, H * 0.2, 40, 0, Math.PI * 2);
      ctx.fill();
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer === 0 ? s2 : s3;
        ctx.fillStyle = layer === 0 ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.18)";
        ctx.beginPath();
        ctx.moveTo(0, H);
        const baseY = layer === 0 ? H * 0.55 : H * 0.68;
        const w = 150 + layer * 60;
        for (let x = -w; x <= W + w; x += 6) {
          const k = (x + sp) / w;
          const y = baseY - Math.abs(Math.sin(k)) * (layer === 0 ? 130 : 90);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "space": {
      for (let i = 0; i < 46; i++) {
        const x = ((i * 97 - s1) % (W + 40)) - 20;
        const y = (i * 61) % H;
        const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 1.4 + i));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 2 + (i % 3 === 0 ? 1 : 0), 2);
      }
      const px = ((-s2 * 0.5) % (W + 400)) + W * 0.5;
      ctx.fillStyle = "rgba(129,140,248,.35)";
      ctx.beginPath();
      ctx.arc(px, H * 0.28, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(196,181,253,.4)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(px, H * 0.28, 110, 26, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "reef": {
      for (let i = 0; i < 8; i++) {
        const x = ((i * 120 - s2) % (W + 200)) - 100;
        ctx.fillStyle = `rgba(13,148,136,${0.2 + (i % 3) * 0.07})`;
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.quadraticCurveTo(x + 20 + Math.sin(t + i) * 12, H - 150, x + 46, H);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,.07)";
      for (let i = 0; i < 5; i++) {
        const x = ((i * 160 - s1) % (W + 300)) - 120;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 60, 0);
        ctx.lineTo(x + 160, H);
        ctx.lineTo(x + 40, H);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "volcano": {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.moveTo(0, H);
      const cx = W * 0.5 - ((s3 * 0.3) % (W * 2));
      ctx.lineTo(cx - 200, H);
      ctx.lineTo(cx, H * 0.35);
      ctx.lineTo(cx + 200, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(251,146,60,.6)";
      ctx.beginPath();
      ctx.moveTo(cx - 24, H * 0.36);
      ctx.lineTo(cx, H * 0.3);
      ctx.lineTo(cx + 24, H * 0.36);
      ctx.lineTo(cx + 10, H * 0.55);
      ctx.lineTo(cx - 10, H * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "cyber": {
      ctx.strokeStyle = "rgba(244,114,182,.35)";
      ctx.lineWidth = 1.5;
      const hz = H * 0.62;
      for (let i = 0; i < 12; i++) {
        const x = ((i * 90 - s3) % (W + 180)) - 90;
        ctx.beginPath();
        ctx.moveTo(x, hz);
        ctx.lineTo(x + (x - W / 2) * 1.6, H);
        ctx.stroke();
      }
      for (let i = 1; i < 9; i++) {
        const y = hz + Math.pow(i / 9, 2.2) * (H - hz);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const sg = ctx.createLinearGradient(0, hz - 130, 0, hz);
      sg.addColorStop(0, "rgba(251,191,36,.9)");
      sg.addColorStop(1, "rgba(217,70,239,.9)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(W * 0.5, hz, 88, Math.PI, 0);
      ctx.fill();
      break;
    }
    case "candy": {
      for (let i = 0; i < 7; i++) {
        const x = ((i * 130 - s2) % (W + 220)) - 110;
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,.5)" : "rgba(253,224,71,.4)";
        ctx.beginPath();
        ctx.arc(x, H * 0.62, 40, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 5, H * 0.62, 10, 120);
      }
      for (let i = 0; i < 5; i++) cloud(ctx, ((i * 170 - s1) % (W + 250)) - 60, 60 + ((i * 47) % 110), 30, "rgba(255,255,255,.75)");
      break;
    }
    case "clouds": {
      for (let i = 0; i < 7; i++) {
        cloud(ctx, ((i * 140 - s2) % (W + 260)) - 80, 50 + ((i * 71) % 220), 34 + (i % 3) * 12, "rgba(148,163,184,.45)");
      }
      break;
    }
    case "ruins": {
      for (let i = 0; i < 6; i++) {
        const x = ((i * 150 - s3) % (W + 260)) - 120;
        ctx.fillStyle = "rgba(120,53,15,.35)";
        ctx.fillRect(x, H * 0.55, 18, H);
        ctx.fillRect(x + 60, H * 0.6, 18, H);
        ctx.fillRect(x - 8, H * 0.52, 94, 14);
      }
      break;
    }
  }
}

function cloud(ctx: C, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.85, y + r * 0.15, r * 0.72, 0, Math.PI * 2);
  ctx.arc(x - r * 0.85, y + r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.1, y - r * 0.5, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}
