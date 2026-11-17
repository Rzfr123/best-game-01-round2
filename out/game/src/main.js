// NEON BASTION — the main loop: boot, the state machine, one fixed update step
// and the render call. The game is plain Canvas 2D, keyboard + mouse, no network.

NB.step = function step(game, dt) {
  game.time += dt;
  if (game.banner && game.time > game.banner.until) game.banner = null;
  NB.updateEnemies(game, dt);
  if (game.screen !== 'playing') return;
  NB.updateTowers(game, dt);
  NB.updateProjectiles(game, dt);
};

NB.boot = function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const game = NB.newGame();
  try { game.best = Number(window.localStorage.getItem('neon-bastion-best') || 0); } catch (e) { game.best = 0; }
  window.__game = game;

  const api = {
    start(g) { g.screen = 'playing'; NB.Audio.ensure(); },
    startWave(g) { if (g.screen === 'playing') NB.startWave(g); },
    pause(g) { if (g.screen === 'playing') g.screen = 'paused'; },
    resume(g) { if (g.screen === 'paused') g.screen = 'playing'; },
    restart(g) {
      const fresh = NB.newGame();
      fresh.best = g.best;
      fresh.muted = g.muted;
      Object.keys(fresh).forEach((k) => { g[k] = fresh[k]; });
      g.screen = 'playing';
    },
    click(g, x, y) {
      const hit = NB.clickAt(g, x, y);
      if (hit === 'start') { api.start(g); return; }
      if (hit === 'restart') { api.restart(g); return; }
      if (hit === 'wave') { api.startWave(g); return; }
      if (hit === 'speed') { g.speed = g.speed === 1 ? 2 : 1; return; }
      if (hit === 'pause') { api.pause(g); return; }
      if (hit === 'resume') { api.resume(g); return; }
      if (hit === 'mute') { g.muted = !g.muted; NB.Audio.muted = g.muted; return; }
      if (hit && hit.card) { g.buildType = g.buildType === hit.card ? null : hit.card; g.selected = null; return; }
      if (hit === 'upgrade' && g.selected) {
        const t = NB.towerAt(g, g.selected.col, g.selected.row);
        if (t) NB.upgradeTower(g, t);
        return;
      }
      if (hit === 'sell' && g.selected) {
        const t = NB.towerAt(g, g.selected.col, g.selected.row);
        if (t) { NB.sellTower(g, t); g.selected = null; }
        return;
      }
      if (hit && hit.cell) {
        const { col, row } = hit.cell;
        if (g.buildType) {
          if (NB.buildTower(g, g.buildType, col, row)) g.buildType = null;
        } else {
          g.selected = NB.towerAt(g, col, row) ? { col, row } : null;
        }
      }
    },
  };

  NB.attachInput(game, canvas, api);

  // Screenshot scenes (?shot=title|play|upgrade|victory) render one real frame
  // and stop: the capture is the game itself, mid-rules, at a fixed seed.
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    const seed = Number(params.get('seed') || 1);
    NB.runShot(game, shot, seed);
    NB.draw(ctx, game);
    return;
  }

  // Soak mode (?soak=1): the autopilot plays the whole game live, so a headless
  // run can watch 120 seconds of it for errors.
  const soak = params.get('soak') === '1';
  if (soak) {
    NB.setSeed(Number(params.get('seed') || 7));
    NB.Audio.muted = true;
    api.start(game);
  }

  let last = performance.now();
  let pilotTimer = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (soak) {
      pilotTimer += dt;
      if (pilotTimer >= 0.5) { pilotTimer = 0; if (game.screen === 'playing') NB.autopilotStep(game); }
      if (game.screen === 'victory' || game.screen === 'defeat') {
        // Keep the loop alive but idle on the end screen, so the soak watches it too.
      }
    }
    if (game.screen === 'playing') {
      NB.step(game, dt * game.speed);
    }
    NB.draw(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

document.addEventListener('DOMContentLoaded', NB.boot);
