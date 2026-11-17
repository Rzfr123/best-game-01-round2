// NEON BASTION — enemies: spawning a wave, walking the path, taking damage,
// leaking into the Bastion. Bosses arrive on waves 5, 10 and 15.

NB.startWave = function startWave(game) {
  if (game.waveActive || game.wave >= NB.CFG.maxWaves) return false;
  game.wave += 1;
  const comp = NB.waveComp(game.wave);
  // Shuffle the spawn order (seeded when a shot scene sets the seed).
  for (let i = comp.length - 1; i > 0; i -= 1) {
    const j = Math.floor(NB.rand() * (i + 1));
    const tmp = comp[i]; comp[i] = comp[j]; comp[j] = tmp;
  }
  game.spawnQueue = comp;
  game.spawnTimer = 0.4;
  game.spawnGap = Math.max(0.28, 0.6 - game.wave * 0.015);
  game.waveActive = true;
  game.banner = { text: `WAVE ${game.wave}`, sub: game.wave % 5 === 0 ? 'WARDEN INBOUND' : `${comp.length} hostiles on the path`, until: game.time + 2.2 };
  NB.Audio.waveHorn();
  return true;
};

NB.spawnEnemy = function spawnEnemy(game, type) {
  const def = NB.ENEMIES[type];
  const hp = NB.enemyHp(type, game.wave);
  const start = NB.cellXY(NB.CFG.path[0][0], NB.CFG.path[0][1]);
  game.enemies.push({
    type, hp, maxHp: hp,
    x: start.x, y: start.y,
    wp: 1,
    speed: def.speed * NB.randRange(0.95, 1.05),
    slowUntil: 0, slowPct: 0,
    r: def.r,
    dist: 0,
    flash: 0,
    wobble: NB.rand() * Math.PI * 2,
  });
};

NB.updateEnemies = function updateEnemies(game, dt) {
  const wps = NB.waypoints();
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const e = game.enemies[i];
    e.flash = Math.max(0, e.flash - dt * 6);
    // Slow wears off on its own clock.
    const slowed = game.time < e.slowUntil;
    const speed = e.speed * (slowed ? (1 - e.slowPct) : 1);
    let move = speed * dt;
    while (move > 0 && e.wp < wps.length) {
      const target = wps[e.wp];
      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d <= move) {
        e.x = target.x; e.y = target.y;
        e.wp += 1; move -= d; e.dist += d;
      } else {
        e.x += (dx / d) * move; e.y += (dy / d) * move;
        e.dist += move; move = 0;
      }
    }
    if (e.wp >= wps.length) {
      // Reached the Bastion: it leaks, lives fall, the screen shakes.
      const def = NB.ENEMIES[e.type];
      game.lives -= def.lives;
      game.leaked += 1;
      game.shake = Math.max(game.shake, e.type === 'boss' ? 14 : 8);
      NB.Audio.leak();
      NB.addText(game, e.x - 20, e.y - 30, `-${def.lives} ♥`, '#ff5d7e');
      NB.burst(game, e.x, e.y, '#ff5d7e', 14);
      game.enemies.splice(i, 1);
      if (game.lives <= 0) {
        game.lives = 0;
        NB.endGame(game, false);
      }
    }
  }
  // Spawning trickles the queue in while the wave runs.
  if (game.waveActive && game.spawnQueue.length > 0) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      NB.spawnEnemy(game, game.spawnQueue.shift());
      game.spawnTimer = game.spawnGap;
    }
  }
  // Wave cleared when nothing is left to spawn or fight.
  if (game.waveActive && game.spawnQueue.length === 0 && game.enemies.length === 0) {
    game.waveActive = false;
    const bonus = NB.waveClearBonus(game.wave);
    game.gold += bonus;
    game.stats.earned += bonus;
    game.score += 100 * game.wave;
    game.banner = { text: 'WAVE CLEARED', sub: `+${bonus} gold bonus`, until: game.time + 2.0 };
    NB.Audio.coin();
    if (game.wave >= NB.CFG.maxWaves) NB.endGame(game, true);
  }
};

NB.damageEnemy = function damageEnemy(game, e, dmg) {
  e.hp -= dmg;
  e.flash = 1;
  if (e.hp <= 0) {
    const def = NB.ENEMIES[e.type];
    const idx = game.enemies.indexOf(e);
    if (idx !== -1) game.enemies.splice(idx, 1);
    game.gold += def.gold;
    game.stats.earned += def.gold;
    game.score += def.score + game.wave * 2;
    game.kills += 1;
    NB.addText(game, e.x, e.y - e.r - 6, `+${def.gold}`, '#ffd75e');
    NB.burst(game, e.x, e.y, def.color, e.type === 'boss' ? 40 : 12);
    if (e.type === 'boss') { game.shake = Math.max(game.shake, 12); NB.Audio.cannon(); }
    else NB.Audio.pop();
  }
};

NB.endGame = function endGame(game, won) {
  game.screen = won ? 'victory' : 'defeat';
  game.waveActive = false;
  game.banner = null;
  if (won) {
    const bonus = game.lives * 150;
    game.score += bonus;
    NB.Audio.victory();
  } else {
    NB.Audio.defeat();
  }
  try {
    const best = Number(window.localStorage.getItem('neon-bastion-best') || 0);
    if (game.score > best) window.localStorage.setItem('neon-bastion-best', String(game.score));
    game.best = Math.max(best, game.score);
  } catch (err) { game.best = game.score; }
};
