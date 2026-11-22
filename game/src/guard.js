// guard.js — a patrolling guard: waypoint loop, vision cone, suspicion,
// beeper investigation and alarm convergence.
function makeGuard(route) {
  return {
    route,
    waypoint: 0,
    x: route[0].x,
    y: route[0].y,
    angle: 0,
    pause: 0,
    mode: 'patrol', // patrol | suspicious | investigate | converge
    investigate: null,
    lookTimer: 0,
    converge: null,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function guardSeesPlayer(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.guardConeRange) return false;
  if (dist < 26) return !LEVEL.lineBlocked(guard.x, guard.y, px, py);
  const toPlayer = Math.atan2(dy, dx);
  const half = (CONFIG.guardConeDegrees * Math.PI) / 360;
  if (Math.abs(angleDiff(toPlayer, guard.angle)) > half) return false;
  return !LEVEL.lineBlocked(guard.x, guard.y, px, py);
}

function updateGuard(guard, dt, player, alarmTripped) {
  const speed = CONFIG.guardSpeed;
  if (alarmTripped && guard.mode !== 'converge') {
    guard.mode = 'converge';
    guard.converge = { x: player.x, y: player.y };
    guard.pause = 0;
  }
  if (guard.mode === 'converge') {
    const target = guard.converge;
    if (!target) { guard.mode = 'patrol'; return; }
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 14) { guard.mode = 'patrol'; guard.converge = null; return; }
    const step = Math.min(dist, speed * 1.5 * dt);
    guard.angle = Math.atan2(dy, dx);
    moveGuard(guard, (dx / dist) * step, (dy / dist) * step);
    return;
  }
  if (guard.mode === 'investigate' && guard.investigate) {
    const target = guard.investigate;
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12) {
      guard.lookTimer -= dt;
      guard.angle += dt * 1.6;
      if (guard.lookTimer <= 0) {
        guard.mode = 'patrol';
        guard.investigate = null;
      }
      return;
    }
    const step = Math.min(dist, speed * 1.25 * dt);
    guard.angle = Math.atan2(dy, dx);
    moveGuard(guard, (dx / dist) * step, (dy / dist) * step);
    return;
  }
  if (guard.pause > 0) {
    guard.pause -= dt;
    guard.angle += dt * 0.9;
    return;
  }
  const target = guard.route[(guard.waypoint + 1) % guard.route.length];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    guard.pause = CONFIG.guardPauseSeconds;
    return;
  }
  const step = Math.min(dist, speed * dt);
  guard.angle = Math.atan2(dy, dx);
  moveGuard(guard, (dx / dist) * step, (dy / dist) * step);
}

function moveGuard(guard, dx, dy) {
  const r = 12;
  if (!LEVEL.pointBlocked(guard.x + dx, guard.y, r)) guard.x += dx;
  if (!LEVEL.pointBlocked(guard.x, guard.y + dy, r)) guard.y += dy;
}

function guardInvestigate(guard, point) {
  if (guard.mode === 'converge') return;
  guard.mode = 'investigate';
  guard.investigate = { x: point.x, y: point.y };
  guard.lookTimer = 2;
  guard.pause = 0;
}

function guardCalm(guard) {
  if (guard.mode === 'suspicious') guard.mode = 'patrol';
}
