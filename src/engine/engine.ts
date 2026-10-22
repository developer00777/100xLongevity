/**
 * 100X Longevity scoring engine.
 * Benchmarks come from the 100X Longevity Benchmark Matrix (age-bracketed fitness,
 * objective biomarker ranges). Pure TypeScript — no React Native imports — so it can be
 * unit-tested and reused on a server.
 */

export const TIERS = ['100X', '95X', '90X', '80X', '70X', 'Below 70X'] as const;
export const EQUIV = [
  '100x Longevity', '95x Longevity', '90x Longevity',
  '80x Longevity', '70x Longevity', 'Below 70x Longevity',
] as const;
export const PTS = [100, 95, 90, 80, 70, 60];
export const AGEB = ['20–40', '40–50', '50–60', '60–80', '80+'];

export type TierIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type Sex = 'M' | 'F';
export type DomainId = 'fitness' | 'body' | 'metabolic' | 'cardio' | 'inflam' | 'kl' | 'sleep';
export type State = Record<string, string | boolean | undefined>;

export const DOMAINS: { id: DomainId; name: string; sensitive?: boolean }[] = [
  { id: 'fitness', name: 'Fitness' },
  { id: 'body', name: 'Body Composition' },
  { id: 'metabolic', name: 'Metabolic Health', sensitive: true },
  { id: 'cardio', name: 'Cardiovascular' },
  { id: 'inflam', name: 'Inflammation', sensitive: true },
  { id: 'kl', name: 'Kidney/Liver' },
  { id: 'sleep', name: 'Sleep/Recovery' },
];
const BIO: DomainId[] = ['metabolic', 'cardio', 'inflam', 'kl'];

export const bracket = (a: number) => (a < 40 ? 0 : a < 50 ? 1 : a < 60 ? 2 : a < 80 ? 3 : 4);

type PullStep = { r?: number; h?: number };
const R = (n: number): PullStep => ({ r: n });
const H = (s: number): PullStep => ({ h: s });

const FIT: Record<Sex, { vo2: number[][]; push: (number | null)[][]; pull: PullStep[][]; wall: number[] }> = {
  M: {
    vo2: [[55, 52, 48, 44, 40], [50, 48, 44, 40, 36], [50, 48, 46, 42, 38], [44, 40, 36, 32, 28], [39, 37, 34, 30, 26]],
    push: [[60, 50, 40, 32, 25], [50, 40, 30, 24, 19], [40, 30, 22, 18, 14], [30, 25, 15, 12, 9], [15, 10, 7, 6, 4]],
    pull: [
      [R(20), R(15), R(10), R(8), R(6)], [R(15), R(10), R(5), R(4), R(3)], [R(8), R(7), R(4), R(3), R(2)],
      [R(6), R(5), R(3), R(2), R(1)], [R(4), R(3), R(2), R(1), H(30)],
    ],
    wall: [100, 85, 75, 60, 50],
  },
  F: {
    vo2: [[50, 48, 44, 40, 36], [48, 45, 40, 36, 32], [46, 44, 42, 38, 34], [40, 38, 36, 32, 28], [36, 34, 30, 26, 22]],
    push: [[40, 30, 20, 16, 12], [30, 20, 15, 12, 9], [15, 12, 9, 7, 5], [8, 6, 4, 3, 2], [2, 1, null, null, null]],
    pull: [
      [R(3), R(2), R(1), H(45), H(30)], [R(3), R(2), R(1), H(45), H(30)], [R(2), R(1), H(60), H(40), H(25)],
      [R(1), H(60), H(45), H(30), H(20)], [R(1), H(45), H(30), H(20), H(15)],
    ],
    wall: [65, 55, 45, 38, 30],
  },
};

