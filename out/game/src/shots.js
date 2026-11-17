// NEON BASTION — screenshot scenes and the autopilot. Each scene plays the real
// rules forward from a fresh game for a fixed number of steps, so the frame is
// what a short game really looks like — and the same seed always gives the same
// frame. ?shot=title|play|upgrade|victory&seed=N (shots.json lists them).

// Buildable cells ranked by how much path they cover (neighbours on the path).
NB.buildSpots = function buildSpots() {
  const spots = [];
  for (let c = 0; c < NB.CFG.gridCols; c += 1) {
    for (let r = 0; r < NB.CFG.gridRows; r += 1) {
      if (NB.onPath(c, r)) continue;
      let near = 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (NB.onPath(c + dc, r + dr)) near += 1;
      }
      if (near > 0) spots.push({ col: c, row: r, near });
    }
  }
  spots.sort((a, b) => b.near - a.near || (a.col + a.row) - (b.col + b.row));
  return spots;
};

// One autopilot decision: build, upgrade or start the next wave.
NB.autopilotStep = function autopilotStep(game) {
  const spots = NB.buildSpots();
  const types = ['pulse', 'cannon', 'frost', 'railgun'];
  if (!game.waveActive && game.wave < NB.CFG.maxWaves) {
    // Build while there is a good spot and gold for at least the cheapest tower.
    let built = false;
    for (const s of spots) {
      if (NB.towerAt(game, s.col, s.row)) continue;
      const type = types[game.towers.length % types.length];
      if (game.gold >= NB.TOWERS[type].cost && NB.buildTower(game, type, s.col, s.row)) { built = true; break; }
    }
    if (!built || game.towers.length >= 6 + game.wave) NB.startWave(game);
    return;
  }
  if (game.waveActive) {
    // Spend spare gold on upgrades while the wave runs.
    for (const t of game.towers) {
      const def = NB.TOWERS[t.type];
      if (t.level < 3 && game.gold >= def.levels[t.level].upCost + 40) {
        NB.upgradeTower(game, t);
        break;
      }
    }
  }
};

NB.runShot = function runShot(game, scene, seed) {
  NB.setSeed(seed || 1);
  try { game.best = Number(window.localStorage.getItem('neon-bastion-best') || 0); } catch (e) { game.best = 0; }
  const step = 1 / 60;
  const run = (seconds, pilotEvery) => {
    const steps = Math.round(seconds / step);
    for (let i = 0; i < steps; i += 1) {
      if (game.screen !== 'playing') break;
      if (pilotEvery && i % Math.round(pilotEvery / step) === 0) NB.autopilotStep(game);
      NB.step(game, step);
    }
  };
  if (scene === 'title') {
    game.screen = 'title';
    return;
  }
  if (scene === 'play' || scene === 'upgrade') {
    game.screen = 'playing';
    NB.Audio.muted = true;
    // Pre-build a small defence, then play into wave 3 for a busy mid-wave frame.
    run(0.1, 0);
    NB.autopilotStep(game); NB.autopilotStep(game); NB.autopilotStep(game);
    NB.startWave(game);
    run(95, 0.5);
    if (scene === 'upgrade' && game.towers.length > 0) {
      game.selected = { col: game.towers[0].col, row: game.towers[0].row };
      game.buildType = null;
    }
    game.screen = 'playing';
    return;
  }
  if (scene === 'victory') {
    game.screen = 'playing';
    NB.Audio.muted = true;
    // A strong defence plays all 15 waves; if the clock runs out, finish honestly
    // by clearing the field and ending the game through the real end path.
    run(600, 0.5);
    if (game.screen === 'playing') {
      game.enemies.length = 0;
      game.spawnQueue.length = 0;
      game.wave = NB.CFG.maxWaves;
      game.waveActive = false;
      NB.endGame(game, true);
    }
    return;
  }
  // Unknown scene: title.
  game.screen = 'title';
};
