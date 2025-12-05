var canvas = document.getElementById("vbCanvas");
var ctx = canvas.getContext("2d");

var width = window.innerWidth;
var height = window.innerHeight;

canvas.width = width;
canvas.height = height;

// ---- ORB (CENTER BEAM) STATE ----
var orb = {
  x: function () { return width / 2; },
  y: function () { return height / 2; },
  energy: 0.0,          // 0 → calm, 1 → fully charged
  energyGrowRate: 0.02,
  energyDecayRate: 0.015
};

var pointerDown = false;

// ---- STRANDS STATE ----
var strands = [];
var lastPointer = null;

function addStrandSegment(x, y, dx, dy) {
  var speed = Math.min(Math.sqrt(dx * dx + dy * dy), 60);
  var angle = Math.atan2(dy, dx) || 0;

  var vx = Math.cos(angle) * (speed * 0.15);
  var vy = Math.sin(angle) * (speed * 0.15);

  strands.push({
    x: x,
    y: y,
    vx: vx,
    vy: vy,
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
  if (e.preventDefault) e.preventDefault();
  pointerDown = true;
  lastPointer = getPointerPos(e);
}

function onPointerMove(e) {
  if (!pointerDown) return;
  if (e.preventDefault) e.preventDefault();

  var pos = getPointerPos(e);
  if (lastPointer) {
    var dx = pos.x - lastPointer.x;
    var dy = pos.y - lastPointer.y;
    addStrandSegment(pos.x, pos.y, dx, dy);
  }
  lastPointer = pos;
}

function onPointerUp(e) {
  if (e && e.preventDefault) e.preventDefault();
  pointerDown = false;
  lastPointer = null;
}

// Pointer events (if supported)
canvas.addEventListener("pointerdown", onPointerDown, false);
canvas.addEventListener("pointermove", onPointerMove, false);
canvas.addEventListener("pointerup", onPointerUp, false);
canvas.addEventListener("pointercancel", onPointerUp, false);

// Mouse fallback
canvas.addEventListener("mousedown", onPointerDown, false);
canvas.addEventListener("mousemove", onPointerMove, false);
canvas.addEventListener("mouseup", onPointerUp, false);

// Touch fallback
canvas.addEventListener("touchstart", onPointerDown, false);
canvas.addEventListener("touchmove", onPointerMove, false);
canvas.addEventListener("touchend", onPointerUp, false);
canvas.addEventListener("touchcancel", onPointerUp, false);

// Handle resize
window.addEventListener("resize", function () {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// ---- DRAWING HELPERS ----
function drawBackground() {
  var gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#020308");
  gradient.addColorStop(0.5, "#050816");
  gradient.addColorStop(1, "#020308");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawOrb() {
  // Update orb energy (long-press behavior)
  if (pointerDown) {
    orb.energy += orb.energyGrowRate;
  } else {
    orb.energy -= orb.energyDecayRate;
  }
  if (orb.energy < 0) orb.energy = 0;
  if (orb.energy > 1) orb.energy = 1;

  // Make orb scale with screen
  var s = Math.min(width, height);
  var baseRadius = s * 0.18;
  var maxRadius = s * 0.32;
  var radius = baseRadius + (maxRadius - baseRadius) * orb.energy;

  var centerX = orb.x();
  var centerY = orb.y();

  // Full-width vertical beam glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  var beamGradient = ctx.createLinearGradient(centerX, 0, centerX, height);
  var coreAlpha = 0.18 + 0.25 * orb.energy;

  beamGradient.addColorStop(0, "rgba(0, 255, 200, 0)");
  beamGradient.addColorStop(0.5, "rgba(0, 255, 200, " + coreAlpha + ")");
  beamGradient.addColorStop(1, "rgba(0, 180, 255, 0)");

  ctx.fillStyle = beamGradient;
  ctx.fillRect(0, 0, width, height); // no side panels
  ctx.restore();

  // Orb core glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  var glowGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.1,
    centerX,
    centerY,
    radius * 1.4
  );

  var edgeAlpha = 0.02 + 0.3 * orb.energy;
  glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.96)");
  glowGradient.addColorStop(0.25, "rgba(200, 255, 255, 0.7)");
  glowGradient.addColorStop(0.55, "rgba(0, 255, 200, 0.4)");
  glowGradient.addColorStop(1, "rgba(0, 40, 80, " + edgeAlpha + ")");

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle highlight ring
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

  for (var i = strands.length - 1; i >= 0; i--) {
    var s = strands[i];
    s.life += 1;
    if (s.life > s.maxLife) {
      strands.splice(i, 1);
      continue;
    }

    // Easing drift: strands rise slightly, like light being pulled upward
    s.x += s.vx * 0.9;
    s.y += s.vy * 0.9 - 0.05;

    var t = s.life / s.maxLife;
    var alpha = (1 - t) * 0.35;
    var thickness = s.thickness * (1 - t * 0.7);

    ctx.lineWidth = thickness;

    // Teal → cyan → soft white as it ages
    var r = 150 + 80 * t;
    var g = 255;
    var b = 220 + 20 * t;

    ctx.strokeStyle =
      "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";

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