export function num(v: unknown): number | null {
  if (v === '' || v == null || typeof v === 'boolean') return null;
  const x = Number(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : null;
}
const loT = (v: number, t: number[]): TierIndex => {
  for (let i = 0; i < 5; i++) if (v <= t[i]) return i as TierIndex;
  return 5;
};
const hiT = (v: number, t: (number | null)[]): TierIndex => {
  for (let i = 0; i < 5; i++) { const x = t[i]; if (x != null && v >= x) return i as TierIndex; }
  return 5;
};
export const fmt = (n: number | null | undefined) => {
  if (n == null) return '';
  return Number.isInteger(n) ? String(n) : String(+n.toFixed(2));
};
const loS = (t: number[]) => [...t.map((x) => '≤' + fmt(x)), '>' + fmt(t[4])];
const hiS = (t: (number | null)[]) => [
  ...t.map((x) => (x == null ? 'incline test' : '≥' + fmt(x))),
  t[4] == null ? 'see matrix' : '<' + fmt(t[4]),
];

export type Profile = { age: number | null; sex: Sex | null; h: number | null; w: number | null; waist: number | null; b: number | null };
type ScoreResult = { i: TierIndex | null; note?: string };
export type Marker = {
  id: string; label: string; unit: string; d: DomainId; age?: boolean;
  ranges: (p: Profile & { sex: Sex; b: number }) => string[];
  score: (v: number, p: Profile & { sex: Sex; b: number }, s: State) => ScoreResult;
};

function simple(id: string, label: string, unit: string, d: DomainId, dir: 'lo' | 'hi', t: (p: Profile & { sex: Sex; b: number }) => (number | null)[], extra: Partial<Marker> = {}): Marker {
  return {
    id, label, unit, d,
    ranges: (p) => (dir === 'lo' ? loS(t(p) as number[]) : hiS(t(p))),
    score: (v, p) => ({ i: dir === 'lo' ? loT(v, t(p) as number[]) : hiT(v, t(p)) }),
    ...extra,
  };
}

export const MARKERS: Marker[] = [
  simple('vo2', 'VO2 max', 'ml/kg/min', 'fitness', 'hi', (p) => FIT[p.sex].vo2[p.b], { age: true }),
  simple('push', 'Push-ups', 'reps', 'fitness', 'hi', (p) => FIT[p.sex].push[p.b], {
    age: true,
    score: (v, p) => {
      const t = FIT[p.sex].push[p.b];
      const i = hiT(v, t);
      if (i === 5 && t.includes(null)) return { i: null, note: 'Below 1 rep at 80+: use the incline push-up test from the matrix.' };
      return { i };
    },
  }),
  {
    id: 'pull', label: 'Pull-ups', unit: 'reps', d: 'fitness', age: true,
    ranges: (p) => {
      const t = FIT[p.sex].pull[p.b];
      const o = t.map((x) => (x.r != null ? `≥${x.r} reps` : `≥${x.h} s hang`));
      const l = t[4];
      o.push(l.r != null ? `<${l.r} reps` : `<${l.h} s hang`);
      return o;
    },
    score: (v, p, s) => {
      const t = FIT[p.sex].pull[p.b];
      const hang = num(s.hang);
      for (let i = 0; i < 5; i++) {
        const x = t[i];
        if (x.r != null && v >= x.r) return { i: i as TierIndex };
        if (x.h != null && hang != null && hang >= x.h) return { i: i as TierIndex };
      }
      if (t.some((x) => x.h != null) && hang == null) return { i: null, note: 'Add a dead-hang time to score pull-ups at this age and sex.' };
      return { i: 5 };
    },
  },
  simple('wall', 'Wall sit', 's', 'fitness', 'hi', (p) => FIT[p.sex].wall),

  simple('bf', 'Body fat', '%', 'body', 'lo', (p) => (p.sex === 'M' ? [12, 15, 18, 20, 24] : [22, 25, 28, 30, 33]), {
    score: (v, p) => {
      const t = p.sex === 'M' ? [12, 15, 18, 20, 24] : [22, 25, 28, 30, 33];
      const floor = p.sex === 'M' ? 8 : 18;
      const i = loT(v, t);
      return v < floor ? { i, note: `Below the 100X floor (${floor}%). Review with a qualified professional.` } : { i };
    },
  }),
  simple('waist', 'Waist', 'cm', 'body', 'lo', (p) => (p.sex === 'M' ? [85, 90, 95, 97, 100] : [70, 75, 80, 82, 85])),
  simple('whr', 'Waist-to-hip ratio', '', 'body', 'lo', (p) => (p.sex === 'M' ? [0.9, 0.95, 0.97, 0.98, 1.0] : [0.8, 0.82, 0.85, 0.86, 0.88])),

  simple('glu', 'Fasting glucose', 'mg/dL', 'metabolic', 'lo', () => [82, 85, 94, 98, 105], {
    score: (v) => {
      const i = loT(v, [82, 85, 94, 98, 105]);
      return v < 72 ? { i, note: 'Below the 100X range floor (72). Review with a qualified professional.' } : { i };
    },
  }),
  simple('a1c', 'HbA1c', '%', 'metabolic', 'lo', () => [4.7, 5.0, 5.3, 5.6, 5.9]),
  simple('ins', 'Fasting insulin', 'µU/mL', 'metabolic', 'lo', () => [5, 7, 10, 12, 15]),
  simple('homa', 'HOMA-IR', '', 'metabolic', 'lo', () => [0.8, 1.0, 1.2, 1.4, 1.6]),
  simple('tg', 'Triglycerides', 'mg/dL', 'metabolic', 'lo', () => [45, 60, 74, 90, 110]),

  {
    id: 'bp', label: 'Blood pressure', unit: 'mmHg', d: 'cardio',
    ranges: () => ['≤110/70', '≤115/75', '≤120/80', '≤124/84', '≤129/89', '≥130 or ≥90'],
    score: (_v, _p, s) => {
      const sy = num(s.sbp), di = num(s.dbp);
      let i = 0;
      if (sy != null) i = Math.max(i, loT(sy, [110, 115, 120, 124, 129]));
      if (di != null) i = Math.max(i, loT(di, [70, 75, 80, 84, 89]));
      return { i: i as TierIndex };
    },
  },
  simple('apob', 'ApoB', 'mg/dL', 'cardio', 'lo', () => [70, 100, 120, 130, 150]),
  simple('ldl', 'LDL-C', 'mg/dL', 'cardio', 'lo', () => [55, 75, 100, 115, 130]),
  {
    id: 'hdl', label: 'HDL-C', unit: 'mg/dL', d: 'cardio',
    ranges: () => ['60–79', '50–59', '40–49', '35–39 or 80–85', '30–34 or 86–90', '<30 or >90'],
    score: (v) => {
      let i: TierIndex;
      if (v > 90 || v < 30) i = 5; else if (v > 85) i = 4; else if (v >= 80) i = 3;
      else if (v >= 60) i = 0; else if (v >= 50) i = 1; else if (v >= 40) i = 2; else if (v >= 35) i = 3; else i = 4;
      return { i };
    },
  },

  simple('crp', 'hsCRP', 'mg/L', 'inflam', 'lo', () => [0.2, 0.5, 1.0, 1.5, 2.5]),
  simple('hcy', 'Homocysteine', 'µmol/L', 'inflam', 'lo', () => [6, 8, 10, 15, 20]),
  simple('o3', 'Omega-3 Index', '%', 'inflam', 'hi', () => [9.5, 8, 7, 6, 5]),

  simple('egfr', 'eGFR', 'mL/min', 'kl', 'hi', () => [110, 105, 100, 95, 90]),
  simple('cysc', 'Cystatin C', 'mg/L', 'kl', 'lo', () => [0.84, 1.0, 1.2, 1.5, 2.0]),
  simple('alb', 'Albumin', 'g/dL', 'kl', 'hi', () => [4.8, 4.6, 4.4, 4.3, 4.2]),
  simple('alt', 'ALT', 'IU/L', 'kl', 'lo', () => [20, 25, 30, 40, 50]),
  simple('ast', 'AST', 'IU/L', 'kl', 'lo', () => [20, 25, 30, 40, 50]),
  simple('alp', 'ALP', 'IU/L', 'kl', 'lo', () => [55, 60, 70, 80, 90]),
  simple('ggt', 'GGT', 'IU/L', 'kl', 'lo', () => [20, 25, 30, 40, 50]),
  {
    id: 'bun', label: 'BUN', unit: 'mg/dL', d: 'kl',
    ranges: () => ['11–15', '≤18', '≤20 (or <11)', '≤30', '≤40', '>40'],
    score: (v) => ({ i: v < 11 ? 2 : loT(v, [15, 18, 20, 30, 40]) }),
  },

  simple('rhr', 'Resting heart rate', 'bpm', 'sleep', 'lo', () => [45, 50, 60, 69, 79]),
  simple('hrv', 'HRV', 'ms', 'sleep', 'hi', () => [90, 70, 50, 40, 30]),
];

export const NOT_BENCHMARKED = [
  { id: 'run5k', label: '5K time' },
  { id: 'run15', label: '1.5-mile time' },
  { id: 'sleepH', label: 'Sleep duration' },
  { id: 'steps', label: 'Daily steps' },
  { id: 'train', label: 'Training frequency' },
];

export const EXAMPLE: State = {
  age: '55', sex: 'M', height: '180', height_u: 'cm', weight: '92', weight_u: 'kg', waist: '91', waist_u: 'cm',
  goal: 'body recomposition', activity: 'moderately active',
  glu: '86.9', a1c: '5.5', ins: '17.15', tg: '122', hdl: '37', ldl: '83.77', apob: '76', crp: '2.8', hcy: '14.72',
  egfr: '84', cysc: '1.06', alb: '4.14', alt: '26.3', ast: '21.6', alp: '81.1', ggt: '24.1', bun: '11.7',
};

export function profile(state: State): Profile {
  const age = num(state.age);
  const sex = state.sex === 'M' || state.sex === 'F' ? state.sex : null;
  let h = num(state.height); if (h != null && state.height_u === 'in') h *= 2.54;
  let w = num(state.weight); if (w != null && state.weight_u === 'lb') w *= 0.45359237;
  let waist = num(state.waist); if (waist != null && state.waist_u === 'in') waist *= 2.54;
  return { age, sex, h, w, waist, b: age != null ? bracket(age) : null };
}

export type Scored = { m: Marker; v: number; i: TierIndex; display: string; note?: string };
export type Domain = { id: DomainId; name: string; sensitive?: boolean; ms: Scored[]; i: TierIndex | null };
export type Assessment = ReturnType<typeof assess>;

export function assess(state: State) {
  const p = profile(state);
  const s: State = { ...state, waist: p.waist == null ? '' : String(p.waist) };
  let homaCalc = false;
  if (num(s.homa) == null && num(s.glu) != null && num(s.ins) != null) {
    s.homa = String(+((num(s.glu)! * num(s.ins)!) / 405).toFixed(2));
    homaCalc = true;
  }
  const bpGiven = num(s.sbp) != null || num(s.dbp) != null;
  const scored: Scored[] = [];
  const unscored: { m: Marker; why: string }[] = [];
  const full = p.sex ? { ...p, sex: p.sex, b: p.b ?? 0 } : null;

  for (const m of MARKERS) {
    const needsProfile = m.d === 'fitness' || m.d === 'body';
    let v = m.id === 'bp' ? (bpGiven ? 1 : null) : num(s[m.id]);
    if (m.id === 'pull' && v == null && num(s.hang) != null) v = 0;
    if (v == null) continue;
    if (needsProfile && (!full || (m.age && p.age == null))) { unscored.push({ m, why: 'Needs age and sex' }); continue; }
    const r = m.score(v, full ?? { ...p, sex: 'M', b: 0 }, s);
    if (r.i == null) { unscored.push({ m, why: r.note ?? 'Not scored' }); continue; }
    const display = m.id === 'bp' ? `${s.sbp || '–'}/${s.dbp || '–'}`
      : m.id === 'homa' && homaCalc ? `${fmt(v)} (calculated)`
      : m.id === 'waist' ? fmt(Math.round(v * 10) / 10) : fmt(v);
    scored.push({ m, v, i: r.i, display, note: r.note });
  }

  const doms: Domain[] = DOMAINS.map((d) => {
    const ms = scored.filter((x) => x.m.d === d.id);
    if (!ms.length) return { ...d, ms, i: null };
    const mean = ms.reduce((a, x) => a + PTS[x.i], 0) / ms.length;
    let i = mean >= 97.5 ? 0 : mean >= 92.5 ? 1 : mean >= 85 ? 2 : mean >= 75 ? 3 : mean >= 65 ? 4 : 5;
    const worst = Math.max(...ms.map((x) => x.i));
    if (d.sensitive) i = Math.max(i, worst - 1);
    if (worst === 5) i = Math.max(i, 3);
    return { ...d, ms, i: i as TierIndex };
  });

  const n = scored.length;
  const cnt = (f: (x: Scored) => boolean) => scored.filter(f).length;
  const dI = doms.filter((d) => d.i != null).map((d) => d.i!);
  const allDom = (lim: number) => dI.every((x) => x <= lim);
  let tier: TierIndex | null = null;
  if (n) {
    if (cnt((x) => x.i === 0) > n / 2 && allDom(1)) tier = 0;
    else if (cnt((x) => x.i <= 1) > n / 2 && cnt((x) => x.i === 0) >= 3 && allDom(2)) tier = 1;
    else if (cnt((x) => x.i <= 2) > n / 2 && cnt((x) => x.i === 5) === 0 && allDom(3)) tier = 2;
    else if (cnt((x) => x.i <= 3) > n / 2 && cnt((x) => x.i >= 4) <= 3) tier = 3;
    else if (cnt((x) => x.i <= 4) > n / 2 && cnt((x) => x.i <= 3) >= 1) tier = 4;
    else tier = 5;
  }

  const PROGRAMS = ['Ultra Program', 'Elite Program', 'Elite Program', 'Optimization Program', 'Foundation Program', 'Foundation Program'];
  const TARGETS = [
    { t: 'Beyond 100X', e: '100x+ Longevity', i: null },
    { t: '100X', e: '100x Longevity', i: 0 },
    { t: '95X, then 100X', e: '95x Longevity, then 100x Longevity', i: 1 },
    { t: '90X', e: '90x Longevity', i: 2 },
    { t: '80X', e: '80x Longevity', i: 3 },
    { t: '70X first, then 80X', e: '70x Longevity, then 80x Longevity', i: 4 },
  ] as const;
  const program = tier == null ? null : PROGRAMS[tier];
  const target = tier == null ? null : TARGETS[tier];

  const scoredDoms = doms.filter((d) => d.i != null).map((d) => d.id);
  const hasBio = scoredDoms.some((x) => BIO.includes(x));
  let conf: 'High' | 'Moderate' | 'Low' = 'Low';
  if (hasBio && scoredDoms.includes('fitness') && scoredDoms.includes('body') && scoredDoms.includes('sleep') && scoredDoms.length >= 5) conf = 'High';
  else if ((hasBio && scoredDoms.length >= 2) || scoredDoms.length >= 3) conf = 'Moderate';

  let bott: { text: string; markers: string[]; i: number } | null = null;
  const live = doms.filter((d) => d.i != null);
  if (live.length) {
    const worstI = Math.max(...live.map((d) => d.i!));
    const wd = live.filter((d) => d.i === worstI);
    const names = wd.map((d) => d.name.replace(' Health', ' health'));
    const mk = wd.flatMap((d) => d.ms.filter((x) => x.i >= Math.max(3, worstI)).sort((a, b) => b.i - a.i).map((x) => x.m.label));
    bott = { text: joinList(names), markers: mk, i: worstI };
  }

  const strong = scored.filter((y) => y.i <= 1).length;
  const raises = scored.filter((x) => x.i <= 1 || (x.i === 2 && strong < 3)).sort((a, b) => a.i - b.i).slice(0, 6);
  const lowers = scored.filter((x) => x.i >= 4).sort((a, b) => b.i - a.i);

  const urgent = !!state.urgent || (num(s.sbp) ?? 0) >= 180 || (num(s.dbp) ?? 0) >= 120 || (num(s.glu) ?? 0) >= 250;

  let meal: { base: number; kcal: number } | null = null;
  if (p.w != null) {
    const lv = [1500, 1700, 2000, 2500, 3000];
    const b = p.w < 60 ? 0 : p.w < 70 ? 1 : p.w < 80 ? 2 : p.w <= 100 ? 3 : 4;
    let a = b;
    if (state.goal === 'fat loss') a = Math.max(0, b - 1);
    if (state.goal === 'muscle gain') a = Math.min(4, b + 1);
    meal = { base: lv[b], kcal: lv[a] };
  }

  const missingDoms = doms.filter((d) => d.i == null).map((d) => d.name);
  const pri = ['vo2', 'ins', 'homa', 'tg', 'apob', 'crp', 'hrv', 'bf', 'egfr', 'push', 'hdl', 'hcy', 'whr', 'a1c', 'cysc', 'rhr', 'pull', 'wall', 'ldl', 'o3', 'glu', 'alb'];
  const suggest: string[] = [];
  for (const id of pri) {
    const m = MARKERS.find((x) => x.id === id)!;
    if (!scored.some((x) => x.m.id === id) && !(id === 'homa' && num(s.homa) != null)) suggest.push(m.label);
  }
  if (!p.sex || p.age == null) suggest.unshift('Age and sex (needed for fitness and body scoring)');
  const extras = NOT_BENCHMARKED.filter((x) => String(state[x.id] ?? '').trim() !== '').map((x) => ({ label: x.label, v: String(state[x.id]) }));

  return { p, s, scored, unscored, doms, tier, program, target, conf, bott, raises, lowers, urgent, meal, missingDoms, suggest: suggest.slice(0, 5), extras, n };
}

/* ---------- text builders (shared by screens, copy, share and Ask) ---------- */

export const joinList = (a: string[]) => (a.length <= 1 ? a[0] || '' : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

export function domainReason(d: Domain) {
  if (d.i == null) return 'No benchmarked markers entered';
  const best = d.ms.filter((x) => x.i <= 1).map((x) => x.m.label);
  const weak = d.ms.filter((x) => x.i >= 4).map((x) => x.m.label);
  if (weak.length && best.length) return `${joinList(weak)} limit${weak.length === 1 ? 's' : ''} the domain despite strong ${joinList(best)}`;
  if (weak.length) return `Limited by ${joinList(weak)}`;
  if (best.length) return `Strong ${joinList(best)}`;
  return `${d.ms.length} marker${d.ms.length > 1 ? 's' : ''} at 80X–90X`;
}

export function explanation(A: Assessment) {
  if (A.tier == null) return '';
  const mid = A.scored.filter((x) => x.i <= 3).map((x) => x.m.label);
  const weak = A.lowers.map((x) => x.m.label);
  const next = A.tier > 0 ? TIERS[A.tier - 1] : null;
  let t = '';
  if (mid.length) {
    const best = TIERS[Math.min(...A.scored.map((x) => x.i))];
    t += `${A.scored.length === 1 ? 'Your marker sits' : 'Several markers sit'} in the ${best}–80X range, including ${joinList(mid.slice(0, 7))}. `;
  }
  if (weak.length && next) t += `However, ${joinList(weak)} ${weak.length === 1 ? 'prevents' : 'prevent'} a ${next} score.`;
  else if (next) {
    const d = A.doms.filter((x) => x.i != null && x.i > A.tier! - 1).map((x) => x.name);
    t += d.length ? `${joinList(d)} ${d.length === 1 ? 'is' : 'are'} holding you below ${next}.` : `More markers in the ${next} range are needed to reach ${next}.`;
  } else t += 'Every scored domain meets the 100X pattern.';
  return t;
}

export function markersUsed(A: Assessment) {
  const o: string[] = [];
  const p = A.p;
  if (p.age != null) o.push(`Age: ${p.age}`);
  if (p.sex) o.push(`Sex: ${p.sex === 'M' ? 'Male' : 'Female'}`);
  if (p.h != null) o.push(`Height: ${Math.round(p.h)} cm`);
  if (p.w != null) o.push(`Weight: ${Math.round(p.w * 10) / 10} kg`);
  for (const x of A.scored) o.push(`${x.m.label}: ${x.display}${x.m.id === 'bp' ? ' mmHg' : x.m.unit ? ' ' + x.m.unit : ''}`);
  for (const x of A.extras) o.push(`${x.label}: ${x.v} (not benchmarked in uploaded documents)`);
  return o;
}

export function accuracyNote(A: Assessment) {
  const m = A.missingDoms;
  return (m.length ? `No data yet for ${joinList(m)}. ` : 'All seven domains have data. ')
    + `Tier is based on ${A.n} benchmarked marker${A.n === 1 ? '' : 's'}; confidence is ${A.conf.toLowerCase()}.`;
}

export function mealReason(A: Assessment, state: State) {
  if (!A.meal) return '';
  const act = (state.activity as string) || '';
  const g = (state.goal as string) || 'maintenance';
  return `Based on your body weight, ${act ? act + ' activity level' : 'activity level'}, and goal of ${g}, the most appropriate starting point is the ${A.meal.kcal} calorie meal plan.`;
}

export function shareText(A: Assessment) {
  if (A.tier == null || !A.target) return '';
  return `My current Health Tier is ${TIERS[A.tier]}.\n\nMy Health equivalent is ${EQUIV[A.tier].replace(' Longevity', '')}.\n\nMy biggest bottleneck is ${A.bott ? A.bott.text.toLowerCase() : 'not yet identified'}.\n\nI'll be starting the ${A.program}.\n\nMy next milestone is reaching ${A.target.t} / ${A.target.e}.`;
}

export function reportText(A: Assessment, state: State) {
  if (A.tier == null || !A.target) return '100X LONGEVITY ASSESSMENT\n\nNot enough benchmarked data yet.';
  const L: string[] = [];
  L.push('100X LONGEVITY ASSESSMENT', '', `Estimated Health Tier:\n${TIERS[A.tier]}`, '', `Estimated Health Equivalent:\n${EQUIV[A.tier]}`, '',
    `Assigned Program:\n${A.program}`, '', `Target Health Tier:\n${A.target.t}`, '', `Target Health Equivalent:\n${A.target.e}`, '',
    `Confidence:\n${A.conf}`, '', 'Markers Used:');
  markersUsed(A).forEach((x) => L.push('• ' + x));
  L.push('', 'Scorecard Summary:', '', 'Domain | Domain Score | Main Reason');
  A.doms.forEach((d) => L.push(`${d.name} | ${d.i == null ? 'Missing' : TIERS[d.i]} | ${domainReason(d)}`));
  L.push('', 'What Raises Your Score:');
  (A.raises.length ? A.raises.map((x) => `${x.m.label} (${x.display} → ${TIERS[x.i]})`) : ['No markers at 95X or better yet']).forEach((x) => L.push('• ' + x));
  L.push('', 'What Lowers Your Score:');
  (A.lowers.length ? A.lowers.map((x) => `${x.m.label} (${x.display} → ${TIERS[x.i]})`) : ['No markers at 70X or below']).forEach((x) => L.push('• ' + x));
  L.push('', `Main Bottleneck:\n${A.bott ? A.bott.text : '—'}`, '', `Explanation:\n${explanation(A)}`, '', `Accuracy Note:\n${accuracyNote(A)}`, '',
    'Optional Data That Would Improve Accuracy:');
  A.suggest.forEach((x) => L.push('• ' + x));
  if (A.meal) L.push('', 'Nutrition Plan Recommendation:', '', `Recommended Meal Plan: ${A.meal.kcal} Calories`, '', `Reason:\n${mealReason(A, state)}`);
  L.push('', 'NEXT STEPS', '', 'Your assessment is complete.', '', `Your next step:\nOpen the ${A.program} inside 100x Longevity and complete the first action item today.`);
  return L.join('\n');
}

export function matrixText(A: Assessment) {
  const p = A.p;
  const ok = !!p.sex && p.age != null;
  const L = [`100X matrix cut-offs for this user (${ok ? (p.sex === 'M' ? 'male' : 'female') + ', age bracket ' + AGEB[p.b!] : 'age/sex not set: fitness and body composition not scored'}). Columns: 100X | 95X | 90X | 80X | 70X | Below 70X.`];
  for (const d of DOMAINS) for (const m of MARKERS.filter((x) => x.d === d.id)) {
    if ((m.d === 'fitness' || m.d === 'body') && !ok) continue;
    L.push(`${d.name} · ${m.label}${m.unit ? ' (' + m.unit + ')' : ''}: ${m.ranges({ ...p, sex: p.sex ?? 'M', b: p.b ?? 0 }).join(' | ')}`);
  }
  L.push('Domain scoring: average of marker tiers; Metabolic Health and Inflammation can be at most one tier above their weakest marker; any Below 70X marker caps its domain at 80X.');
  L.push('Final tier rules (highest qualifying): 100X: >50% of markers at 100X and every domain 95X+. 95X: >50% at 95X+, ≥3 at 100X, every domain 90X+. 90X: >50% at 90X+, none Below 70X, every domain 80X+. 80X: >50% at 80X+, ≤3 markers at 70X or below. 70X: >50% at 70X+, ≥1 at 80X+. Otherwise Below 70X.');
  return L.join('\n');
}

// Context sent with every Ask question (results, per-marker tiers and the user's matrix).
export function askContext(A: Assessment, state: State) {
  return `=== USER'S CURRENT ASSESSMENT ===\n${reportText(A, state)}\n\n=== PER-MARKER TIERS ===\n${A.scored.map((x) => `${x.m.label}: ${x.display}`).join('\n') || 'none'}\n\n=== BENCHMARK MATRIX ===\n${matrixText(A)}`;
}
