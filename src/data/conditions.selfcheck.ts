// Run: npx tsx src/data/conditions.selfcheck.ts
import { matchSymptomQuery } from './conditions';

const options = [
  { id: 'back-pain', label: 'Back Pain', conditions: ['Musculoskeletal / Orthopedic'] },
  { id: 'knee-injury', label: 'Knee Injury', conditions: ['Sports Injuries'] },
  { id: 'sciatica', label: 'Sciatica', conditions: ['Musculoskeletal / Orthopedic'] },
];

let passed = 0;
let failed = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

const kind = (q: string) => {
  const m = matchSymptomQuery(q, options);
  return m ? { id: m.item.id, kind: m.kind } : null;
};

check('exact label', kind('back pain'), { id: 'back-pain', kind: 'exact' });
check('exact ignores case/punctuation', kind('Back Pain!'), { id: 'back-pain', kind: 'exact' });
check('sentence containing label', kind('i have back pain in the morning'), { id: 'back-pain', kind: 'partial' });
check('specialty keyword contained', kind('something musculoskeletal orthopedic'), { id: 'back-pain', kind: 'partial' });
check('partial word picks shortest label', kind('back'), { id: 'back-pain', kind: 'partial' });
check('typo within distance', kind('bakc pain'), { id: 'back-pain', kind: 'fuzzy' });
check('typo short label', kind('sciatca'), { id: 'sciatica', kind: 'fuzzy' });
check('near-miss phrase', kind('knee injry'), { id: 'knee-injury', kind: 'fuzzy' });
check('garbage rejected', kind('xyzzyplughqwerty'), null);
check('too short rejected', kind('ok'), null);
check('empty rejected', kind('   '), null);

console.log(`\n${passed}/${passed + failed} passed`);
if (failed > 0) throw new Error(`${failed} check(s) failed`);
