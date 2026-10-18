// The full course catalog. To add a world, create a file in ./challenges/ and
// add it to the list below (see "Adding a challenge" in the README).

import variables from './challenges/01-variables.js';
import operators from './challenges/02-operators.js';
import conditionals from './challenges/03-conditionals.js';
import loops from './challenges/04-loops.js';
import functions from './challenges/05-functions.js';
import arrays from './challenges/06-arrays.js';
import objects from './challenges/07-objects.js';
import strings from './challenges/08-strings.js';
import scope from './challenges/09-scope.js';
import asyncWorld from './challenges/10-async.js';
import dom from './challenges/11-dom.js';

export const worlds = [variables, operators, conditionals, loops, functions, arrays, objects, strings, scope, asyncWorld, dom];

/** Flat, ordered list of challenges; each one remembers its world and position. */
export const challenges = worlds.flatMap((world, wi) =>
  world.challenges.map((c, ci) => ({ ...c, worldId: world.id, worldIndex: wi, indexInWorld: ci })),
);

export const catalog = { worlds, challenges };

const byId = new Map(challenges.map((c) => [c.id, c]));
export const getChallenge = (id) => byId.get(id);
export const getWorld = (id) => worlds.find((w) => w.id === id);
export const nextChallenge = (id) => {
  const i = challenges.findIndex((c) => c.id === id);
  return i >= 0 ? challenges[i + 1] : undefined;
};
export const prevChallenge = (id) => {
  const i = challenges.findIndex((c) => c.id === id);
  return i > 0 ? challenges[i - 1] : undefined;
};
