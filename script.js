const canvas = document.getElementById("vbCanvas");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// ---- ORB (CENTER BEAM) STATE ----
const orb = {
  x: () => width / 2,
  y: () => height / 2,
  baseRadius: 80,
  maxRadius: 150,
  energy: 0.0,
  energyGrowRate: 0.02,
  energyDecayRate: 0.015
};

let pointerDown = false;

// ---- STRANDS STATE ----
const strands = [];
let lastPointer = null;

function addStrandSegment(x, y, dx, dy) {
  const speed = Math.min(Math.hypot(dx, dy), 60);
  const angle = Math.atan2(dy, dx) || 0;

  const velocity = {
    vx: Math.cos(angle) * (speed * 0.15),
    vy: Math.sin(angle) * (speed * 0.15)
  };

  strands.push({
    x,
    y,
    vx: velocity.vx,
    vy: velocity.vy,
    life: 0,
    maxLife: 80 + Math.random() * 40,
    thickness: 1.5 + Math.random() * 2.5
  });
}

// ---- POINTER HELPERS ----
function getPointerPos(e) {
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
  return { x: e.clientX, y: e.clientY };
}

function onPointerDown(e) {
  e.preventDefault();
  pointerDown = true;
  lastPointer = getPointerPos(e);
}

function onPointerMove(e) {
  if (!pointerDown) return;
  e.preventDefault();

  const pos = getPointerPos(e);
  if (lastPointer) {
    const dx = pos.x - lastPointer.x;
    const dy = pos.y - lastPointer.y;
    addStrandSegment(pos.x, pos.y, dx, dy);
  }
  lastPointer = pos;
}

function onPointerUp(e) {
  e.preventDefault();
  pointerDown = false;
  lastPointer = null;
}

// Pointer events
canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
canvas.addEventListener("pointermove", onPointerMove, { passive: false });
canvas.addEventListener("pointerup", onPointerUp, { passive: false });
canvas.addEventListener("pointercancel", onPointerUp, { passive: false });

// Mouse fallback
canvas.addEventListener("mousedown", onPointerDown, { passive: false });
canvas.addEventListener("mousemove", onPointerMove, { passive: false });
canvas.addEventListener("mouseup", onPointerUp, { passive: false });

// Touch fallback
canvas.addEventListener("touchstart", onPointerDown, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerUp, { passive: false });
canvas.addEventListener("touchcancel", onPointerUp, { passive: false });

// ---- DRAWING HELPERS ----
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#020308");
  gradient.addColorStop(0.5, "#050816");
  gradient.addColorStop(1, "#020308");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawOrb() {
  // Update orb energy
  if (pointerDown) {
    orb.energy += orb.energyGrowRate;
  } else {
    orb.energy -= orb.energyDecayRate;
  }
  orb.energy = Math.max(0, Math.min(1, orb.energy));

  const radius =
    orb.baseRadius + (orb.maxRadius - orb.baseRadius) * orb.energy;
  const centerX = orb.x();
  const centerY = orb.y();

  // Vertical beam glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const beamGradient = ctx.createLinearGradient(centerX, 0, centerX, height);
  const coreAlpha = 0.18 + 0.25 * orb.energy;

  beamGradient.addColorStop(0, `rgba(0, 255, 200, 0)`);
  beamGradient.addColorStop(0.5, `rgba(0, 255, 200, ${coreAlpha})`);
  beamGradient.addColorStop(1, `rgba(0, 180, 255, 0)`);

  ctx.fillStyle = beamGradient;
  const beamWidth = radius * 1.8;
  ctx.fillRect(centerX - beamWidth / 2, 0, beamWidth, height);
  ctx.restore();

  // Orb glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glowGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.1,
    centerX,
    centerY,
    radius * 1.4
  );

  const edgeAlpha = 0.02 + 0.3 * orb.energy;
  glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.96)");
  glowGradient.addColorStop(0.25, "rgba(200, 255, 255, 0.7)");
  glowGradient.addColorStop(0.55, "rgba(0, 255, 200, 0.4)");
  glowGradient.addColorStop(1, `rgba(0, 40, 80, ${edgeAlpha})`);

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Highlight ring
  ctx.save();
  ctx.globalAlpha = 0.4 + 0.4 * orb.energy;
  ctx.strokeStyle = "rgba(220, 255, 255, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateAndDrawStrands() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = strands.length - 1; i >= 0; i--) {
    const s = strands[i];
    s.life += 1;
    if (s.life > s.maxLife) {
      strands.splice(i, 1);
      continue;
    }

    s.x += s.vx * 0.9;
    s.y += s.vy * 0.9 - 0.05;

    const t = s.life / s.maxLife;
    const alpha = (1 - t) * 0.35;
    const thickness = s.thickness * (1 - t * 0.7);

    ctx.lineWidth = thickness;

    const r = 150 + 80 * t;
    const g = 255;
    const b = 220 + 20 * t;

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 0.5, s.y - s.vy * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

// ---- MAIN LOOP ----
function loop() {
  drawBackground();
  updateAndDrawStrands();
  drawOrb();
  requestAnimationFrame(loop);
}

loop();
