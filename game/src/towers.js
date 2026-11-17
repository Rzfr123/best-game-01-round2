// NEON BASTION — towers: building, aiming, firing, upgrading and selling.
// A tower fires at the enemy furthest along the path inside its range.

NB.towerStats = function towerStats(type, level) {
  const def = NB.TOWERS[type];
  const lv = def.levels[level - 1];
  return {
    dmg: lv.dmg,
    rate: lv.rate,
    range: lv.range,
    splash: lv.splash !== undefined ? lv.splash : def.splash,
    slowPct: lv.slowPct !== undefined ? lv.slowPct : def.slowPct,
    slowSecs: def.slowSecs || 0,
  };
};

NB.buildTower = function buildTower(game, type, col, row) {
  const def = NB.TOWERS[type];
  if (!NB.canBuild(game, col, row)) { NB.Audio.error(); return false; }
  if (game.gold < def.cost) { NB.Audio.error(); return false; }
  const p = NB.cellXY(col, row);
  game.gold -= def.cost;
  game.stats.spent += def.cost;
  game.stats.built += 1;
  game.towers.push({
    type, level: 1, col, row, x: p.x, y: p.y,
    cooldown: 0, angle: -Math.PI / 2, invested: def.cost, placedAt: game.time,
  });
  NB.burst(game, p.x, p.y, def.color, 10);
  NB.Audio.upgrade();
  return true;
};

NB.upgradeTower = function upgradeTower(game, tower) {
  const def = NB.TOWERS[tower.type];
  if (tower.level >= 3) return false;
  const cost = def.levels[tower.level].upCost;
  if (game.gold < cost) { NB.Audio.error(); return false; }
  game.gold -= cost;
  game.stats.spent += cost;
  tower.invested += cost;
  tower.level += 1;
  NB.burst(game, tower.x, tower.y, def.color, 16);
  NB.Audio.upgrade();
  return true;
};

NB.sellTower = function sellTower(game, tower) {
  const refund = Math.floor(tower.invested * NB.CFG.sellRefund);
  game.gold += refund;
  game.towers.splice(game.towers.indexOf(tower), 1);
  NB.addText(game, tower.x, tower.y - 24, `+${refund}`, '#ffd75e');
  NB.Audio.coin();
  return refund;
};

// The target that has travelled furthest along the path and is in range.
NB.pickTarget = function pickTarget(game, tower, stats) {
  let best = null;
  for (const e of game.enemies) {
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d <= stats.range + e.r && (!best || e.dist > best.dist)) best = e;
  }
  return best;
};

NB.updateTowers = function updateTowers(game, dt) {
  for (const t of game.towers) {
    t.cooldown -= dt;
    const stats = NB.towerStats(t.type, t.level);
    const target = NB.pickTarget(game, t, stats);
    if (!target) continue;
    t.angle = Math.atan2(target.y - t.y, target.x - t.x);
    if (t.cooldown > 0) continue;
    t.cooldown = 1 / stats.rate;
    if (t.type === 'railgun') {
      NB.beam(game, t, target, stats);
      NB.damageEnemy(game, target, stats.dmg);
      NB.Audio.railgun();
    } else if (t.type === 'cannon') {
      NB.shell(game, t, target, stats);
      NB.Audio.cannon();
    } else if (t.type === 'frost') {
      NB.shard(game, t, target, stats);
      NB.Audio.frost();
    } else {
      NB.bolt(game, t, target, stats);
      NB.Audio.shoot();
    }
  }
};
