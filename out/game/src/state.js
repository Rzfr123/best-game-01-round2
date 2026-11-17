// NEON BASTION — the game state: gold, lives, score, waves, towers and enemies.
// One object holds a whole game; starting a new game means making a fresh one.

NB.newGame = function newGame() {
  return {
    screen: 'title', // title | playing | paused | victory | defeat
    gold: NB.CFG.startGold,
    lives: NB.CFG.startLives,
    score: 0,
    wave: 0,
    kills: 0,
    leaked: 0,
    time: 0,
    speed: 1,
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    spawnGap: 0.55,
    towers: [], // {type, level, col, row, x, y, cooldown, angle, invested}
    enemies: [], // {type, hp, maxHp, x, y, wp, speed, slowUntil, slowPct, r, dist}
    projectiles: [],
    beams: [],
    particles: [],
    texts: [],
    shake: 0,
    selected: null, // {col, row} tower being inspected, or null
    buildType: null, // tower type the player is about to place, or null
    hover: null, // {col, row} grid cell under the mouse, or null
    banner: null, // {text, sub, until} big centre announcement
    waveCountdown: 0,
    best: 0,
    muted: false,
    stats: { earned: 0, spent: 0, built: 0, sold: 0 },
  };
};

// Grid helpers: pixel centre of a cell, and whether a cell can hold a tower.
NB.cellXY = function cellXY(col, row) {
  return { x: col * NB.CFG.cell + NB.CFG.cell / 2, y: NB.CFG.hudHeight + row * NB.CFG.cell + NB.CFG.cell / 2 };
};

NB.pathCells = function pathCells() {
  const cells = new Set();
  const pts = NB.CFG.path;
  for (let i = 0; i < pts.length - 1; i += 1) {
    let [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    while (x0 !== x1 || y0 !== y1) {
      if (x0 >= 0 && x0 < NB.CFG.gridCols && y0 >= 0 && y0 < NB.CFG.gridRows) cells.add(`${x0},${y0}`);
      x0 += dx; y0 += dy;
    }
  }
  const last = pts[pts.length - 1];
  void last;
  return cells;
};
NB.PATH_SET = NB.pathCells();

NB.onPath = function onPath(col, row) { return NB.PATH_SET.has(`${col},${row}`); };

NB.towerAt = function towerAt(game, col, row) {
  return game.towers.find((t) => t.col === col && t.row === row) || null;
};

NB.canBuild = function canBuild(game, col, row) {
  if (col < 0 || col >= NB.CFG.gridCols || row < 0 || row >= NB.CFG.gridRows) return false;
  if (NB.onPath(col, row)) return false;
  if (NB.towerAt(game, col, row)) return false;
  return true;
};

// Waypoints in pixels, from the cell path (used by enemies).
NB.waypoints = function waypoints() {
  return NB.CFG.path.map(([c, r]) => NB.cellXY(c, r));
};
