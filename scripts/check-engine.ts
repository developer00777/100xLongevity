import { assess, EXAMPLE, TIERS } from '../src/engine/engine';
const A = assess(EXAMPLE);
const ok = A.tier !== null && TIERS[A.tier] === '70X' && A.program === 'Foundation Program' && A.target?.t === '80X' && A.conf === 'Moderate' && A.bott?.text === 'Metabolic health and Inflammation' && A.meal?.kcal === 2500;
console.log(TIERS[A.tier!], A.program, A.target?.t, A.conf, A.bott?.text, A.meal?.kcal, 'markers', A.n);
if (!ok) { console.error('Example assessment does not match the expected result'); process.exit(1); }
console.log('Engine check passed');
