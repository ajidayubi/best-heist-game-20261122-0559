// laser.js — the vault corridor's blinking laser grid: each beam cycles on and
// off on a staggered phase, and crossing an active beam trips the alarm meter.
function makeLaser(def) {
  return {
    x: def.x,
    y1: def.y1,
    y2: def.y2,
    phase: def.phase,
    time: 0,
    cooldown: 0,
  };
}

function laserCycleSeconds() {
  return CONFIG.laserOnSeconds + CONFIG.laserOffSeconds;
}

function updateLaser(laser, dt) {
  laser.time += dt;
  if (laser.cooldown > 0) laser.cooldown -= dt;
}

function laserIsActive(laser) {
  const t = (laser.time + laser.phase * laserCycleSeconds()) % laserCycleSeconds();
  return t < CONFIG.laserOnSeconds;
}

function laserCrossed(laser, px, py, prevX, prevY) {
  if (!laserIsActive(laser)) return false;
  if (laser.cooldown > 0) return false;
  // Did the player's movement segment cross the beam line?
  const crossed = (prevX < laser.x && px >= laser.x) || (prevX > laser.x && px <= laser.x);
  if (!crossed) return false;
  const yAtBeam = prevY + ((laser.x - prevX) / (px - prevX || 1e-9)) * (py - prevY);
  if (yAtBeam < laser.y1 - CONFIG.playerRadius || yAtBeam > laser.y2 + CONFIG.playerRadius) return false;
  const near = LEVEL.distanceToSegment(px, py, laser.x, laser.y1, laser.x, laser.y2);
  if (near > CONFIG.playerRadius + 4) return false;
  laser.cooldown = CONFIG.laserRecheckSeconds;
  return true;
}
