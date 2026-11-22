// main.js — the game loop: update, alarm meter, alarms, win/lose, restart.
const GAME = {
  screen: 'title', // title | play | won | busted
  guards: LEVEL.guardRoutes.map(makeGuard),
  cameras: LEVEL.cameras.map(makeCamera),
  lasers: LEVEL.lasers.map(makeLaser),
  alarm: 0,
  alarmsUsed: 0,
  time: 0,
  flash: 0,
  lootValue: 0,
  score: 0,
  timeText: '0:00',
  objective: 'Grab the loot, crack the safe, reach the lift unseen',
  frozen: false,
  resetTimer: 0,
};

function formatTime(t) {
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function resetFloor() {
  for (const item of LEVEL.loot) item.taken = false;
  LEVEL.safe.open = false;
  LEVEL.lift.open = false;
  CAMERAS.offSecondsLeft = 0;
  CAMERAS.hackCooldownLeft = 0;
  resetPlayer();
  PLAYER.beepers = CONFIG.beeperCount;
  GAME.guards = LEVEL.guardRoutes.map(makeGuard);
  GAME.cameras = LEVEL.cameras.map(makeCamera);
  GAME.lasers = LEVEL.lasers.map(makeLaser);
  GAME.alarm = 0;
  GAME.alarmsUsed = 0;
  GAME.time = 0;
  GAME.flash = 0;
  GAME.lootValue = 0;
  GAME.score = 0;
  GAME.timeText = '0:00';
  GAME.objective = 'Grab the loot, crack the safe, reach the lift unseen';
  GAME.resetTimer = 0;
  GAME.screen = 'play';
}

function tripAlarm() {
  GAME.alarmsUsed += 1;
  GAME.alarm = 0;
  GAME.flash = 1;
  soundAlarm();
  if (GAME.alarmsUsed >= CONFIG.maxAlarms) {
    GAME.screen = 'busted';
    return;
  }
  GAME.resetTimer = 1.2;
  for (const g of GAME.guards) {
    g.mode = 'converge';
    g.converge = { x: PLAYER.x, y: PLAYER.y };
    g.pause = 0;
  }
}

function updateObjective() {
  const taken = LEVEL.loot.filter((l) => l.taken).length;
  if (taken === 3) {
    GAME.objective = 'All loot grabbed — reach the service lift!';
  } else if (LEVEL.loot[0].taken && LEVEL.loot[1].taken) {
    GAME.objective = 'Crack the vault safe (hold E) for the diamond';
  } else {
    GAME.objective = 'Grab the loot, crack the safe, reach the lift unseen';
  }
}

function update(dt) {
  if (GAME.screen !== 'play' || GAME.frozen) return;
  GAME.time += dt;
  GAME.timeText = formatTime(GAME.time);
  if (GAME.flash > 0) GAME.flash = Math.max(0, GAME.flash - dt / CONFIG.flashSeconds);

  if (GAME.resetTimer > 0) {
    GAME.resetTimer -= dt;
    for (const g of GAME.guards) updateGuard(g, dt, PLAYER, true);
    if (GAME.resetTimer <= 0) {
      resetPlayer();
      GAME.guards = LEVEL.guardRoutes.map(makeGuard);
      GAME.alarm = 0;
    }
    return;
  }

  updateCameraTimers(dt);
  for (const cam of GAME.cameras) updateCamera(cam, dt);
  for (const laser of GAME.lasers) updateLaser(laser, dt);

  updatePlayer(dt, INPUT.keys);

  if (INPUT.click) {
    const click = INPUT.click;
    INPUT.click = null;
    if (tossBeeper(click.x, click.y)) {
      soundBeeper();
      const guard = nearestGuardTo(PLAYER.beeper, GAME.guards);
      if (guard) guardInvestigate(guard, PLAYER.beeper);
    }
  }

  const done = updateInteract(dt, INPUT.interactHeld);
  if (done === 'hack') {
    hackCameras();
    soundHack();
  } else if (done === 'crack') {
    LEVEL.safe.open = true;
    const diamond = LEVEL.loot.find((l) => l.id === 'diamond');
    diamond.taken = true;
    GAME.lootValue += diamond.value;
    soundPickup();
    updateObjective();
  }

  // Loot pickup by proximity (cash and gold sit on furniture).
  for (const item of LEVEL.loot) {
    if (item.taken || item.needsCrack) continue;
    if (Math.hypot(PLAYER.x - item.x, PLAYER.y - item.y) <= 46) {
      item.taken = true;
      GAME.lootValue += item.value;
      soundPickup();
      updateObjective();
    }
  }

  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of GAME.guards) {
    updateGuard(g, dt, PLAYER, false);
    if (guardSeesPlayer(g, PLAYER.x, PLAYER.y)) {
      seenByGuard = true;
      if (g.mode === 'patrol') g.mode = 'suspicious';
    }
  }
  for (const cam of GAME.cameras) {
    if (cameraSeesPlayer(cam, PLAYER.x, PLAYER.y)) seenByCamera = true;
  }

  if (seenByGuard) GAME.alarm += CONFIG.guardSeeRate * dt;
  if (seenByCamera) GAME.alarm += CONFIG.cameraSeeRate * dt;
  if (!seenByGuard && !seenByCamera) {
    GAME.alarm = Math.max(0, GAME.alarm - CONFIG.alarmDrainRate * dt);
    if (GAME.alarm === 0) {
      for (const g of GAME.guards) guardCalm(g);
    }
  }
  GAME.alarm = Math.min(CONFIG.alarmMax, GAME.alarm);

  for (const laser of GAME.lasers) {
    if (laserCrossed(laser, PLAYER.x, PLAYER.y, PLAYER.prevX, PLAYER.prevY)) {
      GAME.alarm = Math.min(CONFIG.alarmMax, GAME.alarm + CONFIG.laserHitAlarm);
      GAME.flash = 1;
      soundZap();
    }
  }

  if (GAME.alarm >= CONFIG.alarmMax) {
    tripAlarm();
    return;
  }

  if (LEVEL.loot.every((l) => l.taken)) LEVEL.lift.open = true;
  if (LEVEL.lift.open) {
    const l = LEVEL.lift;
    if (PLAYER.x > l.x && PLAYER.x < l.x + l.w && PLAYER.y > l.y && PLAYER.y < l.y + l.h) {
      GAME.screen = 'won';
      GAME.score = Math.max(0, GAME.lootValue
        - Math.floor(GAME.time) * CONFIG.timeScorePenalty
        - GAME.alarmsUsed * CONFIG.alarmScorePenalty);
      soundWin();
    }
  }
}

function view() {
  return {
    guards: GAME.guards,
    cameras: GAME.cameras,
    lasers: GAME.lasers,
    alarm: GAME.alarm,
    alarmsUsed: GAME.alarmsUsed,
    time: GAME.time,
    screen: GAME.screen,
    flash: GAME.flash,
    lootValue: GAME.lootValue,
    objective: GAME.objective,
    score: GAME.score,
    timeText: GAME.timeText,
    interact: PLAYER.interact,
    interactProgress: PLAYER.interactProgress,
  };
}

function start() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  bindInput(canvas, {
    onRestart: () => { if (GAME.screen !== 'title') resetFloor(); },
    onMute: (muted) => { AUDIO.muted = muted; },
    onAnyKey: () => {
      ensureAudio();
      if (GAME.screen === 'title' && !GAME.frozen) GAME.screen = 'play';
    },
  });
  if (shot) {
    applyShot(shot);
    RENDER.draw(ctx, view());
    return;
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    RENDER.draw(ctx, view());
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', start);
