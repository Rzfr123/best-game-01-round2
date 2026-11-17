// NEON BASTION — input: mouse and keyboard. One layout table drives both the
// drawing (render.js) and the hit-testing here, so buttons never drift apart.

NB.Layout = {
  sidebarX: 1024,
  startBtn: { x: 1036, y: 66, w: 232, h: 44 },
  speedBtn: { x: 1036, y: 118, w: 74, h: 30 },
  pauseBtn: { x: 1118, y: 118, w: 74, h: 30 },
  muteBtn: { x: 1200, y: 118, w: 68, h: 30 },
  cardY: 180, cardH: 92, cardGap: 6, cardX: 1036, cardW: 232,
  panelY: 574, panelH: 126,
  upgradeBtn: { x: 1036, y: 652, w: 112, h: 36 },
  sellBtn: { x: 1156, y: 652, w: 112, h: 36 },
};

NB.cardRect = function cardRect(i) {
  const L = NB.Layout;
  return { x: L.cardX, y: L.cardY + i * (L.cardH + L.cardGap), w: L.cardW, h: L.cardH };
};

NB.inRect = function inRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
};

NB.attachInput = function attachInput(game, canvas, api) {
  function pos(evt) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - r.left) / r.width) * NB.CFG.width,
      y: ((evt.clientY - r.top) / r.height) * NB.CFG.height,
    };
  }
  function gridCell(x, y) {
    const col = Math.floor(x / NB.CFG.cell);
    const row = Math.floor((y - NB.CFG.hudHeight) / NB.CFG.cell);
    if (col < 0 || col >= NB.CFG.gridCols || row < 0 || row >= NB.CFG.gridRows) return null;
    return { col, row };
  }

  canvas.addEventListener('mousemove', (evt) => {
    const p = pos(evt);
    game.hover = gridCell(p.x, p.y);
    game.mouse = p;
  });
  canvas.addEventListener('mouseleave', () => { game.hover = null; game.mouse = null; });

  canvas.addEventListener('click', (evt) => {
    const p = pos(evt);
    NB.Audio.ensure();
    api.click(game, p.x, p.y);
  });

  window.addEventListener('keydown', (evt) => {
    if (evt.repeat) return;
    const k = evt.key.toLowerCase();
    if (k === '1' || k === '2' || k === '3' || k === '4') {
      const type = NB.TOWER_ORDER[Number(k) - 1];
      if (game.screen === 'playing') { game.buildType = game.buildType === type ? null : type; game.selected = null; }
    } else if (k === 'escape') {
      game.buildType = null; game.selected = null;
    } else if (k === ' ') {
      evt.preventDefault();
      if (game.screen === 'title') api.start(game);
      else if (game.screen === 'playing') api.startWave(game);
      else if (game.screen === 'paused') api.resume(game);
    } else if (k === 'p') {
      if (game.screen === 'playing') api.pause(game);
      else if (game.screen === 'paused') api.resume(game);
    } else if (k === 'f') {
      game.speed = game.speed === 1 ? 2 : 1;
    } else if (k === 'm') {
      game.muted = !game.muted; NB.Audio.muted = game.muted;
    } else if (k === 'enter') {
      if (game.screen === 'title') api.start(game);
      else if (game.screen === 'victory' || game.screen === 'defeat') api.restart(game);
    } else if (k === 'r') {
      if (game.screen === 'victory' || game.screen === 'defeat') api.restart(game);
    }
  });
};

// The click rules, shared by mouse input and the autopilot scenes.
NB.clickAt = function clickAt(game, x, y) {
  const L = NB.Layout;
  if (game.screen === 'title') { return 'start'; }
  if (game.screen === 'victory' || game.screen === 'defeat') {
    if (NB.inRect(x, y, { x: 540, y: 520, w: 200, h: 52 })) return 'restart';
    return null;
  }
  if (game.screen !== 'playing' && game.screen !== 'paused') return null;
  if (NB.inRect(x, y, L.startBtn)) return 'wave';
  if (NB.inRect(x, y, L.speedBtn)) return 'speed';
  if (NB.inRect(x, y, L.pauseBtn)) return game.screen === 'playing' ? 'pause' : 'resume';
  if (NB.inRect(x, y, L.muteBtn)) return 'mute';
  for (let i = 0; i < NB.TOWER_ORDER.length; i += 1) {
    if (NB.inRect(x, y, NB.cardRect(i))) return { card: NB.TOWER_ORDER[i] };
  }
  if (game.selected) {
    if (NB.inRect(x, y, L.upgradeBtn)) return 'upgrade';
    if (NB.inRect(x, y, L.sellBtn)) return 'sell';
  }
  const col = Math.floor(x / NB.CFG.cell);
  const row = Math.floor((y - NB.CFG.hudHeight) / NB.CFG.cell);
  if (col >= 0 && col < NB.CFG.gridCols && row >= 0 && row < NB.CFG.gridRows) {
    return { cell: { col, row } };
  }
  return null;
};
