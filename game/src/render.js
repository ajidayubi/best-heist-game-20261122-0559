// render.js — all canvas drawing: the casino floor, walls, cover, neon, loot,
// safe, lift, lasers, guards with cones, cameras with cones, the thief, the HUD
// and the title / win / lose screens.
const RENDER = {
  draw(ctx, G) {
    const C = CONFIG.colours;
    const W = CONFIG.canvasWidth;
    const H = CONFIG.canvasHeight;
    ctx.clearRect(0, 0, W, H);
    this.drawFloor(ctx, C);
    this.drawLowCover(ctx, C);
    this.drawWalls(ctx, C);
    this.drawNeon(ctx, C);
    this.drawTallCover(ctx, C);
    this.drawLoot(ctx, C, G);
    this.drawTerminal(ctx, C, G);
    this.drawLift(ctx, C, G);
    this.drawLasers(ctx, C, G);
    this.drawBeeper(ctx, C, G);
    this.drawCameras(ctx, C, G);
    this.drawGuards(ctx, C, G);
    this.drawPlayer(ctx, C, G);
    this.drawHud(ctx, C, G);
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.35 * G.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (G.screen === 'title') this.drawTitle(ctx, C, G);
    if (G.screen === 'won') this.drawWon(ctx, C, G);
    if (G.screen === 'busted') this.drawBusted(ctx, C, G);
  },

  drawFloor(ctx, C) {
    // Casino carpet (west) and cold marble (vault wing, east).
    for (let y = CONFIG.hudHeight; y < CONFIG.canvasHeight; y += 40) {
      for (let x = 0; x < CONFIG.canvasWidth; x += 40) {
        const east = x >= 836;
        const dark = ((x / 40 + y / 40) % 2 === 0);
        ctx.fillStyle = east ? (dark ? C.marbleDark : C.marble) : (dark ? C.carpetDark : C.carpet);
        ctx.fillRect(x, y, 40, 40);
      }
    }
    // Corridor strip between the dividers, slightly darker.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(576, CONFIG.hudHeight, 244, CONFIG.canvasHeight - CONFIG.hudHeight);
    // Gold carpet runner down the corridor.
    ctx.fillStyle = 'rgba(212, 175, 55, 0.16)';
    ctx.fillRect(640, CONFIG.hudHeight, 116, CONFIG.canvasHeight - CONFIG.hudHeight);
  },

  drawLowCover(ctx, C) {
    for (const r of LEVEL.lowCover) {
      if (r.kind === 'rope') {
        ctx.fillStyle = C.rope;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(r.x, r.y, 6, r.h);
        ctx.fillRect(r.x + r.w - 6, r.y, 6, r.h);
      } else {
        ctx.fillStyle = C.chipRack;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#d4af37';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(r.x + 10 + i * 12, r.y + r.h / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  },

  drawWalls(ctx, C) {
    for (const w of LEVEL.walls) {
      ctx.fillStyle = C.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = C.wallTop;
      ctx.fillRect(w.x, w.y, w.w, 3);
    }
  },

  drawNeon(ctx, C) {
    const signs = [
      { x: 120, y: 76, w: 150, h: 18, text: 'MERIDIAN', colour: '#f472b6' },
      { x: 880, y: 76, w: 90, h: 18, text: 'VAULT', colour: '#38bdf8' },
      { x: 640, y: 76, w: 120, h: 18, text: 'SLOTS', colour: '#fbbf24' },
    ];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const s of signs) {
      ctx.save();
      ctx.shadowColor = s.colour;
      ctx.shadowBlur = 12;
      ctx.fillStyle = s.colour;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(s.text, s.x + s.w / 2, s.y + s.h / 2);
      ctx.restore();
    }
  },

  drawTallCover(ctx, C) {
    for (const r of LEVEL.tallCover) {
      if (r.kind === 'machine') {
        ctx.fillStyle = C.machine;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = C.machineTop;
        ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, 14);
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(r.x + 10, r.y + 8, 10, 6);
        ctx.fillRect(r.x + 26, r.y + 8, 10, 6);
        ctx.fillRect(r.x + 42, r.y + 8, 10, 6);
        ctx.fillStyle = '#e9d5ff';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('777', r.x + r.w / 2, r.y + r.h - 8);
      } else if (r.kind === 'table') {
        ctx.fillStyle = C.table;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = C.tableTop;
        ctx.lineWidth = 3;
        ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (r.kind === 'pedestal') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
      } else if (r.kind === 'safe') {
        ctx.fillStyle = LEVEL.safe.open ? C.safeOpen : C.safe;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x + 5, r.y + 5, r.w - 10, r.h - 10);
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(LEVEL.safe.open ? 'OPEN' : 'VAULT', r.x + r.w / 2, r.y + r.h - 10);
      }
    }
  },

  drawLoot(ctx, C, G) {
    for (const item of LEVEL.loot) {
      if (item.taken) continue;
      if (item.id === 'diamond' && !LEVEL.safe.open) continue;
      ctx.save();
      ctx.shadowBlur = 10;
      if (item.id === 'cash') {
        ctx.shadowColor = C.lootCash;
        ctx.fillStyle = C.lootCash;
        ctx.fillRect(item.x - 14, item.y - 8, 28, 16);
        ctx.fillStyle = '#14532d';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', item.x, item.y + 3);
      } else if (item.id === 'gold') {
        ctx.shadowColor = C.lootGold;
        ctx.fillStyle = C.lootGold;
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(item.x - 16 + i * 11, item.y - 6, 10, 12);
        }
      } else {
        ctx.shadowColor = C.lootDiamond;
        ctx.fillStyle = C.lootDiamond;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 12);
        ctx.lineTo(item.x + 11, item.y);
        ctx.lineTo(item.x, item.y + 12);
        ctx.lineTo(item.x - 11, item.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  },

  drawTerminal(ctx, C, G) {
    const t = LEVEL.terminal;
    ctx.fillStyle = CAMERAS.hackCooldownLeft > 0 ? '#334155' : C.terminal;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HACK', t.x + t.w / 2, t.y + t.h / 2 + 3);
    if (G.interact === 'hack') {
      this.drawProgressRing(ctx, t.point.x, t.point.y - 14, G.interactProgress / CONFIG.hackSeconds, '#0ea5e9');
    }
  },

  drawLift(ctx, C, G) {
    const l = LEVEL.lift;
    const open = LEVEL.lift.open;
    ctx.save();
    if (open) { ctx.shadowColor = C.liftOpen; ctx.shadowBlur = 18; }
    ctx.fillStyle = open ? C.liftOpen : C.lift;
    ctx.fillRect(l.x, l.y, l.w, l.h);
    ctx.restore();
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 2;
    ctx.strokeRect(l.x + 6, l.y + 6, l.w - 12, l.h - 12);
    ctx.fillStyle = '#f0fdf4';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'LIFT OPEN' : 'LIFT', l.x + l.w / 2, l.y + l.h / 2 - 4);
    ctx.font = '9px sans-serif';
    ctx.fillText(open ? 'GO!' : 'LOCKED', l.x + l.w / 2, l.y + l.h / 2 + 12);
  },

  drawLasers(ctx, C, G) {
    for (const laser of G.lasers) {
      const active = laserIsActive(laser);
      ctx.save();
      if (active) {
        ctx.shadowColor = C.laserOn;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = C.laserOn;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = C.laserOff;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
      }
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y1);
      ctx.lineTo(laser.x, laser.y2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(laser.x - 6, laser.y1 - 8, 12, 10);
      ctx.fillRect(laser.x - 6, laser.y2 - 2, 12, 10);
    }
  },

  drawBeeper(ctx, C, G) {
    const b = PLAYER.beeper;
    if (!b) return;
    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.landed ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (b.landed) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 10 + (G.time * 20) % 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  drawCone(ctx, x, y, angle, range, halfAngle, colour) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    ctx.closePath();
    ctx.fill();
  },

  drawCameras(ctx, C, G) {
    for (const cam of G.cameras) {
      const off = camerasDisabled();
      const half = (CONFIG.cameraConeDegrees * Math.PI) / 360;
      this.drawCone(ctx, cam.x, cam.y, cam.angle, CONFIG.cameraConeRange, half,
        off ? C.cameraOffCone : C.cameraCone);
      ctx.fillStyle = off ? '#475569' : '#dc2626';
      ctx.fillRect(cam.x - 8, cam.y - 6, 16, 12);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cam.x + Math.cos(cam.angle) * 8, cam.y + Math.sin(cam.angle) * 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(cam.label + (off ? ' OFF' : ''), cam.x + 12, cam.y - 8);
    }
  },

  drawGuards(ctx, C, G) {
    for (const guard of G.guards) {
      const half = (CONFIG.guardConeDegrees * Math.PI) / 360;
      this.drawCone(ctx, guard.x, guard.y, guard.angle, CONFIG.guardConeRange, half, C.guardCone);
      ctx.fillStyle = C.guard;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#dbeafe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.lineTo(guard.x + Math.cos(guard.angle) * 16, guard.y + Math.sin(guard.angle) * 16);
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      if (guard.mode === 'suspicious') ctx.fillText('?', guard.x, guard.y - 18);
      if (guard.mode === 'investigate' || guard.mode === 'converge') ctx.fillText('!', guard.x, guard.y - 18);
    }
  },

  drawPlayer(ctx, C, G) {
    const p = PLAYER;
    ctx.save();
    ctx.shadowColor = 'rgba(232, 228, 218, 0.5)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(232, 228, 218, 0.10)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(p.x, p.y, CONFIG.playerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.playerTie;
    ctx.fillRect(p.x - 2, p.y - 4, 4, 12);
    ctx.strokeStyle = C.player;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.facing) * 16, p.y + Math.sin(p.facing) * 16);
    ctx.stroke();
    if (G.interact === 'crack') {
      const s = LEVEL.safe;
      this.drawProgressRing(ctx, s.x + s.w / 2, s.y + s.h + 16, G.interactProgress / CONFIG.crackSeconds, '#7dd3fc');
    }
  },

  drawProgressRing(ctx, x, y, frac, colour) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  },

  drawHud(ctx, C, G) {
    ctx.fillStyle = C.hudBar;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.hudHeight);
    ctx.fillStyle = C.text;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const taken = LEVEL.loot.filter((l) => l.taken).length;
    ctx.fillText(`LOOT ${taken}/3  $${G.lootValue.toLocaleString('en-US')}`, 16, 20);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = C.textDim;
    ctx.fillText(G.objective, 16, 42);
    // Alarm meter
    const barX = 420;
    const barW = 260;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, 12, barW, 16);
    const frac = G.alarm / CONFIG.alarmMax;
    ctx.fillStyle = frac < 0.5 ? C.alarmLow : frac < 0.8 ? C.alarmMid : C.alarmHigh;
    ctx.fillRect(barX, 12, barW * frac, 16);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, 12, barW, 16);
    ctx.fillStyle = C.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ALARM', barX, 42);
    // Alarms used
    ctx.fillStyle = C.text;
    ctx.font = '12px sans-serif';
    ctx.fillText(`ALARMS ${G.alarmsUsed}/${CONFIG.maxAlarms}`, 700, 20);
    ctx.fillText(`BEEPERS ${PLAYER.beepers}`, 700, 42);
    // Cameras-off countdown
    if (CAMERAS.offSecondsLeft > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`CAMERAS OFF ${Math.ceil(CAMERAS.offSecondsLeft)}s`, 840, 20);
    } else if (CAMERAS.hackCooldownLeft > 0) {
      ctx.fillStyle = C.textDim;
      ctx.font = '12px sans-serif';
      ctx.fillText(`HACK ${Math.ceil(CAMERAS.hackCooldownLeft)}s`, 840, 20);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px sans-serif';
      ctx.fillText('HACK READY (E)', 840, 20);
    }
    // Timer
    const mins = Math.floor(G.time / 60);
    const secs = Math.floor(G.time % 60);
    ctx.fillStyle = C.text;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1264, 20);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = C.textDim;
    ctx.fillText(INPUT.muted ? 'MUTED (M)' : 'SOUND ON (M)', 1264, 42);
    ctx.textAlign = 'left';
  },

  drawTitle(ctx, C, G) {
    ctx.fillStyle = 'rgba(5, 5, 12, 0.78)';
    ctx.fillRect(0, CONFIG.hudHeight, CONFIG.canvasWidth, CONFIG.canvasHeight - CONFIG.hudHeight);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('THE MERIDIAN JOB', CONFIG.canvasWidth / 2, 240);
    ctx.fillStyle = C.text;
    ctx.font = '20px sans-serif';
    ctx.fillText('One night. One vault. Three stashes of loot. Get in, get rich, get out unseen.', CONFIG.canvasWidth / 2, 300);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = C.textDim;
    ctx.fillText('WASD / arrows — move      Click — toss a beeper (5 per night)', CONFIG.canvasWidth / 2, 360);
    ctx.fillText('Hold E at the terminal — kill the cameras      Hold E at the safe — crack it', CONFIG.canvasWidth / 2, 390);
    ctx.fillText('Dodge the amber guard cones, the red camera cones and the blinking lasers.', CONFIG.canvasWidth / 2, 420);
    ctx.fillText('Three alarms and the night is over. Grab everything, then reach the lift.', CONFIG.canvasWidth / 2, 450);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press any key to start', CONFIG.canvasWidth / 2, 520);
    ctx.textAlign = 'left';
  },

  drawWon(ctx, C, G) {
    ctx.fillStyle = 'rgba(5, 20, 8, 0.82)';
    ctx.fillRect(0, CONFIG.hudHeight, CONFIG.canvasWidth, CONFIG.canvasHeight - CONFIG.hudHeight);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('CLEAN GETAWAY', CONFIG.canvasWidth / 2, 280);
    ctx.fillStyle = C.text;
    ctx.font = '20px sans-serif';
    ctx.fillText(`Loot $${G.lootValue.toLocaleString('en-US')}  ·  Time ${G.timeText}  ·  Alarms ${G.alarmsUsed}`, CONFIG.canvasWidth / 2, 340);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SCORE ${G.score.toLocaleString('en-US')}`, CONFIG.canvasWidth / 2, 390);
    ctx.fillStyle = C.textDim;
    ctx.font = '16px sans-serif';
    ctx.fillText('Press R to run it again', CONFIG.canvasWidth / 2, 450);
    ctx.textAlign = 'left';
  },

  drawBusted(ctx, C, G) {
    ctx.fillStyle = 'rgba(25, 5, 5, 0.85)';
    ctx.fillRect(0, CONFIG.hudHeight, CONFIG.canvasWidth, CONFIG.canvasHeight - CONFIG.hudHeight);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('BUSTED', CONFIG.canvasWidth / 2, 280);
    ctx.fillStyle = C.text;
    ctx.font = '20px sans-serif';
    ctx.fillText('Three alarms. The Meridian keeps its money tonight.', CONFIG.canvasWidth / 2, 340);
    ctx.fillStyle = C.textDim;
    ctx.font = '16px sans-serif';
    ctx.fillText('Press R to try the job again', CONFIG.canvasWidth / 2, 400);
    ctx.textAlign = 'left';
  },
};
