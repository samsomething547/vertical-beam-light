const canvas = document.getElementById("vbCanvas");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

// ---- ORB (CENTER BEAM) STATE ----
const orb = {
  x: () => width / 2,
  y: () => height / 2,
  baseRadius: 0,   // will be set dynamically
  maxRadius: 0,
  energy: 0.0,
  energyGrowRate: 0.02,
  energyDecayRate: 0.015
};

function updateOrbScale() {
  // Scale orb based on screen size (use smaller dimension)
  const s = Math.min(width, height);
  orb.baseRadius = s * 0.18;  // calm size
  orb.maxRadius = s * 0.32;   // fully charged size
}

// set initial scale
updateOrbScale();

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
canvas.addEventListener("mousemo
