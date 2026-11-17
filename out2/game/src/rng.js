// NEON BASTION — seeded random numbers (mulberry32), so screenshot scenes and
// the soak test play the same way every run while real games stay unpredictable.

NB.mulberry32 = function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// The game's live RNG. Seeded per game from Date.now() unless a demo/shot scene
// sets it, so replays of a scene are byte-stable for screenshots.
NB.rng = Math.random;
NB.setSeed = function setSeed(seed) { NB.rng = NB.mulberry32(seed); };
NB.rand = function rand() { return NB.rng(); };
NB.randRange = function randRange(min, max) { return min + NB.rng() * (max - min); };
NB.pick = function pick(list) { return list[Math.floor(NB.rng() * list.length)]; };
