import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { assess, Assessment, EXAMPLE, State } from '../engine/engine';

const KEY = '100x-longevity-v1';
// Answers are saved per account on the device, so people sharing a device don't see each other's.
const keyFor = (owner: string) => `${KEY}:${owner}`;
export const removeAssessment = (owner: string) => AsyncStorage.removeItem(keyFor(owner)).catch(() => {});

type Ctx = {
  ready: boolean;
  state: State;
  A: Assessment;
  isExample: boolean;
  acknowledged: boolean;
  askConsent: boolean;
  setAskConsent: (v: boolean) => void;
  step: number;
  setStep: (n: number) => void;
  setField: (k: string, v: string | boolean) => void;
  loadExample: () => void;
  reset: () => void;
  acknowledge: () => void;
};

const AssessmentContext = createContext<Ctx | null>(null);

// `owner` is the signed-in email; with no owner nothing is loaded or saved.
export function AssessmentProvider({ owner, children }: { owner: string | null; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>({});
  const [isExample, setIsExample] = useState(false);
  const [acknowledged, setAck] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [step, setStep] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!owner) { setReady(true); return; }
    // Answers saved before sign-in existed (under the bare key) move to the first account that signs in here.
    Promise.all([AsyncStorage.getItem(keyFor(owner)), AsyncStorage.getItem(KEY)])
      .then(([own, legacy]) => {
        const raw = own ?? legacy;
        if (!own && legacy) AsyncStorage.removeItem(KEY).catch(() => {});
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.state) setState(d.state);
        setIsExample(!!d.isExample);
        setAck(!!d.acknowledged);
        setAskConsent(!!d.askConsent);
        setStep(d.step || 0);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [owner]);

  useEffect(() => {
    if (!ready || !owner) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(keyFor(owner), JSON.stringify({ state, isExample, acknowledged, askConsent, step })).catch(() => {});
    }, 300);
  }, [state, isExample, acknowledged, askConsent, step, ready, owner]);

  // A pending save must not land after sign-out or account deletion.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const A = useMemo(() => assess(state), [state]);

  const value: Ctx = {
    ready, state, A, isExample, acknowledged, askConsent, setAskConsent, step, setStep,
    setField: (k, v) => {
      setState((s) => ({ ...s, [k]: v }));
      if (isExample) setIsExample(false);
    },
    loadExample: () => { setState({ ...EXAMPLE }); setIsExample(true); setStep(0); },
    reset: () => { setState({}); setIsExample(false); setStep(0); },
    acknowledge: () => setAck(true),
  };
  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const c = useContext(AssessmentContext);
  if (!c) throw new Error('useAssessment must be used inside AssessmentProvider');
  return c;
}
