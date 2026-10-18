// Checks the challenge catalog: schema, unique ids, reference solutions pass,
// and starter code does NOT pass. Run with `npm run validate`.
import { validateCatalog } from '../js/core/validate.js';
import { catalog } from '../js/data/catalog.js';

const problems = await validateCatalog(catalog);
if (problems.length) {
  console.error(`✖ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✔ ${catalog.challenges.length} challenges in ${catalog.worlds.length} worlds are valid`);
