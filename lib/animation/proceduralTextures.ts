import * as THREE from "three";

/** Small deterministic PRNG so textures are identical on every load. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(size: [number, number], draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, size[0], size[1]);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Warm stone tiles with grout lines and subtle tonal variation. */
export function createFloorTexture(): THREE.CanvasTexture {
  return canvasTexture([512, 512], (ctx, w, h) => {
    const rnd = seeded(7);
    ctx.fillStyle = "#3a322b";
    ctx.fillRect(0, 0, w, h);
    const tile = w / 2;
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const v = 44 + Math.floor(rnd() * 14);
        ctx.fillStyle = `rgb(${v + 6},${v},${v - 6})`;
        ctx.fillRect(tx * tile + 3, ty * tile + 3, tile - 6, tile - 6);
      }
    }
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
  });
}

/** Dark wood grain for tables, wall slats and cabinetry. */
export function createWoodTexture(base = "#4a2c1b"): THREE.CanvasTexture {
  return canvasTexture([512, 512], (ctx, w, h) => {
    const rnd = seeded(31);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      const y = rnd() * h;
      const amp = 2 + rnd() * 6;
      const alpha = 0.04 + rnd() * 0.1;
      ctx.strokeStyle = rnd() > 0.5 ? `rgba(20,10,5,${alpha})` : `rgba(255,190,120,${alpha * 0.6})`;
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const yy = y + Math.sin(x * 0.02 + i) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  });
}

/** Dark marble with brown-gold veining, matching the reference counter. */
export function createMarbleTexture(): THREE.CanvasTexture {
  return canvasTexture([512, 512], (ctx, w, h) => {
    const rnd = seeded(91);
    ctx.fillStyle = "#1e1714";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      let x = rnd() * w;
      let y = rnd() * h;
      ctx.strokeStyle = `rgba(${170 + rnd() * 60},${120 + rnd() * 50},${70 + rnd() * 30},${0.12 + rnd() * 0.22})`;
      ctx.lineWidth = 0.8 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 14; s++) {
        x += (rnd() - 0.4) * 60;
        y += (rnd() - 0.5) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

/** Abstract dark portrait-style painting for the back wall. */
export function createPaintingTexture(): THREE.CanvasTexture {
  return canvasTexture([512, 352], (ctx, w, h) => {
    const rnd = seeded(5);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#2a2f3a");
    g.addColorStop(1, "#0d1017");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const head = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.45, h * 0.42);
    head.addColorStop(0, "rgba(214,190,160,0.75)");
    head.addColorStop(1, "rgba(214,190,160,0)");
    ctx.fillStyle = head;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? "10,12,18" : "200,170,140"},${rnd() * 0.06})`;
      ctx.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 18, 2 + rnd() * 6);
    }
  });
}

/** Thin roughness-style noise used for plaster walls. */
export function createPlasterTexture(): THREE.CanvasTexture {
  return canvasTexture([256, 256], (ctx, w, h) => {
    const rnd = seeded(13);
    ctx.fillStyle = "#1c1f27";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) {
      const v = Math.floor(rnd() * 22);
      ctx.fillStyle = `rgba(${v + 20},${v + 22},${v + 30},0.35)`;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
  });
}

export { seeded };
