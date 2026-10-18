// Web Worker entry point. The page sends { id, challengeId, code }; the worker
// looks the challenge up in its own copy of the catalog (so test definitions
// never travel through the page) and replies with a serialisable result.

import { runChallenge } from './engine.js';
import { getChallenge } from '../data/catalog.js';

self.onmessage = async (event) => {
  const { id, challengeId, code } = event.data ?? {};
  const challenge = getChallenge(challengeId);
  try {
    if (!challenge) throw new Error(`Unknown challenge "${challengeId}"`);
    const result = await runChallenge({ code, challenge });
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message ?? err) });
  }
};

self.postMessage({ ready: true });
