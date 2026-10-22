export type Field =
  | { id: string; label: string; kind: 'number'; hint?: string; units?: [string, string][]; integer?: boolean; full?: boolean }
  | { id: string; label: string; kind: 'text'; hint?: string; full?: boolean }
  | { id: string; label: string; kind: 'choice'; options: [string, string][]; full?: boolean }
  | { id: string; label: string; kind: 'switch'; full?: boolean };

export type Section = { id: string; short: string; title: string; hint: string; fields: Field[] };

export const SECTIONS: Section[] = [
  {
    id: 'basics', short: 'Basics', title: 'The basics',
    hint: 'Age, sex, height, weight and waist give a first estimate. Goal and activity set your meal plan.',
    fields: [
      { id: 'age', label: 'Age', kind: 'number', integer: true },
      { id: 'sex', label: 'Sex', kind: 'choice', options: [['M', 'Male'], ['F', 'Female']] },
      { id: 'height', label: 'Height', kind: 'number', units: [['cm', 'cm'], ['in', 'in']] },
      { id: 'weight', label: 'Weight', kind: 'number', units: [['kg', 'kg'], ['lb', 'lb']] },
      { id: 'waist', label: 'Waist circumference', kind: 'number', units: [['cm', 'cm'], ['in', 'in']], hint: 'Measured at the navel', full: true },
      { id: 'goal', label: 'Goal', kind: 'choice', full: true, options: [['fat loss', 'Fat loss'], ['body recomposition', 'Recomposition'], ['maintenance', 'Maintenance'], ['muscle gain', 'Muscle gain']] },
      { id: 'activity', label: 'Activity level', kind: 'choice', full: true, options: [['sedentary', 'Sedentary'], ['lightly active', 'Light'], ['moderately active', 'Moderate'], ['very active', 'Very active']] },
    ],
  },
  {
    id: 'metabolic', short: 'Metabolic', title: 'Metabolic health',
    hint: 'From a fasting blood test. HOMA-IR is calculated from glucose and insulin if left blank.',
    fields: [
      { id: 'glu', label: 'Fasting glucose (mg/dL)', kind: 'number' },
      { id: 'a1c', label: 'HbA1c (%)', kind: 'number' },
      { id: 'ins', label: 'Fasting insulin (µU/mL)', kind: 'number' },
      { id: 'homa', label: 'HOMA-IR', kind: 'number', hint: 'Auto from glucose × insulin ÷ 405' },
      { id: 'tg', label: 'Triglycerides (mg/dL)', kind: 'number' },
    ],
  },
  {
    id: 'body', short: 'Body', title: 'Body composition', hint: 'From a DEXA, InBody or tape measure.',
    fields: [
      { id: 'bf', label: 'Body fat (%)', kind: 'number' },
      { id: 'whr', label: 'Waist-to-hip ratio', kind: 'number', hint: 'Waist ÷ hip' },
    ],
  },
  {
    id: 'fitness', short: 'Fitness', title: 'Fitness', hint: 'Scored against your age bracket. Leave blank anything you have not tested.',
    fields: [
      { id: 'vo2', label: 'VO2 max (ml/kg/min)', kind: 'number' },
      { id: 'push', label: 'Push-ups (continuous)', kind: 'number', integer: true },
      { id: 'pull', label: 'Pull-ups (strict)', kind: 'number', integer: true },
      { id: 'hang', label: 'Dead hang (s)', kind: 'number', hint: 'Used where reps cannot separate tiers' },
      { id: 'wall', label: 'Wall sit (s)', kind: 'number' },
      { id: 'run5k', label: '5K time', kind: 'text', hint: 'mm:ss' },
      { id: 'run15', label: '1.5-mile time', kind: 'text', hint: 'mm:ss' },
    ],
  },
  {
    id: 'cardio', short: 'Heart', title: 'Cardiovascular', hint: 'Blood pressure is scored on the worse of the two numbers.',
    fields: [
      { id: 'sbp', label: 'Systolic BP', kind: 'number', integer: true },
      { id: 'dbp', label: 'Diastolic BP', kind: 'number', integer: true },
      { id: 'apob', label: 'ApoB (mg/dL)', kind: 'number' },
      { id: 'ldl', label: 'LDL-C (mg/dL)', kind: 'number' },
      { id: 'hdl', label: 'HDL-C (mg/dL)', kind: 'number' },
    ],
  },
  {
    id: 'inflam', short: 'Inflammation', title: 'Inflammation', hint: 'From your blood panel.',
    fields: [
      { id: 'crp', label: 'hsCRP (mg/L)', kind: 'number' },
      { id: 'hcy', label: 'Homocysteine (µmol/L)', kind: 'number' },
      { id: 'o3', label: 'Omega-3 Index (%)', kind: 'number' },
    ],
  },
  {
    id: 'kl', short: 'Kidney & liver', title: 'Kidney & liver', hint: 'From your blood panel.',
    fields: [
      { id: 'egfr', label: 'eGFR', kind: 'number' },
      { id: 'cysc', label: 'Cystatin C (mg/L)', kind: 'number' },
      { id: 'alb', label: 'Albumin (g/dL)', kind: 'number' },
      { id: 'alt', label: 'ALT (IU/L)', kind: 'number' },
      { id: 'ast', label: 'AST (IU/L)', kind: 'number' },
      { id: 'alp', label: 'ALP (IU/L)', kind: 'number' },
      { id: 'ggt', label: 'GGT (IU/L)', kind: 'number' },
      { id: 'bun', label: 'BUN (mg/dL)', kind: 'number' },
    ],
  },
  {
    id: 'sleep', short: 'Sleep', title: 'Sleep, recovery & lifestyle',
    hint: 'Resting HR and HRV are scored. Sleep, steps and training are recorded but not benchmarked.',
    fields: [
      { id: 'rhr', label: 'Resting HR (bpm)', kind: 'number', integer: true },
      { id: 'hrv', label: 'HRV (ms)', kind: 'number' },
      { id: 'sleepH', label: 'Sleep (hours/night)', kind: 'number' },
      { id: 'steps', label: 'Daily steps', kind: 'number', integer: true },
      { id: 'train', label: 'Training days / week', kind: 'number', integer: true },
      { id: 'urgent', label: 'I currently have chest pain, fainting, severe shortness of breath or neurological symptoms', kind: 'switch', full: true },
    ],
  },
];
