// level.js — the Meridian casino vault floor: walls, cover, loot, safe, terminal,
// lift, lasers, cameras and guard routes, plus the geometry helpers the game uses.
const LEVEL = (() => {
  const T = 16; // outer wall thickness
  const top = CONFIG.hudHeight;

  const walls = [
    // Outer border
    { x: 0, y: top, w: 1280, h: T },
    { x: 0, y: 784, w: 1280, h: T },
    { x: 0, y: top, w: T, h: 800 - top },
    { x: 1264, y: top, w: T, h: 800 - top },
    // Casino / corridor divider (gap y 300..560 is the corridor mouth)
    { x: 560, y: top, w: T, h: 300 - top },
    { x: 560, y: 560, w: T, h: 800 - 560 },
    // Corridor / vault-wing divider (same gap)
    { x: 820, y: top, w: T, h: 300 - top },
    { x: 820, y: 560, w: T, h: 800 - 560 },
    // Vault room (north-east): top, left, right, bottom with a door gap x 1100..1160
    { x: 980, y: 88, w: 260, h: T },
    { x: 980, y: 88, w: T, h: 232 },
    { x: 1224, y: 88, w: T, h: 232 },
    { x: 980, y: 304, w: 120, h: T },
    { x: 1160, y: 304, w: 80, h: T },
    // One interior wall on the casino floor: two routes around it
    { x: 380, y: 200, w: T, h: 220 },
  ];

  // Tall cover: blocks movement AND sight.
  const tallCover = [
    // Slot-machine rows on the casino floor
    { x: 90, y: 180, w: 80, h: 44, kind: 'machine' },
    { x: 200, y: 180, w: 80, h: 44, kind: 'machine' },
    { x: 310, y: 180, w: 60, h: 44, kind: 'machine' },
    { x: 90, y: 300, w: 80, h: 44, kind: 'machine' },
    { x: 200, y: 300, w: 80, h: 44, kind: 'machine' },
    { x: 310, y: 300, w: 60, h: 44, kind: 'machine' },
    // Roulette tables
    { x: 150, y: 560, w: 110, h: 70, kind: 'table' },
    { x: 420, y: 620, w: 110, h: 70, kind: 'table' },
    // Cash table (loot sits on it)
    { x: 100, y: 640, w: 70, h: 40, kind: 'table' },
    // Gold pedestal in the vault ante-room
    { x: 930, y: 170, w: 70, h: 60, kind: 'pedestal' },
    // The vault safe (inside the vault room)
    { x: 1030, y: 130, w: 100, h: 70, kind: 'safe' },
  ];

  // Low cover: blocks movement only, never sight.
  const lowCover = [
    { x: 250, y: 660, w: 70, h: 26, kind: 'chips' },
    { x: 300, y: 540, w: 70, h: 26, kind: 'chips' },
    { x: 90, y: 480, w: 140, h: 10, kind: 'rope' },
    { x: 330, y: 100, w: 140, h: 10, kind: 'rope' },
  ];

  const loot = [
    { id: 'cash', name: 'Cash stacks', x: 135, y: 660, value: CONFIG.lootValues.cash, taken: false },
    { id: 'gold', name: 'Gold bars', x: 965, y: 200, value: CONFIG.lootValues.gold, taken: false },
    { id: 'diamond', name: 'Aurelia Diamond', x: 1080, y: 215, value: CONFIG.lootValues.diamond, taken: false, needsCrack: true },
  ];

  const safe = { x: 1030, y: 130, w: 100, h: 70, open: false };
  const terminal = { x: 300, y: 72, w: 60, h: 20, point: { x: 330, y: 108 } };
  const lift = { x: 1180, y: 690, w: 84, h: 94, open: false };

  const lasers = [
    { x: 640, y1: 305, y2: 555, phase: 0.0 },
    { x: 700, y1: 305, y2: 555, phase: 0.55 },
    { x: 760, y1: 305, y2: 555, phase: 1.1 },
  ];

  const cameras = [
    { x: 280, y: 130, baseAngle: Math.PI / 2, label: 'CAM 1' },
    { x: 700, y: 330, baseAngle: Math.PI / 2, label: 'CAM 2' },
    { x: 1130, y: 290, baseAngle: -Math.PI / 2, label: 'CAM 3' },
  ];

  const guardRoutes = [
    // Casino floor loop
    [{ x: 80, y: 130 }, { x: 500, y: 130 }, { x: 500, y: 700 }, { x: 80, y: 700 }],
    // Vault ante-room north loop (stays east of the laser grid)
    [{ x: 780, y: 120 }, { x: 880, y: 120 }, { x: 880, y: 480 }, { x: 780, y: 480 }],
    // Vault ante-room south loop
    [{ x: 900, y: 600 }, { x: 1180, y: 600 }, { x: 1180, y: 420 }, { x: 900, y: 420 }],
  ];

  const playerStart = { x: 60, y: 740 };

  function circleHitsRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function pointBlocked(x, y, r) {
    for (const w of walls) if (circleHitsRect(x, y, r, w)) return true;
    for (const c of tallCover) if (circleHitsRect(x, y, r, c)) return true;
    for (const c of lowCover) if (circleHitsRect(x, y, r, c)) return true;
    return false;
  }

  function segmentHitsRect(x1, y1, x2, y2, rect) {
    // Slab test: does the segment cross the rectangle?
    const dx = x2 - x1;
    const dy = y2 - y1;
    let tmin = 0;
    let tmax = 1;
    if (Math.abs(dx) < 1e-9) {
      if (x1 < rect.x || x1 > rect.x + rect.w) return false;
    } else {
      let t1 = (rect.x - x1) / dx;
      let t2 = (rect.x + rect.w - x1) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
    if (Math.abs(dy) < 1e-9) {
      if (y1 < rect.y || y1 > rect.y + rect.h) return false;
    } else {
      let t1 = (rect.y - y1) / dy;
      let t2 = (rect.y + rect.h - y1) / dy;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
    return true;
  }

  function lineBlocked(x1, y1, x2, y2) {
    for (const w of walls) if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
    for (const c of tallCover) if (segmentHitsRect(x1, y1, x2, y2, c)) return true;
    return false;
  }

  function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  return {
    walls, tallCover, lowCover, loot, safe, terminal, lift,
    lasers, cameras, guardRoutes, playerStart,
    pointBlocked, lineBlocked, distanceToSegment,
  };
})();
