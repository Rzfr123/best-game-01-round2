// NEON BASTION — configuration: the board, the path, towers, enemies and waves.
// Every number the game balances on lives here, so tuning never touches logic.
const NB = window.NB || (window.NB = {});

NB.CFG = {
  width: 1280,
  height: 720,
  hudHeight: 56,
  cell: 64,
  gridCols: 16,
  gridRows: 9,
  sidebarX: 1024,
  startGold: 220,
  startLives: 20,
  maxWaves: 15,
  sellRefund: 0.7,
  // Path waypoints in grid cells (x, y); enemies walk them in order, then leave right.
  path: [
    [-1, 1], [13, 1], [13, 4], [2, 4], [2, 7], [15, 7], [16, 7],
  ],
};

// Tower types: cost, damage, shots per second, range px, and per-level upgrades.
// Level costs are paid on top of the base price; level 3 is the cap.
NB.TOWERS = {
  pulse: {
    name: 'PULSE', color: '#37e6ff', desc: 'Fast blaster. Cheap, rapid.',
    cost: 50,
    levels: [
      { dmg: 12, rate: 2.5, range: 130 },
      { dmg: 20, rate: 3.0, range: 140, upCost: 40 },
      { dmg: 34, rate: 3.5, range: 150, upCost: 70 },
    ],
  },
  frost: {
    name: 'FROST', color: '#8fd8ff', desc: 'Chills enemies, slows the pack.',
    cost: 75, slowPct: 0.45, slowSecs: 1.2,
    levels: [
      { dmg: 4, rate: 1.2, range: 120 },
      { dmg: 7, rate: 1.5, range: 135, upCost: 60, slowPct: 0.55 },
      { dmg: 12, rate: 1.8, range: 150, upCost: 90, slowPct: 0.65 },
    ],
  },
  cannon: {
    name: 'CANNON', color: '#ffb02e', desc: 'Lobs shells. Splash damage.',
    cost: 100, splash: 55,
    levels: [
      { dmg: 45, rate: 0.7, range: 115 },
      { dmg: 75, rate: 0.85, range: 125, upCost: 80, splash: 65 },
      { dmg: 120, rate: 1.0, range: 135, upCost: 130, splash: 80 },
    ],
  },
  railgun: {
    name: 'RAILGUN', color: '#ff5d7e', desc: 'Long-range lance. Huge damage.',
    cost: 150,
    levels: [
      { dmg: 110, rate: 0.45, range: 280 },
      { dmg: 190, rate: 0.55, range: 300, upCost: 120 },
      { dmg: 320, rate: 0.65, range: 320, upCost: 190 },
    ],
  },
};
NB.TOWER_ORDER = ['pulse', 'frost', 'cannon', 'railgun'];

// Enemy types: speed px/s, base hp, gold on kill, lives lost on leak, radius, score.
NB.ENEMIES = {
  drone:   { name: 'DRONE',   color: '#ff6b6b', speed: 95,  hp: 30,   gold: 6,   lives: 1, r: 11, score: 10 },
  crawler: { name: 'CRAWLER', color: '#ffb02e', speed: 60,  hp: 60,   gold: 8,   lives: 1, r: 14, score: 15 },
  tank:    { name: 'TANK',    color: '#b388ff', speed: 35,  hp: 220,  gold: 16,  lives: 2, r: 18, score: 30 },
  swarmer: { name: 'SWARMER', color: '#7dff8a', speed: 110, hp: 14,   gold: 3,   lives: 1, r: 8,  score: 5 },
  boss:    { name: 'WARDEN',  color: '#ff2e63', speed: 28,  hp: 2500, gold: 150, lives: 5, r: 26, score: 500 },
};

// Wave composition: how many of each type spawn on wave n (1-based). Boss waves are 5/10/15.
NB.waveComp = function waveComp(n) {
  const list = [];
  const add = (type, count) => { for (let i = 0; i < count; i += 1) list.push(type); };
  add('drone', 6 + n);
  add('crawler', 2 + Math.floor(n * 0.8));
  if (n >= 3) add('swarmer', 4 + n);
  if (n >= 4) add('tank', Math.floor(n * 0.7));
  if (n === 5 || n === 10 || n === 15) add('boss', 1);
  // Shuffle the mix with a seeded shuffle done by the spawner, so the order varies.
  return list;
};

// Enemy hp scales with the wave: tougher the deeper you go.
NB.enemyHp = function enemyHp(type, wave) {
  const base = NB.ENEMIES[type].hp;
  return Math.round(base * (1 + 0.22 * (wave - 1)) + wave * 8);
};

NB.waveClearBonus = function waveClearBonus(wave) { return 30 + wave * 5; };
