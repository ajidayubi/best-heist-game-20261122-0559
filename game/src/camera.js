// camera.js — a wall/ceiling security camera sweeping its cone, plus the hack
// terminal's cameras-off timer shared by all cameras.
const CAMERAS = {
  offSecondsLeft: 0,
  hackCooldownLeft: 0,
};

function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    label: def.label,
    angle: def.baseAngle,
    sweepPhase: 0,
  };
}

function updateCamera(camera, dt) {
  if (CAMERAS.offSecondsLeft > 0) return;
  camera.sweepPhase += dt / CONFIG.cameraSweepSeconds;
  const half = (CONFIG.cameraSweepDegrees * Math.PI) / 360;
  camera.angle = camera.baseAngle + Math.sin(camera.sweepPhase * Math.PI * 2) * half;
}

function cameraSeesPlayer(camera, px, py) {
  if (CAMERAS.offSecondsLeft > 0) return false;
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.cameraConeRange) return false;
  if (dist < 26) return !LEVEL.lineBlocked(camera.x, camera.y, px, py);
  const toPlayer = Math.atan2(dy, dx);
  const half = (CONFIG.cameraConeDegrees * Math.PI) / 360;
  if (Math.abs(angleDiff(toPlayer, camera.angle)) > half) return false;
  return !LEVEL.lineBlocked(camera.x, camera.y, px, py);
}

function camerasDisabled() {
  return CAMERAS.offSecondsLeft > 0;
}

function hackCameras() {
  CAMERAS.offSecondsLeft = CONFIG.camerasOffSeconds;
  CAMERAS.hackCooldownLeft = CONFIG.hackCooldownSeconds;
}

function updateCameraTimers(dt) {
  if (CAMERAS.offSecondsLeft > 0) CAMERAS.offSecondsLeft -= dt;
  if (CAMERAS.hackCooldownLeft > 0) CAMERAS.hackCooldownLeft -= dt;
}
