// shots.js — the ?shot= staging: four deterministic poses for the screenshots.
// Each pose uses the real floor, the real guards, cameras and lasers and the real
// renderer — never a separate drawing.
function applyShot(name) {
  // Reset everything to a clean floor first.
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
  GAME.frozen = true;

  const guard = GAME.guards;
  const cam = GAME.cameras;
  const laser = GAME.lasers;

  if (name === 'start') {
    GAME.screen = 'title';
    GAME.time = 0;
    guard[0].x = 300; guard[0].y = 130; guard[0].angle = 0;
    guard[1].x = 830; guard[1].y = 300; guard[1].angle = Math.PI / 2;
    guard[2].x = 1040; guard[2].y = 500; guard[2].angle = Math.PI;
    cam[0].angle = Math.PI / 2 + 0.4;
    cam[1].angle = Math.PI / 2 - 0.3;
    cam[2].angle = -Math.PI / 2;
    laser[0].time = 0.2; laser[1].time = 1.4; laser[2].time = 0.6;
  } else if (name === 'play') {
    GAME.screen = 'play';
    GAME.time = 47;
    GAME.alarm = 15;
    GAME.objective = 'Grab the loot, crack the safe, reach the lift unseen';
    PLAYER.x = 150; PLAYER.y = 372; PLAYER.facing = Math.PI / 2;
    PLAYER.beeper = { fromX: 150, fromY: 372, targetX: 300, targetY: 380, x: 300, y: 380, t: 1, landed: true };
    LEVEL.loot[0].taken = true;
    GAME.lootValue = CONFIG.lootValues.cash;
    guard[0].x = 150; guard[0].y = 250; guard[0].angle = Math.PI / 2;
    guard[1].x = 830; guard[1].y = 300; guard[1].angle = Math.PI / 2;
    guard[2].x = 1040; guard[2].y = 500; guard[2].angle = Math.PI;
    cam[0].angle = Math.PI / 2 + 0.55;
    cam[1].angle = Math.PI / 2 - 0.3;
    cam[2].angle = -Math.PI / 2;
    laser[0].time = 0.2; laser[1].time = 1.4; laser[2].time = 0.6;
  } else if (name === 'chase') {
    GAME.screen = 'play';
    GAME.time = 132;
    GAME.alarm = 92;
    GAME.flash = 0.55;
    GAME.objective = 'Grab the loot, crack the safe, reach the lift unseen';
    PLAYER.x = 700; PLAYER.y = 440; PLAYER.facing = -Math.PI / 2;
    LEVEL.loot[0].taken = true;
    LEVEL.loot[1].taken = true;
    GAME.lootValue = CONFIG.lootValues.cash + CONFIG.lootValues.gold;
    guard[0].x = 300; guard[0].y = 130; guard[0].angle = 0;
    guard[1].x = 700; guard[1].y = 380; guard[1].angle = Math.PI / 2; guard[1].mode = 'suspicious';
    guard[2].x = 1040; guard[2].y = 500; guard[2].angle = Math.PI;
    cam[0].angle = Math.PI / 2 + 0.4;
    cam[1].angle = Math.PI / 2;
    cam[2].angle = -Math.PI / 2;
    laser[0].time = 0.2; laser[1].time = 0.1; laser[2].time = 2.6;
  } else if (name === 'exit') {
    GAME.screen = 'play';
    GAME.time = 214;
    GAME.alarm = 0;
    GAME.objective = 'All loot grabbed — reach the service lift!';
    for (const item of LEVEL.loot) item.taken = true;
    LEVEL.safe.open = true;
    LEVEL.lift.open = true;
    GAME.lootValue = CONFIG.lootValues.cash + CONFIG.lootValues.gold + CONFIG.lootValues.diamond;
    PLAYER.x = 1238; PLAYER.y = 712; PLAYER.facing = Math.PI / 2;
    guard[0].x = 300; guard[0].y = 130; guard[0].angle = 0;
    guard[1].x = 830; guard[1].y = 300; guard[1].angle = Math.PI / 2;
    guard[2].x = 1040; guard[2].y = 500; guard[2].angle = Math.PI;
    cam[0].angle = Math.PI / 2 + 0.4;
    cam[1].angle = Math.PI / 2 - 0.3;
    cam[2].angle = -Math.PI / 2;
    laser[0].time = 0.2; laser[1].time = 1.4; laser[2].time = 0.6;
  }
}
