// player.js — the thief: keyboard movement with wall sliding, beeper tosses,
// and the hold-E interact (hack terminal / crack safe) progress.
const PLAYER = {
  x: LEVEL.playerStart.x,
  y: LEVEL.playerStart.y,
  prevX: LEVEL.playerStart.x,
  prevY: LEVEL.playerStart.y,
  facing: 0,
  beepers: CONFIG.beeperCount,
  beeper: null, // {x, y, targetX, targetY, t, landed}
  interact: null, // 'hack' | 'crack' | null
  interactProgress: 0,
};

function resetPlayer() {
  PLAYER.x = LEVEL.playerStart.x;
  PLAYER.y = LEVEL.playerStart.y;
  PLAYER.prevX = PLAYER.x;
  PLAYER.prevY = PLAYER.y;
  PLAYER.facing = 0;
  PLAYER.beeper = null;
  PLAYER.interact = null;
  PLAYER.interactProgress = 0;
}

function updatePlayer(dt, keys) {
  PLAYER.prevX = PLAYER.x;
  PLAYER.prevY = PLAYER.y;
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    PLAYER.facing = Math.atan2(dy, dx);
    const step = CONFIG.playerSpeed * dt;
    const r = CONFIG.playerRadius;
    if (!LEVEL.pointBlocked(PLAYER.x + dx * step, PLAYER.y, r)) PLAYER.x += dx * step;
    if (!LEVEL.pointBlocked(PLAYER.x, PLAYER.y + dy * step, r)) PLAYER.y += dy * step;
  }
  if (PLAYER.beeper && !PLAYER.beeper.landed) {
    const b = PLAYER.beeper;
    b.t += dt / CONFIG.beeperFlightSeconds;
    if (b.t >= 1) {
      b.t = 1;
      b.landed = true;
      b.x = b.targetX;
      b.y = b.targetY;
    } else {
      b.x = b.fromX + (b.targetX - b.fromX) * b.t;
      b.y = b.fromY + (b.targetY - b.fromY) * b.t;
    }
  }
}

function tossBeeper(targetX, targetY) {
  if (PLAYER.beepers <= 0) return false;
  if (PLAYER.beeper && !PLAYER.beeper.landed) return false;
  const dx = targetX - PLAYER.x;
  const dy = targetY - PLAYER.y;
  const dist = Math.hypot(dx, dy);
  const clamped = Math.min(dist, CONFIG.beeperRange);
  const tx = PLAYER.x + (dist === 0 ? 0 : (dx / dist) * clamped);
  const ty = PLAYER.y + (dist === 0 ? 0 : (dy / dist) * clamped);
  PLAYER.beeper = { fromX: PLAYER.x, fromY: PLAYER.y, targetX: tx, targetY: ty, x: PLAYER.x, y: PLAYER.y, t: 0, landed: false };
  PLAYER.beepers -= 1;
  return true;
}

function nearestGuardTo(point, guards) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - point.x, g.y - point.y);
    if (d < bestDist) { bestDist = d; best = g; }
  }
  if (best && bestDist <= CONFIG.beeperEarshot) return best;
  return null;
}

function interactTarget() {
  const dTerm = Math.hypot(PLAYER.x - LEVEL.terminal.point.x, PLAYER.y - LEVEL.terminal.point.y);
  if (dTerm <= CONFIG.interactRange && CAMERAS.hackCooldownLeft <= 0) return 'hack';
  const safeFront = { x: LEVEL.safe.x + LEVEL.safe.w / 2, y: LEVEL.safe.y + LEVEL.safe.h + 14 };
  const dSafe = Math.hypot(PLAYER.x - safeFront.x, PLAYER.y - safeFront.y);
  if (dSafe <= CONFIG.safeRange && !LEVEL.safe.open) return 'crack';
  return null;
}

function updateInteract(dt, keyE) {
  const target = interactTarget();
  if (!keyE || !target) {
    PLAYER.interact = null;
    PLAYER.interactProgress = 0;
    return null;
  }
  PLAYER.interact = target;
  const need = target === 'hack' ? CONFIG.hackSeconds : CONFIG.crackSeconds;
  PLAYER.interactProgress += dt;
  if (PLAYER.interactProgress >= need) {
    PLAYER.interact = null;
    PLAYER.interactProgress = 0;
    return target;
  }
  return null;
}
