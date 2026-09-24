import type { GameMap, Skin } from "./data";

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

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

/** hex color -> [r,g,b] */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  if (hex.length === 4) return [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex: string, f: number): string {
  const [r, g, b] = rgb(hex);
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${cl(r * f)},${cl(g * f)},${cl(b * f)})`;
}

/** soft radial gloss overlay inside current transform */
function gloss(ctx: C, cx: number, cy: number, r: number, alpha = 0.5) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 4, 0, TAU);
  ctx.fill();
}

function eye(ctx: C, x: number, y: number, r: number, color: string, angry = false) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + r * 0.28, y, r * 0.54, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.85)";
  ctx.beginPath();
  ctx.arc(x + r * 0.38, y, r * 0.26, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.arc(x + r * 0.14, y - r * 0.34, r * 0.18, 0, TAU);
  ctx.fill();
  if (angry) {
    ctx.strokeStyle = color === "#0f172a" ? "#0f172a" : "#111827";
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 1.15);
    ctx.lineTo(x + r * 0.55, y - r * 0.5);
    ctx.stroke();
  }
}

function bodyShade(ctx: C, r: number) {
  // ambient occlusion at bottom
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0.35, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.22)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.14, r, 0, 0, TAU);
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
  _t = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (dead) ctx.globalAlpha = 0.88;
  const wingY = Math.sin(flap) * r * 0.42;
  const wingRot = Math.sin(flap) * 0.55;
  const s = r / 16;

  const grad = ctx.createLinearGradient(0, -r * 1.1, 0, r * 1.2);
  grad.addColorStop(0, shade(skin.body, 1.18));
  grad.addColorStop(0.45, skin.body);
  grad.addColorStop(1, skin.body2);

  switch (skin.shape) {
    case "bird": {
      // tail feathers
      ctx.fillStyle = shade(skin.body2, 0.9);
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.rotate(i * 0.18);
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.05);
        ctx.lineTo(-r * 1.55, -r * 0.42);
        ctx.lineTo(-r * 1.32, r * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // body
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.12, r * 0.95, 0, 0, TAU);
      ctx.fill();
      bodyShade(ctx, r);
      // belly
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(r * 0.12, r * 0.36, r * 0.7, r * 0.5, 0, 0, TAU);
      ctx.fill();
      // wing (drawn above body, behind beak)
      ctx.save();
      ctx.translate(-r * 0.22, wingY * 0.5);
      ctx.rotate(wingRot);
      ctx.fillStyle = skin.wing;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.62, r * 0.36, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.12)";
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.62, r * 0.28, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.16)";
      ctx.lineWidth = s;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.4 + i * r * 0.28, -r * 0.2);
        ctx.lineTo(-r * 0.55 + i * r * 0.3, r * 0.22);
        ctx.stroke();
      }
      ctx.restore();
      // beak
      const bg = ctx.createLinearGradient(r, -r * 0.2, r * 1.6, r * 0.4);
      bg.addColorStop(0, shade(skin.beak, 1.2));
      bg.addColorStop(1, shade(skin.beak, 0.85));
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(r * 0.92, -r * 0.14);
      ctx.lineTo(r * 1.78, r * 0.04);
      ctx.lineTo(r * 0.92, r * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.2)";
      ctx.lineWidth = s * 0.8;
      ctx.beginPath();
      ctx.moveTo(r * 0.92, r * 0.08);
      ctx.lineTo(r * 1.5, r * 0.1);
      ctx.stroke();
      // cheek blush
      ctx.fillStyle = "rgba(251,113,133,.35)";
      ctx.beginPath();
      ctx.arc(r * 0.55, r * 0.22, r * 0.22, 0, TAU);
      ctx.fill();
      eye(ctx, r * 0.5, -r * 0.3, r * 0.3, skin.eye, dead);
      // top gloss
      gloss(ctx, -r * 0.3, -r * 0.55, r * 0.5, 0.28);
      break;
    }
    case "round": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.08, 0, TAU);
      ctx.fill();
      bodyShade(ctx, r);
      // arms
      ctx.fillStyle = shade(skin.wing, 0.95);
      ctx.beginPath();
      ctx.ellipse(-r * 0.85, wingY * 0.7, r * 0.4, r * 0.26, 0.4 + wingRot * 0.5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.85, wingY * 0.7, r * 0.4, r * 0.26, -0.4 - wingRot * 0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.16)";
      ctx.beginPath();
      ctx.arc(-r * 0.55, -r * 0.5, r * 0.28, 0, TAU);
      ctx.fill();
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.4, r * 0.62, r * 0.44, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(251,113,133,.4)";
      ctx.beginPath();
      ctx.arc(-r * 0.62, r * 0.02, r * 0.18, 0, TAU);
      ctx.arc(r * 0.66, r * 0.02, r * 0.18, 0, TAU);
      ctx.fill();
      eye(ctx, -r * 0.34, -r * 0.2, r * 0.25, skin.eye);
      eye(ctx, r * 0.42, -r * 0.2, r * 0.25, skin.eye, dead);
      ctx.fillStyle = shade(skin.beak, 1.05);
      ctx.beginPath();
      ctx.moveTo(r * 0.02, r * 0.12);
      ctx.lineTo(r * 0.34, r * 0.28);
      ctx.lineTo(r * 0.02, r * 0.44);
      ctx.closePath();
      ctx.fill();
      gloss(ctx, -r * 0.35, -r * 0.6, r * 0.45, 0.3);
      break;
    }
    case "rocket": {
      // animated flame: outer + inner
      const fl = 1 + Math.sin(flap * 2.3) * 0.22;
      const fg = ctx.createLinearGradient(-r, 0, -r * 2.6 * fl, 0);
      fg.addColorStop(0, "rgba(254,240,138,.95)");
      fg.addColorStop(0.4, "rgba(251,146,60,.9)");
      fg.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-r * 1.0, -r * 0.32);
      ctx.quadraticCurveTo(-r * 1.9 * fl, 0, -r * 1.0, r * 0.32);
      ctx.quadraticCurveTo(-r * 2.5 * fl, 0, -r * 1.0, -r * 0.32);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.beginPath();
      ctx.moveTo(-r * 1.0, -r * 0.14);
      ctx.quadraticCurveTo(-r * 1.7 * fl, 0, -r * 1.0, r * 0.14);
      ctx.quadraticCurveTo(-r * 1.5 * fl, 0, -r * 1.0, -r * 0.14);
      ctx.fill();
      // fins
      ctx.fillStyle = skin.wing;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, sgn * r * 0.45);
        ctx.lineTo(-r * 1.25, sgn * r * 1.05);
        ctx.lineTo(-r * 0.8, sgn * r * 0.18);
        ctx.closePath();
        ctx.fill();
      }
      // hull
      const hull = ctx.createLinearGradient(0, -r, 0, r);
      hull.addColorStop(0, shade(skin.body, 1.25));
      hull.addColorStop(0.5, skin.body);
      hull.addColorStop(1, skin.body2);
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.quadraticCurveTo(r * 0.3, -r * 0.8, -r * 1.0, -r * 0.5);
      ctx.lineTo(-r * 1.0, r * 0.5);
      ctx.quadraticCurveTo(r * 0.3, r * 0.8, r * 1.65, 0);
      ctx.closePath();
      ctx.fill();
      // hull shade + nose line
      ctx.fillStyle = "rgba(0,0,0,.16)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, r * 0.4, r * 1.02, r * 0.3, 0, 0, TAU);
      ctx.fill();
      // stripes
      ctx.strokeStyle = shade(skin.wing, 0.95);
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.moveTo(r * 0.72, -r * 0.42);
      ctx.lineTo(r * 0.72, r * 0.42);
      ctx.stroke();
      // window w/ sheen
      ctx.fillStyle = shade(skin.eye, 0.5);
      ctx.beginPath();
      ctx.arc(r * 0.42, 0, r * 0.34, 0, TAU);
      ctx.fill();
      ctx.fillStyle = skin.eye;
      ctx.beginPath();
      ctx.arc(r * 0.42, 0, r * 0.26, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.beginPath();
      ctx.arc(r * 0.33, -r * 0.1, r * 0.11, 0, TAU);
      ctx.fill();
      gloss(ctx, r * 0.5, -r * 0.5, r * 0.4, 0.25);
      break;
    }
    case "ghost": {
      // wavy translucent body
      ctx.globalAlpha *= 0.92;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 1.05, Math.PI, 0);
      const waves = 5;
      for (let i = 0; i <= waves; i++) {
        const px = r * 1.05 - (i * (r * 2.1)) / waves;
        const py = r * 0.95 + (i % 2 === 1 ? -r * 0.34 : -r * 0.02) + Math.sin(flap + i * 1.3) * r * 0.12;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // inner shadow bottom
      ctx.fillStyle = "rgba(0,0,0,.10)";
      ctx.beginPath();
      ctx.ellipse(0, r * 0.7, r * 0.85, r * 0.3, 0, 0, TAU);
      ctx.fill();
      eye(ctx, -r * 0.34, -r * 0.25, r * 0.27, skin.eye);
      eye(ctx, r * 0.42, -r * 0.25, r * 0.27, skin.eye, dead);
      // mouth
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.ellipse(r * 0.05, r * 0.32, r * 0.2, r * (0.26 + Math.sin(flap) * 0.05), 0, 0, TAU);
      ctx.fill();
      // pink cheeks
      ctx.fillStyle = "rgba(244,114,182,.4)";
      ctx.beginPath();
      ctx.arc(-r * 0.62, r * 0.08, r * 0.16, 0, TAU);
      ctx.arc(r * 0.68, r * 0.08, r * 0.16, 0, TAU);
      ctx.fill();
      gloss(ctx, -r * 0.3, -r * 0.6, r * 0.42, 0.3);
      break;
    }
    case "ufo": {
      // tractor beam
      const beam = ctx.createLinearGradient(0, r * 0.3, 0, r * 2.3);
      beam.addColorStop(0, "rgba(160,255,190,.45)");
      beam.addColorStop(1, "rgba(160,255,190,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.3);
      ctx.lineTo(-r * 1.35 - Math.sin(flap) * r * 0.1, r * 2.3);
      ctx.lineTo(r * 1.35 + Math.sin(flap) * r * 0.1, r * 2.3);
      ctx.lineTo(r * 0.5, r * 0.3);
      ctx.closePath();
      ctx.fill();
      // dome glass
      const dg = ctx.createLinearGradient(0, -r, 0, 0);
      dg.addColorStop(0, "rgba(224,242,254,.9)");
      dg.addColorStop(1, skin.wing);
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.62, r * 0.58, 0, Math.PI, 0);
      ctx.fill();
      // alien head in dome
      ctx.fillStyle = shade(skin.beak, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.42, r * 0.28, r * 0.3, 0, 0, TAU);
      ctx.fill();
      eye(ctx, -r * 0.09, -r * 0.5, r * 0.09, skin.eye);
      eye(ctx, r * 0.12, -r * 0.5, r * 0.09, skin.eye);
      // saucer
      const sg = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.5);
      sg.addColorStop(0, shade(skin.body, 1.3));
      sg.addColorStop(0.5, skin.body);
      sg.addColorStop(1, skin.body2);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 1.3, r * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.25)";
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.08, r * 1.05, r * 0.2, 0, 0, TAU);
      ctx.fill();
      // rotating lights
      for (let i = 0; i < 6; i++) {
        const a = flap * 1.5 + (i / 6) * TAU;
        const lx = Math.cos(a) * r * 0.85;
        const lz = Math.sin(a);
        if (lz < -0.5) continue;
        ctx.fillStyle = i % 2 === 0 ? skin.beak : skin.belly;
        ctx.beginPath();
        ctx.arc(lx, r * 0.16 + lz * r * 0.1, r * (0.11 + lz * 0.04), 0, TAU);
        ctx.fill();
      }
      break;
    }
    case "dragon": {
      // tail
      ctx.fillStyle = shade(skin.body2, 0.95);
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.1);
      ctx.quadraticCurveTo(-r * 1.7, -r * 0.5 + wingY * 0.4, -r * 2.0, r * 0.1 + wingY * 0.5);
      ctx.lineTo(-r * 1.6, r * 0.35);
      ctx.lineTo(-r * 2.1, r * 0.75);
      ctx.lineTo(-r * 0.7, r * 0.45);
      ctx.closePath();
      ctx.fill();
      // wing
      ctx.save();
      ctx.translate(-r * 0.25, -r * 0.2);
      ctx.rotate(wingRot * 0.9);
      const wg = ctx.createLinearGradient(0, -r, 0, r * 0.5);
      wg.addColorStop(0, shade(skin.wing, 1.15));
      wg.addColorStop(1, shade(skin.wing, 0.8));
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * 0.9, -r * 1.4, -r * 1.75, -r * 0.55);
      ctx.quadraticCurveTo(-r * 1.25, -r * 0.25, -r * 1.05, r * 0.05);
      ctx.quadraticCurveTo(-r * 0.6, -r * 0.05, 0, r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.18)";
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-r * 1.35, -r * 0.7);
      ctx.moveTo(-r * 0.4, -r * 0.05);
      ctx.lineTo(-r * 1.1, -r * 0.28);
      ctx.stroke();
      ctx.restore();
      // body
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.15, r * 0.92, 0, 0, TAU);
      ctx.fill();
      bodyShade(ctx, r);
      // belly plates
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(r * 0.14, r * 0.38, r * 0.68, r * 0.46, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.14)";
      ctx.lineWidth = s;
      for (let i = -1; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(r * 0.1, r * (0.05 + i * 0.22), r * 0.62, 0.25 * Math.PI, 0.75 * Math.PI);
        ctx.stroke();
      }
      // back spikes
      ctx.fillStyle = skin.beak;
      for (let i = 0; i < 4; i++) {
        const sx = -r * 0.65 + i * r * 0.42;
        const sy = -r * 0.72 - Math.sin(i) * r * 0.06;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + r * 0.15, sy - r * 0.5);
        ctx.lineTo(sx + r * 0.34, sy + r * 0.04);
        ctx.closePath();
        ctx.fill();
      }
      // horns
      ctx.fillStyle = shade(skin.beak, 1.1);
      ctx.beginPath();
      ctx.moveTo(r * 0.15, -r * 0.75);
      ctx.lineTo(r * 0.02, -r * 1.3);
      ctx.lineTo(r * 0.42, -r * 0.8);
      ctx.closePath();
      ctx.fill();
      // snout + nostril
      ctx.fillStyle = shade(skin.beak, 1.05);
      ctx.beginPath();
      ctx.moveTo(r * 1.0, -r * 0.08);
      ctx.lineTo(r * 1.72, r * 0.1);
      ctx.lineTo(r * 1.0, r * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.arc(r * 1.32, r * 0.06, r * 0.05, 0, TAU);
      ctx.fill();
      eye(ctx, r * 0.5, -r * 0.32, r * 0.28, skin.eye, dead);
      gloss(ctx, -r * 0.2, -r * 0.5, r * 0.42, 0.22);
      break;
    }
    case "cube": {
      const q = r * 0.95;
      ctx.fillStyle = grad;
      roundRect(ctx, -q, -q, q * 2, q * 2, q * 0.18);
      ctx.fill();
      const sg2 = ctx.createLinearGradient(0, -q, 0, q);
      sg2.addColorStop(0, "rgba(255,255,255,.28)");
      sg2.addColorStop(0.5, "rgba(0,0,0,0)");
      sg2.addColorStop(1, "rgba(0,0,0,.2)");
      ctx.fillStyle = sg2;
      roundRect(ctx, -q, -q, q * 2, q * 2, q * 0.18);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.24)";
      ctx.lineWidth = s * 1.4;
      roundRect(ctx, -q, -q, q * 2, q * 2, q * 0.18);
      ctx.stroke();
      ctx.fillStyle = skin.belly;
      ctx.fillRect(-q, q * 0.35, q * 2, q * 0.65);
      // side wing
      ctx.fillStyle = shade(skin.wing, 1.05);
      roundRect(ctx, -q * 1.55, wingY - q * 0.28, q * 0.62, q * 0.56, q * 0.15);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.22)";
      ctx.stroke();
      // eyes
      ctx.fillStyle = "#fff";
      roundRect(ctx, -q * 0.58, -q * 0.55, q * 0.42, q * 0.5, q * 0.1);
      ctx.fill();
      roundRect(ctx, q * 0.16, -q * 0.55, q * 0.42, q * 0.5, q * 0.1);
      ctx.fill();
      ctx.fillStyle = skin.eye;
      roundRect(ctx, -q * 0.4, -q * 0.4, q * 0.18, q * 0.28, q * 0.07);
      ctx.fill();
      roundRect(ctx, q * 0.34, -q * 0.4, q * 0.18, q * 0.28, q * 0.07);
      ctx.fill();
      // beak slot
      ctx.fillStyle = skin.beak;
      roundRect(ctx, q * 0.82, -q * 0.06, q * 0.7, q * 0.36, q * 0.1);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(q * 0.82, q * 0.16, q * 0.7, q * 0.06);
      break;
    }
    case "star": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 1.35 : r * 0.62;
        ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.16)";
      ctx.lineWidth = s * 1.4;
      ctx.stroke();
      gloss(ctx, -r * 0.3, -r * 0.5, r * 0.5, 0.35);
      eye(ctx, -r * 0.3, -r * 0.08, r * 0.21, skin.eye);
      eye(ctx, r * 0.34, -r * 0.08, r * 0.21, skin.eye, dead);
      ctx.fillStyle = "rgba(251,113,133,.4)";
      ctx.beginPath();
      ctx.arc(-r * 0.52, r * 0.18, r * 0.13, 0, TAU);
      ctx.arc(r * 0.56, r * 0.18, r * 0.13, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = skin.eye;
      ctx.lineWidth = s * 1.3;
      ctx.beginPath();
      ctx.arc(r * 0.02, r * 0.26, r * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }
    case "fish": {
      // waving tail
      ctx.fillStyle = shade(skin.body2, 1.05);
      ctx.save();
      ctx.translate(-r * 0.85, wingY * 0.4);
      ctx.rotate(Math.sin(flap) * 0.25);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-r * 0.95, -r * 0.85);
      ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.95, r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // body
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.3, r * 0.82, 0, 0, TAU);
      ctx.fill();
      // scales hint
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = s;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-r * 0.5 + i * r * 0.4, -r * 0.1, r * 0.3, -0.3 * Math.PI, 0.6 * Math.PI);
        ctx.stroke();
      }
      ctx.fillStyle = skin.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.34, r * 0.92, r * 0.38, 0, 0, TAU);
      ctx.fill();
      // fins
      ctx.fillStyle = shade(skin.wing, 1.05);
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.62);
      ctx.lineTo(r * 0.12, -r * 1.32 + wingY * 0.3);
      ctx.lineTo(r * 0.5, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, r * 0.55);
      ctx.lineTo(r * 0.05, r * 1.05);
      ctx.lineTo(r * 0.42, r * 0.6);
      ctx.closePath();
      ctx.fill();
      eye(ctx, r * 0.62, -r * 0.18, r * 0.25, skin.eye, dead);
      ctx.fillStyle = "rgba(251,113,133,.35)";
      ctx.beginPath();
      ctx.arc(r * 0.45, r * 0.14, r * 0.14, 0, TAU);
      ctx.fill();
      gloss(ctx, -r * 0.2, -r * 0.45, r * 0.45, 0.28);
      break;
    }
    case "plane": {
      // folded paper with shading
      ctx.fillStyle = shade(skin.body, 1.05);
      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.lineTo(-r * 1.25, r * 0.9);
      ctx.lineTo(-r * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.12)";
      ctx.lineWidth = s;
      ctx.stroke();
      const pg = ctx.createLinearGradient(r * 1.6, -r, -r * 1.2, 0);
      pg.addColorStop(0, shade(skin.body, 1.25));
      pg.addColorStop(1, skin.body2);
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.lineTo(-r * 1.25, -r * 0.9);
      ctx.lineTo(-r * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.18)";
      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.lineTo(-r * 0.55, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,.14)";
      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.lineTo(r * 0.75, 0);
      ctx.lineTo(r * 0.45, -r * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.16, 0, TAU);
      ctx.fill();
      break;
    }
    case "skull": {
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 1.02, 0, TAU);
      ctx.fill();
      // cheekbones
      ctx.beginPath();
      ctx.ellipse(-r * 0.5, r * 0.3, r * 0.4, r * 0.42, 0.3, 0, TAU);
      ctx.ellipse(r * 0.5, r * 0.3, r * 0.4, r * 0.42, -0.3, 0, TAU);
      ctx.fill();
      // jaw
      ctx.fillStyle = shade(skin.body, 0.92);
      roundRect(ctx, -r * 0.6, r * 0.42, r * 1.2, r * 0.5, r * 0.16);
      ctx.fill();
      // sockets w/ deep shade
      ctx.fillStyle = "rgba(2,6,23,.92)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.42, -r * 0.22, r * 0.32, r * 0.36, 0.15, 0, TAU);
      ctx.ellipse(r * 0.42, -r * 0.22, r * 0.32, r * 0.36, -0.15, 0, TAU);
      ctx.fill();
      // glowing pupils
      ctx.fillStyle = skin.beak;
      ctx.globalAlpha *= 0.9;
      ctx.beginPath();
      ctx.arc(-r * 0.4 + Math.sin(flap) * 0.5, -r * 0.2, r * 0.09, 0, TAU);
      ctx.arc(r * 0.44 + Math.sin(flap) * 0.5, -r * 0.2, r * 0.09, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = dead ? 0.85 : 1;
      // nose
      ctx.fillStyle = "rgba(2,6,23,.85)";
      ctx.beginPath();
      ctx.moveTo(0, r * 0.06);
      ctx.lineTo(-r * 0.17, r * 0.36);
      ctx.lineTo(r * 0.17, r * 0.36);
      ctx.closePath();
      ctx.fill();
      // teeth
      ctx.strokeStyle = "rgba(0,0,0,.28)";
      ctx.lineWidth = s * 1.3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.22, r * 0.42);
        ctx.lineTo(i * r * 0.22, r * 0.92);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.66);
      ctx.lineTo(r * 0.6, r * 0.66);
      ctx.stroke();
      // skull crack
      ctx.strokeStyle = "rgba(0,0,0,.3)";
      ctx.lineWidth = s * 1.1;
      ctx.beginPath();
      ctx.moveTo(r * 0.15, -r * 1.1);
      ctx.lineTo(r * 0.28, -r * 0.78);
      ctx.lineTo(r * 0.12, -r * 0.55);
      ctx.stroke();
      gloss(ctx, -r * 0.3, -r * 0.65, r * 0.4, 0.3);
      break;
    }
    case "heart": {
      const hs = r * 1.25;
      // subtle heartbeat
      const beat = 1 + Math.sin(flap * 0.7) * 0.04;
      ctx.scale(beat, beat);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, hs * 0.75);
      ctx.bezierCurveTo(-hs * 1.3, -hs * 0.1, -hs * 0.55, -hs * 1.05, 0, -hs * 0.35);
      ctx.bezierCurveTo(hs * 0.55, -hs * 1.05, hs * 1.3, -hs * 0.1, 0, hs * 0.75);
      ctx.fill();
      const hg = ctx.createLinearGradient(-hs, -hs, hs * 0.6, hs * 0.5);
      hg.addColorStop(0, "rgba(255,255,255,.4)");
      hg.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(0, hs * 0.75);
      ctx.bezierCurveTo(-hs * 1.3, -hs * 0.1, -hs * 0.55, -hs * 1.05, 0, -hs * 0.35);
      ctx.bezierCurveTo(hs * 0.55, -hs * 1.05, hs * 1.3, -hs * 0.1, 0, hs * 0.75);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.14)";
      ctx.lineWidth = s * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, hs * 0.75);
      ctx.bezierCurveTo(-hs * 1.3, -hs * 0.1, -hs * 0.55, -hs * 1.05, 0, -hs * 0.35);
      ctx.bezierCurveTo(hs * 0.55, -hs * 1.05, hs * 1.3, -hs * 0.1, 0, hs * 0.75);
      ctx.stroke();
      eye(ctx, -r * 0.35, -r * 0.16, r * 0.2, skin.eye);
      eye(ctx, r * 0.36, -r * 0.16, r * 0.2, skin.eye, dead);
      ctx.strokeStyle = skin.eye;
      ctx.lineWidth = s * 1.2;
      ctx.beginPath();
      ctx.arc(r * 0.0, r * 0.18, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }
  }
  // soft drop shadow under creature
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

function cloud(ctx: C, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.arc(x + r * 0.85, y + r * 0.15, r * 0.72, 0, TAU);
  ctx.arc(x - r * 0.85, y + r * 0.2, r * 0.6, 0, TAU);
  ctx.arc(x + r * 0.1, y - r * 0.5, r * 0.6, 0, TAU);
  ctx.fill();
}

function mist(ctx: C, W: number, y: number, h: number, t: number, color: string, alpha: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    const w = 190;
    const x = ((i * 157 + t * 12) % (W + w * 2)) - w;
    ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 2.1));
    ctx.beginPath();
    ctx.ellipse(x, y + Math.sin(t * 0.5 + i) * 6, w, h, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
  const s1 = scroll * 0.09;
  const s2 = scroll * 0.22;
  const s3 = scroll * 0.42;
  const gy = H - 86; // approximate ground line

  switch (map.back) {
    case "hills": {
      // glowing sun
      const sx = W * 0.78, sy = H * 0.16;
      const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90);
      sg.addColorStop(0, "rgba(254,249,195,.95)");
      sg.addColorStop(0.35, "rgba(254,240,138,.55)");
      sg.addColorStop(1, "rgba(254,240,138,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, 90, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fefce8";
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 175 - s1 * 1.2) % (W + 260)) - 130;
        cloud(ctx, cx, 62 + ((i * 53) % 110), 24 + (i % 3) * 9, "rgba(255,255,255,.85)");
      }
      hills(ctx, W, H, s2, "rgba(255,255,255,.28)", H * 0.58, 26, 120);
      hills(ctx, W, H, s2 * 1.5, "rgba(255,255,255,.16)", H * 0.66, 20, 80);
      hills(ctx, W, H, s3, "rgba(21,128,61,.28)", H * 0.76, 15, 62);
      // flowers dots
      for (let i = 0; i < 14; i++) {
        const x = ((i * 71 - s3) % (W + 30)) - 15;
        ctx.fillStyle = i % 3 === 0 ? "#fbcfe8" : i % 3 === 1 ? "#fef08a" : "#ffffff";
        ctx.beginPath();
        ctx.arc(x, gy - 62 + (i % 4) * 10, 2.4, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case "city": {
      // moon + halo
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath();
      ctx.arc(W * 0.75, 80, 27, 0, TAU);
      ctx.fill();
      ctx.fillStyle = map.sky[0];
      ctx.beginPath();
      ctx.arc(W * 0.8, 72, 25, 0, TAU);
      ctx.fill();
      // stars
      for (let i = 0; i < 30; i++) {
        const x = (i * 97) % W, y = (i * 59) % (H * 0.5);
        ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * Math.abs(Math.sin(t + i))})`;
        ctx.fillRect(x, y, 2, 2);
      }
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer === 0 ? s2 : s3;
        const alpha = layer === 0 ? 0.4 : 0.75;
        const bh = layer === 0 ? 170 : 250;
        for (let i = 0; i < 14; i++) {
          const bw = 42 + ((i * 37) % 42);
          const x = ((i * 76 - sp) % (W + 200)) - 100;
          const hh = bh * (0.5 + (((i * 13) % 10) / 20));
          ctx.fillStyle = `rgba(2,6,23,${alpha})`;
          ctx.fillRect(x, gy - hh, bw, hh);
          // antenna
          if (i % 3 === 0) {
            ctx.fillRect(x + bw / 2 - 1, gy - hh - 22, 2, 22);
            ctx.fillStyle = `rgba(248,113,113,${0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))})`;
            ctx.beginPath();
            ctx.arc(x + bw / 2, gy - hh - 24, 3, 0, TAU);
            ctx.fill();
          }
          if (layer === 1) {
            for (let wy = 0; wy < Math.floor(hh / 26); wy++) {
              for (let wx = 0; wx < 3; wx++) {
                const lit = (i * 7 + wy * 3 + wx) % 3 === 0;
                if (lit) {
                  ctx.fillStyle = `rgba(253,224,71,${0.3 + 0.35 * Math.abs(Math.sin(t * 0.7 + i + wy))})`;
                  ctx.fillRect(x + 8 + wx * 13, gy - hh + 12 + wy * 26, 8, 11);
                } else {
                  ctx.fillStyle = "rgba(148,163,184,.14)";
                  ctx.fillRect(x + 8 + wx * 13, gy - hh + 12 + wy * 26, 8, 11);
                }
              }
            }
          }
        }
      }
      mist(ctx, W, gy - 90, 26, t, "rgba(125,211,252,.14)", 0.5);
      break;
    }
    case "mountains": {
      const sx = W * 0.22, sy = H * 0.18;
      const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 120);
      sg.addColorStop(0, "rgba(255,247,237,.9)");
      sg.addColorStop(1, "rgba(255,247,237,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, 120, 0, TAU);
      ctx.fill();
      for (let layer = 0; layer < 3; layer++) {
        const sp = layer === 0 ? s1 : layer === 1 ? s2 : s3;
        ctx.fillStyle = layer === 0 ? "rgba(255,255,255,.18)" : layer === 1 ? "rgba(51,65,85,.32)" : "rgba(15,23,42,.42)";
        ctx.beginPath();
        ctx.moveTo(0, H);
        const baseY = H * (0.48 + layer * 0.12);
        const w = 170 + layer * 50;
        for (let x = -w; x <= W + w; x += 6) {
          const k = (x + sp) / w;
          const y = baseY - Math.abs(Math.sin(k)) * (150 - layer * 22);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      }
      mist(ctx, W, H * 0.62, 30, t, "rgba(255,255,255,.5)", 0.35);
      break;
    }
    case "space": {
      for (let i = 0; i < 60; i++) {
        const x = ((i * 97 - s1) % (W + 40)) - 20;
        const y = (i * 61) % H;
        const a = 0.25 + 0.65 * Math.abs(Math.sin(t * 1.4 + i));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        const sz = i % 5 === 0 ? 3 : 2;
        ctx.fillRect(x, y, sz, sz);
      }
      // nebula
      const nx = W * 0.2 - ((s1 * 0.4) % (W * 2));
      for (const [dx, dy, rr, col] of [[0, 0, 130, "rgba(168,85,247,.16)"], [70, 60, 90, "rgba(236,72,153,.14)"], [-60, 90, 100, "rgba(56,189,248,.13)"]] as const) {
        const ng = ctx.createRadialGradient(nx + dx, H * 0.32 + dy, 0, nx + dx, H * 0.32 + dy, rr);
        ng.addColorStop(0, col);
        ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(nx + dx, H * 0.32 + dy, rr, 0, TAU);
        ctx.fill();
      }
      // ring planet
      const px = W * 0.82 - ((s2 * 0.5) % (W + 460)) - 100;
      const py = H * 0.26;
      const pg = ctx.createLinearGradient(px - 70, py - 70, px + 70, py + 70);
      pg.addColorStop(0, "rgba(165,180,252,.6)");
      pg.addColorStop(1, "rgba(76,29,149,.55)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, 62, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(196,181,253,.55)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(px, py, 100, 24, -0.28, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.16)";
      ctx.beginPath();
      ctx.ellipse(px - 16, py - 18, 18, 12, -0.5, 0, TAU);
      ctx.fill();
      break;
    }
    case "reef": {
      // light rays
      ctx.fillStyle = "rgba(186,230,253,.07)";
      for (let i = 0; i < 6; i++) {
        const x = ((i * 150 - s1) % (W + 320)) - 140;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 56, 0);
        ctx.lineTo(x + 170, H);
        ctx.lineTo(x + 40, H);
        ctx.closePath();
        ctx.fill();
      }
      for (let i = 0; i < 9; i++) {
        const x = ((i * 115 - s2) % (W + 220)) - 110;
        const sway = Math.sin(t * 1.2 + i) * 14;
        ctx.strokeStyle = `rgba(13,148,136,${0.3 + (i % 3) * 0.1})`;
        ctx.lineWidth = 9 + (i % 3) * 3;
        ctx.beginPath();
        ctx.moveTo(x, gy + 10);
        ctx.quadraticCurveTo(x + sway, gy - 80, x + sway * 1.6, gy - 150 - (i % 3) * 30);
        ctx.stroke();
        // coral
        if (i % 2 === 0) {
          ctx.strokeStyle = `rgba(251,113,133,${0.3 + (i % 4) * 0.08})`;
          ctx.lineWidth = 5;
          for (let b = -1; b <= 1; b++) {
            ctx.beginPath();
            ctx.moveTo(x + 40, gy + 6);
            ctx.quadraticCurveTo(x + 40 + b * 14, gy - 24, x + 44 + b * 18, gy - 40);
            ctx.stroke();
          }
        }
      }
      break;
    }
    case "volcano": {
      const cx = W * 0.5 - ((s3 * 0.3) % (W * 2));
      // lava glow sky
      const lg = ctx.createRadialGradient(cx, H * 0.5, 20, cx, H * 0.5, 300);
      lg.addColorStop(0, `rgba(249,115,22,${0.25 + 0.1 * Math.sin(t * 2)})`);
      lg.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.beginPath();
      ctx.moveTo(cx - 240, gy);
      ctx.lineTo(cx, H * 0.3);
      ctx.lineTo(cx + 240, gy);
      ctx.closePath();
      ctx.fill();
      // lava channel
      ctx.fillStyle = `rgba(251,146,60,${0.75 + 0.2 * Math.sin(t * 3)})`;
      ctx.beginPath();
      ctx.moveTo(cx - 26, H * 0.32);
      ctx.lineTo(cx, H * 0.26);
      ctx.lineTo(cx + 26, H * 0.32);
      ctx.lineTo(cx + 14, H * 0.6);
      ctx.lineTo(cx - 14, H * 0.6);
      ctx.closePath();
      ctx.fill();
      // embers rising (big)
      for (let i = 0; i < 8; i++) {
        const ex = cx - 30 + ((i * 53) % 60) + Math.sin(t * 2 + i) * 10;
        const ey = H * 0.3 - ((t * 40 + i * 60) % (H * 0.3));
        ctx.fillStyle = `rgba(253,186,116,${0.8 - ey / H})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 2 + (i % 3), 0, TAU);
        ctx.fill();
      }
      // smoke clouds
      for (let i = 0; i < 4; i++) {
        cloud(ctx, cx + ((i * 90 - t * 14) % 200) - 100, H * 0.22 - i * 26, 30 + i * 8, "rgba(30,10,10,.4)");
      }
      break;
    }
    case "cyber": {
      ctx.strokeStyle = "rgba(244,114,182,.4)";
      ctx.lineWidth = 1.5;
      const hz = H * 0.62;
      for (let i = 0; i < 14; i++) {
        const x = ((i * 80 - s3) % (W + 160)) - 80;
        ctx.beginPath();
        ctx.moveTo(x, hz);
        ctx.lineTo(x + (x - W / 2) * 1.7, H);
        ctx.stroke();
      }
      for (let i = 1; i < 10; i++) {
        const y = hz + Math.pow(i / 10, 2.2) * (H - hz);
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // synth sun w/ scanlines
      const sg = ctx.createLinearGradient(0, hz - 150, 0, hz);
      sg.addColorStop(0, "rgba(253,224,71,.95)");
      sg.addColorStop(0.6, "rgba(217,70,239,.95)");
      sg.addColorStop(1, "rgba(74,4,78,.9)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(W * 0.5, hz, 96, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = map.sky[1];
      for (let i = 0; i < 5; i++) ctx.fillRect(0, hz - 18 - i * 20 + Math.sin(t + i) * 2, W, 3 + i);
      // floating neon shapes
      for (let i = 0; i < 6; i++) {
        const x = ((i * 140 - s2) % (W + 220)) - 100;
        const yy = 90 + (i * 67) % 200 + Math.sin(t + i) * 14;
        ctx.strokeStyle = i % 2 ? "rgba(34,211,238,.5)" : "rgba(240,171,252,.5)";
        ctx.lineWidth = 2;
        if (i % 2) {
          ctx.strokeRect(x, yy, 22, 22);
        } else {
          ctx.beginPath();
          ctx.moveTo(x + 12, yy);
          ctx.lineTo(x + 24, yy + 22);
          ctx.lineTo(x, yy + 22);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }
    case "candy": {
      for (let i = 0; i < 5; i++) cloud(ctx, ((i * 170 - s1) % (W + 260)) - 70, 55 + ((i * 47) % 130), 30, "rgba(255,255,255,.8)");
      // shining sun
      const sx = W * 0.8, sy = H * 0.14;
      ctx.fillStyle = "rgba(254,240,138,.9)";
      ctx.beginPath();
      ctx.arc(sx, sy, 34, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(253,224,71,.5)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + t * 0.4;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 42, sy + Math.sin(a) * 42);
        ctx.lineTo(sx + Math.cos(a) * 54, sy + Math.sin(a) * 54);
        ctx.stroke();
      }
      // lollipops
      for (let i = 0; i < 7; i++) {
        const x = ((i * 130 - s2) % (W + 220)) - 110;
        const y = gy + 4;
        const rr = 26 + (i % 3) * 7;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x - 4, y - rr * 2 - 60, 8, 60 + rr);
        ctx.fillStyle = i % 2 ? "#f472b6" : "#a78bfa";
        ctx.beginPath();
        ctx.arc(x, y - rr * 2 - 60, rr, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.75)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y - rr * 2 - 60, rr * 0.6, t + i, t + i + 4.2);
        ctx.stroke();
      }
      break;
    }
    case "clouds": {
      // moody layered clouds
      for (let i = 0; i < 8; i++) {
        cloud(ctx, ((i * 130 - s2) % (W + 280)) - 100, 40 + ((i * 61) % 260), 36 + (i % 3) * 14, `rgba(100,116,139,${0.3 + (i % 2) * 0.15})`);
      }
      for (let i = 0; i < 4; i++) {
        cloud(ctx, ((i * 210 - s1) % (W + 300)) - 110, 30 + ((i * 97) % 160), 46, "rgba(15,23,42,.35)");
      }
      break;
    }
    case "storm": {
      // dark front clouds
      for (let i = 0; i < 5; i++) {
        cloud(ctx, ((i * 190 - s1 * 1.4) % (W + 340)) - 120, 24 + ((i * 83) % 120), 52 + (i % 2) * 18, "rgba(2,6,23,.55)");
      }
      for (let i = 0; i < 7; i++) {
        cloud(ctx, ((i * 130 - s2 * 1.6) % (W + 280)) - 100, 80 + ((i * 71) % 200), 34 + (i % 3) * 12, "rgba(71,85,105,.5)");
      }
      // distant city silhouette
      ctx.fillStyle = "rgba(15,23,42,.5)";
      for (let i = 0; i < 18; i++) {
        const x = ((i * 54 - s3) % (W + 120)) - 60;
        const hh = 40 + ((i * 29) % 90);
        ctx.fillRect(x, gy - hh, 28, hh);
      }
      break;
    }
    case "ruins": {
      // low sun
      const sx = W * 0.5, sy = H * 0.3;
      const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 160);
      sg.addColorStop(0, "rgba(255,251,235,.7)");
      sg.addColorStop(1, "rgba(255,251,235,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, 160, 0, TAU);
      ctx.fill();
      // pyramids far
      ctx.fillStyle = "rgba(120,53,15,.25)";
      for (let i = 0; i < 2; i++) {
        const x = ((i * 300 - s1) % (W + 400)) - 180;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + 120, gy - 130);
        ctx.lineTo(x + 240, gy);
        ctx.closePath();
        ctx.fill();
      }
      // columns near
      for (let i = 0; i < 6; i++) {
        const x = ((i * 150 - s3) % (W + 280)) - 130;
        ctx.fillStyle = "rgba(120,53,15,.42)";
        ctx.fillRect(x, gy - 180, 18, 180);
        ctx.fillRect(x + 64, gy - 150, 18, 150);
        ctx.fillRect(x - 10, gy - 196, 100, 16);
        // broken
        if (i % 3 === 0) ctx.fillRect(x + 82, gy - 110, 18, 110);
      }
      mist(ctx, W, gy - 60, 22, t, "rgba(253,230,138,.25)", 0.4);
      break;
    }
    case "aurora": {
      // star field
      for (let i = 0; i < 50; i++) {
        const x = ((i * 89 - s1) % (W + 30)) - 15;
        const y = (i * 47) % (H * 0.6);
        ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`;
        ctx.fillRect(x, y, 2, 2);
      }
      // aurora ribbons
      const ribbons = [
        ["rgba(52,211,153,.30)", 0.9],
        ["rgba(56,189,248,.22)", 1.35],
        ["rgba(192,132,252,.18)", 1.8],
      ] as const;
      for (const [col, k] of ribbons) {
        ctx.fillStyle = col;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) {
          const y = H * 0.22 + Math.sin(x / 110 + t * 0.6 * k) * 40 + Math.sin(x / 47 + t * 0.9) * 16;
          ctx[x === 0 ? "moveTo" : "lineTo"](x, y);
        }
        for (let x = W; x >= 0; x -= 8) {
          const y = H * 0.22 + Math.sin(x / 110 + t * 0.6 * k) * 40 + Math.sin(x / 47 + t * 0.9) * 16 + 60 + 20 * Math.sin(t + x / 60);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      // snowy mountains
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer === 0 ? s2 : s3;
        ctx.fillStyle = layer === 0 ? "rgba(226,232,240,.16)" : "rgba(226,232,240,.3)";
        ctx.beginPath();
        ctx.moveTo(0, H);
        const baseY = H * (0.55 + layer * 0.13);
        const w = 160 + layer * 60;
        for (let x = -w; x <= W + w; x += 6) {
          const k = (x + sp) / w;
          ctx.lineTo(x, baseY - Math.abs(Math.sin(k)) * (140 - layer * 30));
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "japan": {
      // sun
      const sx = W * 0.72, sy = H * 0.24;
      const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 110);
      sg.addColorStop(0, "rgba(255,241,242,.85)");
      sg.addColorStop(1, "rgba(255,241,242,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, 110, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fff1f2";
      ctx.beginPath();
      ctx.arc(sx, sy, 26, 0, TAU);
      ctx.fill();
      // Fuji
      const fx = W * 0.22 - ((s1 * 0.7) % (W + 300)) + 80;
      ctx.fillStyle = "rgba(159,18,57,.28)";
      ctx.beginPath();
      ctx.moveTo(fx - 190, gy);
      ctx.lineTo(fx, gy - 240);
      ctx.lineTo(fx + 190, gy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.beginPath();
      ctx.moveTo(fx - 52, gy - 176);
      ctx.lineTo(fx, gy - 240);
      ctx.lineTo(fx + 52, gy - 176);
      ctx.lineTo(fx + 30, gy - 162);
      ctx.lineTo(fx + 8, gy - 176);
      ctx.lineTo(fx - 14, gy - 158);
      ctx.lineTo(fx - 30, gy - 172);
      ctx.closePath();
      ctx.fill();
      // pagoda
      const px = W * 0.68 - ((s2) % (W + 400)) + 100;
      ctx.fillStyle = "rgba(76,5,25,.55)";
      for (let l = 0; l < 4; l++) {
        const b = 60 - l * 10;
        const yv = gy - 28 - l * 34;
        ctx.fillRect(px - b / 2, yv, b, 24);
        ctx.beginPath();
        ctx.moveTo(px - b / 2 - 14, yv);
        ctx.lineTo(px, yv - 12);
        ctx.lineTo(px + b / 2 + 14, yv);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillRect(px - 2, gy - 156, 4, 20);
      // cherry trees
      for (let i = 0; i < 6; i++) {
        const x = ((i * 118 - s3) % (W + 200)) - 90;
        const y = gy - 8;
        ctx.fillStyle = "rgba(69,10,10,.6)";
        ctx.fillRect(x - 3, y - 46, 7, 46);
        ctx.fillStyle = "rgba(253,164,175,.85)";
        for (const [dx, dy, rr] of [[-14, -56, 16], [10, -60, 17], [-2, -68, 18]] as const) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, rr, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(255,228,230,.8)";
        ctx.beginPath();
        ctx.arc(x - 8, y - 66, 7, 0, TAU);
        ctx.fill();
      }
      mist(ctx, W, gy - 80, 20, t, "rgba(255,228,230,.4)", 0.45);
      break;
    }
  }
}
