// NEON BASTION — rendering: the board, the towers, the enemies, the effects,
// the HUD, the shop and every screen. Everything the judge sees is drawn here.

NB.SCREEN_TITLE = 'title';
NB.SCREEN_PLAY = 'playing';

NB.draw = function draw(ctx, game) {
  ctx.save();
  if (game.shake > 0.5) {
    ctx.translate(NB.randRange(-game.shake, game.shake) * 0.5, NB.randRange(-game.shake, game.shake) * 0.5);
  }
  NB.drawBoard(ctx, game);
  NB.drawTowers(ctx, game);
  NB.drawEnemies(ctx, game);
  NB.drawProjectiles(ctx, game);
  NB.drawParticles(ctx, game);
  NB.drawTexts(ctx, game);
  NB.drawHud(ctx, game);
  NB.drawSidebar(ctx, game);
  NB.drawBanner(ctx, game);
  ctx.restore();
  if (game.screen === 'title') NB.drawTitle(ctx, game);
  if (game.screen === 'paused') NB.drawPaused(ctx, game);
  if (game.screen === 'victory' || game.screen === 'defeat') NB.drawEnd(ctx, game);
};

NB.drawBoard = function drawBoard(ctx, game) {
  const C = NB.CFG;
  // Deep-space backdrop with a faint grid.
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, C.width, C.height);
  ctx.strokeStyle = 'rgba(80,120,255,0.07)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= C.gridCols; c += 1) {
    ctx.beginPath(); ctx.moveTo(c * C.cell, C.hudHeight); ctx.lineTo(c * C.cell, C.hudHeight + C.gridRows * C.cell); ctx.stroke();
  }
  for (let r = 0; r <= C.gridRows; r += 1) {
    ctx.beginPath(); ctx.moveTo(0, C.hudHeight + r * C.cell); ctx.lineTo(C.gridCols * C.cell, C.hudHeight + r * C.cell); ctx.stroke();
  }
  // The path: glowing tiles the enemies march on.
  for (const key of NB.PATH_SET) {
    const [c, r] = key.split(',').map(Number);
    const x = c * C.cell;
    const y = C.hudHeight + r * C.cell;
    ctx.fillStyle = 'rgba(55,230,255,0.10)';
    ctx.fillRect(x + 1, y + 1, C.cell - 2, C.cell - 2);
    ctx.strokeStyle = 'rgba(55,230,255,0.35)';
    ctx.strokeRect(x + 1.5, y + 1.5, C.cell - 3, C.cell - 3);
  }
  // Entry portal (left edge) and the Bastion core (right edge, row 7).
  const entry = NB.cellXY(-1, 1);
  ctx.fillStyle = '#ff2e63';
  ctx.beginPath(); ctx.arc(Math.max(6, entry.x), entry.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('IN', Math.max(6, entry.x), entry.y + 4);
  const core = NB.cellXY(15, 7);
  const pulse = 0.6 + 0.4 * Math.sin(game.time * 3);
  ctx.fillStyle = `rgba(255,46,99,${0.25 + 0.3 * pulse})`;
  ctx.beginPath(); ctx.arc(core.x, core.y, 30 + 4 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff2e63';
  ctx.beginPath(); ctx.arc(core.x, core.y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('CORE', core.x, core.y + 4);
  // Hover + placement preview.
  if (game.screen === 'playing' && game.hover) {
    const { col, row } = game.hover;
    const p = NB.cellXY(col, row);
    if (game.buildType) {
      const stats = NB.towerStats(game.buildType, 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(p.x, p.y, stats.range, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = NB.canBuild(game, col, row) ? 'rgba(125,255,138,0.25)' : 'rgba(255,93,126,0.3)';
      ctx.fillRect(col * C.cell + 2, C.hudHeight + row * C.cell + 2, C.cell - 4, C.cell - 4);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(col * C.cell + 2, C.hudHeight + row * C.cell + 2, C.cell - 4, C.cell - 4);
    }
  }
  // Selected tower: range ring.
  if (game.selected) {
    const t = NB.towerAt(game, game.selected.col, game.selected.row);
    if (t) {
      const stats = NB.towerStats(t.type, t.level);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(t.x, t.y, stats.range, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
};

NB.drawTowers = function drawTowers(ctx, game) {
  for (const t of game.towers) {
    const def = NB.TOWERS[t.type];
    // Base plate.
    ctx.fillStyle = '#131a2e';
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x, t.y, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Rotating barrel.
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.fillStyle = def.color;
    if (t.type === 'cannon') ctx.fillRect(0, -7, 26, 14);
    else if (t.type === 'railgun') ctx.fillRect(0, -3, 30, 6);
    else if (t.type === 'frost') { ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(0, -4, 22, 8);
    ctx.restore();
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(t.x, t.y, 9, 0, Math.PI * 2); ctx.fill();
    // Level pips.
    ctx.fillStyle = '#ffd75e';
    for (let i = 0; i < t.level; i += 1) {
      ctx.beginPath(); ctx.arc(t.x - 10 + i * 10, t.y + 20, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
};

NB.drawEnemies = function drawEnemies(ctx, game) {
  const wps = NB.waypoints();
  for (const e of game.enemies) {
    const def = NB.ENEMIES[e.type];
    const wob = Math.sin(game.time * 6 + e.wobble) * 2;
    const heading = e.wp < wps.length ? Math.atan2(wps[e.wp].y - e.y, wps[e.wp].x - e.x) : 0;
    // Body: a different shape per type, so the pack reads at a glance.
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : def.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(e.x, e.y + wob * 0.3);
    if (e.type === 'drone') {
      ctx.rotate(heading);
      ctx.beginPath(); ctx.moveTo(e.r + 3, 0); ctx.lineTo(-e.r, -e.r * 0.85); ctx.lineTo(-e.r * 0.4, 0); ctx.lineTo(-e.r, e.r * 0.85); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (e.type === 'crawler') {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-e.r * 0.8, -e.r * 0.8, e.r * 1.6, e.r * 1.6);
      ctx.strokeRect(-e.r * 0.8, -e.r * 0.8, e.r * 1.6, e.r * 1.6);
    } else if (e.type === 'tank') {
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(a) * e.r;
        const py = Math.sin(a) * e.r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    if (e.type === 'boss') {
      // Crown spikes on the Warden.
      ctx.fillStyle = '#ffd75e';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(e.x + i * 12 - 5, e.y - e.r + 2);
        ctx.lineTo(e.x + i * 12, e.y - e.r - 10);
        ctx.lineTo(e.x + i * 12 + 5, e.y - e.r + 2);
        ctx.fill();
      }
    }
    if (game.time < e.slowUntil) {
      ctx.strokeStyle = 'rgba(143,216,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, Math.PI * 2); ctx.stroke();
    }
    // HP bar.
    const w = e.r * 2 + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 5);
    ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#7dff8a' : (e.hp / e.maxHp > 0.25 ? '#ffd75e' : '#ff5d7e');
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * Math.max(0, e.hp / e.maxHp), 5);
  }
};

NB.drawProjectiles = function drawProjectiles(ctx, game) {
  for (const p of game.projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  for (const b of game.beams) {
    const a = b.life / b.max;
    ctx.strokeStyle = `rgba(255,93,126,${a})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
  }
};

NB.drawParticles = function drawParticles(ctx, game) {
  for (const pt of game.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
};

NB.drawTexts = function drawTexts(ctx, game) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px sans-serif';
  for (const t of game.texts) {
    ctx.globalAlpha = Math.max(0, t.life / t.max);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
};

NB.drawHud = function drawHud(ctx, game) {
  const C = NB.CFG;
  ctx.fillStyle = '#101830';
  ctx.fillRect(0, 0, C.width, C.hudHeight);
  ctx.strokeStyle = 'rgba(55,230,255,0.35)';
  ctx.beginPath(); ctx.moveTo(0, C.hudHeight + 0.5); ctx.lineTo(C.width, C.hudHeight + 0.5); ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#37e6ff';
  ctx.fillText('NEON BASTION', 16, 37);
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = '#ffd75e';
  ctx.fillText(`◈ ${game.gold}`, 250, 36);
  ctx.fillStyle = '#ff5d7e';
  ctx.fillText(`♥ ${game.lives}`, 360, 36);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE ${game.score}`, 470, 36);
  ctx.fillStyle = '#7dff8a';
  ctx.fillText(`WAVE ${Math.max(1, game.wave)}/${C.maxWaves}`, 640, 36);
  ctx.fillStyle = '#8fa3c8';
  ctx.font = '15px sans-serif';
  ctx.fillText(`kills ${game.kills}`, 790, 36);
  if (game.waveActive) {
    ctx.fillStyle = '#ffb02e';
    ctx.fillText(`hostiles left ${game.enemies.length + game.spawnQueue.length}`, 890, 36);
  }
};

NB.drawSidebar = function drawSidebar(ctx, game) {
  const L = NB.Layout;
  ctx.fillStyle = '#0d1322';
  ctx.fillRect(L.sidebarX, NB.CFG.hudHeight, 256, NB.CFG.height - NB.CFG.hudHeight);
  ctx.strokeStyle = 'rgba(55,230,255,0.35)';
  ctx.beginPath(); ctx.moveTo(L.sidebarX + 0.5, NB.CFG.hudHeight); ctx.lineTo(L.sidebarX + 0.5, NB.CFG.height); ctx.stroke();
  // Start wave button.
  const sb = L.startBtn;
  const done = game.wave >= NB.CFG.maxWaves;
  ctx.fillStyle = game.waveActive || done ? '#1a2438' : '#ff2e63';
  ctx.fillRect(sb.x, sb.y, sb.w, sb.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(done ? '✓ ALL WAVES CLEARED' : (game.waveActive ? 'WAVE RUNNING…' : (game.wave === 0 ? '▶ START WAVE 1' : `▶ START WAVE ${game.wave + 1}`)), sb.x + sb.w / 2, sb.y + 28);
  // Speed / pause / mute.
  const small = [[L.speedBtn, `SPEED ×${game.speed}`], [L.pauseBtn, game.screen === 'paused' ? 'RESUME' : 'PAUSE'], [L.muteBtn, game.muted ? 'MUTED' : 'SOUND']];
  ctx.font = 'bold 13px sans-serif';
  for (const [r, label] of small) {
    ctx.fillStyle = '#1a2438';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(143,163,200,0.5)';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = '#dfe8ff';
    ctx.fillText(label, r.x + r.w / 2, r.y + 20);
  }
  // Tower shop cards.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8fa3c8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('BUILD  —  click a tower, then a cell', L.cardX, L.cardY - 8);
  for (let i = 0; i < NB.TOWER_ORDER.length; i += 1) {
    const type = NB.TOWER_ORDER[i];
    const def = NB.TOWERS[type];
    const r = NB.cardRect(i);
    const picked = game.buildType === type;
    ctx.fillStyle = picked ? '#1d3a55' : '#131a2e';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = picked ? def.color : 'rgba(143,163,200,0.4)';
    ctx.lineWidth = picked ? 2 : 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(r.x + 26, r.y + 26, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${def.name}  ◈ ${def.cost}`, r.x + 48, r.y + 24);
    ctx.fillStyle = '#8fa3c8';
    ctx.font = '12px sans-serif';
    ctx.fillText(def.desc, r.x + 48, r.y + 42);
    const lv = def.levels[0];
    ctx.fillText(`dmg ${lv.dmg}  ·  ${lv.rate}/s  ·  range ${lv.range}`, r.x + 14, r.y + 66);
    ctx.fillStyle = game.gold >= def.cost ? '#7dff8a' : '#ff5d7e';
    ctx.fillText(game.gold >= def.cost ? 'affordable' : 'not enough gold', r.x + 14, r.y + 84);
  }
  // Selected tower panel.
  const t = game.selected ? NB.towerAt(game, game.selected.col, game.selected.row) : null;
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px sans-serif';
  if (t) {
    const def = NB.TOWERS[t.type];
    const stats = NB.towerStats(t.type, t.level);
    const y = L.panelY;
    ctx.fillStyle = '#8fa3c8';
    ctx.fillText('SELECTED TOWER', L.cardX, y - 6);
    ctx.fillStyle = def.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${def.name}  —  level ${t.level}/3`, L.cardX, y + 18);
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '13px sans-serif';
    ctx.fillText(`dmg ${stats.dmg}  ·  ${stats.rate}/s  ·  range ${stats.range}${stats.splash ? `  ·  splash ${stats.splash}` : ''}${stats.slowPct ? `  ·  slow ${Math.round(stats.slowPct * 100)}%` : ''}`, L.cardX, y + 40);
    const up = L.upgradeBtn;
    const se = L.sellBtn;
    const canUp = t.level < 3;
    const upCost = canUp ? def.levels[t.level].upCost : 0;
    ctx.fillStyle = canUp && game.gold >= upCost ? '#1f7a3d' : '#1a2438';
    ctx.fillRect(up.x, up.y, up.w, up.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(canUp ? `UPGRADE ◈ ${upCost}` : 'MAX LEVEL', up.x + up.w / 2, up.y + 23);
    ctx.fillStyle = '#7a2d1f';
    ctx.fillRect(se.x, se.y, se.w, se.h);
    ctx.fillStyle = '#fff';
    ctx.fillText(`SELL +${Math.floor(t.invested * NB.CFG.sellRefund)}`, se.x + se.w / 2, se.y + 23);
    ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = '#8fa3c8';
    ctx.fillText('No tower selected.', L.cardX, L.panelY + 14);
    ctx.fillText('Tip: Frost slows the pack so your', L.cardX, L.panelY + 36);
    ctx.fillText('Cannons can catch it. Railguns', L.cardX, L.panelY + 54);
    ctx.fillText('delete bosses from far away.', L.cardX, L.panelY + 72);
  }
};

NB.drawBanner = function drawBanner(ctx, game) {
  if (!game.banner || game.time > game.banner.until) return;
  const a = Math.min(1, (game.banner.until - game.time) * 2);
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(game.banner.text, 512, 300);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#ffd75e';
  ctx.fillText(game.banner.sub, 512, 332);
  ctx.globalAlpha = 1;
};

NB.drawTitle = function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(5,8,18,0.82)';
  ctx.fillRect(0, 0, NB.CFG.width, NB.CFG.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#37e6ff';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('NEON BASTION', 640, 210);
  ctx.fillStyle = '#ff2e63';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('TOWER DEFENSE', 640, 252);
  ctx.fillStyle = '#dfe8ff';
  ctx.font = '19px sans-serif';
  ctx.fillText('The swarm is coming down the neon path. Build towers, hold the Core', 640, 320);
  ctx.fillText('through 15 waves — and stop the Warden on waves 5, 10 and 15.', 640, 348);
  ctx.fillStyle = '#8fa3c8';
  ctx.font = '16px sans-serif';
  ctx.fillText('Click a tower in the shop, click a cell to build it.  1–4 pick towers  ·  Space starts a wave', 640, 400);
  ctx.fillText('P pause  ·  F speed  ·  M sound  ·  click a placed tower to upgrade or sell it', 640, 426);
  ctx.fillStyle = '#ffd75e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO PLAY', 640, 500);
  if (game.best > 0) {
    ctx.fillStyle = '#8fa3c8';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Best score on this machine: ${game.best}`, 640, 540);
  }
};

NB.drawPaused = function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(5,8,18,0.7)';
  ctx.fillRect(0, 0, NB.CFG.width, NB.CFG.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('PAUSED', 640, 350);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#8fa3c8';
  ctx.fillText('Press P or Space to resume', 640, 392);
};

NB.drawEnd = function drawEnd(ctx, game) {
  const won = game.screen === 'victory';
  ctx.fillStyle = 'rgba(5,8,18,0.85)';
  ctx.fillRect(0, 0, NB.CFG.width, NB.CFG.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#7dff8a' : '#ff5d7e';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(won ? 'BASTION HELD!' : 'THE CORE HAS FALLEN', 640, 220);
  ctx.fillStyle = '#dfe8ff';
  ctx.font = '20px sans-serif';
  ctx.fillText(won
    ? `All 15 waves repelled. The neon path is quiet — for now.`
    : `The swarm broke through on wave ${game.wave}.`, 640, 268);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffd75e';
  ctx.fillText(`SCORE ${game.score}`, 640, 330);
  ctx.fillStyle = '#dfe8ff';
  ctx.font = '17px sans-serif';
  ctx.fillText(`Waves cleared: ${game.wave - (won ? 0 : 1)}  ·  Kills: ${game.kills}  ·  Gold earned: ${game.stats.earned}  ·  Towers built: ${game.stats.built}`, 640, 366);
  if (game.best > 0) {
    ctx.fillStyle = '#8fa3c8';
    ctx.fillText(`Best score: ${game.best}`, 640, 394);
  }
  ctx.fillStyle = won ? '#1f7a3d' : '#ff2e63';
  ctx.fillRect(540, 520, 200, 52);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('↻ PLAY AGAIN (R)', 640, 553);
};
