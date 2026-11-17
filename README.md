# NEON BASTION — Tower Defense

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Rzfr123/best-game-01-round2/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Rzfr123/best-game-01-round2/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A neon tower defense in plain Canvas 2D. The swarm marches down a glowing
path toward your Core: build Pulse, Frost, Cannon and Railgun towers on the
grid, upgrade them, sell them, and hold the line through 15 waves — the
Warden bosses arrive on waves 5, 10 and 15.

## How it plays

- Click a tower in the shop (or press 1–4), then click a grid cell to build it.
- Towers fire on their own at the enemy furthest along the path. Click a
  placed tower to upgrade it (3 levels) or sell it back for 70%.
- Press Space to start a wave, P to pause, F for ×2 speed, M to mute.
- Enemies that reach the Core cost lives. Lose all 20 and the Core falls;
  clear wave 15 and the Bastion stands.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no assets to download: the game is
static files under `game/`, and its sound is synthesized live with WebAudio.
