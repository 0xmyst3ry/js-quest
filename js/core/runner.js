// Main-thread side of the sandbox. Every run gets a brand-new Web Worker that
// is terminated afterwards, so state can't leak between runs and a hung
// `while (true) {}` can always be killed by the watchdog timer.

export const HARD_TIMEOUT_MS = 4000;

const TIMEOUT_RESULT = (ms) => ({
  status: 'timeout',
  passed: 0,
  total: 0,
  tests: [],
  logs: [],
  error: {
    name: 'TimeoutError',
    message: `Your code ran for more than ${ms / 1000} seconds and was stopped. Is there an infinite loop?`,
  },
  dom: null,
});

const FAILURE_RESULT = (message) => ({
  status: 'error',
  passed: 0,
  total: 0,
  tests: [],
  logs: [],
  error: { name: 'SandboxError', message },
  dom: null,
});

const defaultFactory = () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

/**
 * @param {{ workerFactory?: () => Worker, timeoutMs?: number }} [options]
 * @returns {(args: { challengeId: string, code: string }) => Promise<object>}
 */
export function createRunner({ workerFactory = defaultFactory, timeoutMs = HARD_TIMEOUT_MS } = {}) {
  let counter = 0;
  return function run({ challengeId, code }) {
    return new Promise((resolve) => {
      let worker;
      let timer;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          worker?.terminate();
        } catch {
          /* already gone */
        }
        resolve(value);
      };
      try {
        worker = workerFactory();
      } catch (err) {
        finish(FAILURE_RESULT(`Could not start the sandbox: ${err?.message ?? err}. Serve the site over http(s) rather than opening the file directly.`));
        return;
      }
      const id = ++counter;
      worker.onmessage = (event) => {
        const data = event.data ?? {};
        if (data.ready) {
          worker.postMessage({ id, challengeId, code });
        } else if (data.id === id) {
          finish(data.ok ? data.result : FAILURE_RESULT(data.error));
        }
      };
      worker.onerror = (event) => {
        event.preventDefault?.();
        finish(FAILURE_RESULT(`The sandbox crashed: ${event.message || 'unknown error'}`));
      };
      timer = setTimeout(() => finish(TIMEOUT_RESULT(timeoutMs)), timeoutMs);
    });
  };
}
