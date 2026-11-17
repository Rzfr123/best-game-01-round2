// NEON BASTION — projectiles, beams, explosions, particles and floating text.
// All the juice: nothing here changes the rules, it only shows them.

NB.bolt = function bolt(game, tower, target, stats) {
  game.projectiles.push({
    kind: 'bolt', x: tower.x, y: tower.y, target,
    speed: 520, dmg: stats.dmg, color: NB.TOWERS[tower.type].color, r: 4,
  });
};

NB.shard = function shard(game, tower, target, stats) {
  game.projectiles.push({
    kind: 'shard', x: tower.x, y: tower.y, target,
    speed: 420, dmg: stats.dmg, color: '#8fd8ff', r: 5,
    slowPct: stats.slowPct, slowSecs: stats.slowSecs,
  });
};

NB.shell = function shell(game, tower, target, stats) {
  game.projectiles.push({
    kind: 'shell', x: tower.x, y: tower.y,
    tx: target.x, ty: target.y, target,
    speed: 300, dmg: stats.dmg, splash: stats.splash, color: '#ffb02e', r: 7,
  });
};

// A railgun beam hits instantly and draws a fading lance for a few frames.
NB.beam = function beam(game, tower, target, stats) {
  game.beams.push({ x0: tower.x, y0: tower.y, x1: target.x, y1: target.y, life: 0.14, max: 0.14 });
  NB.burst(game, target.x, target.y, '#ff5d7e', 8);
  void stats;
};

NB.burst = function burst(game, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const a = NB.rand() * Math.PI * 2;
    const sp = NB.randRange(40, 180);
    game.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: NB.randRange(0.25, 0.6), max: 0.6, color, r: NB.randRange(2, 4.5),
    });
  }
};

NB.addText = function addText(game, x, y, text, color) {
  game.texts.push({ x, y, text, color, life: 0.9, max: 0.9 });
};

NB.updateProjectiles = function updateProjectiles(game, dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i -= 1) {
    const p = game.projectiles[i];
    // The target may already be dead: shells keep flying to where it was.
    const tx = p.target && game.enemies.includes(p.target) ? p.target.x : (p.tx !== undefined ? p.tx : (p.target ? p.target.x : p.x));
    const ty = p.target && game.enemies.includes(p.target) ? p.target.y : (p.ty !== undefined ? p.ty : (p.target ? p.target.y : p.y));
    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step + (p.target ? p.target.r : 4)) {
      if (p.kind === 'shell') {
        NB.explode(game, tx, ty, p.dmg, p.splash);
      } else if (p.target && game.enemies.includes(p.target)) {
        if (p.kind === 'shard') {
          p.target.slowUntil = game.time + p.slowSecs;
          p.target.slowPct = p.slowPct;
        }
        NB.damageEnemy(game, p.target, p.dmg);
        NB.burst(game, tx, ty, p.color, 3);
      }
      game.projectiles.splice(i, 1);
      continue;
    }
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
  }
  // Splash: every enemy near the blast takes the shell's damage.
  // (explode is called from the shell's impact above.)
  for (let i = game.beams.length - 1; i >= 0; i -= 1) {
    game.beams[i].life -= dt;
    if (game.beams[i].life <= 0) game.beams.splice(i, 1);
  }
  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const pt = game.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= 0.92; pt.vy *= 0.92;
    if (pt.life <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.texts.length - 1; i >= 0; i -= 1) {
    const t = game.texts[i];
    t.life -= dt; t.y -= 28 * dt;
    if (t.life <= 0) game.texts.splice(i, 1);
  }
  game.shake = Math.max(0, game.shake - dt * 30);
};

NB.explode = function explode(game, x, y, dmg, splash) {
  NB.burst(game, x, y, '#ffb02e', 18);
  NB.burst(game, x, y, '#ff6b6b', 10);
  game.shake = Math.max(game.shake, 4);
  const hit = [];
  for (const e of game.enemies) {
    if (Math.hypot(e.x - x, e.y - y) <= splash + e.r) hit.push(e);
  }
  // Damage the closest first so the list stays stable as enemies die.
  hit.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  for (const e of hit) NB.damageEnemy(game, e, dmg);
};
